import React from 'react';
import type {  Wire  } from "../../core/mna/types";

interface WireLayerProps {
  wires: Wire[];
  previewWire: Wire | null;
  selectedWireId: string | null;
  onWireClick: (id: string) => void;
  currentMap?: Map<string, number>;
}

export const WireLayer: React.FC<WireLayerProps> = ({
  wires,
  previewWire,
  selectedWireId,
  onWireClick,
  currentMap
}) => {
  return (
    <g className="wires">
      <style>
        {`
          @keyframes currentFlow { from { stroke-dashoffset: 56; } to { stroke-dashoffset: 0; } }
          @keyframes currentFlowRev { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 56; } }
        `}
      </style>
      {wires.map((wire) => {
        const isSelected = selectedWireId === wire.id;
        const current = currentMap?.get(wire.id) || 0;
        const absCurrent = Math.abs(current);
        const hasCurrent = absCurrent > 1e-9;
        
        const animationSpeed = hasCurrent ? Math.max(0.2, 2 / (1 + absCurrent)) : 0;
        const animName = current >= 0 ? 'currentFlow' : 'currentFlowRev';
        const animStyle = hasCurrent ? { animation: `${animName} ${animationSpeed}s linear infinite` } : {};
        
        const pointsStr = wire.points.map(p => `${p.x},${p.y}`).join(' ');

        return (
          <g key={wire.id} onClick={() => onWireClick(wire.id)} className="cursor-pointer">
            {/* Invisible thicker stroke for easier clicking */}
            <polyline points={pointsStr} fill="none" stroke="transparent" strokeWidth="15" />
            
            <polyline
              points={pointsStr}
              fill="none"
              stroke={isSelected ? "#3b82f6" : "currentColor"}
              strokeWidth="2"
              className="text-gray-500 dark:text-gray-400"
            />
            
            {hasCurrent && (
              <polyline
                points={pointsStr}
                fill="none"
                stroke="#eab308"
                strokeWidth="2"
                strokeDasharray="8 6"
                style={animStyle}
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}

      {previewWire && (
        <polyline
          points={previewWire.points.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="gray"
          strokeWidth="2"
          strokeDasharray="4 4"
          pointerEvents="none"
        />
      )}
    </g>
  );
};
