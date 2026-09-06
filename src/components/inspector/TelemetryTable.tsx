import React from 'react';
import { useCircuitStore } from '../../store/circuitStore';
import { smartFormatUnit } from '../../core/mna/gaussSolver';

export const TelemetryTable: React.FC = () => {
  const store = useCircuitStore();
  const telemetry = store.mnaResult?.telemetry || [];

  if (telemetry.length === 0) {
    return (
      <div className="p-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th>元件</th><th>類型</th><th>V₊</th><th>V₋</th><th>ΔV</th><th>I</th><th>P</th><th>供/耗</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={8} className="text-center py-4 text-gray-500">--</td></tr>
          </tbody>
        </table>
      </div>
    );
  }

  const typeMap: Record<string, string> = {
    resistor: '電阻',
    vSourceDC: '直流電壓源',
    capacitor: '電容',
    inductor: '電感',
    gnd: '接地',
    opamp: '運算放大器'
  };

  const getRowColor = (type: string) => {
    switch (type) {
      case 'vSourceDC': return 'bg-blue-50 dark:bg-blue-900/20';
      case 'resistor': return 'bg-gray-50 dark:bg-gray-800';
      case 'capacitor':
      case 'inductor': return 'bg-purple-50 dark:bg-purple-900/20';
      case 'gnd':
      case 'opamp': return 'bg-yellow-50 dark:bg-yellow-900/20';
      default: return '';
    }
  };

  let totalSupply = 0;
  let totalDissipated = 0;

  return (
    <div className="p-4 overflow-x-auto h-full">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-2">元件</th>
            <th>類型</th>
            <th>V₊</th>
            <th>V₋</th>
            <th>ΔV</th>
            <th>I</th>
            <th>P</th>
            <th>供/耗</th>
          </tr>
        </thead>
        <tbody>
          {telemetry.map((t: any, i: number) => {
            if (t.powerType === 'supply') totalSupply += t.power;
            else totalDissipated += t.power;

            return (
              <tr key={i} className={`border-b border-gray-200 dark:border-gray-700 ${getRowColor(t.type)}`}>
                <td className="py-2 font-bold">{t.label}</td>
                <td>{typeMap[t.type] || t.type}</td>
                <td>{smartFormatUnit(t.vPlus, 'V')}</td>
                <td>{smartFormatUnit(t.vMinus, 'V')}</td>
                <td>{smartFormatUnit(t.deltaV, 'V')}</td>
                <td>{smartFormatUnit(t.current, 'A')}</td>
                <td>{smartFormatUnit(t.power, 'W')}</td>
                <td>
                  {t.powerType === 'supply' ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">供應</span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">消耗</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="font-bold border-t-2 border-gray-400">
            <td colSpan={6} className="py-2 text-right pr-4">總供應 / 總消耗:</td>
            <td colSpan={2}>
              <span className="text-green-600">{smartFormatUnit(totalSupply, 'W')}</span> / 
              <span className="text-red-600 ml-1">{smartFormatUnit(totalDissipated, 'W')}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
