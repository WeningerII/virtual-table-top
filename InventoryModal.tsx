import React from 'react';
import { useAppSelector } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';
import InventoryPanel from '../InventoryPanel';
import ToolsPanel from '../ToolsPanel';
import { usePlayerActions } from '../../../hooks/usePlayerActions';
import Modal from '../../shared/Modal';

interface InventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const { handleRoll } = usePlayerActions();

    if (!character) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Inventory & Equipment">
            <div className="space-y-4">
                <InventoryPanel character={character} />
                <ToolsPanel character={character} onRoll={handleRoll} />
            </div>
        </Modal>
    );
};

export default InventoryModal;