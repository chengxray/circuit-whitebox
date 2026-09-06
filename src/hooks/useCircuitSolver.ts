import { useEffect } from 'react';
import { useCircuitStore } from '../store/circuitStore';

export function useAutoSolve(enabled: boolean = false) {
  const components = useCircuitStore(s => s.components);
  const wires = useCircuitStore(s => s.wires);
  const solve = useCircuitStore(s => s.solve);

  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(solve, 500);
    return () => clearTimeout(t);
  }, [components, wires, enabled, solve]);
}
