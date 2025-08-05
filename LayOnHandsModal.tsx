import React, { useState } from 'react';
import { useToast } from '../../state/ToastContext';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../state/selectors';
import { logEvent } from '../../state/logSlice';
import { Character } from '../../types';
import { playStateActions } from '../../engine/slices/playStateSlice';
import Modal from '../shared/Modal';

interface LayOnHandsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LayOnHandsModal: React.FC<LayOnHandsModalProps> = ({ isOpen, onClose }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [healAmount, setHealAmount] = useState(1);

    if (!character || !character.paladin?.layOnHandsPool) return null;

    const { current, max } = character.paladin.layOnHandsPool;
    const maxHealable = Math.min(current, character.hp - character.currentHp);

    const handleHeal = () => {
        if (healAmount <= 0) return;
        dispatch(playStateActions.useLayOnHands({ amount: healAmount, cure: false }));
        addToast(`Healed for ${healAmount} HP.`);
        dispatch(logEvent({ type: 'heal', message: `Used Lay on Hands to heal for ${healAmount} HP.` }));
        onClose();
    };

    const handleCure = () => {
        if (current < 5) {
            addToast("Not enough points in pool to cure.", "error");
            return;
        }
        dispatch(playStateActions.useLayOnHands({ amount: 0, cure: true }));
        addToast("Cured one disease or poison.");
        dispatch(logEvent({ type: 'system', message: `Used Lay on Hands to cure a disease/poison.` }));
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Lay on Hands" maxWidth="max-w-md">
             <p className="text-sm text-gray-400 text-center mb-4">Pool Remaining: {current} / {max}</p>
            <div className="space-y-4">
                <div>
                    <label htmlFor="heal-amount" className="block text-sm font-medium text-gray-400 mb-2">HP to Restore</label>
                    <div className="flex items-center gap-4">
                        <input
                            id="heal-amount"
                            type="range"
                            min="1"
                            max={maxHealable}
                            value={healAmount}
                            onChange={(e) => setHealAmount(parseInt(e.target.value, 10))}
                            className="w-full"
                        />
                        <span className="font-bold text-2xl w-16 text-center">{healAmount}</span>
                    </div>
                </div>
                <button
                    onClick={handleHeal}
                    disabled={healAmount > maxHealable || healAmount <= 0}
                    className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold disabled:bg-gray-500"
                >
                    Heal
                </button>
                <div className="relative flex py-3 items-center">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-xs">OR</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                </div>
                <button
                    onClick={handleCure}
                    disabled={current < 5}
                    className="w-full px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500"
                >
                    Cure Disease or Poison (Costs 5)
                </button>
            </div>
        </Modal>
    );
};

export default LayOnHandsModal;