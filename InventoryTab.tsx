

import React from 'react';
import { Character } from './types';
import Accordion from '../../shared/Accordion';
import InventoryPanel from '../InventoryPanel';
import ToolsPanel from '../ToolsPanel';
import { useAppSelector } from '../.././state/hooks';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';
import { usePlayerActions } from '../../../hooks/usePlayerActions';

const InventoryTab: React.FC = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character;
    const { handleRoll } = usePlayerActions();

    return (
        <div className="space-y-4">
            <Accordion title="Inventory" startsOpen><InventoryPanel character={character} /></Accordion>
            <Accordion title="Tools"><ToolsPanel character={character} onRoll={handleRoll} /></Accordion>
        </div>
    );
};

export default InventoryTab;