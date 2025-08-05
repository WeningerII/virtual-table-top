import React, { useState, useMemo } from 'react';
import { Character, DndClass, Spell, PendingChoice } from '../../../types';
import { useToast } from '../../../state/ToastContext';
import { useAppSelector } from '../../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../../state/selectors';
import { useCharacterActions } from '../../../hooks/useCharacterActions';
import SpellCard from './SpellCard';
import LearnSpellsModal from './LearnSpellsModal';
import MysticArcanumSelector from './MysticArcanumSelector';

interface KnownSpellsManagerProps {
    classData: DndClass;
}

const KnownSpellsManager: React.FC<KnownSpellsManagerProps> = ({ classData }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const allSpells = useAppSelector(state => state.app.staticDataCache?.allSpells || []);
    const { updateKnownSpells } = useCharacterActions();
    const { addToast } = useToast();
    const [isChoosing, setIsChoosing] = useState(false);
    
    if (!character || !character.spellcastingInfo) return null;
    
    const spellcastingInfo = character.spellcastingInfo;
    const isMagicalSecrets = character.pendingChoices.some(c => c.type === 'spell' && c.source.includes('Magical Secrets'));
    const magicalSecretsChoice = character.pendingChoices.find(c => c.type === 'spell' && c.source.includes('Magical Secrets')) as Extract<PendingChoice, { type: 'spell' }> | undefined;
    const spellsToLearn = isMagicalSecrets ? (magicalSecretsChoice?.count || 0) : spellcastingInfo.maxKnownSpells - character.knownSpells.length;

    const handleConfirmLearn = (spellIds: string[]) => {
        const newKnownSpells = [...new Set([...character.knownSpells, ...spellIds])];
        updateKnownSpells(newKnownSpells);
        addToast(`${spellIds.length} new spell(s) learned!`);
        setIsChoosing(false);
    };

    const knownSpellsByLevel = useMemo(() => {
        const spells: { [level: number]: Spell[] } = {};
        const knownAndArcanumSpells = [...character.knownSpells, ...Object.values(character.mysticArcanum || {}).filter(Boolean) as string[]];
        
        knownAndArcanumSpells.forEach(id => {
            const spell = allSpells.find(s => s.id === id);
            if (spell) {
                if (!spells[spell.level]) spells[spell.level] = [];
                spells[spell.level].push(spell);
            }
        });

        const classLevel = character.classes.find(c=>c.id === classData.id)!.level;
        const cantripCount = classData.progressionTable?.[classLevel -1]?.cantripsKnown || 0;
        
        // This is a simplified way to get cantrips for known casters
        if (cantripCount > 0) {
            const cantrips = allSpells.filter(s => s.level === 0 && s.classIds?.includes(classData.id)).slice(0, cantripCount);
            spells[0] = cantrips;
        }

        return spells;
    }, [character, allSpells, classData]);

    const warlockLevel = character.classes.find(c => c.id === 'warlock')?.level || 0;

    return (
        <div className="mt-6">
            {isChoosing && <LearnSpellsModal isOpen={isChoosing} onClose={() => setIsChoosing(false)} onConfirm={handleConfirmLearn} classData={classData} count={spellsToLearn} isMagicalSecrets={isMagicalSecrets} />}
            <div className="p-4 bg-gray-900/50 rounded-lg">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold font-teko text-2xl tracking-wide">Known Spells ({classData.name})</h3>
                    <div className="text-center">
                        <div className="font-bold text-3xl">{character.knownSpells.length} / {spellcastingInfo.maxKnownSpells}</div>
                        <div className="text-xs text-gray-400 uppercase">Spells Known</div>
                    </div>
                </div>
                {spellsToLearn > 0 && (
                    <div className="my-4 p-4 bg-green-900/30 border border-green-600 rounded-lg text-center">
                        <h4 className="font-bold text-lg text-green-300">{isMagicalSecrets ? "Magical Secrets" : "New Spells Available!"}</h4>
                        <p className="text-sm text-gray-300 mb-3">You can learn {spellsToLearn} new spell(s) of a level you can cast.</p>
                        <button onClick={() => setIsChoosing(true)} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold">Learn Spells</button>
                    </div>
                )}
            </div>

            {warlockLevel >= 11 && (
                <div className="space-y-4 my-6">
                     <MysticArcanumSelector level={6} warlockLevel={warlockLevel} />
                     <MysticArcanumSelector level={7} warlockLevel={warlockLevel} />
                     <MysticArcanumSelector level={8} warlockLevel={warlockLevel} />
                     <MysticArcanumSelector level={9} warlockLevel={warlockLevel} />
                </div>
            )}
            
            <div className="space-y-6 mt-4">
                {Object.keys(knownSpellsByLevel).sort((a,b) => parseInt(a) - parseInt(b)).map(levelStr => {
                    const level = parseInt(levelStr);
                    const spells = knownSpellsByLevel[level];
                    if(spells.length === 0) return null;
                    return (
                        <div key={level}>
                             <h3 className="font-bold font-teko text-2xl tracking-wide border-b-2 border-gray-600 mb-3 pb-1">
                                {level === 0 ? 'Cantrips' : `Level ${level} Spells`}
                            </h3>
                            <div className="space-y-3">
                                {spells.map(spell => (
                                    <SpellCard key={spell.id} spell={spell} isKnown={true} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default KnownSpellsManager;