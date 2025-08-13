import React, { useState, useMemo } from 'react';
import { useToast } from 'state/ToastContext';
import { rollDice } from '../../utils/dice';
import { useAppSelector, useAppDispatch } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';
import { logEvent } from 'state/logSlice';
import { Character, Ability } from './types';
import { vitalsActions } from './vitalsSlice';
import { playStateActions } from './playStateSlice';
import Modal from '../shared/Modal';

interface ShortRestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ShortRestModal: React.FC<ShortRestModalProps> = ({ isOpen, onClose }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [diceToSpend, setDiceToSpend] = useState<Record<string, number>>({});

    const conModifier = useMemo(() => {
        if (!character) return 0;
        const score = (character.abilityScores.CONSTITUTION?.base || 0) + (character.abilityScores.CONSTITUTION?.bonus || 0);
        return Math.floor((score - 10) / 2);
    }, [character]);

    if (!character) return null;
    
    const handleDiceChange = (die: string, amount: number) => {
        setDiceToSpend(prev => ({
            ...prev,
            [die]: Math.max(0, Math.min(character.hitDice[die]?.current || 0, (prev[die] || 0) + amount))
        }));
    };

    const handleRollAndHeal = () => {
        let totalHealed = 0;
        let diceRolled = 0;

        for (const [dieKey, count] of Object.entries(diceToSpend)) {
            if (count > 0) {
                const dieType = parseInt(dieKey.slice(1), 10);
                const rollResult = rollDice(`${count}d${dieType}`);
                totalHealed += rollResult.total;
                diceRolled += count;
                dispatch(vitalsActions.spendHitDice({ die: dieType, count }));
            }
        }
        totalHealed += conModifier * diceRolled;
        
        const newHp = Math.min(character.hp, character.currentHp + totalHealed);
        dispatch(vitalsActions.updateCurrentHp(newHp));

        dispatch(logEvent({ type: 'heal', message: `Spent Hit Dice to recover ${totalHealed} HP.` }));
        addToast(`You recovered ${totalHealed} hit points!`);
        setDiceToSpend({});
    };

    const handleFinishRest = () => {
        dispatch(playStateActions.applyShortRest());
        dispatch(logEvent({ type: 'system', message: 'Short rest complete. Some features restored.' }));
        addToast("Short rest complete. Some features restored.");
        onClose();
    };
    
    const availableDice = Object.entries(character.hitDice).filter(([_, data]) => data.max > 0);
    const canRoll = Object.values(diceToSpend).some(count => count > 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Take a Short Rest" maxWidth="max-w-lg">
            <div className="space-y-4">
                <div className="text-center bg-gray-900/50 p-3 rounded-md">
                    <p className="font-semibold">Current HP: <span className="text-green-400">{character.currentHp} / {character.hp}</span></p>
                </div>

                {availableDice.length > 0 ? (
                    availableDice.map(([dieKey, data]) => (
                        <div key={dieKey} className="bg-gray-700/50 p-3 rounded-md">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold">{dieKey.toUpperCase()} Hit Dice</h4>
                                <span className="text-sm">{data.current} / {data.max} Available</span>
                            </div>
                            <div className="flex items-center justify-center gap-4 mt-2">
                                <button onClick={() => handleDiceChange(dieKey, -1)} disabled={(diceToSpend[dieKey] || 0) <= 0} className="px-4 py-2 bg-gray-700 rounded-md disabled:opacity-50">-</button>
                                <span className="text-xl font-bold w-12 text-center">{diceToSpend[dieKey] || 0}</span>
                                <button onClick={() => handleDiceChange(dieKey, 1)} disabled={(diceToSpend[dieKey] || 0) >= data.current} className="px-4 py-2 bg-gray-700 rounded-md disabled:opacity-50">+</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 italic py-4">No Hit Dice available.</p>
                )}
            </div>

            <div className="pt-4 mt-4 border-t border-gray-700 flex justify-between items-center">
                <button
                    onClick={handleRollAndHeal}
                    disabled={!canRoll}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Roll & Heal
                </button>
                    <button
                    onClick={handleFinishRest}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold"
                >
                    Finish Rest
                </button>
            </div>
        </Modal>
    );
};

export default ShortRestModal;