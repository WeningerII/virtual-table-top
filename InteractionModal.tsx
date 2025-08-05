import React, { useState } from 'react';
import { InteractionPrompt, Character } from '../../types';
import { useToast } from '../../state/ToastContext';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../state/selectors';
import { logEvent } from '../../state/logSlice';
import { playStateActions } from '../../engine/slices/playStateSlice';
import Modal from '../shared/Modal';

interface InteractionModalProps {
    isOpen: boolean;
    onClose: () => void;
    prompt: InteractionPrompt;
}

const BardicInspirationUI: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [allyName, setAllyName] = useState('');

    if (!character || !character.bardicInspiration) return null;

    const handleGive = () => {
        if (!allyName.trim()) return;
        dispatch(playStateActions.giveBardicInspiration({ allyName: allyName.trim() }));
        const message = `Gave Bardic Inspiration (1d${character.bardicInspiration.dieSize}) to ${allyName.trim()}!`;
        addToast(message);
        dispatch(logEvent({ type: 'system', message }));
        onClose();
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-400">Choose a creature other than yourself within 60 feet who can hear you. They gain one Bardic Inspiration die (a d{character.bardicInspiration.dieSize}).</p>
            <div>
                <label htmlFor="ally-name" className="block text-sm font-medium text-gray-400 mb-1">Ally's Name</label>
                <input
                    id="ally-name"
                    type="text"
                    value={allyName}
                    onChange={(e) => setAllyName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2"
                    placeholder="e.g., Gimli"
                />
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-700">
                <button onClick={handleGive} disabled={!allyName.trim()} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500">Inspire</button>
            </div>
        </div>
    );
};

const CuttingWordsUI: React.FC<{ onClose: () => void }> = ({ onClose }) => {
     const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
     const dispatch = useAppDispatch();
     const { addToast } = useToast();

    if (!character || !character.bardicInspiration) return null;

    const handleUse = (target: string) => {
        const roll = Math.floor(Math.random() * (character.bardicInspiration?.dieSize || 6)) + 1;
        dispatch(playStateActions.useBardicInspiration({ allyName: 'SELF_FOR_CUTTING_WORDS' }));
        const message = `Used Cutting Words! Rolled a ${roll}. Subtract from the enemy's ${target}.`;
        addToast(message);
        dispatch(logEvent({ type: 'system', message }));
        onClose();
    };
    
    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-400">Use your reaction to expend one use of Bardic Inspiration, roll the die, and subtract the number from a creature's roll.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                 <button onClick={() => handleUse('Attack Roll')} className="p-3 bg-blue-800 hover:bg-blue-700 rounded-md font-semibold">Attack Roll</button>
                 <button onClick={() => handleUse('Ability Check')} className="p-3 bg-blue-800 hover:bg-blue-700 rounded-md font-semibold">Ability Check</button>
                 <button onClick={() => handleUse('Damage Roll')} className="p-3 bg-blue-800 hover:bg-blue-700 rounded-md font-semibold">Damage Roll</button>
            </div>
        </div>
    )
}

const InteractionModal: React.FC<InteractionModalProps> = ({ isOpen, onClose, prompt }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;

    const renderContent = () => {
        switch (prompt.type) {
            case 'bardic_inspiration':
                return <BardicInspirationUI onClose={onClose} />;
            case 'cutting_words':
                return <CuttingWordsUI onClose={onClose} />;
            default:
                return <p>This interaction has not been fully implemented yet.</p>;
        }
    };

    const title = character?.allFeatures?.find(f => f.id === prompt.sourceFeatureId)?.name || 'Interaction';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
            {renderContent()}
        </Modal>
    );
};

export default InteractionModal;