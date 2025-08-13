import React from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import HomeView from '../../HomeView';
import BuilderView from '../../BuilderView';
import GenesisView from '../../GenesisView';
import WorldbuilderView from '../../WorldbuilderView';
import BestiaryView from '../../BestiaryView';
import CrucibleView from '../../CrucibleView';
import { PlayView } from '../../PlayView';
import { rosterSelectors, createCharacter, loadCharacter, deleteCharacter } from '../../state/rosterSlice';

const AppRouter: React.FC = () => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.app.mode);
  const roster = useAppSelector(rosterSelectors.selectAll);

  switch (mode) {
    case 'home':
      return (
        <HomeView
          roster={roster}
          onCreate={() => dispatch(createCharacter())}
          onLoad={(id) => dispatch(loadCharacter(id))}
          onDelete={(id) => dispatch(deleteCharacter(id))}
        />
      );
    case 'builder':
      return <BuilderView />;
    case 'genesis':
      return <GenesisView />;
    case 'worldbuilder':
      return <WorldbuilderView />;
    case 'bestiary':
      return <BestiaryView />;
    case 'crucible':
      return <CrucibleView />;
    case 'play':
      return <PlayView />;
    default:
      return <div className="p-6">Unknown mode: {mode}</div>;
  }
};

export default AppRouter;
