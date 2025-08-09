import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { setActiveCharacterId } from '../../state/rosterSlice';
import BestiaryView from '../../BestiaryView';
import HomeView from '../../HomeView';
import WorldbuilderView from '../../WorldbuilderView';
import GenesisView from '../../GenesisView';
import {
  addToken,
  moveToken,
  setToolMode,
  startMeasure,
  updateMeasure,
  endMeasure,
  setFogEnabled,
  reveal,
  setGridCellsAcross,
  setUnitsPerCell,
  setSnapToGrid,
  updateToken,
  setTokens,
  setInitiative,
  nextTurn,
  loadTokensState,
  removeToken,
  healToken,
  damageToken,
  setSelectedToken,
} from '../../state/tokensSlice';
import { postGameEvent } from '../../eventSlice';

const HomeAdapter: React.FC = () => {
  const dispatch = useAppDispatch();
  const roster = [] as any[]; // TODO: integrate real roster list
  const onCreate = () => dispatch(setActiveCharacterId('demo-' + Math.random().toString(36).slice(2, 8)));
  const onLoad = (id: string) => dispatch(setActiveCharacterId(id));
  const onDelete = (_id: string) => {};
  return <HomeView roster={roster as any} onCreate={onCreate} onLoad={onLoad} onDelete={onDelete} />;
};

const TokenInspector: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tokens, selectedTokenId } = useAppSelector((s: any) => s.tokens);
  const tok = tokens.find((t: any) => t.id === selectedTokenId);
  if (!tok) return <div className="text-sm text-gray-400">No token selected</div>;
  return (
    <div className="space-y-2 text-sm">
      <div className="flex gap-2 items-center"><span className="w-16 text-gray-400">Name</span><input className="bg-gray-800 rounded px-2 py-1 flex-1" value={tok.name} onChange={(e) => dispatch(updateToken({ id: tok.id, changes: { name: e.target.value } }))} /></div>
      <div className="flex gap-2 items-center"><span className="w-16 text-gray-400">Color</span><input type="color" value={tok.color} onChange={(e) => dispatch(updateToken({ id: tok.id, changes: { color: e.target.value } }))} /></div>
      <div className="flex gap-2 items-center"><span className="w-16 text-gray-400">Size</span><input type="number" min={1} max={4} className="bg-gray-800 rounded px-2 py-1 w-20" value={tok.size} onChange={(e) => dispatch(updateToken({ id: tok.id, changes: { size: Math.max(1, Math.min(4, Number(e.target.value)||1)) } }))} /></div>
      <div className="flex gap-2 items-center"><span className="w-16 text-gray-400">Image</span><input className="bg-gray-800 rounded px-2 py-1 flex-1" value={tok.imageUrl || ''} onChange={(e) => dispatch(updateToken({ id: tok.id, changes: { imageUrl: e.target.value || undefined } }))} placeholder="https://..." /></div>
    </div>
  );
};

