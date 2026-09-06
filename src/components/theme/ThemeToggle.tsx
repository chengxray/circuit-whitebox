import { useCircuitStore } from '../../store/circuitStore';

export function ThemeToggle() {
  const darkMode = useCircuitStore(s => s.darkMode);
  const setDarkMode = useCircuitStore(s => s.setDarkMode);
  return (
    <button onClick={() => setDarkMode(!darkMode)} className="text-xl">
      {darkMode ? '☀️' : '🌙'}
    </button>
  );
}
