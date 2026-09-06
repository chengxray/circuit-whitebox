import { useEffect } from 'react';
import { useCircuitStore } from '../store/circuitStore';

export function useDarkMode() {
  const darkMode = useCircuitStore(s => s.darkMode);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
}
