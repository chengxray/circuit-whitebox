// ============================================================
// CircuitWhitebox — Core Type Definitions
// ============================================================

export interface Point {
  x: number;
  y: number;
}

// ── Component Types ────────────────────────────────────────
export type ComponentType =
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'vSourceDC'
  | 'vSourceAC'
  | 'iSourceDC'
  | 'iSourceAC'
  | 'ground'
  | 'opamp'
  | 'vcvs'   // Voltage-Controlled Voltage Source (菱形)
  | 'cccs'   // Current-Controlled Current Source (菱形)
  | 'vccs'   // Voltage-Controlled Current Source (菱形)
  | 'ccvs';  // Current-Controlled Voltage Source (菱形)

export interface Component {
  id: string;
  type: ComponentType;
  label: string;       // "R1", "C2", "V1" …
  value: number;       // 元件數值
  unit: string;        // "Ω", "kΩ", "MΩ", "μF", "nF", "mH", "μH", "V", "mV", "A", "mA"
  pos: Point;          // 畫布中心位置（格點座標）
  rotation: 0 | 90 | 180 | 270;
  // 衍生引腳（由 rotation + pos 算出，格點座標）
  pins: [Point, Point];
  // Op-Amp 有第三引腳 (out)
  pin3?: Point;
  // 相依電源：控制元件 label（e.g. "R1"）與增益
  controlRef?: string;
  gain?: number;
  gainUnit?: string;   // "V/V", "A/A", "A/V", "V/A"
  // AC 電源額外參數
  frequency?: number;  // Hz
  phase?: number;      // degrees
}

// ── Wire ──────────────────────────────────────────────────
export interface Wire {
  id: string;
  points: Point[];    // 折線頂點（正交）；最少 2 個點
}

// ── Electrical Net ───────────────────────────────────────
export interface Net {
  id: number;         // 0 = GND
  pinKeys: Set<string>; // "x,y" 格式的格點 key 集合
}

// ── Netlist (解析結果) ────────────────────────────────────
export interface NetlistResult {
  nets: Net[];
  /** 每個 component pin 對應的 net id */
  pinNetMap: Map<string, number>; // key: "compId:pinIndex"
  errors: string[];
}

// ── MNA Matrix (雙表示) ───────────────────────────────────
export interface MNAMatrix {
  /** 增廣矩陣 [A|b] 數字版本 */
  numericA: number[][];
  numericB: number[];
  /** 增廣矩陣 [A|b] 符號版本（LaTeX 字串）*/
  symbolicA: string[][];
  symbolicB: string[];
  /** 行/列標頭 */
  rowLabels: string[];  // e.g. ["Node 1", "Node 2", "V1 KVL"]
  colLabels: string[];  // e.g. ["V₁", "V₂", "Iᵥ₁"]
  nodeCount: number;
  voltSourceCount: number;
}

// ── Gaussian Elimination Step ────────────────────────────
export interface GaussStep {
  description: string;        // 自然語言說明
  pivotRow: number;
  pivotCol: number;
  /** 快照：此步驟後的增廣矩陣（數字）*/
  matrixSnapshot: number[][];
  bSnapshot: number[];
}

// ── Component Telemetry ──────────────────────────────────
export interface ComponentTelemetry {
  componentId: string;
  label: string;
  type: ComponentType;
  vPlus: number;      // V at pin[0]
  vMinus: number;     // V at pin[1]
  deltaV: number;     // vPlus - vMinus
  current: number;    // A（正 = 從 pin[0] 流入）
  power: number;      // W（正 = 消耗，負 = 供應）
  powerType: 'dissipated' | 'supplied';
}

// ── KCL/KVL 推導行 ───────────────────────────────────────
export interface KCLLine {
  nodeId: number;
  latex: string;       // LaTeX 方程式字串
  description: string; // 自然語言說明
}

// ── Bode Plot Data ────────────────────────────────────────
export interface BodePoint {
  freq: number;        // Hz
  gain_dB: number;
  phase_deg: number;
}

// ── Complex Number ────────────────────────────────────────
export interface Complex {
  re: number;
  im: number;
}

export const complex = {
  add: (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im }),
  sub: (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im }),
  mul: (a: Complex, b: Complex): Complex => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }),
  div: (a: Complex, b: Complex): Complex => {
    const denom = b.re * b.re + b.im * b.im;
    return { re: (a.re * b.re + a.im * b.im) / denom, im: (a.im * b.re - a.re * b.im) / denom };
  },
  abs: (a: Complex): number => Math.sqrt(a.re * a.re + a.im * a.im),
  arg: (a: Complex): number => Math.atan2(a.im, a.re),
  fromReal: (r: number): Complex => ({ re: r, im: 0 }),
  zero: (): Complex => ({ re: 0, im: 0 }),
};

// ── MNA Result ───────────────────────────────────────────
export interface MNAResult {
  mode: 'DC' | 'AC';
  /** DC: 實數電壓；AC: 相量（Complex）*/
  nodeVoltages: number[];        // DC only (index = net id - 1, net 0 = GND)
  nodeVoltagesAC?: Complex[];    // AC only
  sourceCurrents: number[];      // DC 電壓源電流
  sourceCurrentsAC?: Complex[];  // AC 電壓源電流
  matrix: MNAMatrix;
  gaussSteps: GaussStep[];
  kclLines: KCLLine[];
  telemetry: ComponentTelemetry[];
  bodeData?: BodePoint[];
  error?: string;
}
