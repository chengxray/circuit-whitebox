import React from 'react';
import type {  Component, ComponentType  } from "../../core/mna/types";

interface PopupEditorProps {
  comp: Component;
  onUpdate: (updates: Partial<Component>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const getUnits = (type: ComponentType): string[] => {
  switch (type) {
    case 'resistor':  return ['Ω', 'kΩ', 'MΩ'];
    case 'capacitor': return ['F', 'mF', 'μF', 'nF', 'pF'];
    case 'inductor':  return ['H', 'mH', 'μH'];
    case 'vSourceDC':
    case 'vSourceAC': return ['V', 'mV'];
    case 'iSourceDC':
    case 'iSourceAC': return ['A', 'mA'];
    case 'vcvs': return ['V/V'];
    case 'cccs': return ['A/A'];
    case 'vccs': return ['A/V'];
    case 'ccvs': return ['V/A'];
    default: return [];
  }
};

export const PopupEditor: React.FC<PopupEditorProps> = ({ comp, onUpdate, onDelete, onClose }) => {
  const isAC = comp.type.endsWith('AC');
  const isDependent = ['vcvs', 'vccs', 'ccvs', 'cccs'].includes(comp.type);
  const units = getUnits(comp.type);

  // 計算彈出框位置（使用 comp.pos，並限制在可見範圍內）
  const left = Math.max(10, comp.pos.x + 50);
  const top  = Math.max(10, comp.pos.y - 50);

  return (
    <div
      className="absolute bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 text-sm z-50 flex flex-col gap-2"
      style={{ left: `${left}px`, top: `${top}px`, width: '220px', touchAction: 'none' }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header: 標籤 + 關閉按鈕 */}
      <div className="flex justify-between items-center mb-1">
        <input
          className="font-bold bg-transparent border-b border-transparent hover:border-gray-300 dark:text-white focus:outline-none focus:border-blue-500 w-24"
          value={comp.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white text-lg leading-none">×</button>
      </div>

      {/* 數值 + 單位 */}
      {comp.value !== undefined && units.length > 0 && (
        <div className="flex gap-2">
          <input
            type="number"
            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 dark:text-white"
            value={comp.value}
            onChange={(e) => onUpdate({ value: parseFloat(e.target.value) || 0 })}
          />
          <select
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 dark:text-white"
            value={comp.unit || units[0]}
            onChange={(e) => onUpdate({ unit: e.target.value })}
          >
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      )}

      {/* 相依電源：控制元件 + Gain */}
      {isDependent && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">控制元件</label>
            <input
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 dark:text-white"
              value={comp.controlRef || ''}
              placeholder="e.g. R1, V1"
              onChange={(e) => onUpdate({ controlRef: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Gain</label>
            <input
              type="number"
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 dark:text-white"
              value={comp.gain ?? 1}
              onChange={(e) => onUpdate({ gain: parseFloat(e.target.value) || 1 })}
            />
          </div>
        </>
      )}

      {/* AC 電源：頻率 + 相位 */}
      {isAC && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block">Freq (Hz)</label>
            <input
              type="number"
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 dark:text-white"
              value={comp.frequency ?? 60}
              onChange={(e) => onUpdate({ frequency: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 block">Phase (°)</label>
            <input
              type="number"
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 dark:text-white"
              value={comp.phase ?? 0}
              onChange={(e) => onUpdate({ phase: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
      )}

      {/* 旋轉按鈕 */}
      <div className="flex justify-between gap-1 mt-1">
        {([0, 90, 180, 270] as const).map(deg => (
          <button
            key={deg}
            className={`px-2 py-1 rounded text-xs ${comp.rotation === deg ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            onClick={() => onUpdate({ rotation: deg })}
          >
            {deg}°
          </button>
        ))}
      </div>

      {/* 刪除 */}
      <button
        className="mt-1 w-full py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
        onClick={onDelete}
      >
        刪除元件
      </button>
    </div>
  );
};
