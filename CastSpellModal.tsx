import React, { useMemo, useState, useEffect } from 'react';
import { Spell, Character, Metamagic } from './types';
import { dataService } from 'services./data.service';
import { useToast } from 'state/ToastContext';
import { useAppDispatch } from 'state/hooks';
import { playStateActions } from './playStateSlice';
import Modal from '../shared/Modal';

interface CastSpellModalProps {
    isOpen: boolean;
    onClose: () => void;
    spell: Spell;
    character: Character;
}

interface CastOption {
    level: number;
    type: 'regular' | 'pact';
    remaining: number;
    description: string;
}

const CastSpellModal: React.FC<CastSpellModalProps> = ({ isOpen, onClose, spell, character }) => {
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [allMetamagic, setAllMetamagic] = useState<Metamagic[]>([]);
    const [selectedMetamagic, setSelectedMetamagic] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            dataService.getAllMetamagic().then(setAllMetamagic);
        } else {
            setSelectedMetamagic([]);
        }
    }, [isOpen]);

    const isSorcerer = character.classes.some(c => c.id === 'sorcerer');
    const sorceryPoints = useMemo(() => character.resources.find(r => r.id === 'sorcery-points') || { current: 0, max: 0 }, [character.resources]);

    const castOptions = useMemo((): CastOption[] => {
        if (!isOpen) return [];
        const options: CastOption[] = [];
        const { spellcastingInfo, expendedSpellSlots, expendedPactSlots } = character;
        if (!spellcastingInfo) return [];

        if (spell.level === 0) {
            return [{ level: 0, type: 'regular', remaining: Infinity, description: 'Cast as Cantrip' }];
        }

        spellcastingInfo.spellSlots.forEach((max, index) => {
            const level = index + 1;
            if (level >= spell.level && max > 0) {
                const expended = expendedSpellSlots[level] || 0;
                if (max - expended > 0) {
                    options.push({
                        level,
                        type: 'regular',
                        remaining: max - expended,
                        description: `Use a level ${level} slot (${max - expended} remaining).`,
                    });
                }
            }
        });

        if (spellcastingInfo.pactSlots.count > 0 && spellcastingInfo.pactSlots.level >= spell.level) {
            const remaining = spellcastingInfo.pactSlots.count - (expendedPactSlots || 0);
            if (remaining > 0) {
                options.push({
                    level: spellcastingInfo.pactSlots.level,
                    type: 'pact',
                    remaining,
                    description: `Use a Pact Magic slot (Level ${spellcastingInfo.pactSlots.level}, ${remaining} remaining).`,
                });
            }
        }
        
        if (!spell.higherLevel) {
            const baseLevelOption = options.find(o => o.level === spell.level);
            return baseLevelOption ? [baseLevelOption] : [];
        }

        return [...new Map(options.map(item => [`${item.level}-${item.type}`, item])).values()].sort((a, b) => a.level - b.level);

    }, [isOpen, spell, character]);

    const knownMetamagic = useMemo(() => {
        return allMetamagic.filter(m => character.selectedMetamagic.includes(m.id));
    }, [allMetamagic, character.selectedMetamagic]);

    const totalSorceryPointCost = useMemo(() => {
        return selectedMetamagic.reduce((total, id) => {
            const meta = allMetamagic.find(m => m.id === id);
            if (!meta) return total;
            if (typeof meta.sorceryPointCost === 'number') {
                return total + meta.sorceryPointCost;
            }
            if (meta.id === 'twinned-spell') {
                return total + spell.level;
            }
            return total;
        }, 0);
    }, [selectedMetamagic, allMetamagic, spell.level]);

    const handleToggleMetamagic = (id: string) => {
        setSelectedMetamagic(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const handleCast = (option: CastOption) => {
        if (sorceryPoints.current < totalSorceryPointCost) {
            addToast("Not enough sorcery points!", "error");
            return;
        }

        if (totalSorceryPointCost > 0) {
            dispatch(playStateActions.spendResource({ id: 'sorcery-points', amount: totalSorceryPointCost }));
        }
        
        dispatch(playStateActions.castSpell({
                spell: spell,
                level: option.level,
                usePactSlot: option.type === 'pact',
                character
            })
        );
        addToast(`Cast ${spell.name} at level ${option.level}!`);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Cast ${spell.name}`} maxWidth="max-w-lg">
            <div className="space-y-3">
                {isSorcerer && knownMetamagic.length > 0 && (
                    <div className="p-3 bg-gray-900/50 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-300">Metamagic</h3>
                            <div className="text-sm text-yellow-300">Cost: {totalSorceryPointCost} SP ({sorceryPoints.current} available)</div>
                        </div>
                        <div className="space-y-2">
                            {knownMetamagic.map(meta => (
                                <label key={meta.id} className="flex items-center gap-3 p-2 rounded-md transition-colors bg-gray-700 hover:bg-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={selectedMetamagic.includes(meta.id)} onChange={() => handleToggleMetamagic(meta.id)} className="form-checkbox h-4 w-4 text-pink-500 bg-gray-800 border-gray-600 rounded focus:ring-pink-500" />
                                    <div>
                                        <p className="font-semibold">{meta.name} <span className="text-xs text-gray-400">({meta.id === 'twinned-spell' ? `${spell.level} SP` : `${meta.sorceryPointCost} SP`})</span></p>
                                        <p className="text-xs text-gray-400">{meta.description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
                <div className="space-y-2 pt-3 border-t border-gray-700">
                    <h3 className="font-bold text-gray-300">Choose a spell slot:</h3>
                    {castOptions.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleCast(option)}
                            disabled={sorceryPoints.current < totalSorceryPointCost}
                            className={`w-full p-3 rounded-md text-left transition-colors ${option.type === 'pact' ? 'bg-purple-800 hover:bg-purple-700' : 'bg-blue-800 hover:bg-blue-700'} disabled:bg-gray-600 disabled:cursor-not-allowed`}
                        >
                            <span className="font-semibold">{option.description}</span>
                        </button>
                    ))}
                        {castOptions.length === 0 && (
                        <p className="text-center text-gray-500 italic py-4">No available spell slots for this spell.</p>
                        )}
                </div>
            </div>
        </Modal>
    );
};

export default CastSpellModal;