import React from 'react';
import { useAppSelector, useAppDispatch } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';
import { SpellsPanel } from '../SpellsPanel';
import { useVttInteractions } from '../../../hooks/useVttInteractions';
import Modal from '../../shared/Modal';
import { animationActions } from 'state/animationSlice';
import { VFXRequest } from './types';

interface SpellsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SpellsModal: React.FC<SpellsModalProps> = ({ isOpen, onClose }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const dispatch = useAppDispatch();
    const vttInteractions = useVttInteractions();

    if (!character) return null;

    const setLastVFX = (vfx: VFXRequest | null) => {
        dispatch(animationActions.setLastVFXRequest(vfx));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Spellbook">
            <SpellsPanel 
                setSpellTargetingState={vttInteractions.setSpellTargetingState}
                setActiveTool={vttInteractions.setActiveTool}
                setLastVFX={setLastVFX}
            />
        </Modal>
    );
};

export default SpellsModal;