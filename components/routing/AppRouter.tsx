import React from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { setActiveCharacterId } from '../../state/rosterSlice';
import { setMode } from '../../state/appSlice';
import BestiaryView from '../../BestiaryView';
import HomeView from '../../HomeView';

const HomeAdapter: React.FC = () => {
  const dispatch = useAppDispatch();
  const roster = [] as any[]; // TODO: integrate real roster list
  const onCreate = () => dispatch(setActiveCharacterId('demo-' + Math.random().toString(36).slice(2, 8)));
  const onLoad = (id: string) => dispatch(setActiveCharacterId(id));
  const onDelete = (_id: string) => {};
  return <HomeView roster={roster as any} onCreate={onCreate} onLoad={onLoad} onDelete={onDelete} />;
};

const AppRouter: React.FC = () => {
  const mode = useAppSelector((s) => s.app.mode);

  switch (mode) {
    case 'home':
      return <HomeAdapter />;
    case 'builder':
      return <div className="p-6">Builder</div>;
    case 'genesis':
      return <div className="p-6">Genesis</div>;
    case 'worldbuilder':
      return <div className="p-6">Worldbuilder</div>;
    case 'bestiary':
      return <BestiaryView />;
    case 'crucible':
      return <div className="p-6">Crucible</div>;
    case 'play':
      return <div className="p-6">Play</div>;
    default:
      return <div className="p-6">Unknown mode</div>;
  }
};

export default AppRouter;