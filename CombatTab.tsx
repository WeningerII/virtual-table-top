import React from 'react';
import { Character } from './types';
import Accordion from '../../shared/Accordion';
import ActionsPanel from '../ActionsPanel';
import SkillsPanel from '../SkillsPanel';
import SavingThrowsPanel from '../SavingThrowsPanel';
import ActiveEffectsPanel from '../ActiveEffectsPanel';
import ConditionsPanel from '../ConditionsPanel';
import InitiativeTracker from '../InitiativeTracker';
import InteractionPanel from '../InteractionPanel';
import InvocationsPanel from '../InvocationsPanel';
import MetamagicPanel from '../MetamagicPanel';
import { useAppSelector } from '../.././state/hooks';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';

interface CombatTabProps {
    targetTokenId: string | null;
}

const CombatTab: React.FC<CombatTabProps> = ({ targetTokenId }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    
    if (!character) return null;

    const isSorcerer = character.classes.some(c => c.id === 'sorcerer');
    const hasMetamagic = character.selectedMetamagic && character.selectedMetamagic.length > 0;
    
    return (
        <div className="space-y-4">
            <Accordion title="Initiative" startsOpen><InitiativeTracker /></Accordion>
            <Accordion title="Actions"><ActionsPanel targetTokenId={targetTokenId} /></Accordion>
            <Accordion title="Interactions"><InteractionPanel targetTokenId={targetTokenId} /></Accordion>
            {character.resolvedInvocations && character.resolvedInvocations.length > 0 && (
                <Accordion title="Invocations"><InvocationsPanel /></Accordion>
            )}
            {isSorcerer && hasMetamagic && (
                <Accordion title="Metamagic"><MetamagicPanel /></Accordion>
            )}
            <Accordion title="Saving Throws"><SavingThrowsPanel /></Accordion>
            <Accordion title="Skills"><SkillsPanel /></Accordion>
            <ActiveEffectsPanel />
            <ConditionsPanel />
        </div>
    );
};

export default CombatTab;
