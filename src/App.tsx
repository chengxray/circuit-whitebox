import { SchematicCanvas } from './components/canvas/SchematicCanvas';
import { FloatingToolbar } from './components/toolbar/FloatingToolbar';
import { InspectorDrawer } from './components/inspector/InspectorDrawer';
import { useDarkMode } from './hooks/usePersistence';
import { useCircuitStore } from './store/circuitStore';
import 'katex/dist/katex.min.css';

export default function App() {
  useDarkMode();
  const inspectorOpen = useCircuitStore(s => s.inspectorOpen);
  
  return (
    <div className="w-screen h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden flex flex-col">
      {/* Main canvas area - takes remaining height above inspector */}
      <div 
        className="flex-1 relative overflow-hidden"
        style={{ paddingBottom: inspectorOpen ? '35vh' : '48px' }}
      >
        <SchematicCanvas />
        <FloatingToolbar />
      </div>
      {/* Inspector drawer fixed at bottom */}
      <InspectorDrawer />
    </div>
  );
}
