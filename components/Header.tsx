import React from 'react';
import type { AppMode } from '../state/appSlice';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  hasActiveCharacter: boolean;
}

const NavButton: React.FC<{
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  isActive: boolean;
  className?: string;
}> = ({ children, disabled = false, onClick, isActive, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors duration-300 ${
      isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    aria-current={isActive ? 'page' : undefined}
  >
    {children}
  </button>
);

const Header: React.FC<HeaderProps> = ({ mode, setMode, hasActiveCharacter }) => {
  return (
    <header className="bg-gray-900 bg-opacity-80 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 border-b-2 border-transparent">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl md:text-2xl font-bold font-teko tracking-wider text-white">VTT CATHEDRAL</h1>
          </div>
          <nav className="flex items-center space-x-1 bg-gray-800 p-1 rounded-lg">
            <NavButton onClick={() => setMode('home')} isActive={mode === 'home'}>HOME</NavButton>
            <NavButton onClick={() => setMode('genesis')} isActive={mode === 'genesis'}>GENESIS</NavButton>
            <NavButton onClick={() => setMode('builder')} isActive={mode === 'builder'} disabled={!hasActiveCharacter}>BUILDER</NavButton>
            <NavButton onClick={() => setMode('play')} isActive={mode === 'play'} disabled={!hasActiveCharacter}>PLAY</NavButton>
            <NavButton onClick={() => setMode('bestiary')} isActive={mode === 'bestiary'}>BESTIARY</NavButton>
            <NavButton onClick={() => setMode('worldbuilder')} isActive={mode === 'worldbuilder'}>WORLDBUILDER</NavButton>
            <NavButton onClick={() => setMode('crucible')} isActive={mode === 'crucible'} className={mode === 'crucible' ? 'bg-red-600' : 'hover:bg-red-700/50'}>
              CRUCIBLE
            </NavButton>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;