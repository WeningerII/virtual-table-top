import React, { useMemo } from 'react';
import { DndClass, Spell } from './types';
import { useAppSelector } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';
import { useCharacterActions } from '../../../hooks/useCharacterActions';
import { useToast } from 'state/ToastContext';
import SpellCard from './SpellCard';

interface PreparedSpellsManagerProps {
    classData: DndClass[];
}

const PreparedSpellsManager: React.FC<PreparedSpellsManagerProps> = ({ classData }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const { addToast } = useToast();
    const { prepareSpell, unprepareSpell } = useCharacterActions();

    if (!character || !character.spellcastingInfo) return null;
    
    const { spellcastingInfo } = character;
    const numPrepared = character.preparedSpells.filter(id => !spellcastingInfo.alwaysPreparedSpells.some(s => s.id === id)).length;
    
    const handleTogglePrepare = (spellId: string) => {
        const isPrepared = character.preparedSpells.includes(spellId);
        if (isPrepared) {
            unprepareSpell(spellId);
        } else {
            if (numPrepared < spellcastingInfo.maxPreparedSpells) {
                prepareSpell(spellId);
            } else {
                addToast("You have reached your maximum number of prepared spells.", "error");
            }
        }
    };
    
    const preparableSpells = useMemo(() => {
        const classIds = new Set(classData.map(c => c.id));
        return spellcastingInfo.availableSpells.filter(s => s.classIds?.some(id => classIds.has(id)));
    }, [classData, spellcastingInfo.availableSpells]);

    const spellsByLevel: { [level: number]: Spell[] } = {};
    preparableSpells.forEach(spell => {
        if (!spellsByLevel[spell.level]) spellsByLevel[spell.level] = [];
        spellsByLevel[spell.level].push(spell);
    });

    return (
        <div className="mt-6">
            <div className="p-4 bg-gray-900/50 rounded-lg">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold font-teko text-2xl tracking-wide">Prepared Spells</h3>
                     <div className="text-center">
                        <div className="font-bold text-3xl">{numPrepared} / {spellcastingInfo.maxPreparedSpells}</div>
                        <div className="text-xs text-gray-400 uppercase">Spells Prepared</div>
                    </div>
                </div>
            </div>
            <div className="space-y-6 mt-4">
                {spellcastingInfo.alwaysPreparedSpells.length > 0 && (
                     <div>
                        <h3 className="font-bold font-teko text-2xl tracking-wide border-b-2 border-yellow-600 mb-3 pb-1 text-yellow-300">
                            Always Prepared Spells
                        </h3>
                        <div className="space-y-3">
                            {spellcastingInfo.alwaysPreparedSpells.map(spell => (
                                <SpellCard key={spell.id} spell={spell} isPrepared={true} isAlwaysPrepared={true} />
                            ))}
                        </div>
                    </div>
                )}
                {Object.keys(spellsByLevel).sort((a,b) => parseInt(a) - parseInt(b)).map(levelStr => {
                    const level = parseInt(levelStr);
                    const spells = spellsByLevel[level].filter(s => !spellcastingInfo.alwaysPreparedSpells.some(aps => aps.id === s.id));
                    if (spells.length === 0) return null;

                    return (
                        <div key={level}>
                             <h3 className="font-bold font-teko text-2xl tracking-wide border-b-2 border-gray-600 mb-3 pb-1">
                                {level === 0 ? 'Cantrips' : `Level ${level} Spells`}
                            </h3>
                            <div className="space-y-3">
                                {spells.map(spell => (
                                    <SpellCard
                                        key={spell.id}
                                        spell={spell}
                                        isPrepared={character.preparedSpells.includes(spell.id)}
                                        canPrepare={true}
                                        onTogglePrepare={handleTogglePrepare}
                                        isAlwaysPrepared={false}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default PreparedSpellsManager;