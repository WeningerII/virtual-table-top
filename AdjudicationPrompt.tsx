import React from 'react';
import { PlayerChoicePrompt, SavingThrowChoice, ReactionChoice, Character } from './types';
import { rollD20 } from '../../utils/dice';
import { useAppDispatch, useAppSelector } from '.././state/hooks';
import { resolvePlayerChoice, postGameEvent } from '../../state/eventSlice';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';
import Modal from '../shared/Modal';

const SavingThrowUI: React.FC<{ prompt: SavingThrowChoice }> = ({ prompt }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const dispatch = useAppDispatch();

    const handleRoll = () => {
        if (!character) return;
        const saveInfo = character.savingThrowItems?.find(s => s.id === prompt.ability);
        const modifier = saveInfo?.modifier || 0;
        const roll = rollD20();
        const total = roll + modifier;
        const success = total >= prompt.dc;

        dispatch(resolvePlayerChoice({
            choiceId: prompt.choiceId,
            selection: { roll, modifier, total, success }
        }));
    };

    return (
        <div className="text-center">
            <p className="text-lg">You must make a <span className="font-bold text-yellow-300">{prompt.ability}</span> saving throw!</p>
            <p className="text-4xl font-bold my-3">DC {prompt.dc}</p>
            <p className="text-sm text-gray-400 italic mb-4">On Failure: {prompt.effectDescription}</p>
            <button
                onClick={handleRoll}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-md font-bold text-lg"
            >
                Roll Save (+{character?.savingThrowItems?.find(s => s.id === prompt.ability)?.modifier ?? 0})
            </button>
        </div>
    );
};

const ReactionUI: React.FC<{ prompt: ReactionChoice }> = ({ prompt }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const dispatch = useAppDispatch();

    const handleSelectOption = (optionId: string) => {
        if (!character) return;
        
        const isSpell = optionId === 'shield' || optionId === 'counterspell';

        if (isSpell) {
             dispatch(postGameEvent({ type: 'CAST_SPELL', sourceId: character.id, spellId: optionId, upcastLevel: 1, targets: { tokenIds: [character.id] } }));
        } else {
             dispatch(postGameEvent({ type: 'USE_FEATURE', sourceId: character.id, featureId: optionId }));
        }
        
        dispatch(resolvePlayerChoice({ choiceId: prompt.choiceId, selection: optionId }));
    };
    
    const handleDecline = () => {
        dispatch(resolvePlayerChoice({ choiceId: prompt.choiceId, selection: null }));
    }

    return (
        <div className="text-center">
            <p className="text-lg text-gray-300">Trigger: <span className="font-semibold text-white">{prompt.trigger}</span></p>
            <p className="text-gray-400 mt-2 mb-4">You have a reaction available. What do you do?</p>
            <div className="space-y-3">
                {prompt.options.map(opt => (
                    <button key={opt.id} onClick={() => handleSelectOption(opt.id)} className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-md font-bold">
                        {opt.name}
                    </button>
                ))}
                 <button onClick={handleDecline} className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold text-sm">
                    Do Nothing
                </button>
            </div>
        </div>
    );
};

const AdjudicationPrompt: React.FC<{ prompt: PlayerChoicePrompt }> = ({ prompt }) => {
    const dispatch = useAppDispatch();

    const renderContent = () => {
        switch (prompt.type) {
            case 'saving_throw':
                return <SavingThrowUI prompt={prompt as SavingThrowChoice} />;
            case 'reaction':
                 return <ReactionUI prompt={prompt as ReactionChoice} />;
            default:
                return <p>Unknown choice type: {(prompt as any).type}</p>;
        }
    };

    const handleClose = () => {
        dispatch(resolvePlayerChoice({ choiceId: prompt.choiceId, selection: null }));
    };

    return (
        <Modal isOpen={true} onClose={handleClose} title="PLAYER DECISION REQUIRED">
             {renderContent()}
        </Modal>
    );
};

export default AdjudicationPrompt;