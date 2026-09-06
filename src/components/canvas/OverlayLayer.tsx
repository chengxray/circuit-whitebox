import React from 'react';
import { Component, ComponentTelemetry } from '../../core/mna/types';
import { smartFormatUnit } from '../../core/mna/gaussSolver';

interface OverlayLayerProps {
  components: Component[];
  telemetry: ComponentTelemetry[];
  nodeVoltages: number[];
}

export const OverlayLayer: React.FC<OverlayLayerProps> = ({ components, telemetry }) => {
  return (
    <g className="overlays pointer-events-none">
      {telemetry.map(t => {
        const comp = components.find(c => c.id === t.componentId);
        if (!comp) return null;

        const voltageStr = smartFormatUnit(Math.abs(t.voltageDrop), 'V');
        const currentStr = smartFormatUnit(Math.abs(t.current), 'A');
        
        const isDissipating = t.power > 0;
        const powerStr = `${smartFormatUnit(Math.abs(t.power), 'W')} (${isDissipating ? '消耗' : '供應'})`;

        return (
          <foreignObject
            key={t.componentId}
            x={comp.position.x - 60}
            y={comp.position.y + 40}
            width="120"
            height="60"
            className="overflow-visible"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 text-xs p-1 rounded shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center">
              <div className="text-blue-600 dark:text-blue-400">ΔV = {voltageStr}</div>
              <div className="text-orange-600 dark:text-orange-400">I = {currentStr}</div>
              <div className={isDissipating ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
                P = {powerStr}
              </div>
            </div>
          </foreignObject>
        );
      })}
    </g>
  );
};
