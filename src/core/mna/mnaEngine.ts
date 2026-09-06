// ============================================================
// MNA Engine — 修正節點分析矩陣建立器
// 同時產生符號矩陣（LaTeX）和數字矩陣（Float64）
// ============================================================

import type { Component, MNAMatrix, KCLLine, Complex } from './types';
import { complex } from './types';

// ── 值域轉換（含單位）────────────────────────────────────
export function toSI(value: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === 'kω' || u === 'kv' || u === 'ka' || u === 'khz') return value * 1e3;
  if (u === 'mω' || u === 'mv') return value * 1e6;
  if (u === 'mh') return value * 1e-3;
  if (u === 'μh' || u === 'uh') return value * 1e-6;
  if (u === 'μf' || u === 'uf') return value * 1e-6;
  if (u === 'nf') return value * 1e-9;
  if (u === 'pf') return value * 1e-12;
  if (u === 'ma') return value * 1e-3;
  if (u === 'mv') return value * 1e-3;
  if (u === 'mhz') return value * 1e6;
  if (u === 'ghz') return value * 1e9;
  return value; // Ω, V, A, H, F, Hz as-is
}

// ── 符號格式化 ────────────────────────────────────────────
function symVal(comp: Component): string {
  return `${comp.label}`;
}

function symCond(comp: Component): string {
  // 電導 1/R 的符號表示
  return `\\frac{1}{${symVal(comp)}}`;
}

// ── 零矩陣 (複數) ─────────────────────────────────────────
function zeroMatrix(n: number): Complex[][] {
  return Array.from({ length: n }, () =>
    Array.from({ length: n }, () => complex.zero())
  );
}
function zeroVec(n: number): Complex[] {
  return Array.from({ length: n }, () => complex.zero());
}

// ── 主函式 ────────────────────────────────────────────────
export interface MNABuildResult {
  matrix: MNAMatrix;
  /** 複數增廣矩陣（DC 時虛部為 0）*/
  complexA: Complex[][];
  complexB: Complex[];
  kclLines: KCLLine[];
}

/**
 * 建立 MNA 矩陣
 * @param components  所有元件（不含 GND 本身）
 * @param pinNetMap   "compId:pinIdx" → netId（0 = GND）
 * @param nodeCount   非 GND 節點數量
 * @param omega       角頻率 2πf（DC 時為 0）
 */
