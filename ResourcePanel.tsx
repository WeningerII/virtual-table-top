

import React from 'react';
import { useAppSelector, useAppDispatch } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';
import { Character } from './types';
import { playStateActions } from './playStateSlice';

const ResourcePanel: React.FC = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();

    if (!character || !character.resources || character.resources.length === 0) {
        return null;
    }

    const handleSpend = (resourceId: string) => {
        dispatch(playStateActions.spendResource({ id: resourceId, amount: 1 }));
    };

    const handleRegain = (resourceId: string) => {
        dispatch(playStateActions.regainResource({ id: resourceId, amount: 1 }));
    };

    return (
        <div className="bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-900/50">
                <h3 className="font-bold font-teko text-2xl tracking-wider text-white">RESOURCES</h3>
            </div>
            <div className="p-4 space-y-3">
                {character.resources.map(resource => (
                    <div key={resource.id} className="bg-gray-900/30 p-3 rounded-md border-l-4 border-yellow-500">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-yellow-300">{resource.name}</h4>
                            <span className="text-xs text-gray-400">Recovers on {resource.per === 'longRest' ? 'Long' : 'Short'} Rest</span>
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-2">
                            <button
                                onClick={() => handleSpend(resource.id)}
                                disabled={resource.current <= 0}
                                className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-md font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Spend ${resource.name}`}
                            >
                                -
                            </button>
                            <div className="text-center">
                                <div className="font-bold text-3xl">{resource.current} / {resource.max}</div>
                                {resource.dieSize && <div className="text-xs text-gray-400">(d{resource.dieSize})</div>}
                            </div>
                            <button
                                onClick={() => handleRegain(resource.id)}
                                disabled={resource.current >= resource.max}
                                className="px-4 py-2 bg-green-800 hover:bg-green-700 rounded-md font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Regain ${resource.name}`}
                            >
                                +
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResourcePanel;