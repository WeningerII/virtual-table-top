import React, { useState, useMemo } from 'react';
import { Character, PendingChoice, Maneuver, Invocation, Metamagic, Spell, Rune } from './types';
import { useAppSelector } from '.././state/hooks';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';

interface ChoiceSelectorProps {
    title: string;
    choice: Extract<PendingChoice, { type: 'maneuver' | 'invocation' | 'metamagic' | 'spell' | 'totem_animal' | 'rune' }>;
    options: Array<{ id: string; name: string; description?: string; prerequisites?: any[], level?: number }>;
    character: Character;
    onConfirm: (choices: string[], level?: number) => void;
    checkPrerequisites?: (character: Character, option: any) => boolean;
    allSpells?: Spell[]; // For Magical Secrets
}

const ChoiceSelector: React.FC<ChoiceSelectorProps> = ({ title, choice, options, character, onConfirm, checkPrerequisites, allSpells }) => {
    const spellcastingInfo = useAppSelector(state => selectCalculatedActiveCharacterSheet(state as any)?.spellcastingInfo);
    const [selected, setSelected] = useState<string[]>([]);
    
    const count = 'count' in choice ? choice.count : 1;

    const handleSelect = (optionId: string) => {
        setSelected(prev => {
            if (prev.includes(optionId)) {
                return prev.filter(id => id !== optionId);
            }
            if (prev.length < count) {
                return [...prev, optionId];
            }
             if (count === 1) { // If it's a single choice (like radio), replace instead of adding
                return [optionId];
            }
            return prev;
        });
    };

    const handleConfirmClick = () => {
        const level = 'level' in choice ? choice.level : undefined;
        onConfirm(selected, level);
        setSelected([]); // Clear selection after confirming
    };

    const displayOptions = useMemo(() => {
        let opts: any[] = allSpells && allSpells.length > 0 ? allSpells : options;

        if (checkPrerequisites) {
            opts = opts.filter(opt => checkPrerequisites(character, opt));
        }
        
        if (choice.type === 'spell' && spellcastingInfo) {
            const maxSpellLevel = spellcastingInfo.spellSlots.findIndex(s => s > 0) + 1 || 1;
            opts = opts.filter(spell => spell.level <= maxSpellLevel);
        }

        return opts;
    }, [options, character, checkPrerequisites, allSpells, choice.type, spellcastingInfo]);

    const inputType = count === 1 ? 'radio' : 'checkbox';

    return (
        <div className="my-4 p-4 bg-blue-900/30 border border-blue-600 rounded-lg animate-fade-in-up">
            <h4 className="font-bold text-lg text-blue-300">Pending Choice: {title}</h4>
            <p className="text-sm text-gray-300 mb-3">Choose {count}:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 bg-gray-900/50 p-2 rounded-md">
                {displayOptions.map(opt => (
                    <label key={opt.id} className={`flex items-start gap-3 p-3 rounded-md transition-colors cursor-pointer ${selected.includes(opt.id) ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        <input
                            type={inputType}
                            name={choice.id}
                            checked={selected.includes(opt.id)}
                            onChange={() => handleSelect(opt.id)}
                            className={`h-5 w-5 text-blue-500 bg-gray-800 border-gray-600 focus:ring-blue-500 mt-1 ${inputType === 'radio' ? 'form-radio' : 'form-checkbox rounded'}`}
                        />
                        <div>
                            <p className="font-semibold">{opt.name}{opt.level !== undefined && ` (Lvl ${opt.level})`}</p>
                            {opt.description && <p className="text-xs text-gray-300">{opt.description}</p>}
                        </div>
                    </label>
                ))}
            </div>
            <div className="text-right mt-3">
                <button
                    onClick={handleConfirmClick}
                    disabled={selected.length !== count}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Confirm Selection ({selected.length}/{count})
                </button>
            </div>
        </div>
    );
};

export default ChoiceSelector;