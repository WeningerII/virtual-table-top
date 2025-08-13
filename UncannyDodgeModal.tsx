import React from 'react';
import { UncannyDodgePrompt, Character } from './types';
import { useToast } from './state/ToastContext';
import { useAppDispatch, useAppSelector } from '.././state/hooks';
import { logEvent } from '../../state/logSlice';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';
import { vitalsActions } from './engine/slices/vitalsSlice';
import { playStateActions } from './engine/slices/playStateSlice';

interface UncannyDodgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    prompt: UncannyDodgePrompt;
}

const UncannyDodgeModal: React.FC<UncannyDodgeModalProps> = ({ isOpen, onClose, prompt }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const appDispatch = useAppDispatch();
    const { addToast } = useToast();

    if (!isOpen) return null;

    const handleUseReaction = () => {
        const halvedDamage = Math.floor(prompt.damage / 2);
        appDispatch(vitalsActions.resolveDamage({ amount: halvedDamage }));
        appDispatch(playStateActions.setUncannyDodgePrompt(null));
        const message = `Uncanny Dodge! Damage from ${prompt.source} reduced to ${halvedDamage}.`;
        addToast(message);
        appDispatch(logEvent({ type: 'system', message }));
        // No need to call onClose, the state update will close it.
    };

    const handleTakeFullDamage = () => {
        appDispatch(vitalsActions.resolveDamage({ amount: prompt.damage }));
        appDispatch(playStateActions.setUncannyDodgePrompt(null));
        // No need to call onClose.
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[80] p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold font-teko tracking-wide text-yellow-300">UNEXPECTED ATTACK!</h2>
                </div>
                <div className="p-6 text-center">
                    <p className="text-lg">You are about to take <span className="font-bold text-2xl text-red-400">{prompt.damage}</span> damage from an attack!</p>
                    <p className="text-gray-400 mt-2">Use your reaction for Uncanny Dodge to halve the damage?</p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                    <button
                        onClick={handleTakeFullDamage}
                        className="px-6 py-3 bg-red-800 hover:bg-red-700 rounded-md font-semibold text-white"
                    >
                        Take Full Damage
                    </button>
                    <button
                        onClick={handleUseReaction}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold text-white"
                    >
                        Use Reaction ({Math.floor(prompt.damage / 2)} Damage)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UncannyDodgeModal;