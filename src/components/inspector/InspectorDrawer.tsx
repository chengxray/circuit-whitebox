import React, { useState, useRef, useEffect } from 'react';
import { useCircuitStore } from '../../store/circuitStore';
import { MNAMatrixView } from './MNAMatrixView';
import { StepDerivation } from './StepDerivation';
import { TelemetryTable } from './TelemetryTable';
import { BodePlot } from './BodePlot';

export const InspectorDrawer: React.FC = () => {
  const store = useCircuitStore();
  const [height, setHeight] = useState(300);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const tabs = [
    { label: '[A|b]', title: 'MNA Matrix', component: <MNAMatrixView /> },
    { label: 'KCL', title: '推導步驟', component: <StepDerivation /> },
    { label: '📊', title: '元件遙測', component: <TelemetryTable /> },
    { label: '〰️', title: 'Bode 圖', component: <BodePlot /> },
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const windowHeight = window.innerHeight;
      let newHeight = windowHeight - e.clientY;
      if (newHeight < 80) newHeight = 80;
      if (newHeight > windowHeight * 0.7) newHeight = windowHeight * 0.7;
      setHeight(newHeight);
      if (collapsed) setCollapsed(false);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [collapsed]);

  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <div 
      ref={drawerRef}
      className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex flex-col z-50 transition-all duration-300"
      style={{ height: collapsed ? '48px' : `${height}px` }}
    >
      <div 
        className="h-2 w-full cursor-ns-resize flex justify-center items-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors"
        onMouseDown={(e) => {
          isDragging.current = true;
          document.body.style.cursor = 'ns-resize';
          e.preventDefault();
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
      </div>

      <div className="flex justify-between items-center px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex gap-1 h-10 items-center">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveTab(i);
                if (collapsed) setCollapsed(false);
              }}
              className={`px-3 py-1 rounded text-sm flex items-center gap-1
                ${activeTab === i && !collapsed ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              title={tab.title}
            >
              <span className="font-mono">{tab.label}</span>
              {!collapsed && <span>{tab.title}</span>}
            </button>
          ))}
        </div>
        <button 
          onClick={toggleCollapse}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          {collapsed ? '▼' : '≡'}
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-hidden relative">
          {tabs[activeTab].component}
        </div>
      )}
    </div>
  );
};
