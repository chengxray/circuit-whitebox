import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useCircuitStore, genId, calcPins } from '../../store/circuitStore';
import { ComponentSprite } from './ComponentSprite';
import { WireLayer } from './WireLayer';
import { OverlayLayer } from './OverlayLayer';
import { PopupEditor } from './PopupEditor';
import { Wire, Point } from '../../core/mna/types';

const GRID = 20;
function snap(v: number): number { return Math.round(v / GRID) * GRID; }

export const SchematicCanvas: React.FC = () => {
  const store = useCircuitStore();
  const svgRef = useRef<SVGSVGElement>(null);

  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1200, h: 800 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panVB, setPanVB] = useState({ x: 0, y: 0 });

  const [previewWire, setPreviewWire] = useState<Wire | null>(null);
  const [wireStart, setWireStart] = useState<Point | null>(null);

  const [ghostPos, setGhostPos] = useState<Point>({ x: 200, y: 200 });
  const [draggedCompId, setDraggedCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const { clientWidth, clientHeight } = svgRef.current;
        setViewBox(prev => ({ ...prev, w: clientWidth, h: clientHeight }));
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        store.setMode('select');
        setWireStart(null);
        setPreviewWire(null);
        setSelectedCompId(null);
        setSelectedWireId(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCompId) {
          store.deleteComponent(selectedCompId);
          setSelectedCompId(null);
        }
        if (selectedWireId) {
          store.deleteWire(selectedWireId);
          setSelectedWireId(null);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        store.undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCompId, selectedWireId, store]);

  // SVG coordinate transform
  const getSVGPoint = useCallback((e: React.PointerEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const inv = svgRef.current.getScreenCTM()?.inverse();
    if (!inv) return { x: 0, y: 0 };
    const t = pt.matrixTransform(inv);
    return { x: snap(t.x), y: snap(t.y) };
  }, []);

  const getRawSVGPoint = useCallback((e: React.PointerEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const inv = svgRef.current.getScreenCTM()?.inverse();
    if (!inv) return { x: 0, y: 0 };
    const t = pt.matrixTransform(inv);
    return { x: t.x, y: t.y };
  }, []);

  // Orthogonal wire routing
  const routeWire = (start: Point, end: Point, diagonal: boolean): Point[] => {
    if (diagonal) return [start, end];
    // Horizontal first, then vertical
    return [start, { x: end.x, y: start.y }, end];
  };

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    // Middle click or Alt+click = pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setPanVB({ x: viewBox.x, y: viewBox.y });
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if (e.button !== 0) return;

    const pt = getSVGPoint(e);

    if (store.mode === 'place' && store.placingType) {
      const { pins, pin3 } = calcPins(store.placingType, pt, 0);
      store.addComponent(store.placingType, pt);
      store.setMode('select');
      return;
    }

    if (store.mode === 'wire') {
      if (!wireStart) {
        setWireStart(pt);
      } else {
        const points = routeWire(wireStart, pt, e.shiftKey);
        const newWire: Wire = { id: genId('w'), points };
        store.addWire(newWire);
        setWireStart(null);
        setPreviewWire(null);
      }
      return;
    }

    if (store.mode === 'select') {
      // Click on blank canvas = deselect
      setSelectedCompId(null);
      setSelectedWireId(null);
    }
  }, [store, viewBox, wireStart, getSVGPoint]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setViewBox(prev => ({ ...prev, x: panVB.x - dx, y: panVB.y - dy }));
      return;
    }

    const pt = getSVGPoint(e);
    setGhostPos(pt);

    if (draggedCompId) {
      store.updateComponent(draggedCompId, {
        pos: { x: pt.x - dragOffset.x, y: pt.y - dragOffset.y },
      });
      return;
    }

    if (store.mode === 'wire' && wireStart) {
      const points = routeWire(wireStart, pt, e.shiftKey);
      setPreviewWire({ id: 'preview', points });
    }
  }, [isPanning, panStart, panVB, draggedCompId, dragOffset, store, wireStart, getSVGPoint]);

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    setIsPanning(false);
    setDraggedCompId(null);
    if (svgRef.current) {
      try { svgRef.current.releasePointerCapture(e.pointerId); } catch {}
    }
  }, []);

  // Telemetry current map
  const currentMap = new Map<string, number>();
  // (wire-to-current mapping would need net analysis; simplified here)

  const viewBoxStr = `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`;
  const cursorClass = store.mode === 'place' || store.mode === 'wire'
    ? 'cursor-crosshair'
    : isPanning
    ? 'cursor-grabbing'
    : 'cursor-default';

  const selectedComp = selectedCompId
    ? store.components.find(c => c.id === selectedCompId) ?? null
    : null;

  const mnaResult = store.mnaResult;

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-950">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={viewBoxStr}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={cursorClass}
        style={{ touchAction: 'none' }}
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"
            x={viewBox.x % 20} y={viewBox.y % 20}>
            <circle cx="10" cy="10" r="1.2" fill="#cbd5e1" className="dark:fill-gray-700" />
          </pattern>
        </defs>

        {/* Grid background */}
        <rect
          x={viewBox.x}
          y={viewBox.y}
          width={viewBox.w}
          height={viewBox.h}
          fill="url(#grid)"
          pointerEvents="none"
        />

        {/* Wires */}
        <WireLayer
          wires={store.wires}
          previewWire={previewWire}
          selectedWireId={selectedWireId}
          onWireClick={(id) => {
            if (store.mode === 'select') {
              setSelectedWireId(id);
              setSelectedCompId(null);
            }
          }}
          currentMap={currentMap}
        />

        {/* Components */}
        {store.components.map(comp => (
          <ComponentSprite
            key={comp.id}
            comp={comp}
            isSelected={selectedCompId === comp.id}
            showPins={store.mode === 'wire'}
            result={mnaResult?.telemetry?.find(t => t.componentId === comp.id) ?? null}
            onClick={(e) => {
              e.stopPropagation();
              if (store.mode === 'select') {
                setSelectedCompId(comp.id);
                setSelectedWireId(null);
              }
            }}
            onDragStart={(e) => {
              if (store.mode === 'select') {
                e.stopPropagation();
                const svgPt = getSVGPoint(e);
                setDragOffset({ x: svgPt.x - comp.pos.x, y: svgPt.y - comp.pos.y });
                setSelectedCompId(comp.id);
                setDraggedCompId(comp.id);
              }
            }}
          />
        ))}

        {/* Ghost component while placing */}
        {store.mode === 'place' && store.placingType && (
          <g opacity={0.5} pointerEvents="none">
            <ComponentSprite
              comp={{
                id: 'ghost',
                type: store.placingType,
                label: '...',
                value: 1,
                unit: '',
                pos: ghostPos,
                rotation: 0,
                pins: [ghostPos, ghostPos],
              }}
              isSelected={false}
              showPins={true}
              result={null}
              onClick={() => {}}
              onDragStart={() => {}}
            />
          </g>
        )}

        {/* Wire start indicator */}
        {wireStart && (
          <circle
            cx={wireStart.x}
            cy={wireStart.y}
            r={5}
            fill="#3b82f6"
            opacity={0.8}
            pointerEvents="none"
          />
        )}

        {/* V/I/P overlays */}
        {mnaResult && (
          <OverlayLayer
            components={store.components}
            telemetry={mnaResult.telemetry}
            nodeVoltages={mnaResult.nodeVoltages}
          />
        )}
      </svg>

      {/* Popup editor */}
      {selectedComp && (
        <PopupEditor
          comp={selectedComp}
          onUpdate={(updates) => store.updateComponent(selectedComp.id, updates)}
          onDelete={() => {
            store.deleteComponent(selectedComp.id);
            setSelectedCompId(null);
          }}
          onClose={() => setSelectedCompId(null)}
        />
      )}
    </div>
  );
};
