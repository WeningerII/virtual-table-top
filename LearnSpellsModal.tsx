import React, { useState, useMemo } from 'react';
import { Character, DndClass, Spell } from '../../../types';
import { useAppSelector } from '../../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../../state/selectors';

interface LearnSpellsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (spellIds: string[]) => void;
    classData: DndClass;
    count: number;
    isMagicalSecrets?: boolean;
}

const LearnSpellsModal: React.FC<LearnSpellsModalProps> = ({ isOpen, onClose, onConfirm, classData, count, isMagicalSecrets = false }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const spellcastingInfo = character?.spellcastingInfo;
    const allSpells = useAppSelector(state => state.app.staticDataCache?.allSpells || []);
    
    const [selected, setSelected] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    const maxSpellLevel = useMemo(() => {
        if (!spellcastingInfo) return 0;
        const spellSlots = spellcastingInfo.spellSlots;
        for (let i = spellSlots.length - 1; i >= 0; i--) {
            if (spellSlots[i] > 0) return i + 1;
        }
        return 0;
    }, [spellcastingInfo]);

    const availableSpells = useMemo(() => {
        if (!spellcastingInfo || !character) return [];
        const sourceList = isMagicalSecrets ? allSpells : spellcastingInfo.availableSpells;
        return sourceList.filter(s =>
            (isMagicalSecrets || s.classIds?.includes(classData.id)) &&
            s.level > 0 &&
            s.level <= maxSpellLevel &&
            !character.knownSpells.includes(s.id) &&
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a,b) => a.level - b.level || a.name.localeCompare(b.name));
    }, [spellcastingInfo, classData.id, maxSpellLevel, searchTerm, character, isMagicalSecrets, allSpells]);

    const handleSelect = (spellId: string) => {
        setSelected(prev => {
            if (prev.includes(spellId)) {
                return prev.filter(id => id !== spellId);
            }
            if (prev.length < count) {
                return [...prev, spellId];
            }
            return prev;
        });
    };

    const handleConfirmClick = () => {
        onConfirm(selected);
        setSelected([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold">{isMagicalSecrets ? 'Magical Secrets' : `Learn Spells for ${classData.name}`}</h3>
                    <p className="text-sm text-gray-400">Choose {count} new spell(s) to add to your repertoire.</p>
                     <input type="text" placeholder="Search spells..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 mt-2" />
                </div>
                <div className="p-4 flex-grow overflow-y-auto space-y-2">
                     {availableSpells.map(spell => (
                        <label key={spell.id} className={`flex items-start gap-3 p-3 rounded-md transition-colors cursor-pointer ${selected.includes(spell.id) ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            <input type="checkbox" checked={selected.includes(spell.id)} onChange={() => handleSelect(spell.id)} className="form-checkbox h-5 w-5 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 mt-1" />
                            <div>
                                <p className="font-semibold">{spell.name} <span className="text-xs text-gray-400">(Lvl {spell.level} {spell.school})</span></p>
                                <p className="text-xs text-gray-300">{spell.description}</p>
                            </div>
                        </label>
                    ))}
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-between items-center">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancel</button>
                    <button onClick={handleConfirmClick} disabled={selected.length !== count} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500">Confirm ({selected.length}/{count})</button>
                </div>
            </div>
        </div>
    );
};

export default LearnSpellsModal;