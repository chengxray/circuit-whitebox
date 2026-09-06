import React from 'react';
import type {  Component, ComponentTelemetry  } from "../../core/mna/types";

interface ComponentSpriteProps {
  comp: Component;
  isSelected: boolean;
  onClick: (e: React.MouseEvent<SVGGElement>) => void;
  onDragStart: (e: React.PointerEvent<SVGGElement>) => void;
  showPins: boolean;
  result?: ComponentTelemetry | null;
}

export const ComponentSprite: React.FC<ComponentSpriteProps> = ({
  comp,
  isSelected,
  onClick,
  onDragStart,
  showPins
}) => {
  const { type, pos, rotation = 0, label } = comp;

  const renderSymbol = () => {
    switch (type) {
      case 'resistor':
        return (
          <>
            <rect x="-30" y="-10" width="60" height="20" fill="transparent" stroke="currentColor" strokeWidth="2" />
            <line x1="-40" y1="0" x2="-30" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="30" y1="0" x2="40" y2="0" stroke="currentColor" strokeWidth="2" />
          </>
        );
      case 'capacitor':
        return (
          <>
            <line x1="-5" y1="-15" x2="-5" y2="15" stroke="currentColor" strokeWidth="2" />
            <line x1="5" y1="-15" x2="5" y2="15" stroke="currentColor" strokeWidth="2" />
            <line x1="-40" y1="0" x2="-5" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="5" y1="0" x2="40" y2="0" stroke="currentColor" strokeWidth="2" />
          </>
        );
      case 'inductor':
        return (
          <>
            <line x1="-40" y1="0" x2="-20" y2="0" stroke="currentColor" strokeWidth="2" />
            <path d="M-20,0 Q-10,-20 0,0 Q10,-20 20,0 Q30,-20 40,0" fill="transparent" stroke="currentColor" strokeWidth="2" />
          </>
        );
      case 'vSourceDC':
        return (
          <>
            <circle cx="0" cy="0" r="20" fill="transparent" stroke="currentColor" strokeWidth="2" />
            <text x="0" y="-5" fontSize="14" textAnchor="middle" dominantBaseline="middle" fill="currentColor">+</text>
            <text x="0" y="7" fontSize="14" textAnchor="middle" dominantBaseline="middle" fill="currentColor">−</text>
            <line x1="-40" y1="0" x2="-20" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="0" x2="40" y2="0" stroke="currentColor" strokeWidth="2" />
          </>
        );
      case 'vSourceAC':
        return (
          <>
            <circle cx="0" cy="0" r="20" fill="transparent" stroke="currentColor" strokeWidth="2" />
            <text x="0" y="0" fontSize="18" textAnchor="middle" dominantBaseline="middle" fill="currentColor">~</text>
            <line x1="-40" y1="0" x2="-20" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="0" x2="40" y2="0" stroke="currentColor" strokeWidth="2" />
          </>
        );
      case 'iSourceDC':
        return (
          <>
            <circle cx="0" cy="0" r="20" fill="transparent" stroke="currentColor" strokeWidth="2" />
            <line x1="-10" y1="0" x2="10" y2="0" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow)" />
            <line x1="-40" y1="0" x2="-20" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="0" x2="40" y2="0" stroke="currentColor" strokeWidth="2" />
          </>
        );
      case 'iSourceAC':
        return (
          <>
            <circle cx="0" cy="0" r="20" fill="transparent" stroke="currentColor" strokeWidth="2" />
            <text x="0" y="-8" fontSize="14" textAnchor="middle" dominantBaseline="middle" fill="currentColor">~</text>
            <line x1="-10" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow)" />
            <line x1="-40" y1="0" x2="-20" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="0" x2="40" y2="0" stroke="currentColor" strokeWidth="2" />
          </>
        );
      case 'ground':
        return (
          <>
            <line x1="0" y1="-20" x2="0" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="-15" y1="0" x2="15" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="-10" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="2" />
            <line x1="-5" y1="10" x2="5" y2="10" stroke="currentColor" strokeWidth="2" />
          </>
        );
      case 'opamp':
        return (
          <>
            <polygon points="-20,-20 -20,20 20,0" fill="transparent" stroke="currentColor" strokeWidth="2" />
            <text x="-12" y="-8" fontSize="10" textAnchor="middle" dominantBaseline="middle" fill="currentColor">+</text>
            <text x="-12" y="8" fontSize="10" textAnchor="middle" dominantBaseline="middle" fill="currentColor">−</text>
            <line x1="-40" y1="-10" x2="-20" y2="-10" stroke="currentColor" strokeWidth="2" />
            <line x1="-40" y1="10" x2="-20" y2="10" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="0" x2="40" y2="0" stroke="currentColor" strokeWidth="2" />
          </>
        );
      case 'vcvs':
      case 'ccvs':
        return (
          <>
            <polygon points="0,-20 20,0 0,20 -20,0" fill="transparent" stroke="currentColor" strokeWidth="2" />
            <text x="0" y="0" fontSize="14" textAnchor="middle" dominantBaseline="middle" fill="currentColor">V</text>
            <line x1="-40" y1="0" x2="-20" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="0" x2="40" y2="0" stroke="currentColor" strokeWidth="2" />
          </>
        );
      case 'vccs':
      case 'cccs':
        return (
          <>
            <polygon points="0,-20 20,0 0,20 -20,0" fill="transparent" stroke="currentColor" strokeWidth="2" />
            <text x="0" y="0" fontSize="14" textAnchor="middle" dominantBaseline="middle" fill="currentColor">I</text>
            <line x1="-40" y1="0" x2="-20" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="0" x2="40" y2="0" stroke="currentColor" strokeWidth="2" />
          </>
        );
      default:
        return <rect x="-20" y="-20" width="40" height="40" fill="transparent" stroke="currentColor" strokeWidth="2" />;
    }
  };

  const getPinOffsets = () => {
    if (type === 'opamp') return [{ x: -40, y: -10 }, { x: -40, y: 10 }, { x: 40, y: 0 }];
    if (type === 'ground') return [{ x: 0, y: -20 }];
    return [{ x: -40, y: 0 }, { x: 40, y: 0 }];
  };

  return (
    <g
      transform={`translate(${pos.x}, ${pos.y}) rotate(${rotation})`}
      className="fill-current text-gray-800 dark:text-gray-100 cursor-pointer"
      onPointerDown={onDragStart}
      onClick={onClick}
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>

      {/* Hitbox */}
      <rect x="-40" y="-40" width="80" height="80" fill="transparent" stroke="none" />

      {isSelected && (
        <rect x="-45" y="-45" width="90" height="90" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 2" />
      )}

      {renderSymbol()}

      <text
        x="0"
        y="30"
        fontSize="12"
        textAnchor="middle"
        fill="currentColor"
        className="select-none"
        transform={rotation === 90 || rotation === 270 ? `rotate(${-rotation})` : undefined}
      >
        {label}
      </text>

      {showPins && getPinOffsets().map((pin, i) => (
        <circle
          key={i}
          cx={pin.x}
          cy={pin.y}
          r="4"
          fill="none"
          stroke="currentColor"
          className="hover:stroke-green-500"
          strokeWidth="1.5"
        />
      ))}
    </g>
  );
};
