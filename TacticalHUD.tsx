import React from 'react';
import { useAppSelector, useAppDispatch } from '../../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../../state/selectors';
import { usePlayerActions } from '../../../hooks/usePlayerActions';
import { uiActions } from '../../../state/uiSlice';
import ActionIconButton from './ActionIconButton';
import { ActionIcon, BonusActionIcon, ReactionIcon, MoveIcon, SpellIcon, InventoryIcon } from '../../icons/ActionIcons';

interface TacticalHUDProps {
    targetTokenId: string | null;
}

const TacticalHUD: React.FC<TacticalHUDProps> = ({ targetTokenId }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const dispatch = useAppDispatch();
    const { 
        handleToggleRage,
        handleToggleFrenzy,
        handleSecondWind,
        handleFlurryOfBlows,
        handlePatientDefense,
        handleStepOfTheWind,
        handleBardicInspiration,
        handleHuntersMark,
        handleVowOfEnmity,
    } = usePlayerActions();

    if (!character) return null;

    const { action, bonusAction, reaction } = character.actionEconomy;
    const isRaging = character.activeStates.some(s => s.id === 'rage');
    const isFrenzied = character.activeStates.some(s => s.id === 'frenzied');

    // Find specific features for bonus actions
    const rageFeature = character.allFeatures?.find(f => f.id === 'rage');
    const frenzyFeature = character.allFeatures?.find(f => f.id === 'berserker-frenzy-3');
    const secondWindFeature = character.resources.find(r => r.id === 'second-wind');
    const bardicInspirationFeature = character.resources.find(r => r.id === 'bardic-inspiration');
    const huntersMarkSpell = character.knownSpells.includes("hunter's-mark");
    const vowOfEnmityFeature = character.allFeatures?.find(f => f.id === 'vengeance-channel-divinity-vow-of-enmity-3');
    const kiResource = character.resources.find(r => r.id === 'ki-points');


    return (
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gray-900/80 backdrop-blur-sm border-t-2 border-gray-700 flex items-center justify-center p-2 z-30">
            <div className="flex items-center gap-2">
                
                {/* Left Side: Core Actions & Modals */}
                <div className="flex items-center gap-2">
                     <ActionIconButton
                        label="Action"
                        icon={<ActionIcon />}
                        onClick={() => dispatch(uiActions.openActionsModal())}
                        disabled={!action}
                        tooltip={action ? "Take an Action (Attack, general actions, etc.)" : "Action already used this turn."}
                    />
                    <ActionIconButton
                        label="Spells"
                        icon={<SpellIcon />}
                        onClick={() => dispatch(uiActions.openSpellsModal())}
                        tooltip="Open your spellbook."
                    />
                    <ActionIconButton
                        label="Inventory"
                        icon={<InventoryIcon />}
                        onClick={() => dispatch(uiActions.openInventoryModal())}
                        tooltip="Open your inventory."
                    />
                </div>

                <div className="w-px h-20 bg-gray-600 mx-3"></div>

                {/* Center: Bonus Actions */}
                <div className="flex items-center gap-2">
                    {rageFeature && (
                        <ActionIconButton
                            label={isRaging ? "End Rage" : "Rage"}
                            icon={<BonusActionIcon />}
                            onClick={handleToggleRage}
                            disabled={!bonusAction && !isRaging}
                            isActive={isRaging}
                            tooltip={isRaging ? "End your rage as a bonus action." : "Enter a rage as a bonus action."}
                            costText="Bonus"
                        />
                    )}
                     {frenzyFeature && isRaging && (
                        <ActionIconButton
                            label="Frenzy"
                            icon={<BonusActionIcon />}
                            onClick={handleToggleFrenzy}
                            disabled={!bonusAction || isFrenzied}
                            isActive={isFrenzied}
                            tooltip="Enter a Frenzy to make a bonus action attack."
                            costText="Bonus"
                        />
                    )}
                    {secondWindFeature && (
                        <ActionIconButton
                            label="Second Wind"
                            icon={<BonusActionIcon />}
                            onClick={handleSecondWind}
                            disabled={!bonusAction || secondWindFeature.current === 0}
                            tooltip="Regain hit points."
                            costText="Bonus"
                        />
                    )}
                     {bardicInspirationFeature && (
                        <ActionIconButton
                            label="Inspire"
                            icon={<BonusActionIcon />}
                            onClick={handleBardicInspiration}
                            disabled={!bonusAction || bardicInspirationFeature.current === 0}
                            tooltip="Inspire an ally."
                            costText="Bonus"
                        />
                    )}
                    {huntersMarkSpell && (
                         <ActionIconButton
                            label="Hunter's Mark"
                            icon={<BonusActionIcon />}
                            onClick={() => handleHuntersMark(targetTokenId)}
                            disabled={!bonusAction || !targetTokenId || !!character.activeConcentration || !!character.activeHuntersMarkTargetId}
                            isActive={!!character.activeHuntersMarkTargetId}
                            tooltip="Mark a creature as your quarry."
                            costText="Bonus"
                        />
                    )}
                    {vowOfEnmityFeature && (
                         <ActionIconButton
                            label="Vow of Enmity"
                            icon={<BonusActionIcon />}
                            onClick={() => handleVowOfEnmity(targetTokenId)}
                            disabled={!bonusAction || !targetTokenId || !!character.activeVowOfEnmityTargetId}
                            isActive={!!character.activeVowOfEnmityTargetId}
                            tooltip="Swear a vow against a creature."
                            costText="Bonus"
                        />
                    )}
                    {kiResource && kiResource.max > 0 && (
                        <>
                             <ActionIconButton label="Flurry" icon={<BonusActionIcon />} onClick={handleFlurryOfBlows} disabled={!bonusAction || kiResource.current < 1} tooltip="Spend 1 ki to make two unarmed strikes." costText="1 Ki" />
                             <ActionIconButton label="Dodge" icon={<BonusActionIcon />} onClick={handlePatientDefense} disabled={!bonusAction || kiResource.current < 1} tooltip="Spend 1 ki to Dodge." costText="1 Ki" />
                             <ActionIconButton label="Dash" icon={<BonusActionIcon />} onClick={handleStepOfTheWind} disabled={!bonusAction || kiResource.current < 1} tooltip="Spend 1 ki to Dash or Disengage." costText="1 Ki" />
                        </>
                    )}
                </div>

                <div className="w-px h-20 bg-gray-600 mx-3"></div>

                {/* Right Side: Reaction & Movement */}
                 <div className="flex items-center gap-2">
                    <ActionIconButton
                        label="Reaction"
                        icon={<ReactionIcon />}
                        onClick={() => {}}
                        disabled={!reaction}
                        tooltip={reaction ? "Reaction available for triggers." : "Reaction used this round."}
                    />
                </div>
            </div>
        </div>
    );
};

export default TacticalHUD;