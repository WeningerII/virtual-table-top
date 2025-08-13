import React from 'react';
import { SavingThrowItem } from './types';
import { usePlayerActions } from '../../hooks/usePlayerActions';
import { useAppSelector } from '.././state/hooks';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';

interface SavingThrowsPanelProps {}

const SavingThrowsPanel: React.FC<SavingThrowsPanelProps> = () => {
    const { handleRoll } = usePlayerActions();
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);

    const savingThrows = character?.savingThrowItems || [];

    if (savingThrows.length === 0) return null;

    return (
        <div className="bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-900/50">
                <h3 className="font-bold font-teko text-2xl tracking-wider text-white">SAVING THROWS</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
                {savingThrows.map(save => (
                    <button 
                        key={save.id} 
                        onClick={() => handleRoll(`${save.name} Save`, save.modifier)}
                        className="p-3 bg-gray-900/30 rounded-md border-b-4 border-gray-600 hover:border-blue-500 hover:bg-gray-700/50 transition-colors text-center"
                    >
                        <div className="flex items-center justify-center gap-2">
                             {save.isProficient ? (
                                <div title="Proficient" className="w-3 h-3 rounded-full bg-green-500"></div>
                            ) : (
                                <div className="w-3 h-3"></div>
                            )}
                            <div className="font-semibold">{save.name}</div>
                        </div>
                        <div className="font-bold text-2xl font-teko tracking-wider mt-1">
                            {save.modifier >= 0 ? `+${save.modifier}` : save.modifier}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SavingThrowsPanel;