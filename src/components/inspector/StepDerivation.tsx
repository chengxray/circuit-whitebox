import React from 'react';
import { useCircuitStore } from '../../store/circuitStore';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

export const StepDerivation: React.FC = () => {
  const store = useCircuitStore();
  const mnaResult = store.mnaResult;

  if (!mnaResult) {
    return <div className="p-4 text-gray-500">按下 ⚡ Solve 按鈕後顯示推導過程</div>;
  }

  const kclLines = mnaResult.kclLines || [];
  const telemetry = mnaResult.telemetry || [];

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">KCL/KVL 方程式推導</h2>
      
      <div className="space-y-4 mb-8">
        {kclLines.map((line: any, idx: number) => (
          <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="font-semibold text-sm mb-1">{line.type === 'KCL' ? `節點 ${line.node}（KCL）:` : `分支 ${line.node}（KVL 約束）:`}</div>
            <div className="my-2">
              <InlineMath math={line.latex} />
            </div>
            <div className="text-xs text-gray-500">{line.description}</div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h3 className="text-md font-semibold mb-2">組裝 MNA 系統</h3>
        <BlockMath math="[A][x] = [b]" />
      </div>

      {telemetry.length > 0 && (
        <div>
          <h3 className="text-md font-semibold mb-2">解得結果</h3>
          <ul className="list-disc pl-5">
            {mnaResult.matrix.colLabels.map((label: string, i: number) => (
              <li key={i} className="font-mono">
                {label} = {mnaResult.nodeVoltages[i] !== undefined ? mnaResult.nodeVoltages[i].toFixed(2) : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
