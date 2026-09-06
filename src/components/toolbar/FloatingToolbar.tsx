import React, { useState, useRef, useEffect } from 'react';
import { useCircuitStore } from '../../store/circuitStore';
import { EXAMPLES } from '../../examples/circuits';
import { ThemeToggle } from '../theme/ThemeToggle';
import type {  ComponentType  } from "../../core/mna/types";

export function FloatingToolbar() {
  const store = useCircuitStore();
  const { mode, placingType, analysisMode, acFrequency, toolbarPos, isSolving } = store;
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      dragStart.current = { x: e.clientX, y: e.clientY };
      store.setToolbarPos({
        x: Math.max(0, Math.min(window.innerWidth - (toolbarRef.current?.offsetWidth || 200), toolbarPos.x + dx)),
        y: Math.max(0, Math.min(window.innerHeight - (toolbarRef.current?.offsetHeight || 400), toolbarPos.y + dy))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, toolbarPos, store]);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const getBtnClass = (active: boolean) => 
    `p-1 m-1 text-sm rounded ${active ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-500 border' : 'bg-gray-100 dark:bg-gray-700 border-transparent border'}`;

  return (
    <div
      ref={toolbarRef}
      className="fixed bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col w-[220px] select-none z-50 text-gray-900 dark:text-gray-100"
      style={{ left: toolbarPos.x, top: toolbarPos.y }}
    >
      <div 
        className="cursor-move p-2 bg-gray-100 dark:bg-gray-900 rounded-t-2xl font-bold text-center border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
        onMouseDown={handleDragStart}
      >
        <span>⚡ CircuitWhitebox</span>
      </div>
      
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="text-xs font-semibold mb-1">模式</div>
        <div className="flex flex-wrap">
          <button className={getBtnClass(mode === 'select')} onClick={() => store.setMode('select')}>選取</button>
          <button className={getBtnClass(mode === 'wire')} onClick={() => store.setMode('wire')}>導線</button>
          <button className={getBtnClass(mode === 'place')} onClick={() => store.setMode('place')}>放置</button>
        </div>
      </div>

      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="text-xs font-semibold mb-1">元件</div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { label: 'R', type: 'resistor' },
            { label: 'C', type: 'capacitor' },
            { label: 'L', type: 'inductor' },
            { label: 'Vdc', type: 'vSourceDC' },
            { label: 'Vac', type: 'vSourceAC' },
            { label: 'Idc', type: 'iSourceDC' },
            { label: 'Iac', type: 'iSourceAC' },
            { label: 'GND', type: 'ground' },
            { label: 'OpAmp', type: 'opamp' },
            { label: 'VCVS', type: 'vcvs' },
            { label: 'CCCS', type: 'cccs' },
            { label: 'VCCS', type: 'vccs' },
            { label: 'CCVS', type: 'ccvs' },
          ].map(item => (
            <button 
              key={item.type}
              className={getBtnClass(mode === 'place' && placingType === item.type)}
              onClick={() => {
                store.setMode('place', item.type as ComponentType);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="text-xs font-semibold mb-1">分析模式</div>
        <div className="flex mb-1">
          <button className={getBtnClass(analysisMode === 'DC')} onClick={() => store.setAnalysisMode('DC')}>DC</button>
          <button className={getBtnClass(analysisMode === 'AC')} onClick={() => store.setAnalysisMode('AC')}>AC</button>
        </div>
        {analysisMode === 'AC' && (
          <div className="flex items-center text-sm mt-1">
            <span className="mr-1">AC 頻率:</span>
            <input 
              type="number" 
              className="w-16 p-1 border rounded dark:bg-gray-700 dark:border-gray-600" 
              value={acFrequency} 
              onChange={e => store.setAcFrequency(Number(e.target.value))}
            />
            <span className="ml-1">Hz</span>
          </div>
        )}
      </div>

      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <select 
          className="w-full p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
          onChange={e => {
            const index = Number(e.target.value);
            const ex = EXAMPLES[index];
            if (ex) {
              const data = ex.create();
              store.loadCircuit(data.components, data.wires);
            }
          }}
          defaultValue=""
        >
          <option value="" disabled>載入範例 ▼</option>
          {EXAMPLES.map((ex, idx) => (
            <option key={idx} value={idx}>{ex.name}</option>
          ))}
        </select>
      </div>

      <div className="p-2 flex flex-col gap-1 border-b border-gray-200 dark:border-gray-700">
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded font-bold flex justify-center items-center"
          onClick={() => store.solve()}
        >
          {isSolving ? 'Solving...' : '⚡ Solve'}
        </button>
        <div className="flex gap-1">
          <button className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-1 rounded text-sm" onClick={() => store.reset()}>↺ Reset</button>
          <button className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-1 rounded text-sm" onClick={() => store.undo?.()}>↩ Undo</button>
        </div>
      </div>

      <div className="p-2 flex justify-center items-center text-sm">
        <ThemeToggle /> <span className="ml-2">主題切換</span>
      </div>
    </div>
  );
}
