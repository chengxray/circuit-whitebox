import React, { useState } from 'react';
import { useCircuitStore } from '../../store/circuitStore';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { smartFormat } from '../../core/mna/gaussSolver';

export const MNAMatrixView: React.FC = () => {
  const store = useCircuitStore();
  const result = store.mnaResult;
  const [mode, setMode] = useState<'symbolic' | 'numeric'>('symbolic');
  const [stepIndex, setStepIndex] = useState(0);

  if (!result || !result.matrix) {
    return <div className="p-4 text-gray-500">按下 ⚡ Solve 按鈕後顯示矩陣</div>;
  }

  const { matrix, gaussSteps } = result;
  
  // Choose which matrix data to show based on step and mode
  let A: any[][] = [];
  let b: any[] = [];
  let pivotRow = -1;
  let pivotCol = -1;
  let stepDesc = '';

  if (gaussSteps && gaussSteps.length > 0 && mode === 'numeric') {
    const step = gaussSteps[stepIndex];
    A = step.A;
    b = step.b;
    pivotRow = step.pivotRow;
    pivotCol = step.pivotCol;
    stepDesc = step.description;
  } else {
    A = mode === 'symbolic' ? matrix.symbolicA : matrix.numericA;
    b = mode === 'symbolic' ? matrix.symbolicB : matrix.numericB;
  }

  // Construct LaTeX array string
  const n = A.length;
  let latex = '\\left[\\begin{array}{' + 'c'.repeat(n) + '|c}\n';
  
  for (let i = 0; i < n; i++) {
    const row = A[i].map((val: any, j: number) => {
      let vStr = mode === 'symbolic' ? val : smartFormat(Number(val));
      if (mode === 'numeric' && i === pivotRow && j === pivotCol) {
        return `\\colorbox{#bfdbfe}{$${vStr}$}`;
      }
      return vStr;
    });
    const bStr = mode === 'symbolic' ? b[i] : smartFormat(Number(b[i]));
    latex += row.join(' & ') + ' & ' + bStr;
    if (i < n - 1) latex += ' \\\\\n';
  }
  latex += '\n\\end{array}\\right]';

  // Construct solution vector
  const xVec = matrix.colLabels.join(', ');

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto">
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setMode('symbolic')}
          className={`px-3 py-1 rounded ${mode === 'symbolic' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          符號模式
        </button>
        <button 
          onClick={() => setMode('numeric')}
          className={`px-3 py-1 rounded ${mode === 'numeric' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          數字模式
        </button>
      </div>

      <div className="text-xs font-mono overflow-x-auto mb-4">
        <BlockMath math={latex} />
      </div>

      <div className="text-center font-mono text-sm mb-6">
        <BlockMath math={`\\mathbf{x} = \\begin{bmatrix} ${xVec.replace(/,/g, ' \\\\ ')} \\end{bmatrix}`} />
      </div>

      {mode === 'numeric' && gaussSteps && gaussSteps.length > 0 && (
        <div className="mt-auto p-4 bg-gray-50 dark:bg-gray-800 rounded">
          <label className="block text-sm font-semibold mb-2">高斯消去法步驟</label>
          <input 
            type="range" 
            min={0} 
            max={gaussSteps.length - 1} 
            value={stepIndex} 
            onChange={(e) => setStepIndex(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-sm mt-2">{stepDesc}</div>
        </div>
      )}
    </div>
  );
};