export function buildMNA(
  components: Component[],
  pinNetMap: Map<string, number>,
  nodeCount: number,
  omega: number = 0
): MNABuildResult {
  // ── 找出電壓源（含相依電壓源）的清單 ──────────────────
  const voltageSources = components.filter(
    c => c.type === 'vSourceDC' || c.type === 'vSourceAC' ||
         c.type === 'vcvs' || c.type === 'ccvs' || c.type === 'opamp'
  );
  const voltSourceCount = voltageSources.length;
  const dim = nodeCount + voltSourceCount;

  // ── 初始化矩陣 ─────────────────────────────────────────
  const A: Complex[][] = zeroMatrix(dim);
  const B: Complex[] = zeroVec(dim);
  const symA: string[][] = Array.from({ length: dim }, () =>
    Array.from({ length: dim }, () => '0')
  );
  const symB: string[] = Array.from({ length: dim }, () => '0');

  const rowLabels: string[] = [];
  const colLabels: string[] = [];
  for (let i = 0; i < nodeCount; i++) {
    rowLabels.push(`節點 ${i + 1}`);
    colLabels.push(`V_{${i + 1}}`);
  }
  for (let k = 0; k < voltSourceCount; k++) {
    rowLabels.push(`${voltageSources[k].label} KVL`);
    colLabels.push(`I_{${voltageSources[k].label}}`);
  }

  // ── 工具：安全取得 net id（GND = 0）───────────────────
  function netOf(compId: string, pinIdx: number): number {
    return pinNetMap.get(`${compId}:${pinIdx}`) ?? 0;
  }

  // ── 工具：加到矩陣 ─────────────────────────────────────
  function addA(row: number, col: number, val: Complex, sym: string) {
    if (row < 0 || col < 0 || row >= dim || col >= dim) return;
    A[row][col] = complex.add(A[row][col], val);
    // 符號累加
    if (sym && sym !== '0') {
      if (symA[row][col] === '0') symA[row][col] = sym;
      else symA[row][col] += ' + ' + sym;
    }
  }
  function addB(row: number, val: Complex, sym: string) {
    if (row < 0 || row >= dim) return;
    B[row] = complex.add(B[row], val);
    if (sym && sym !== '0') {
      if (symB[row] === '0') symB[row] = sym;
      else symB[row] += ' + ' + sym;
    }
  }

  const kclLines: KCLLine[] = [];

  // ── 電壓源 index 查詢 ──────────────────────────────────
  function vsIndex(comp: Component): number {
    return voltageSources.findIndex(v => v.id === comp.id);
  }

  // ── 開始 Stamping ──────────────────────────────────────
  for (const comp of components) {
    const n1 = netOf(comp.id, 0); // pin[0]（正端 / 入端）
    const n2 = netOf(comp.id, 1); // pin[1]（負端 / 出端）
    // 轉換為矩陣行列索引（net 0 = GND，跳過）
    const r1 = n1 - 1; // >= 0 表示非 GND
    const r2 = n2 - 1;

    const siVal = toSI(comp.value, comp.unit);

    switch (comp.type) {
      // ── 電阻 ───────────────────────────────────────────
      case 'resistor': {
        const g_num = siVal !== 0 ? 1 / siVal : 0;
        const g: Complex = { re: g_num, im: 0 };
        const sym = symCond(comp);
        if (r1 >= 0) addA(r1, r1, g, sym);
        if (r2 >= 0) addA(r2, r2, g, sym);
        if (r1 >= 0 && r2 >= 0) {
          addA(r1, r2, { re: -g_num, im: 0 }, `-${sym}`);
          addA(r2, r1, { re: -g_num, im: 0 }, `-${sym}`);
        }
        kclLines.push({
          nodeId: n1,
          latex: `\\frac{V_{${n1}} - V_{${n2}}}{${symVal(comp)}}`,
          description: `${comp.label}（${comp.value}${comp.unit}）從節點 ${n1} → 節點 ${n2}`,
        });
        break;
      }

      // ── 電容 ───────────────────────────────────────────
      case 'capacitor': {
        if (omega === 0) {
          // DC：電容 = 開路，不 stamp
          break;
        }
        // AC：導納 Y = jωC
        const yC: Complex = { re: 0, im: omega * siVal };
        if (r1 >= 0) addA(r1, r1, yC, `j\\omega ${comp.label}`);
        if (r2 >= 0) addA(r2, r2, yC, `j\\omega ${comp.label}`);
        if (r1 >= 0 && r2 >= 0) {
          addA(r1, r2, { re: 0, im: -omega * siVal }, `-j\\omega ${comp.label}`);
          addA(r2, r1, { re: 0, im: -omega * siVal }, `-j\\omega ${comp.label}`);
        }
        break;
      }

      // ── 電感 ───────────────────────────────────────────
      case 'inductor': {
        if (omega === 0) {
          // DC：電感 = 短路（等效電壓源 0V）
          // 用電壓源 stamp：KVL: V_n1 - V_n2 = 0
          // 電感在此以電壓源處理需要輔助電流 → 視為 vSource(0V)
          // 簡化：跳過（待 Phase 2 精化）
          break;
        }
        // AC：阻抗 Z = jωL，導納 Y = 1/(jωL) = -j/(ωL)
        const yL: Complex = { re: 0, im: -1 / (omega * siVal) };
        if (r1 >= 0) addA(r1, r1, yL, `\\frac{1}{j\\omega ${comp.label}}`);
        if (r2 >= 0) addA(r2, r2, yL, `\\frac{1}{j\\omega ${comp.label}}`);
        if (r1 >= 0 && r2 >= 0) {
          addA(r1, r2, { re: 0, im: 1 / (omega * siVal) }, `-\\frac{1}{j\\omega ${comp.label}}`);
          addA(r2, r1, { re: 0, im: 1 / (omega * siVal) }, `-\\frac{1}{j\\omega ${comp.label}}`);
        }
        break;
      }

      // ── DC 電壓源 ──────────────────────────────────────
      case 'vSourceDC': {
        const k = vsIndex(comp);
        const ki = nodeCount + k; // 在矩陣中的行/列索引
        // B 矩陣：n1 +1, n2 -1
        if (r1 >= 0) {
          addA(r1, ki, complex.fromReal(1), `1`);
          addA(ki, r1, complex.fromReal(1), `1`);
        }
        if (r2 >= 0) {
          addA(r2, ki, complex.fromReal(-1), `-1`);
          addA(ki, r2, complex.fromReal(-1), `-1`);
        }
        addB(ki, complex.fromReal(siVal), `${comp.value}`);
        symB[ki] = `${comp.value}`;
        break;
      }

      // ── AC 電壓源 ──────────────────────────────────────
      case 'vSourceAC': {
        const k = vsIndex(comp);
        const ki = nodeCount + k;
        const phaseRad = ((comp.phase ?? 0) * Math.PI) / 180;
        const vPhasor: Complex = {
          re: siVal * Math.cos(phaseRad),
          im: siVal * Math.sin(phaseRad),
        };
        if (r1 >= 0) {
          addA(r1, ki, complex.fromReal(1), `1`);
          addA(ki, r1, complex.fromReal(1), `1`);
        }
        if (r2 >= 0) {
          addA(r2, ki, complex.fromReal(-1), `-1`);
          addA(ki, r2, complex.fromReal(-1), `-1`);
        }
        addB(ki, vPhasor, `${comp.value}\\angle${comp.phase ?? 0}^\\circ`);
        break;
      }

      // ── DC 電流源 ──────────────────────────────────────
      case 'iSourceDC': {
        // 電流方向：從 n2 流向 n1（箭頭指向 n1）
        if (r2 >= 0) addB(r2, complex.fromReal(-siVal), `-${comp.label}`);
        if (r1 >= 0) addB(r1, complex.fromReal(siVal), `${comp.label}`);
        break;
      }

      // ── AC 電流源 ──────────────────────────────────────
      case 'iSourceAC': {
        const phaseRad = ((comp.phase ?? 0) * Math.PI) / 180;
        const iPhasor: Complex = {
          re: siVal * Math.cos(phaseRad),
          im: siVal * Math.sin(phaseRad),
        };
        if (r2 >= 0) addB(r2, { re: -iPhasor.re, im: -iPhasor.im }, `-${comp.label}`);
        if (r1 >= 0) addB(r1, iPhasor, `${comp.label}`);
        break;
      }

      // ── 理想 Op-Amp（nullor 模型）──────────────────────
      // 差分輸入短路：V_in+ = V_in-（兩輸入 net 電壓相等）
      // pin[0] = in+, pin[1] = in-, pin3 = out
      case 'opamp': {
        const k = vsIndex(comp);
        const ki = nodeCount + k;
        const nOut = netOf(comp.id, 2);
        const rOut = nOut - 1;
        // KCL at out node: output current enters
        if (rOut >= 0) addA(rOut, ki, complex.fromReal(1), `1`);
        if (rOut >= 0) addA(ki, rOut, complex.fromReal(-1), `-1`);
        // KVL: V_in+ - V_in- = 0
        if (r1 >= 0) addA(ki, r1, complex.fromReal(1), `1`);
        if (r2 >= 0) addA(ki, r2, complex.fromReal(-1), `-1`);
        addB(ki, complex.zero(), `0`);
        break;
      }

      // ── VCVS ───────────────────────────────────────────
      case 'vcvs': {
        // gain μ: Vout = μ * Vcontrol
        // controlRef 是控制元件 label
        // KVL: V_n1 - V_n2 - μ*(V_ctrl1 - V_ctrl2) = 0
        const k = vsIndex(comp);
        const ki = nodeCount + k;
        const mu = comp.gain ?? 1;
        if (r1 >= 0) {
          addA(r1, ki, complex.fromReal(1), `1`);
          addA(ki, r1, complex.fromReal(1), `1`);
        }
        if (r2 >= 0) {
          addA(r2, ki, complex.fromReal(-1), `-1`);
          addA(ki, r2, complex.fromReal(-1), `-1`);
        }
        // 控制電壓由解後代入（需查 controlRef 對應的 net）
        // 在 KVL 行 stamp -μ * V_ctrl
        const ctrl = findControlComp(components, comp.controlRef ?? '');
        if (ctrl) {
          const cn1 = netOf(ctrl.id, 0) - 1;
          const cn2 = netOf(ctrl.id, 1) - 1;
          if (cn1 >= 0) addA(ki, cn1, complex.fromReal(-mu), `-${mu}\\mu`);
          if (cn2 >= 0) addA(ki, cn2, complex.fromReal(mu), `+${mu}\\mu`);
        }
        break;
      }

      // ── CCCS ───────────────────────────────────────────
      case 'cccs': {
        // gain β: Iout = β * Icontrol
        const beta = comp.gain ?? 1;
        // 找控制電流 (控制元件必須是電壓源或有輔助電流的元件)
        const ctrl = findControlComp(components, comp.controlRef ?? '');
        if (ctrl) {
          const ctrlVsIdx = voltageSources.findIndex(v => v.id === ctrl.id);
          if (ctrlVsIdx >= 0) {
            const ctrlKi = nodeCount + ctrlVsIdx;
            if (r1 >= 0) addA(r1, ctrlKi, complex.fromReal(beta), `${beta}\\beta`);
            if (r2 >= 0) addA(r2, ctrlKi, complex.fromReal(-beta), `-${beta}\\beta`);
          }
        }
        break;
      }

      // ── VCCS ───────────────────────────────────────────
      case 'vccs': {
        // transconductance gm: Iout = gm * Vcontrol
        const gm = comp.gain ?? 1;
        const ctrl = findControlComp(components, comp.controlRef ?? '');
        if (ctrl) {
          const cn1 = netOf(ctrl.id, 0) - 1;
          const cn2 = netOf(ctrl.id, 1) - 1;
          if (r1 >= 0 && cn1 >= 0) addA(r1, cn1, complex.fromReal(gm), `g_m`);
          if (r1 >= 0 && cn2 >= 0) addA(r1, cn2, complex.fromReal(-gm), `-g_m`);
          if (r2 >= 0 && cn1 >= 0) addA(r2, cn1, complex.fromReal(-gm), `-g_m`);
          if (r2 >= 0 && cn2 >= 0) addA(r2, cn2, complex.fromReal(gm), `g_m`);
        }
        break;
      }

      // ── CCVS ───────────────────────────────────────────
      case 'ccvs': {
        // transresistance r: Vout = r * Icontrol
        const k = vsIndex(comp);
        const ki = nodeCount + k;
        const rm = comp.gain ?? 1;
        if (r1 >= 0) {
          addA(r1, ki, complex.fromReal(1), `1`);
          addA(ki, r1, complex.fromReal(1), `1`);
        }
        if (r2 >= 0) {
          addA(r2, ki, complex.fromReal(-1), `-1`);
          addA(ki, r2, complex.fromReal(-1), `-1`);
        }
        const ctrl = findControlComp(components, comp.controlRef ?? '');
        if (ctrl) {
          const ctrlVsIdx = voltageSources.findIndex(v => v.id === ctrl.id);
          if (ctrlVsIdx >= 0) {
            const ctrlKi = nodeCount + ctrlVsIdx;
            addA(ki, ctrlKi, complex.fromReal(-rm), `-r_m`);
          }
        }
        break;
      }

      default:
        break;
    }
  }

  // ── 轉換成實數矩陣（DC 模式）或保持複數（AC 模式）────
  const numericA: number[][] = A.map(row => row.map(c => c.re));
  const numericB: number[] = B.map(c => c.re);

  // 整理符號矩陣：去掉多餘的 "0 + " 前綴
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      symA[i][j] = cleanSym(symA[i][j]);
    }
    symB[i] = cleanSym(symB[i]);
  }

  const matrix: MNAMatrix = {
    numericA,
    numericB,
    symbolicA: symA,
    symbolicB: symB,
    rowLabels,
    colLabels,
    nodeCount,
    voltSourceCount,
  };

  return { matrix, complexA: A, complexB: B, kclLines };
}

// ── 輔助函式 ─────────────────────────────────────────────
function findControlComp(components: Component[], ref: string): Component | undefined {
  return components.find(c => c.label === ref);
}

function cleanSym(s: string): string {
  // 移除首尾空格，不做其他轉換
  return s.trim();
}
