
import React, { useState, useEffect, useMemo } from 'react';
import { PendingChoice, DndClass, Spell, SelectedFeat, Character } from './types';
import { dataService } from './services/data.service';
import { useAppSelector, useAppDispatch } from '.././state/hooks';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';
import { useToast } from './state/ToastContext';
import { proficienciesActions } from './engine/slices/proficienciesSlice';

interface InlineMagicInitiateSelectorProps {
    choice: Extract<PendingChoice, { type: 'magic_initiate' }>;
}

const SPELLCASTING_CLASS_IDS = ['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard'];

const LearnSpellsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (spellIds: string[]) => void;
    classData: DndClass;
    allSpells: Spell[];
}> = ({ isOpen, onClose, onConfirm, classData, allSpells }) => {
    const [selectedCantrips, setSelectedCantrips] = useState<string[]>([]);
    const [selectedLevel1, setSelectedLevel1] = useState<string>('');

    const classSpells = useMemo(() => allSpells.filter(s => s.classIds?.includes(classData.id)), [allSpells, classData.id]);
    const cantrips = useMemo(() => classSpells.filter(s => s.level === 0), [classSpells]);
    const level1Spells = useMemo(() => classSpells.filter(s => s.level === 1), [classSpells]);

    const handleSelectCantrip = (spellId: string) => {
        setSelectedCantrips(prev => {
            if (prev.includes(spellId)) {
                return prev.filter(id => id !== spellId);
            }
            if (prev.length < 2) {
                return [...prev, spellId];
            }
            return prev;
        });
    };

    const handleConfirmClick = () => {
        onConfirm([...selectedCantrips, selectedLevel1]);
    };

    if (!isOpen) return null;
    
    const canConfirm = selectedCantrips.length === 2 && selectedLevel1;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold">Learn Spells for {classData.name}</h3>
                    <p className="text-sm text-gray-400">Choose 2 cantrips and 1 first-level spell.</p>
                </div>
                <div className="p-4 flex-grow overflow-y-auto space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">Cantrips (Choose 2)</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                             {cantrips.map(spell => (
                                <label key={spell.id} className={`flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer ${selectedCantrips.includes(spell.id) ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                    <input type="checkbox" checked={selectedCantrips.includes(spell.id)} onChange={() => handleSelectCantrip(spell.id)} className="form-checkbox h-4 w-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500" />
                                    <span>{spell.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">1st-Level Spell (Choose 1)</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                             {level1Spells.map(spell => (
                                <label key={spell.id} className={`flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer ${selectedLevel1 === spell.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                    <input type="radio" name="level1-spell" checked={selectedLevel1 === spell.id} onChange={() => setSelectedLevel1(spell.id)} className="form-radio h-4 w-4 text-blue-500 bg-gray-800 border-gray-600 focus:ring-blue-500" />
                                    <span>{spell.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-between items-center">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancel</button>
                    <button onClick={handleConfirmClick} disabled={!canConfirm} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500">Confirm Spells</button>
                </div>
            </div>
        </div>
    );
};


const InlineMagicInitiateSelector: React.FC<InlineMagicInitiateSelectorProps> = ({ choice }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [allClasses, setAllClasses] = useState<DndClass[]>([]);
    const [allSpells, setAllSpells] = useState<Spell[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        Promise.all([
            Promise.all(SPELLCASTING_CLASS_IDS.map(id => dataService.getClassById(id))),
            dataService.getAllSpells()
        ]).then(([classes, spells]) => {
            setAllClasses(classes.filter((c): c is DndClass => c !== null));
            setAllSpells(spells);
        });
    }, []);

    const selectedClassData = useMemo(() => allClasses.find(c => c.id === selectedClassId), [allClasses, selectedClassId]);

    const handleConfirmSpells = (spellIds: string[]) => {
        if (!character || !selectedClassData) return;
        
        const existingFeat = character.feats.find(f => f.source === choice.id);
        if (!existingFeat) return;

        const updatedFeat: SelectedFeat = {
            ...existingFeat,
            choices: {
                ...existingFeat.choices,
                classId: selectedClassData.id,
                spellIds,
            }
        };

        const otherFeats = character.feats.filter(f => f.source !== choice.id);
        dispatch(proficienciesActions.updateFeats([...otherFeats, updatedFeat]));
        
        addToast(`Learned spells from the ${selectedClassData.name} list!`);
        setIsModalOpen(false);
    };

    if (!character) return null;
    
    return (
        <>
            {isModalOpen && selectedClassData && (
                <LearnSpellsModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleConfirmSpells}
                    classData={selectedClassData}
                    allSpells={allSpells}
                />
            )}
            <div className="my-4 p-4 bg-blue-900/30 border border-blue-600 rounded-lg animate-fade-in-up">
                <h4 className="font-bold text-lg text-blue-300">Pending Choice: Magic Initiate</h4>
                <p className="text-sm text-gray-300 mb-3">Source: {choice.source}</p>
                <div className="space-y-3">
                    <div>
                        <label htmlFor="class-select" className="block text-sm font-medium text-gray-400 mb-1">Choose a Class</label>
                        <select
                            id="class-select"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2"
                        >
                            <option value="">-- Select a Class --</option>
                            {allClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="text-right">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            disabled={!selectedClassId}
                            className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            Choose Spells
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InlineMagicInitiateSelector;
