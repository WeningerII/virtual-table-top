import React, { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';
import ShortRestModal from './ShortRestModal';
import DivineSmiteModal from './DivineSmiteModal';
import LayOnHandsModal from './LayOnHandsModal';
import ArcaneRecoveryModal from './ArcaneRecoveryModal';
import FontOfMagicModal from './FontOfMagicModal';
import SummoningModal from './SummoningModal';
import SummoningChoiceModal from './SummoningChoiceModal';
import InteractionModal from './InteractionModal';
import AdjudicationPrompt from './AdjudicationPrompt';
import CreatorsWorkbenchModal from './CreatorsWorkbenchModal';
import DialogueModal from './DialogueModal';
import InventoryModal from './modals/InventoryModal';
import SpellsModal from './modals/SpellsModal';
import ActionsPanel from './ActionsPanel'; 
import InteractionPanel from './InteractionPanel'; 
import Modal from '../shared/Modal';
import { Character, MapNpcInstance } from './types';
import { usePlayerActions } from '../../hooks/usePlayerActions';
import { useDialogueManager } from '../../hooks/useDialogueManager';
import { uiActions } from 'state/uiSlice';
import { playStateActions } from './playStateSlice';

// NEW MODAL COMPONENT
const ActionsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    targetTokenId: string | null;
}> = ({ isOpen, onClose, targetTokenId }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Actions">
            <div className="space-y-4">
                <ActionsPanel targetTokenId={targetTokenId} />
                <InteractionPanel targetTokenId={targetTokenId} />
            </div>
        </Modal>
    );
};


interface ModalContainerProps {
    mapNpcInstances: MapNpcInstance[];
    targetTokenId: string | null;
}

const ModalContainer: React.FC<ModalContainerProps> = ({ mapNpcInstances, targetTokenId }) => {
    const uiState = useAppSelector(state => state.ui);
    const eventState = useAppSelector(state => state.events);
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const appDispatch = useAppDispatch();
    const { onConfirmSummonChoice, onSummon } = usePlayerActions();
    const { isDialogueOpen, handleCloseDialogue: onCloseDialogue, activeConversation, handleSendMessage: onSendMessage, isNpcTyping } = useDialogueManager();

    const closeAllModals = useCallback(() => {
        appDispatch(uiActions.closeAllModals());
    }, [appDispatch]);

    if (!character) return null;

    const handleSummonChoiceConfirm = (blueprintId: string, quantity: number) => {
        appDispatch(playStateActions.setSummonChoicePrompt(null));
        onConfirmSummonChoice(blueprintId, quantity);
    };

    return (
        <>
            <DialogueModal isOpen={isDialogueOpen} onClose={onCloseDialogue} conversation={activeConversation} onSendMessage={onSendMessage} isNpcTyping={isNpcTyping} />
            <ShortRestModal isOpen={uiState.isShortRestModalOpen} onClose={closeAllModals} />
            {uiState.divineSmiteModalContext && (
                <DivineSmiteModal isOpen={true} onClose={closeAllModals} action={uiState.divineSmiteModalContext} />
            )}
            {uiState.creatorsWorkbenchContext && (
                 <CreatorsWorkbenchModal isOpen={true} onClose={closeAllModals} context={uiState.creatorsWorkbenchContext} />
            )}
            <LayOnHandsModal isOpen={uiState.layOnHandsModalOpen} onClose={closeAllModals} />
            <ArcaneRecoveryModal isOpen={uiState.arcaneRecoveryModalOpen} onClose={closeAllModals} />
            <FontOfMagicModal isOpen={uiState.fontOfMagicModalOpen} onClose={closeAllModals} />
            <SummoningModal isOpen={!!uiState.summoningModalContext} onClose={closeAllModals} character={character} onSummon={onSummon} castingSpell={uiState.summoningModalContext?.spell} />
            {character.summonChoicePrompt && (
                <SummoningChoiceModal isOpen={true} onClose={() => appDispatch(playStateActions.setSummonChoicePrompt(null))} character={character} prompt={character.summonChoicePrompt} onConfirm={handleSummonChoiceConfirm} />
            )}
            {uiState.interactionModalContext && (
                <InteractionModal isOpen={true} onClose={closeAllModals} prompt={{ type: uiState.interactionModalContext.type, sourceFeatureId: uiState.interactionModalContext.featureId }} />
            )}
            {eventState.pendingChoice && (
                 <AdjudicationPrompt prompt={eventState.pendingChoice} />
            )}
            <InventoryModal isOpen={uiState.isInventoryModalOpen} onClose={closeAllModals} />
            <SpellsModal isOpen={uiState.isSpellsModalOpen} onClose={closeAllModals} />
            <ActionsModal isOpen={uiState.isActionsModalOpen} onClose={closeAllModals} targetTokenId={targetTokenId} />
        </>
    );
};

export default ModalContainer;