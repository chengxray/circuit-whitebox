// ============================================================
// AC Analysis — 頻率掃描與 Bode Plot 計算
// ============================================================

import type { Component, BodePoint } from './types';
import { complex } from './types';
import { buildMNA } from './mnaEngine';
import { gaussElimComplex } from './gaussSolver';

/**
 * 頻率掃描，回傳 Bode Plot 資料
 * @param components    所有元件
 * @param pinNetMap     引腳→net 映射
 * @param nodeCount     非 GND 節點數
 * @param outputNetId   輸出節點的 net id（用於計算增益）
 * @param fStart        起始頻率（Hz）
 * @param fEnd          結束頻率（Hz）
 * @param pointsPerDec  每十倍頻點數（預設 20）
 */
export function sweepFrequency(
  components: Component[],
  pinNetMap: Map<string, number>,
  nodeCount: number,
  outputNetId: number,
  fStart: number = 1,
  fEnd: number = 1e6,
  pointsPerDec: number = 20
): BodePoint[] {
  if (nodeCount === 0) return [];

  const logStart = Math.log10(fStart);
  const logEnd = Math.log10(fEnd);
  const decades = logEnd - logStart;
  const totalPoints = Math.ceil(decades * pointsPerDec) + 1;

  const result: BodePoint[] = [];

  for (let i = 0; i < totalPoints; i++) {
    const freq = Math.pow(10, logStart + (i / (totalPoints - 1)) * decades);
    const omega = 2 * Math.PI * freq;

    const { complexA, complexB } = buildMNA(components, pinNetMap, nodeCount, omega);
    const sol = gaussElimComplex(complexA, complexB);

    if (!sol.success || outputNetId <= 0 || outputNetId > nodeCount) {
      continue;
    }

    const vOut = sol.solution[outputNetId - 1];
    const gain_abs = complex.abs(vOut); // 假設輸入 = 1V∠0°
    const gain_dB = 20 * Math.log10(gain_abs > 0 ? gain_abs : 1e-15);
    const phase_deg = (complex.arg(vOut) * 180) / Math.PI;

    result.push({ freq, gain_dB, phase_deg });
  }

  return result;
}
