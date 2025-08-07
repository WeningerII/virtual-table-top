import React from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { setActiveCharacterId } from '../../state/rosterSlice';
import BestiaryView from '../../BestiaryView';
import HomeView from '../../HomeView';
import WorldbuilderView from '../../WorldbuilderView';
import GenesisView from '../../GenesisView';

const HomeAdapter: React.FC = () => {
  const dispatch = useAppDispatch();
  const roster = [] as any[]; // TODO: integrate real roster list
  const onCreate = () => dispatch(setActiveCharacterId('demo-' + Math.random().toString(36).slice(2, 8)));
  const onLoad = (id: string) => dispatch(setActiveCharacterId(id));
  const onDelete = (_id: string) => {};
  return <HomeView roster={roster as any} onCreate={onCreate} onLoad={onLoad} onDelete={onDelete} />;
};

const PlayAdapter: React.FC = () => {
  const mapImageUrl = useAppSelector((s) => s.worldbuilder.generatedMapImageUrl) || useAppSelector((s) => (s as any).playState?.mapImageUrl);
  return (
    <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
      {mapImageUrl ? (
        <div className="relative" style={{ width: 'min(95vh,95vw)', height: 'min(95vh,95vw)' }}>
          <img src={mapImageUrl} alt="Map" className="absolute inset-0 w-full h-full object-cover rounded" />
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>
      ) : (
        <div className="text-gray-400">No map yet. Generate one in Worldbuilder.</div>
      )}
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