import React, { useState } from 'react';
import { Character, EffectInstance } from './types';
import AddConditionModal from './AddConditionModal';
import { playStateActions } from './playStateSlice';
import { useAppDispatch, useAppSelector } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';

interface ActiveEffectsPanelProps {}

const ActiveEffectsPanel: React.FC<ActiveEffectsPanelProps> = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character;
    const dispatch = useAppDispatch();
    const [isOpen, setIsOpen] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);

    if (!character) return null;

    const handleRemoveEffect = (effectId: string) => {
        dispatch(playStateActions.removeActiveEffect(effectId));
    };

    return (
        <>
            {isModalOpen && (
                <AddConditionModal
                    isOpen={isModalOpen}
                    onClose={() => setModalOpen(false)}
                />
            )}
            <div className="bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full p-4 text-left flex justify-between items-center bg-gray-900/50 hover:bg-gray-700/50 transition-colors"
                >
                    <h3 className="font-bold font-teko text-2xl tracking-wider text-white">ACTIVE EFFECTS &amp; CONDITIONS</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform text-gray-400 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isOpen && (
                    <div className="p-4 space-y-3">
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {character.activeEffects.length > 0 ? (
                                character.activeEffects.map(effect => (
                                    <div key={effect.id} className="bg-gray-900/30 p-2 rounded-md flex justify-between items-center gap-2">
                                        <div className="flex-grow">
                                            <p className="font-semibold text-sm flex justify-between items-baseline">
                                                <span>{effect.source}</span>
                                                {effect.durationInRounds !== undefined && (
                                                    <span className="text-xs font-mono text-yellow-300 bg-gray-700 px-2 py-0.5 rounded-full">{effect.durationInRounds} RND</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-400">{effect.effect.description || effect.effect.type.replace(/_/g, ' ')}</p>
                                        </div>
                                        <button onClick={() => handleRemoveEffect(effect.id)} className="text-red-400 hover:text-red-300 p-1 flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 italic py-4">No active effects or conditions.</p>
                            )}
                        </div>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="w-full mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold text-sm"
                        >
                            Add Condition
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default ActiveEffectsPanel;