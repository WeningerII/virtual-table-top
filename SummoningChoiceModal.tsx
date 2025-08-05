import React, { useState, useMemo, useEffect } from 'react';
import { Character, SummonChoicePrompt, Monster } from '../../types';
import { dataService, MonsterIndexEntry } from '../../services/dataService';
import Modal from '../shared/Modal';

interface SummoningChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    character: Character;
    prompt: SummonChoicePrompt;
    onConfirm: (blueprintId: string, quantity: number) => void;
}

const SummoningChoiceModal: React.FC<SummoningChoiceModalProps> = ({ isOpen, onClose, character, prompt, onConfirm }) => {
    const [selectedOption, setSelectedOption] = useState(prompt.effect.options[0]);
    const [monsterIndex, setMonsterIndex] = useState<MonsterIndexEntry[]>([]);
    const [selectedMonsterId, setSelectedMonsterId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            dataService.getMonsterIndex().then(index => {
                setMonsterIndex(index);
                setIsLoading(false);
            });
        }
    }, [isOpen]);

    const eligibleMonsters = useMemo(() => {
        return monsterIndex.filter(m => {
            const typeMatch = m.type === prompt.effect.filter.type;
            const crMatch = m.challengeRating === selectedOption.cr;
            return typeMatch && crMatch;
        });
    }, [monsterIndex, selectedOption, prompt]);

    useEffect(() => {
        setSelectedMonsterId('');
    }, [selectedOption]);

    const handleConfirmSummon = () => {
        if (!selectedMonsterId) return;
        onConfirm(selectedMonsterId, selectedOption.count);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Summoning: ${prompt.spell.name}`} maxWidth="max-w-2xl">
            <div className="space-y-4">
                <div>
                    <h3 className="font-semibold mb-2">Summoning Options</h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                        {prompt.effect.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedOption(option)}
                                className={`w-full p-3 rounded-md text-sm font-semibold transition-colors ${selectedOption.label === option.label ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Choose a Creature (CR {selectedOption.cr})</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 bg-gray-900/50 p-2 rounded-md">
                        {isLoading ? (
                            <p className="text-gray-400 italic text-center">Loading creatures...</p>
                        ) : eligibleMonsters.length > 0 ? (
                            eligibleMonsters.map(monster => (
                                    <label key={monster.id} className={`flex items-center gap-3 p-3 rounded-md transition-colors cursor-pointer ${selectedMonsterId === monster.id ? 'bg-green-600' : 'bg-gray-700/50 hover:bg-gray-600'}`}>
                                    <input type="radio" name="monster-select" checked={selectedMonsterId === monster.id} onChange={() => setSelectedMonsterId(monster.id)} className="form-radio h-5 w-5 text-green-500 bg-gray-800 border-gray-600 focus:ring-green-500" />
                                    <span>{monster.name}</span>
                                </label>
                            ))
                        ) : (
                            <p className="text-gray-400 italic text-center">No eligible creatures found for this CR.</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-700 flex justify-end">
                <button
                    onClick={handleConfirmSummon}
                    disabled={!selectedMonsterId}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500"
                >
                    Summon {selectedOption.count} {monsterIndex.find(m => m.id === selectedMonsterId)?.name || ''}{selectedOption.count > 1 ? 's' : ''}
                </button>
            </div>
        </Modal>
    );
};

export default SummoningChoiceModal;