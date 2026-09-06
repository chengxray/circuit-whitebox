// ============================================================
// Netlist Builder + Circuit Solver Orchestrator
// ============================================================

import type { Component, Wire, MNAResult, ComponentTelemetry } from './types';
import { buildNets } from './unionFind';
import { buildMNA, toSI } from './mnaEngine';
import { gaussElimReal, gaussElimComplex } from './gaussSolver';
import { sweepFrequency } from './acAnalysis';

// ── 主求解函式 ───────────────────────────────────────────
export function solveCircuit(
  components: Component[],
  wires: Wire[],
  mode: 'DC' | 'AC',
  acFrequency: number = 1000,
  bodeOutputNetId: number = 1
): MNAResult {
  // 1. 建立網路
  const nonGndComps = components.filter(c => c.type !== 'ground');
  const { nets, pinNetMap, errors } = buildNets(wires, components);

  if (errors.length > 0) {
    return {
      mode,
      nodeVoltages: [],
      sourceCurrents: [],
      matrix: emptyMatrix(),
      gaussSteps: [],
      kclLines: [],
      telemetry: [],
      error: errors.join('\n'),
    };
  }

  const nodeCount = nets.filter(n => n.id > 0).length;
  if (nodeCount === 0) {
    return {
      mode,
      nodeVoltages: [],
      sourceCurrents: [],
      matrix: emptyMatrix(),
      gaussSteps: [],
      kclLines: [],
      telemetry: [],
      error: '無有效節點（只有 GND？）',
    };
  }

  const omega = mode === 'AC' ? 2 * Math.PI * acFrequency : 0;

  // 2. 建立 MNA 矩陣
  const { matrix, complexA, complexB, kclLines } = buildMNA(
    nonGndComps,
    pinNetMap,
    nodeCount,
    omega
  );

  // 3. 求解
  let nodeVoltages: number[] = [];
  let sourceCurrents: number[] = [];
  let gaussSteps: import('./gaussSolver').GaussStep[] = [];

  if (mode === 'DC') {
    const sol = gaussElimReal(matrix.numericA, matrix.numericB);
    gaussSteps = sol.steps;
    if (!sol.success) {
      return {
        mode,
        nodeVoltages: [],
        sourceCurrents: [],
        matrix,
        gaussSteps,
        kclLines,
        telemetry: [],
        error: sol.errorMsg,
      };
    }
    nodeVoltages = sol.solution.slice(0, nodeCount);
    sourceCurrents = sol.solution.slice(nodeCount);
  } else {
    const sol = gaussElimComplex(complexA, complexB);
    if (!sol.success) {
      return {
        mode,
        nodeVoltages: [],
        sourceCurrents: [],
        matrix,
        gaussSteps: [],
        kclLines,
        telemetry: [],
        error: sol.errorMsg,
      };
    }
    nodeVoltages = sol.solution.slice(0, nodeCount).map(c => c.re);
    sourceCurrents = sol.solution.slice(nodeCount).map(c => c.re);
  }

  // 4. 計算遙測資料
  const getNodeV = (netId: number): number => {
    if (netId === 0) return 0;
    return nodeVoltages[netId - 1] ?? 0;
  };

  const telemetry: ComponentTelemetry[] = nonGndComps.map(comp => {
    const n1 = pinNetMap.get(`${comp.id}:0`) ?? 0;
    const n2 = pinNetMap.get(`${comp.id}:1`) ?? 0;
    const vPlus = getNodeV(n1);
    const vMinus = getNodeV(n2);
    const deltaV = vPlus - vMinus;
    let current = 0;

    const siVal = toSI(comp.value, comp.unit);

    if (comp.type === 'resistor') {
      current = siVal !== 0 ? deltaV / siVal : 0;
    } else if (comp.type === 'vSourceDC' || comp.type === 'vSourceAC' ||
               comp.type === 'vcvs' || comp.type === 'ccvs' || comp.type === 'opamp') {
      const voltageSources = nonGndComps.filter(
        c => c.type === 'vSourceDC' || c.type === 'vSourceAC' ||
             c.type === 'vcvs' || c.type === 'ccvs' || c.type === 'opamp'
      );
      const idx = voltageSources.findIndex(v => v.id === comp.id);
      current = sourceCurrents[idx] ?? 0;
    } else if (comp.type === 'iSourceDC') {
      current = -siVal; // 電流源提供電流
    } else if (comp.type === 'capacitor') {
      current = 0; // DC 開路
    }

    const power = deltaV * current;
    return {
      componentId: comp.id,
      label: comp.label,
      type: comp.type,
      vPlus,
      vMinus,
      deltaV,
      current,
      power,
      powerType: power >= 0 ? 'dissipated' : 'supplied',
    };
  });

  // 5. AC Bode Plot（可選）
  let bodeData;
  if (mode === 'AC') {
    bodeData = sweepFrequency(
      nonGndComps,
      pinNetMap,
      nodeCount,
      bodeOutputNetId,
      1,
      1e6,
      20
    );
  }

  return {
    mode,
    nodeVoltages,
    sourceCurrents,
    matrix,
    gaussSteps,
    kclLines,
    telemetry,
    bodeData,
  };
}

function emptyMatrix() {
  return {
    numericA: [],
    numericB: [],
    symbolicA: [],
    symbolicB: [],
    rowLabels: [],
    colLabels: [],
    nodeCount: 0,
    voltSourceCount: 0,
  };
}
