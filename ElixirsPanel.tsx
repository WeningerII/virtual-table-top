import React from 'react';
import { Character } from './types';
import { playStateActions } from './playStateSlice';
import { useAppSelector, useAppDispatch } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';

interface ElixirsPanelProps {
}

const ElixirsPanel: React.FC<ElixirsPanelProps> = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();

    if (!character) {
        return null;
    }

    const handleUseElixir = (elixirId: string) => {
        dispatch(playStateActions.useElixir(elixirId));
    };

    return (
        <div className="bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-900/50">
                <h3 className="font-bold font-teko text-2xl tracking-wider text-white">EXPERIMENTAL ELIXIRS</h3>
            </div>
            <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                {character.experimentalElixirs.map(elixir => (
                    <div key={elixir.id} className="bg-gray-900/30 p-3 rounded-md border-l-4 border-blue-500 flex justify-between items-center gap-3">
                        <div className="flex-grow">
                            <p className="font-semibold text-blue-300">{elixir.effect}</p>
                            <p className="text-xs text-gray-400 mt-1">{elixir.description}</p>
                        </div>
                        <button 
                            onClick={() => handleUseElixir(elixir.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-semibold flex-shrink-0"
                        >
                            Use
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ElixirsPanel;