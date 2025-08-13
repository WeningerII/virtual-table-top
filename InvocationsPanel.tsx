

import React from 'react';
import { useAppSelector } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';
import { Character, InnateSpellcastingEffect, Invocation } from './types';
import { usePlayerActions } from '../../hooks/usePlayerActions';

const InvocationsPanel: React.FC = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const { handleCastInvocationSpell } = usePlayerActions();

    if (!character || !character.resolvedInvocations || character.resolvedInvocations.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            {character.resolvedInvocations.map(invocation => {
                const atWillSpells = invocation.effects
                    ?.filter((e): e is InnateSpellcastingEffect => e.type === 'innate_spellcasting')
                    .filter(e => e.spells.every(s => s.frequency === 'at-will'))
                    .flatMap(e => e.spells);

                return (
                    <div key={invocation.id} className="bg-gray-900/30 p-3 rounded-md border-l-4 border-purple-500">
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex-grow">
                                <p className="font-semibold text-purple-300">{invocation.name}</p>
                                <p className="text-xs text-gray-400 mt-1">{invocation.description}</p>
                            </div>
                            {atWillSpells && atWillSpells.length > 0 && (
                                <div className="flex-shrink-0">
                                    {atWillSpells.map(spell => (
                                        <button 
                                            key={spell.id}
                                            onClick={() => handleCastInvocationSpell(spell.id)}
                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-semibold"
                                        >
                                            Use
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default InvocationsPanel;