import React, { useState, useMemo } from 'react';
import { DndClass, Spell } from './types';
import { useToast } from './state/ToastContext';
import { currencyToCopper, copperToCurrency } from '../../../utils/currency';
import { useAppSelector } from '../.././state/hooks';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';
import { useCharacterActions } from '../../../hooks/useCharacterActions';
import SpellCard from './SpellCard';
import PreparedSpellsManager from './PreparedSpellsManager';

interface WizardSpellbookManagerProps {
    classData: DndClass;
}

const WizardSpellbookManager: React.FC<WizardSpellbookManagerProps> = ({ classData }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const allSpells = useAppSelector(state => state.app.staticDataCache?.allSpells || []);
    const { addToast } = useToast();
    const { scribeSpell, updateMoney } = useCharacterActions();
    const [isScribing, setIsScribing] = useState(false);
    const [scribingSearch, setScribingSearch] = useState('');

    if (!character || !character.spellcastingInfo) return null;

    const spellbook = useMemo(() => {
        return (character.spellbook || []).map(id => allSpells.find(s => s.id === id)).filter((s): s is Spell => !!s);
    }, [character.spellbook, allSpells]);

    const spellsByLevel: { [level: number]: Spell[] } = {};
    spellbook.forEach(spell => {
        if (!spellsByLevel[spell.level]) spellsByLevel[spell.level] = [];
        spellsByLevel[spell.level].push(spell);
    });

    const scribableSpells = useMemo(() => {
        return allSpells.filter(s =>
            s.classIds?.includes('wizard') &&
            !(character.spellbook || []).includes(s.id) &&
            s.name.toLowerCase().includes(scribingSearch.toLowerCase())
        ).sort((a,b) => a.level - b.level || a.name.localeCompare(b.name));
    }, [allSpells, character.spellbook, scribingSearch]);

    const handleScribeSpell = (spell: Spell) => {
        const cost = spell.level * 50 * 100; // 50gp per level in copper
        if (currencyToCopper(character.money) < cost) {
            addToast("Not enough gold to scribe this spell.", "error");
            return;
        }
        const newMoney = copperToCurrency(currencyToCopper(character.money) - cost);
        updateMoney(newMoney);
        scribeSpell({ spellId: spell.id });
        addToast(`Successfully scribed ${spell.name} into your spellbook!`);
    };

    return (
        <div className="mt-6">
            <div className="p-4 bg-gray-900/50 rounded-lg">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold font-teko text-2xl tracking-wide">Wizard's Spellbook</h3>
                    <button onClick={() => setIsScribing(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold">Scribe New Spell</button>
                </div>
            </div>

            {isScribing && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setIsScribing(false)}>
                    <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-700">
                             <h3 className="text-xl font-bold">Scribe a New Spell</h3>
                             <input type="text" placeholder="Search wizard spells..." value={scribingSearch} onChange={e => setScribingSearch(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 mt-2" />
                        </div>
                        <div className="p-4 flex-grow overflow-y-auto space-y-2">
                             {scribableSpells.map(spell => (
                                <div key={spell.id} className="flex items-center justify-between gap-4 p-3 bg-gray-700 rounded-md">
                                    <div>
                                        <p className="font-semibold">{spell.name}</p>
                                        <p className="text-xs text-gray-400">Level {spell.level} {spell.school}</p>
                                    </div>
                                    <button onClick={() => handleScribeSpell(spell)} className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-md text-xs font-semibold">{spell.level * 50} gp</button>
                                </div>
                            ))}
                        </div>
                         <div className="p-2 border-t border-gray-700 text-right">
                             <button onClick={() => setIsScribing(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md font-semibold">Close</button>
                         </div>
                    </div>
                </div>
            )}
            
            <div className="space-y-6 mt-4">
                 {Object.keys(spellsByLevel).sort((a,b) => parseInt(a) - parseInt(b)).map(levelStr => {
                    const level = parseInt(levelStr);
                    const spells = spellsByLevel[level];
                    if(spells.length === 0) return null;
                    return (
                        <div key={level}>
                             <h3 className="font-bold font-teko text-2xl tracking-wide border-b-2 border-gray-600 mb-3 pb-1">
                                {level === 0 ? 'Cantrips' : `Level ${level} Spells`}
                            </h3>
                            <div className="space-y-3">
                                {spells.map(spell => (
                                    <SpellCard key={spell.id} spell={spell} isInSpellbook={true} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <PreparedSpellsManager classData={[classData]} />
        </div>
    );
};

export default WizardSpellbookManager;