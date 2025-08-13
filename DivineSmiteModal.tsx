import React from 'react';
import { ActionItem, Character } from './types';
import { useToast } from './state/ToastContext';
import { rollDice } from '../../utils/dice';
import { useAppSelector, useAppDispatch } from '.././state/hooks';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';
import { playStateActions } from './engine/slices/playStateSlice';
import Modal from '../shared/Modal';

interface DivineSmiteModalProps {
    isOpen: boolean;
    onClose: () => void;
    action: ActionItem;
}

const DivineSmiteModal: React.FC<DivineSmiteModalProps> = ({ isOpen, onClose, action }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();
    const { addToast } = useToast();

    if (!character || !character.spellcastingInfo) return null;

    const { spellSlots, pactSlots } = character.spellcastingInfo;

    const handleSmite = (level: number, isPact: boolean) => {
        let diceCount = level + 1;
        if (diceCount > 5) diceCount = 5;

        const damageRoll = rollDice(`${diceCount}d8`);
        const totalDamage = damageRoll.total;
        
        if (isPact) {
            dispatch(playStateActions.expendPactSlot());
        } else {
            dispatch(playStateActions.expendSpellSlot({ level, quantity: 1 }));
        }
        
        addToast(`Divine Smite! +${totalDamage} radiant damage!`, "success");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="DIVINE SMITE!" maxWidth="max-w-md">
            <p className="text-sm text-gray-400 text-center mb-4">You hit with {action.name}. Expend a spell slot to deal extra radiant damage?</p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
                {spellSlots.map((max, index) => {
                    const level = index + 1;
                    if (max === 0) return null;
                    const expended = character.expendedSpellSlots[level] || 0;
                    const remaining = max - expended;
                    const smiteDice = Math.min(5, level + 1);

                    if (remaining <= 0) return null;

                    return (
                        <button
                            key={`slot-${level}`}
                            onClick={() => handleSmite(level, false)}
                            className="w-full p-3 bg-blue-800 hover:bg-blue-700 rounded-md text-left transition-colors flex justify-between items-center"
                        >
                            <span className="font-semibold">Level {level} Slot ({remaining} left)</span>
                            <span className="font-bold text-yellow-300">{smiteDice}d8 Radiant</span>
                        </button>
                    );
                })}
                    {pactSlots.count > 0 && (character.expendedPactSlots || 0) < pactSlots.count && (
                    <button
                        onClick={() => handleSmite(pactSlots.level, true)}
                        className="w-full p-3 bg-purple-800 hover:bg-purple-700 rounded-md text-left transition-colors flex justify-between items-center"
                    >
                        <span className="font-semibold">Pact Slot (Lvl {pactSlots.level})</span>
                        <span className="font-bold text-yellow-300">{Math.min(5, pactSlots.level + 1)}d8 Radiant</span>
                    </button>
                    )}
            </div>
            <div className="pt-4 mt-2 border-t border-gray-700 text-right">
                <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md font-semibold">No Smite</button>
            </div>
        </Modal>
    );
};

export default DivineSmiteModal;