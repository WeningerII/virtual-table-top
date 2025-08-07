import React from 'react';
import { useAppSelector } from '../../state/hooks';

const AppRouter: React.FC = () => {
  const mode = useAppSelector((s) => s.app.mode);

  switch (mode) {
    case 'home':
      return <div className="p-6">Home</div>;
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