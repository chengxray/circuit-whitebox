// ============================================================
// Zustand Global State — CircuitWhitebox
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Component, ComponentType, Wire, MNAResult, Point } from '../core/mna/types';
import { solveCircuit } from '../core/mna/netlist';

// ── 工具：產生不重複 ID ──────────────────────────────────
let _idCounter = 1;
export function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${_idCounter++}`;
}

// ── 工具：根據元件類型產生預設 label ────────────────────
function defaultLabel(type: ComponentType, comps: Component[]): string {
  const prefixMap: Record<ComponentType, string> = {
    resistor: 'R',
    capacitor: 'C',
    inductor: 'L',
    vSourceDC: 'V',
    vSourceAC: 'Vac',
    iSourceDC: 'I',
    iSourceAC: 'Iac',
    ground: 'GND',
    opamp: 'U',
    vcvs: 'E',
    cccs: 'F',
    vccs: 'G',
    ccvs: 'H',
  };
  const prefix = prefixMap[type] ?? 'X';
  const count = comps.filter(c => c.type === type).length + 1;
  return `${prefix}${count}`;
}

// ── 工具：計算引腳位置（根據位置和旋轉）────────────────
export function calcPins(
  type: ComponentType,
  pos: Point,
  rotation: 0 | 90 | 180 | 270
): { pins: [Point, Point]; pin3?: Point } {
  // 預設：水平擺放，長 80px，中心在 pos
  // pin[0] = 左端（正端），pin[1] = 右端（負端）
  const half = 40; // 半長

  let dx0 = -half, dy0 = 0; // pin[0] 偏移
  let dx1 = half, dy1 = 0;  // pin[1] 偏移
  let dx2: number | undefined;
  let dy2: number | undefined;

  if (type === 'opamp') {
    // in+: 左上, in-: 左下, out: 右中
    dx0 = -half; dy0 = -20;
    dx1 = -half; dy1 = 20;
    dx2 = half; dy2 = 0;
  } else if (type === 'ground') {
    // 只有一個引腳在頂部
    dx0 = 0; dy0 = 0;
    dx1 = 0; dy1 = 0;
  }

  const rotate = (dx: number, dy: number) => {
    switch (rotation) {
      case 0: return { x: pos.x + dx, y: pos.y + dy };
      case 90: return { x: pos.x + dy, y: pos.y - dx };
      case 180: return { x: pos.x - dx, y: pos.y - dy };
      case 270: return { x: pos.x - dy, y: pos.y + dx };
    }
  };

  const snap = (p: Point): Point => ({
    x: Math.round(p.x / 20) * 20,
    y: Math.round(p.y / 20) * 20,
  });

  const result = {
    pins: [snap(rotate(dx0, dy0)), snap(rotate(dx1, dy1))] as [Point, Point],
    pin3: dx2 !== undefined ? snap(rotate(dx2!, dy2!)) : undefined,
  };
  return result;
}

// ── 預設值 ────────────────────────────────────────────────
const DEFAULT_VALUES: Partial<Record<ComponentType, { value: number; unit: string }>> = {
  resistor:  { value: 1, unit: 'kΩ' },
  capacitor: { value: 1, unit: 'μF' },
  inductor:  { value: 1, unit: 'mH' },
  vSourceDC: { value: 5, unit: 'V' },
  vSourceAC: { value: 1, unit: 'V' },
  iSourceDC: { value: 1, unit: 'mA' },
  iSourceAC: { value: 1, unit: 'mA' },
  ground:    { value: 0, unit: '' },
  opamp:     { value: 0, unit: '' },
  vcvs:      { value: 1, unit: 'V/V' },
  cccs:      { value: 100, unit: 'A/A' },
  vccs:      { value: 0.01, unit: 'A/V' },
  ccvs:      { value: 1000, unit: 'V/A' },
};

// ── 狀態介面 ─────────────────────────────────────────────
export interface CircuitState {
  // 電路資料
  components: Component[];
  wires: Wire[];
  // 選取與互動
  selectedId: string | null;
  mode: 'select' | 'wire' | 'place';
  placingType: ComponentType | null;
  // 分析模式
  analysisMode: 'DC' | 'AC';
  acFrequency: number;
  bodeOutputNet: number;
  // 求解結果
  mnaResult: MNAResult | null;
  isSolving: boolean;
  // 矩陣顯示
  symbolicMode: boolean;
  gaussStepIndex: number;
  // Inspector 面板
  inspectorOpen: boolean;
  inspectorTab: 0 | 1 | 2 | 3;
  // 主題
  darkMode: boolean;
  // 浮動工具列位置
  toolbarPos: Point;
  // 操作歷史（undo）
  history: { components: Component[]; wires: Wire[] }[];
  // 動作
  addComponent: (type: ComponentType, pos: Point) => void;
  updateComponent: (id: string, updates: Partial<Component>) => void;
  deleteComponent: (id: string) => void;
  addWire: (wire: Wire) => void;
  deleteWire: (id: string) => void;
  setMode: (mode: CircuitState['mode'], placingType?: ComponentType) => void;
  setSelected: (id: string | null) => void;
  solve: () => void;
  reset: () => void;
  setSymbolicMode: (v: boolean) => void;
  setGaussStep: (i: number) => void;
  setInspectorOpen: (v: boolean) => void;
  setInspectorTab: (t: 0 | 1 | 2 | 3) => void;
  setDarkMode: (v: boolean) => void;
  setToolbarPos: (p: Point) => void;
  setAnalysisMode: (m: 'DC' | 'AC') => void;
  setAcFrequency: (f: number) => void;
  setBodeOutputNet: (n: number) => void;
  loadCircuit: (comps: Component[], wires: Wire[]) => void;
  undo: () => void;
}

// ── Zustand Store ─────────────────────────────────────────
export const useCircuitStore = create<CircuitState>()(
  persist(
    (set, get) => ({
      components: [],
      wires: [],
      selectedId: null,
      mode: 'select',
      placingType: null,
      analysisMode: 'DC',
      acFrequency: 1000,
      bodeOutputNet: 1,
      mnaResult: null,
      isSolving: false,
      symbolicMode: true,
      gaussStepIndex: 0,
      inspectorOpen: true,
      inspectorTab: 0,
      darkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
      toolbarPos: { x: 20, y: 100 },
      history: [],

      addComponent: (type, pos) => {
        const { components } = get();
        const label = defaultLabel(type, components);
        const def = DEFAULT_VALUES[type] ?? { value: 1, unit: '' };
        const { pins, pin3 } = calcPins(type, pos, 0);
        const newComp: Component = {
          id: genId(type),
          type,
          label,
          value: def.value,
          unit: def.unit,
          pos,
          rotation: 0,
          pins,
          pin3,
          gain: type === 'vcvs' ? 1 : type === 'cccs' ? 100 : type === 'vccs' ? 0.01 : type === 'ccvs' ? 1000 : undefined,
        };
        set(state => ({
          history: [...state.history.slice(-20), { components: state.components, wires: state.wires }],
          components: [...state.components, newComp],
          mnaResult: null,
        }));
      },

      updateComponent: (id, updates) => {
        set(state => {
          const comps = state.components.map(c => {
            if (c.id !== id) return c;
            const updated = { ...c, ...updates };
            // 重算引腳位置（如果 pos 或 rotation 改變）
            if (updates.pos !== undefined || updates.rotation !== undefined) {
              const { pins, pin3 } = calcPins(
                updated.type,
                updated.pos,
                updated.rotation
              );
              updated.pins = pins;
              updated.pin3 = pin3;
            }
            return updated;
          });
          return { components: comps, mnaResult: null };
        });
      },

      deleteComponent: (id) => {
        set(state => ({
          history: [...state.history.slice(-20), { components: state.components, wires: state.wires }],
          components: state.components.filter(c => c.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
          mnaResult: null,
        }));
      },

      addWire: (wire) => {
        set(state => ({
          history: [...state.history.slice(-20), { components: state.components, wires: state.wires }],
          wires: [...state.wires, wire],
          mnaResult: null,
        }));
      },

      deleteWire: (id) => {
        set(state => ({
          wires: state.wires.filter(w => w.id !== id),
          mnaResult: null,
        }));
      },

      setMode: (mode, placingType = null) => set({ mode, placingType }),
      setSelected: (id) => set({ selectedId: id }),

      solve: () => {
        const { components, wires, analysisMode, acFrequency, bodeOutputNet } = get();
        set({ isSolving: true });
        // 非同步執行（避免 UI 凍結）
        setTimeout(() => {
          const result = solveCircuit(components, wires, analysisMode, acFrequency, bodeOutputNet);
          set({ mnaResult: result, isSolving: false, gaussStepIndex: 0, inspectorOpen: true });
        }, 0);
      },

      reset: () => {
        set(state => ({
          history: [...state.history.slice(-20), { components: state.components, wires: state.wires }],
          components: [],
          wires: [],
          selectedId: null,
          mnaResult: null,
          mode: 'select',
        }));
      },

      setSymbolicMode: (v) => set({ symbolicMode: v }),
      setGaussStep: (i) => set({ gaussStepIndex: i }),
      setInspectorOpen: (v) => set({ inspectorOpen: v }),
      setInspectorTab: (t) => set({ inspectorTab: t }),
      setDarkMode: (v) => set({ darkMode: v }),
      setToolbarPos: (p) => set({ toolbarPos: p }),
      setAnalysisMode: (m) => set({ analysisMode: m, mnaResult: null }),
      setAcFrequency: (f) => set({ acFrequency: f }),
      setBodeOutputNet: (n) => set({ bodeOutputNet: n }),

      loadCircuit: (comps, wires) => {
        set(state => ({
          history: [...state.history.slice(-20), { components: state.components, wires: state.wires }],
          components: comps,
          wires,
          mnaResult: null,
          selectedId: null,
        }));
      },

      undo: () => {
        const { history } = get();
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        set({
          components: prev.components,
          wires: prev.wires,
          history: history.slice(0, -1),
          mnaResult: null,
        });
      },
    }),
    {
      name: 'circuit-whitebox-storage',
      partialize: (state: CircuitState) => ({
        components: state.components,
        wires: state.wires,
        darkMode: state.darkMode,
        analysisMode: state.analysisMode,
        acFrequency: state.acFrequency,
        inspectorOpen: state.inspectorOpen,
        toolbarPos: state.toolbarPos,
      }),
    }
  )
);
