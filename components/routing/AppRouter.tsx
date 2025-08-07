import React from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { setActiveCharacterId } from '../../state/rosterSlice';
import { setMode } from '../../state/appSlice';

const Home: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeId = useAppSelector((s) => s.roster.activeCharacterId);

  const createDemoCharacter = () => {
    const id = 'demo-' + Math.random().toString(36).slice(2, 8);
    dispatch(setActiveCharacterId(id));
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up space-y-6">
      <div className="text-center">
        <h2 className="text-4xl font-bold font-teko tracking-wider text-white">Welcome to VTT Cathedral</h2>
        <p className="text-gray-400 mt-2">Quick-start by creating a demo character or browse tools.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={createDemoCharacter} className="p-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold">Create Demo Character</button>
        <button onClick={() => dispatch(setMode('bestiary'))} className="p-4 bg-purple-700 hover:bg-purple-600 rounded-lg font-bold">Open Bestiary</button>
      </div>
      <div className="text-center text-gray-300">Active Character ID: {activeId ?? 'None'}</div>
    </div>
  );
};

const AppRouter: React.FC = () => {
  const mode = useAppSelector((s) => s.app.mode);

  switch (mode) {
    case 'home':
      return <Home />;
    case 'builder':
      return <div className="p-6">Builder</div>;
    case 'genesis':
      return <div className="p-6">Genesis</div>;
    case 'worldbuilder':
      return <div className="p-6">Worldbuilder</div>;
    case 'bestiary':
      return <div className="p-6">Bestiary</div>;
    case 'crucible':
      return <div className="p-6">Crucible</div>;
    case 'play':
      return <div className="p-6">Play</div>;
    default:
      return <div className="p-6">Unknown mode</div>;
  }
};

export default AppRouter;