const InitiativeTracker: React.FC = () => {
  const dispatch = useAppDispatch();
  const { initiativeOrder, activeIndex, tokens } = useAppSelector((s: any) => s.tokens);
  const nameFor = (id: string) => tokens.find((t: any) => t.id === id)?.name || id.slice(0, 4);
  const reorder = (dir: -1 | 1) => {
    if (initiativeOrder.length < 2) return;
    const idx = activeIndex;
    const swapIdx = (idx + dir + initiativeOrder.length) % initiativeOrder.length;
    const arr = [...initiativeOrder];
    [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
    dispatch(setInitiative(arr));
  };
  return (
    <div className="flex items-center gap-2 text-sm">
      <button className="px-2 py-1 bg-gray-700 rounded" onClick={() => dispatch(nextTurn())}>Next Turn</button>
      <button className="px-2 py-1 bg-gray-700 rounded" onClick={() => reorder(-1)}>⬆</button>
      <button className="px-2 py-1 bg-gray-700 rounded" onClick={() => reorder(1)}>⬇</button>
      <div className="flex gap-1 items-center">
        {initiativeOrder.map((id: string, i: number) => (
          <span key={id} className={`px-2 py-1 rounded ${i===activeIndex?'bg-blue-600 text-white':'bg-gray-800 text-gray-300'}`}>{nameFor(id)}</span>
        ))}
      </div>
    </div>
  );
};

const PlayAdapter: React.FC = () => {
  const dispatch = useAppDispatch();
  const mapImageUrl = useAppSelector((s) => s.worldbuilder.generatedMapImageUrl) || useAppSelector((s) => (s as any).playState?.mapImageUrl);
  const { tokens, toolMode, measure, fogEnabled, reveals, gridCellsAcross, unitsPerCell, snapToGrid, selectedTokenId } = useAppSelector((s: any) => s.tokens);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedTokenId) return;
      if (e.key === 'Delete') dispatch(removeToken(selectedTokenId));
      if (e.key === '+' || e.key === '=') dispatch(healToken({ id: selectedTokenId, amount: 1 }));
      if (e.key === '-' || e.key === '_') dispatch(damageToken({ id: selectedTokenId, amount: 1 }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, selectedTokenId]);

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
      const rect = containerRef.current.getBoundingClientRect();
      const px = pos.x * rect.width;
      const py = pos.y * rect.height;
      const hit = tokens.find((t: any) => {
        const tx = t.x * rect.width;
        const ty = t.y * rect.height;
        const r = (rect.width / gridCellsAcross) * t.size * 0.6;
        return Math.hypot(px - tx, py - ty) <= r;
      });
      if (hit) {
        setDragId(hit.id);
        dispatch(setSelectedToken(hit.id));
      } else {
        dispatch(setSelectedToken(null));
      }
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
    const cellSize = 1 / gridCellsAcross;
    const units = Math.round((diag / cellSize) * unitsPerCell);
    return `${units} ft`;
  }, [measure, gridCellsAcross, unitsPerCell]);

  const exportState = () => {
    const state = { tokens, gridCellsAcross, unitsPerCell, snapToGrid, fogEnabled, reveals };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vtt-state.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const importState = async (file: File) => {
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      dispatch(loadTokensState(json));
    } catch {}
  };

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-8rem)]">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 items-center">
          <button className={`px-3 py-1 rounded ${toolMode==='select'?'bg-blue-600':'bg-gray-700'}`} onClick={() => dispatch(setToolMode('select'))}>Select</button>
          <button className={`px-3 py-1 rounded ${toolMode==='place'?'bg-blue-600':'bg-gray-700'}`} onClick={() => dispatch(setToolMode('place'))}>Place</button>
          <button className={`px-3 py-1 rounded ${toolMode==='measure'?'bg-blue-600':'bg-gray-700'}`} onClick={() => dispatch(setToolMode('measure'))}>Measure</button>
          <label className="flex items-center gap-2 ml-2 text-sm">
            <input type="checkbox" checked={fogEnabled} onChange={(e) => dispatch(setFogEnabled(e.target.checked))} /> Fog
          </label>
        </div>
        <div className="flex gap-2 items-center text-sm">
          <span className="text-gray-400">Grid</span>
          <input className="w-20 bg-gray-800 rounded px-2 py-1" type="number" min={5} max={200} value={gridCellsAcross} onChange={(e) => dispatch(setGridCellsAcross(Number(e.target.value)||20))} />
          <span className="text-gray-400">Units/Cell</span>
          <input className="w-20 bg-gray-800 rounded px-2 py-1" type="number" min={1} max={100} value={unitsPerCell} onChange={(e) => dispatch(setUnitsPerCell(Number(e.target.value)||5))} />
          <label className="flex items-center gap-2"><input type="checkbox" checked={snapToGrid} onChange={(e) => dispatch(setSnapToGrid(e.target.checked))} /> Snap</label>
        </div>
        <InitiativeTracker />
        <div className="ml-auto flex gap-2 items-center text-sm">
          <button className="px-3 py-1 bg-gray-700 rounded" onClick={exportState}>Export</button>
          <label className="px-3 py-1 bg-gray-700 rounded cursor-pointer">Import<input type="file" className="hidden" accept="application/json" onChange={(e) => e.currentTarget.files && e.currentTarget.files[0] && importState(e.currentTarget.files[0])} /></label>
        </div>
      </div>
      <DebugPanel />
      <div className="flex gap-3 flex-1 min-h-0">
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
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: `${100/gridCellsAcross}% ${100/gridCellsAcross}%` }} />
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
            {tokens.map((t: any) => (
              <div key={t.id} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow ${selectedTokenId===t.id?'ring-4 ring-yellow-400':''}`}
                style={{ left: `${t.x*100}%`, top: `${t.y*100}%`, width: `${t.size*(100/gridCellsAcross)}%`, height: `${t.size*(100/gridCellsAcross)}%`, backgroundColor: t.color, backgroundImage: t.imageUrl?`url(${t.imageUrl})`:'none', backgroundSize: 'cover', borderColor: 'rgba(0,0,0,0.5)' }} />
            ))}
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
        <div className="w-80 flex-shrink-0 bg-gray-800/70 rounded p-3 space-y-3">
          <h3 className="font-bold text-gray-200">Token Inspector</h3>
          <TokenInspector />
        </div>
      </div>
    </div>
  );
};

const DebugPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tokens, selectedTokenId, gridCellsAcross } = useAppSelector((s: any) => s.tokens);
  const entity = useAppSelector((s: any) => s.entity);
  const startCombat = () => dispatch(postGameEvent({ type: 'START_COMBAT' } as any));
  const selectTarget = () => {
    const enemy = entity.activeMap?.tokens?.find((t: any) => !t.characterId && (!selectedTokenId || t.id !== selectedTokenId));
    if (enemy) dispatch(postGameEvent({ type: 'TARGET_SELECT', tokenId: enemy.id } as any));
  };
  const attackTarget = () => {
    const targetId = entity.selectedTargetTokenId;
    if (!targetId || !selectedTokenId) return;
    dispatch(postGameEvent({ type: 'DECLARE_ATTACK', sourceId: selectedTokenId, targetId, action: { attackBonus: 3, damage: [{ damageRoll: '1d6', damageType: 'slashing' }], damageBonus: 0 } } as any));
  };
  const moveForward = () => {
    if (!selectedTokenId || !entity.activeMap) return;
    const me = entity.activeMap.tokens.find((t: any) => t.id === selectedTokenId);
    if (!me) return;
    dispatch(postGameEvent({ type: 'MOVE_TOKEN', sourceId: selectedTokenId, path: [{ x: Math.max(0, Math.min(entity.activeMap.grid.width - 1, me.x + 1)), y: me.y }] } as any));
  };
  const summon = () => dispatch(postGameEvent({ type: 'SUMMON_CREATURE', monsterId: 'goblin', position: { x: 10, y: 10 } } as any));
  const nextTurn = () => dispatch(postGameEvent({ type: 'NEXT_TURN' } as any));
  return (
    <div className="flex flex-wrap gap-2 text-xs bg-gray-900/60 p-2 rounded">
      <button className="px-2 py-1 bg-gray-700 rounded" onClick={startCombat}>Start Combat</button>
      <button className="px-2 py-1 bg-gray-700 rounded" onClick={selectTarget}>Select Target</button>
      <button className="px-2 py-1 bg-gray-700 rounded" onClick={attackTarget}>Attack</button>
      <button className="px-2 py-1 bg-gray-700 rounded" onClick={moveForward}>Move +X</button>
      <button className="px-2 py-1 bg-gray-700 rounded" onClick={summon}>Summon Goblin</button>
      <button className="px-2 py-1 bg-gray-700 rounded" onClick={nextTurn}>Next Turn</button>
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