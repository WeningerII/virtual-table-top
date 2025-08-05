import React from 'react';
import { Character, ActionItem, InitiativeEntry } from '../../../types';
import Accordion from '../../shared/Accordion';
import ActionsPanel from '../ActionsPanel';
import SkillsPanel from '../SkillsPanel';
import SavingThrowsPanel from '../SavingThrowsPanel';
import ActiveEffectsPanel from '../ActiveEffectsPanel';
import ConditionsPanel from '../ConditionsPanel';
import InitiativeTracker from '../InitiativeTracker';
import InteractionPanel from '../InteractionPanel';

interface CombatTabProps {
    character: Character;
    onRoll: (title: string, modifier: number) => void;
    onAttack: (action: ActionItem, isReckless: boolean) => void;
    isReckless: boolean;
    onRecklessToggle: (isReckless: boolean) => void;
    characterDispatch: React.Dispatch<any>;
    targetTokenId: string | null;
    onAiTurn: (entry: InitiativeEntry) => void;
    isAiThinking: boolean;
    onLayOnHands: () => void;
}

const CombatTab: React.FC<CombatTabProps> = ({ 
    character, 
    onRoll, 
    onAttack, 
    isReckless, 
    onRecklessToggle, 
    characterDispatch, 
    targetTokenId, 
    onAiTurn, 
    isAiThinking,
    onLayOnHands
}) => {
    return (
        <div className="space-y-4">
            <Accordion title="Initiative" startsOpen><InitiativeTracker onAiTurn={onAiTurn} isAiThinking={isAiThinking} /></Accordion>
            <Accordion title="Actions"><ActionsPanel character={character} onAttack={onAttack} isReckless={isReckless} onRecklessToggle={onRecklessToggle} targetTokenId={targetTokenId} /></Accordion>
            <Accordion title="Interactions"><InteractionPanel onInteraction={() => {}} onLayOnHands={onLayOnHands} onRoll={onRoll} /></Accordion>
            <Accordion title="Saving Throws"><SavingThrowsPanel savingThrows={character.savingThrowItems || []} onRoll={onRoll} /></Accordion>
            <Accordion title="Skills"><SkillsPanel skills={character.skillCheckItems || []} onRoll={onRoll} /></Accordion>
            <ActiveEffectsPanel character={character} dispatch={characterDispatch} />
            <ConditionsPanel />
        </div>
    );
};

export default CombatTab;