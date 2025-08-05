import React, { useState, useMemo } from 'react';
import { useToast } from '../../state/ToastContext';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../state/selectors';
import { logEvent } from '../../state/logSlice';
import { Character } from '../../types';
import { playStateActions } from '../../engine/slices/playStateSlice';
import Modal from '../shared/Modal';

interface ArcaneRecoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ArcaneRecoveryModal: React.FC<ArcaneRecoveryModalProps> = ({ isOpen, onClose }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [slotsToRecover, setSlotsToRecover] = useState<Record<number, number>>({});

    const wizardLevel = useMemo(() => {
        return character?.classes.find(c => c.id === 'wizard')?.level || 0;
    }, [character]);
    
    const maxRecoveryPoints = useMemo(() => Math.ceil(wizardLevel / 2), [wizardLevel]);
    
    const currentRecoveryPoints = useMemo(() => {
        return Object.entries(slotsToRecover).reduce((total, [level, count]) => {
            return total + (parseInt(level, 10) * count);
        }, 0);
    }, [slotsToRecover]);

    if (!character || !character.spellcastingInfo) return null;

    const handleSlotChange = (level: number, amount: number) => {
        const currentCount = slotsToRecover[level] || 0;
        const newCount = Math.max(0, currentCount + amount);
        const expendedCount = character.expendedSpellSlots[level] || 0;
        
        if (newCount > expendedCount) return;

        const newTotalPoints = currentRecoveryPoints - (level * currentCount) + (level * newCount);
        if (newTotalPoints > maxRecoveryPoints) return;

        setSlotsToRecover(prev => ({ ...prev, [level]: newCount }));
    };

    const handleConfirm = () => {
        dispatch(playStateActions.recoverSpellSlots(slotsToRecover));
        const message = `Recovered ${currentRecoveryPoints} levels worth of spell slots!`;
        addToast(message);
        dispatch(logEvent({ type: 'system', message: `Arcane Recovery: ${message}` }));
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Arcane Recovery" maxWidth="max-w-lg">
            <div className="space-y-4">
                <div className="text-center bg-gray-900/50 p-3 rounded-md">
                    <p className="font-semibold">Recovery Points Used: <span className="text-purple-400">{currentRecoveryPoints} / {maxRecoveryPoints}</span></p>
                </div>
                <div className="space-y-3">
                    {character.spellcastingInfo.spellSlots.map((max, index) => {
                        const level = index + 1;
                        if (max === 0 || level > 5) return null;
                        const expended = character.expendedSpellSlots[level] || 0;
                        const recovering = slotsToRecover[level] || 0;
                        
                        if(expended === 0) return null;

                        return (
                            <div key={level} className="bg-gray-700/50 p-3 rounded-md">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold">Level {level} Slots</h4>
                                    <span className="text-sm">Expended: {expended}</span>
                                </div>
                                <div className="flex items-center justify-center gap-4 mt-2">
                                    <button onClick={() => handleSlotChange(level, -1)} disabled={recovering <= 0} className="px-4 py-2 bg-gray-700 rounded-md disabled:opacity-50">-</button>
                                    <span className="text-xl font-bold w-12 text-center">{recovering}</span>
                                    <button onClick={() => handleSlotChange(level, 1)} disabled={recovering >= expended || currentRecoveryPoints + level > maxRecoveryPoints} className="px-4 py-2 bg-gray-700 rounded-md disabled:opacity-50">+</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-700 flex justify-end">
                <button
                    onClick={handleConfirm}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold"
                >
                    Confirm Recovery
                </button>
            </div>
        </Modal>
    );
};

export default ArcaneRecoveryModal;