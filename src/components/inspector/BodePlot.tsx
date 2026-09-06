import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useCircuitStore } from '../../store/circuitStore';

export const BodePlot: React.FC = () => {
  const store = useCircuitStore();
  const bodeData = store.bodeData;

  if (!bodeData || bodeData.length === 0) {
    return (
      <div className="p-4 text-gray-500 flex flex-col h-full">
        請切換到 AC 模式後 Solve 以顯示 Bode 圖
      </div>
    );
  }

  const ticks = [1, 10, 100, 1000, 10000, 100000, 1000000];

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-semibold">輸出節點:</label>
        <input 
          type="text" 
          value={store.bodeOutputNet || ''} 
          onChange={(e) => store.setBodeOutputNet?.(e.target.value)}
          className="border rounded px-2 py-1 text-sm w-24 border-gray-300 dark:border-gray-600 dark:bg-gray-800"
          placeholder="e.g. n2"
        />
      </div>

      <div className="flex-1" style={{ flexBasis: '55%', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={bodeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="frequency" 
              scale="log" 
              domain={['dataMin', 'dataMax']} 
              type="number"
              ticks={ticks}
              tickFormatter={(val) => {
                if (val >= 1000000) return `${val/1000000}M`;
                if (val >= 1000) return `${val/1000}k`;
                return val.toString();
              }}
            />
            <YAxis label={{ value: 'Gain (dB)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <ReferenceLine y={0} stroke="#666" />
            <ReferenceLine y={-3} stroke="#ff0000" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="gain" stroke="#2563eb" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 mt-4" style={{ flexBasis: '45%', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={bodeData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="frequency" 
              scale="log" 
              domain={['dataMin', 'dataMax']} 
              type="number"
              ticks={ticks}
              tickFormatter={(val) => {
                if (val >= 1000000) return `${val/1000000}M`;
                if (val >= 1000) return `${val/1000}k`;
                return val.toString();
              }}
              label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis domain={[-200, 200]} ticks={[-180, -135, -90, -45, 0, 45, 90, 135, 180]} label={{ value: 'Phase (°)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            {[-180, -135, -90, -45, 0].map(deg => (
              <ReferenceLine key={deg} y={deg} stroke="#ccc" strokeDasharray="3 3" />
            ))}
            <Line type="monotone" dataKey="phase" stroke="#ea580c" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
