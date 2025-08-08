import React, { useMemo, useRef, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { setActiveCharacterId } from '../../state/rosterSlice';
import BestiaryView from '../../BestiaryView';
import HomeView from '../../HomeView';
import WorldbuilderView from '../../WorldbuilderView';
import GenesisView from '../../GenesisView';
import { addToken, moveToken, setToolMode, startMeasure, updateMeasure, endMeasure, setFogEnabled, reveal } from '../../state/tokensSlice';

const HomeAdapter: React.FC = () => {
  const dispatch = useAppDispatch();
  const roster = [] as any[]; // TODO: integrate real roster list
  const onCreate = () => dispatch(setActiveCharacterId('demo-' + Math.random().toString(36).slice(2, 8)));
  const onLoad = (id: string) => dispatch(setActiveCharacterId(id));
  const onDelete = (_id: string) => {};
  return <HomeView roster={roster as any} onCreate={onCreate} onLoad={onLoad} onDelete={onDelete} />;
};

const PlayAdapter: React.FC = () => {
  const dispatch = useAppDispatch();
  const mapImageUrl = useAppSelector((s) => s.worldbuilder.generatedMapImageUrl) || useAppSelector((s) => (s as any).playState?.mapImageUrl);
  const { tokens, toolMode, measure, fogEnabled, reveals } = useAppSelector((s: any) => s.tokens);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const handleCoords = (e: React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const pos = handleCoords(e);
    if (toolMode === 'place') {
      dispatch(addToken({ x: pos.x, y: pos.y }));
    } else if (toolMode === 'measure') {
      dispatch(startMeasure(pos));
    } else if (toolMode === 'fog' && fogEnabled) {
      dispatch(reveal({ x: pos.x, y: pos.y }));
    } else {
      // select / drag start if clicked on token
      const rect = containerRef.current.getBoundingClientRect();
      const px = pos.x * rect.width;
      const py = pos.y * rect.height;
      const hit = tokens.find((t: any) => {
        const tx = t.x * rect.width;
        const ty = t.y * rect.height;
        const r = 20 * t.size; // px radius
        return Math.hypot(px - tx, py - ty) <= r;
      });
      if (hit) setDragId(hit.id);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const pos = handleCoords(e);
    if (dragId) {
      dispatch(moveToken({ id: dragId, x: pos.x, y: pos.y }));
    } else if (toolMode === 'measure' && measure) {
      dispatch(updateMeasure(pos));
    }
  };

  const onMouseUp = () => {
    setDragId(null);
    if (measure) dispatch(endMeasure());
  };

  const measurementText = useMemo(() => {
    if (!measure) return null;
    const dx = (measure.end.x - measure.start.x);
    const dy = (measure.end.y - measure.start.y);
    const diag = Math.hypot(dx, dy);
    const cellSize = 1 / 20; // assume 20 cells across for estimate
    const units = Math.round((diag / cellSize) * 5); // 5ft per cell
    return `${units} ft`;
  }, [measure]);

  return (
    <div className="flex flex-col gap-2 h-[calc(100vh-8rem)]">
      <div className="flex gap-2 items-center">
        <button className={`px-3 py-1 rounded ${toolMode==='select'?'bg-blue-600':'bg-gray-700'}`} onClick={() => dispatch(setToolMode('select'))}>Select/Drag</button>
        <button className={`px-3 py-1 rounded ${toolMode==='place'?'bg-blue-600':'bg-gray-700'}`} onClick={() => dispatch(setToolMode('place'))}>Place Token</button>
        <button className={`px-3 py-1 rounded ${toolMode==='measure'?'bg-blue-600':'bg-gray-700'}`} onClick={() => dispatch(setToolMode('measure'))}>Measure</button>
        <label className="flex items-center gap-2 ml-4 text-sm">
          <input type="checkbox" checked={fogEnabled} onChange={(e) => dispatch(setFogEnabled(e.target.checked))} /> Fog of War
        </label>
      </div>
      <div className="flex-grow flex items-center justify-center">
        <div
          ref={containerRef}
          className="relative rounded overflow-hidden bg-black/50"
          style={{ width: 'min(95vh,95vw)', height: 'min(95vh,95vw)', cursor: dragId ? 'grabbing' : toolMode==='place' ? 'crosshair' : toolMode==='measure' ? 'cell' : 'default' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          {mapImageUrl && (
            <img src={mapImageUrl} alt="Map" className="absolute inset-0 w-full h-full object-cover" />
          )}
          {/* grid */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
          {/* fog of war */}
          {fogEnabled && (
            <svg className="absolute inset-0" width="100%" height="100%">
              <defs>
                <mask id="revealMask">
                  <rect x="0" y="0" width="100%" height="100%" fill="black" />
                  {reveals.map((r: any, idx: number) => (
                    <circle key={idx} cx={`${r.x*100}%`} cy={`${r.y*100}%`} r={`${r.radius*100}%`} fill="white" />
                  ))}
                </mask>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#revealMask)" />
            </svg>
          )}
          {/* tokens */}
          {tokens.map((t: any) => (
            <div key={t.id} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black/50 shadow"
              style={{ left: `${t.x*100}%`, top: `${t.y*100}%`, width: `${t.size*50}px`, height: `${t.size*50}px`, backgroundColor: t.color }} />
          ))}
          {/* measuring line */}
          {measure && (
            <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
              <line x1={`${measure.start.x*100}%`} y1={`${measure.start.y*100}%`} x2={`${measure.end.x*100}%`} y2={`${measure.end.y*100}%`} stroke="#60a5fa" strokeWidth="3" />
            </svg>
          )}
          {measure && (
            <div className="absolute bg-blue-600 text-white text-xs px-2 py-1 rounded shadow" style={{ left: `${(measure.end.x*100)}%`, top: `${(measure.end.y*100)}%` }}>
              {measurementText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AppRouter: React.FC = () => {
  const mode = useAppSelector((s) => s.app.mode);

  switch (mode) {
    case 'home':
      return <HomeAdapter />;
    case 'builder':
      return <div className="p-6">Builder</div>;
    case 'genesis':
      return <GenesisView />;
    case 'worldbuilder':
      return <WorldbuilderView />;
    case 'bestiary':
      return <BestiaryView />;
    case 'crucible':
      return <div className="p-6">Crucible</div>;
    case 'play':
      return <PlayAdapter />;
    default:
      return <div className="p-6">Unknown mode</div>;
  }
};

export default AppRouter;