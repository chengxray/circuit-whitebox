// ============================================================
// 範例電路資料
// ============================================================

import type { Component, Wire } from '../core/mna/types';
import { calcPins } from '../store/circuitStore';

// ── 工具函式 ─────────────────────────────────────────────
let id = 100;
const newId = (prefix: string) => `${prefix}_example_${id++}`;

function wire(points: { x: number; y: number }[]): Wire {
  return { id: newId('w'), points };
}

// ── 範例 1：10V 直流分壓器（R1=1kΩ, R2=2kΩ）──────────
export function createVoltageDivider(): { components: Component[]; wires: Wire[] } {
  const v1: Component = {
    id: newId('v'),
    type: 'vSourceDC',
    label: 'V1',
    value: 10,
    unit: 'V',
    pos: { x: 100, y: 200 },
    rotation: 0,
    ...calcPins('vSourceDC', { x: 100, y: 200 }, 0),
  };

  const r1: Component = {
    id: newId('r'),
    type: 'resistor',
    label: 'R1',
    value: 1,
    unit: 'kΩ',
    pos: { x: 240, y: 120 },
    rotation: 0,
    ...calcPins('resistor', { x: 240, y: 120 }, 0),
  };

  const r2: Component = {
    id: newId('r'),
    type: 'resistor',
    label: 'R2',
    value: 2,
    unit: 'kΩ',
    pos: { x: 240, y: 280 },
    rotation: 0,
    ...calcPins('resistor', { x: 240, y: 280 }, 0),
  };

  const gnd: Component = {
    id: newId('gnd'),
    type: 'ground',
    label: 'GND',
    value: 0,
    unit: '',
    pos: { x: 100, y: 360 },
    rotation: 0,
    ...calcPins('ground', { x: 100, y: 360 }, 0),
  };

  // 連線：V1+ (60,200) → R1 左端 (200,120)
  // V1- (140,200) → GND (100,360)
  // R1 右端 (280,120) → R2 右端 (280,280)
  // R2 左端 (200,280) → V1- 線
  const wires: Wire[] = [
    wire([{ x: 60, y: 200 }, { x: 60, y: 120 }, { x: 200, y: 120 }]),
    wire([{ x: 280, y: 120 }, { x: 280, y: 280 }]),
    wire([{ x: 200, y: 280 }, { x: 140, y: 280 }, { x: 140, y: 360 }, { x: 100, y: 360 }]),
    wire([{ x: 140, y: 200 }, { x: 140, y: 280 }]),
  ];

  return { components: [v1, r1, r2, gnd], wires };
}

// ── 範例 2：RC 低通濾波器（R=1kΩ, C=1μF）────────────
export function createRCFilter(): { components: Component[]; wires: Wire[] } {
  const vac: Component = {
    id: newId('v'),
    type: 'vSourceAC',
    label: 'Vin',
    value: 1,
    unit: 'V',
    pos: { x: 100, y: 200 },
    rotation: 0,
    frequency: 1000,
    phase: 0,
    ...calcPins('vSourceAC', { x: 100, y: 200 }, 0),
  };

  const r1: Component = {
    id: newId('r'),
    type: 'resistor',
    label: 'R1',
    value: 1,
    unit: 'kΩ',
    pos: { x: 240, y: 120 },
    rotation: 0,
    ...calcPins('resistor', { x: 240, y: 120 }, 0),
  };

  const c1: Component = {
    id: newId('c'),
    type: 'capacitor',
    label: 'C1',
    value: 1,
    unit: 'μF',
    pos: { x: 360, y: 200 },
    rotation: 90,
    ...calcPins('capacitor', { x: 360, y: 200 }, 90),
  };

  const gnd: Component = {
    id: newId('gnd'),
    type: 'ground',
    label: 'GND',
    value: 0,
    unit: '',
    pos: { x: 100, y: 360 },
    rotation: 0,
    ...calcPins('ground', { x: 100, y: 360 }, 0),
  };

  const wires: Wire[] = [
    wire([{ x: 60, y: 200 }, { x: 60, y: 120 }, { x: 200, y: 120 }]),
    wire([{ x: 280, y: 120 }, { x: 360, y: 120 }, { x: 360, y: 160 }]),
    wire([{ x: 360, y: 240 }, { x: 360, y: 360 }, { x: 140, y: 360 }, { x: 140, y: 200 }]),
    wire([{ x: 100, y: 360 }, { x: 140, y: 360 }]),
  ];

  return { components: [vac, r1, c1, gnd], wires };
}

// ── 範例 3：同相放大器（Op-Amp, R_f=10kΩ, R_in=1kΩ）
export function createNonInvertingAmp(): { components: Component[]; wires: Wire[] } {
  const vin: Component = {
    id: newId('v'),
    type: 'vSourceDC',
    label: 'Vin',
    value: 1,
    unit: 'V',
    pos: { x: 80, y: 200 },
    rotation: 0,
    ...calcPins('vSourceDC', { x: 80, y: 200 }, 0),
  };

  const opamp: Component = {
    id: newId('u'),
    type: 'opamp',
    label: 'U1',
    value: 0,
    unit: '',
    pos: { x: 280, y: 200 },
    rotation: 0,
    ...calcPins('opamp', { x: 280, y: 200 }, 0),
  };

  const rf: Component = {
    id: newId('r'),
    type: 'resistor',
    label: 'Rf',
    value: 10,
    unit: 'kΩ',
    pos: { x: 360, y: 120 },
    rotation: 0,
    ...calcPins('resistor', { x: 360, y: 120 }, 0),
  };

  const rin: Component = {
    id: newId('r'),
    type: 'resistor',
    label: 'Rin',
    value: 1,
    unit: 'kΩ',
    pos: { x: 200, y: 260 },
    rotation: 0,
    ...calcPins('resistor', { x: 200, y: 260 }, 0),
  };

  const gnd: Component = {
    id: newId('gnd'),
    type: 'ground',
    label: 'GND',
    value: 0,
    unit: '',
    pos: { x: 80, y: 360 },
    rotation: 0,
    ...calcPins('ground', { x: 80, y: 360 }, 0),
  };

  const wires: Wire[] = [
    wire([{ x: 40, y: 200 }, { x: 40, y: 180 }, { x: 240, y: 180 }]),
    wire([{ x: 120, y: 200 }, { x: 160, y: 260 }]),
    wire([{ x: 240, y: 260 }, { x: 240, y: 300 }, { x: 80, y: 300 }, { x: 80, y: 360 }]),
    wire([{ x: 320, y: 200 }, { x: 400, y: 200 }, { x: 400, y: 120 }, { x: 320, y: 120 }, { x: 320, y: 200 }]),
    wire([{ x: 240, y: 260 }, { x: 240, y: 260 }]),
  ];

  return { components: [vin, opamp, rf, rin, gnd], wires };
}

export const EXAMPLES = [
  { name: '直流分壓器（Voltage Divider）', create: createVoltageDivider },
  { name: 'RC 低通濾波器（RC Low-Pass Filter）', create: createRCFilter },
  { name: '同相放大器（Non-Inverting Amp）', create: createNonInvertingAmp },
];
