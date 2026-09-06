// ============================================================
// Gaussian Elimination with Partial Pivoting
// 支援實數（DC）和複數（AC）兩種模式
// ============================================================

import { GaussStep, Complex, complex } from './types';

// ── 實數 Gaussian 消去（DC）─────────────────────────────
export interface GaussResult {
  solution: number[];
  steps: GaussStep[];
  success: boolean;
  errorMsg?: string;
}

export function gaussElimReal(
  Ain: number[][],
  Bin: number[]
): GaussResult {
  const n = Bin.length;
  // 深拷貝
  const A = Ain.map(row => [...row]);
  const B = [...Bin];
  const steps: GaussStep[] = [];
  const rowOrder = Array.from({ length: n }, (_, i) => i);

  for (let col = 0; col < n; col++) {
    // 找部分主元（同列中最大絕對值）
    let maxRow = col;
    let maxVal = Math.abs(A[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(A[row][col]) > maxVal) {
        maxVal = Math.abs(A[row][col]);
        maxRow = row;
      }
    }

    if (maxVal < 1e-12) {
      return {
        solution: [],
        steps,
        success: false,
        errorMsg: `矩陣在第 ${col + 1} 行奇異（可能是浮動節點或電路未完全連接）`,
      };
    }

    // 換列
    if (maxRow !== col) {
      [A[col], A[maxRow]] = [A[maxRow], A[col]];
      [B[col], B[maxRow]] = [B[maxRow], B[col]];
      steps.push({
        description: `選主元：將第 ${maxRow + 1} 列換到第 ${col + 1} 列（主元 = ${formatNum(A[col][col])}）`,
        pivotRow: col,
        pivotCol: col,
        matrixSnapshot: A.map(r => [...r]),
        bSnapshot: [...B],
      });
    }

    // 消去
    for (let row = col + 1; row < n; row++) {
      const factor = A[row][col] / A[col][col];
      for (let j = col; j < n; j++) {
        A[row][j] -= factor * A[col][j];
      }
      B[row] -= factor * B[col];
    }

    steps.push({
      description: `消去第 ${col + 1} 行：使用主元 ${formatNum(A[col][col])}，將下方各列的第 ${col + 1} 行消零`,
      pivotRow: col,
      pivotCol: col,
      matrixSnapshot: A.map(r => [...r]),
      bSnapshot: [...B],
    });
  }

  // 回代
  const x = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = B[row];
    for (let j = row + 1; j < n; j++) {
      sum -= A[row][j] * x[j];
    }
    x[row] = sum / A[row][row];
  }

  steps.push({
    description: `回代完成，求得解向量`,
    pivotRow: n - 1,
    pivotCol: n - 1,
    matrixSnapshot: A.map(r => [...r]),
    bSnapshot: [...B],
  });

  return { solution: x, steps, success: true };
}

// ── 複數 Gaussian 消去（AC）─────────────────────────────
export interface GaussResultComplex {
  solution: Complex[];
  success: boolean;
  errorMsg?: string;
}

export function gaussElimComplex(
  Ain: Complex[][],
  Bin: Complex[]
): GaussResultComplex {
  const n = Bin.length;
  const A = Ain.map(row => row.map(c => ({ ...c })));
  const B = Bin.map(c => ({ ...c }));

  for (let col = 0; col < n; col++) {
    // 找主元（最大模）
    let maxRow = col;
    let maxVal = complex.abs(A[col][col]);
    for (let row = col + 1; row < n; row++) {
      const val = complex.abs(A[row][col]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = row;
      }
    }

    if (maxVal < 1e-15) {
      return { solution: [], success: false, errorMsg: `AC 矩陣在第 ${col + 1} 行奇異` };
    }

    if (maxRow !== col) {
      [A[col], A[maxRow]] = [A[maxRow], A[col]];
      [B[col], B[maxRow]] = [B[maxRow], B[col]];
    }

    for (let row = col + 1; row < n; row++) {
      const factor = complex.div(A[row][col], A[col][col]);
      for (let j = col; j < n; j++) {
        A[row][j] = complex.sub(A[row][j], complex.mul(factor, A[col][j]));
      }
      B[row] = complex.sub(B[row], complex.mul(factor, B[col]));
    }
  }

  // 回代
  const x: Complex[] = new Array(n).fill(null).map(() => complex.zero());
  for (let row = n - 1; row >= 0; row--) {
    let sum: Complex = { ...B[row] };
    for (let j = row + 1; j < n; j++) {
      sum = complex.sub(sum, complex.mul(A[row][j], x[j]));
    }
    x[row] = complex.div(sum, A[row][row]);
  }

  return { solution: x, success: true };
}

// ── 格式化數字 ────────────────────────────────────────────
export function formatNum(v: number, digits = 4): string {
  if (!isFinite(v)) return '?';
  return parseFloat(v.toPrecision(digits)).toString();
}

// ── 智慧精度格式化（給 UI 顯示用）────────────────────────
export function smartFormat(v: number): string {
  const abs = Math.abs(v);
  if (abs === 0) return '0';
  if (abs >= 1e6) return (v / 1e6).toPrecision(4) + ' M';
  if (abs >= 1e3) return (v / 1e3).toPrecision(4) + ' k';
  if (abs >= 1) return v.toPrecision(4) + '';
  if (abs >= 1e-3) return (v * 1e3).toPrecision(4) + ' m';
  if (abs >= 1e-6) return (v * 1e6).toPrecision(4) + ' μ';
  if (abs >= 1e-9) return (v * 1e9).toPrecision(4) + ' n';
  return v.toPrecision(4) + '';
}

export function smartFormatUnit(v: number, baseUnit: string): string {
  return smartFormat(v) + baseUnit;
}
