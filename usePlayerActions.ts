import { useCallback, useState } from 'react';
import { useAppSelector, useAppDispatch } from './hooks';
import { useToast } from 'state/ToastContext';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';
import { logEvent } from 'state/logSlice';
import { playStateActions } from './playStateSlice';
import { vitalsActions } from './vitalsSlice';
import { ActionItem, Companion, InitiativeEntry, Spell, CompanionBlueprint, SummonChoiceEffect, ClassFeature, Character, Token, DeclareAttackEvent, CastSpellEvent, HealEvent, DodgeActionEvent, MoveTokenEvent, HelpActionEvent, HideActionEvent, SearchActionEvent, DealDamageToObjectEvent, GameEvent, UseFeatureEvent } from './types';
import { rollDice, rollD20 } from '../utils/dice';
import { setLastRollResult, uiActions } from 'state/uiSlice';
import { postGameEvent } from 'state/eventSlice';
import { soundManager } from 'services./soundManager';


export const usePlayerActions = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);
    const { activeMap: mapState } = useAppSelector(state => state.entity);
    const dispatch = useAppDispatch();
    const { addToast } = useToast();

    const [isRollingCompanionAction, setIsRollingCompanionAction] = useState(false);

    const postEvent = useCallback((event: Omit<GameEvent, 'sourceId'>) => {
        if (!character) return;
        dispatch(postGameEvent({ ...event, sourceId: character.id } as GameEvent));
    }, [character, dispatch]);


    const handleRoll = useCallback((title: string, modifier: number) => {
        if (!character) return;
        const roll = rollD20();
        const total = roll + modifier;
        const isCrit = roll === 20;
        const isCritFail = roll === 1;
        dispatch(setLastRollResult({ title, roll, modifier, total, isCrit, isCritFail }));
        dispatch(logEvent({ type: 'roll', message: `${character.name} rolled for ${title}: ${total} (${roll} + ${modifier})` }));
    }, [character, dispatch]);

    const handleAttack = useCallback((attackerId: string, action: ActionItem, reckless: boolean, targetTokenId: string | null) => {
        if (!targetTokenId || !mapState || !character) {
            addToast("No target selected or data missing!", "error");
            return;
        }
        const event: DeclareAttackEvent = { type: 'DECLARE_ATTACK', sourceId: attackerId, targetId: targetTokenId, action, isReckless: reckless };
        dispatch(postGameEvent(event));

        if (action.attackType === 'ranged') soundManager.playSound('arrow-whoosh', 'sfx');
        else soundManager.playSound('sword-hit', 'sfx');
    
    }, [character, mapState, addToast, dispatch]);
    
    const handleSneakAttack = useCallback((attackerId: string, action: ActionItem, reckless: boolean, targetTokenId: string | null) => {
        if (!character?.sneakAttackDice) return;
        
        const enhancedAction = { ...action, damageParts: [...(action.damageParts || []), { dice: character.sneakAttackDice, bonus: 0, type: 'sneak attack' }] };
        handleAttack(attackerId, enhancedAction, reckless, targetTokenId);
        dispatch(playStateActions.setUsedSneakAttack(true));
    }, [character, handleAttack, dispatch]);

    const handleCompanionRoll = useCallback(async (companion: Companion, action: ActionItem, targetTokenId: string | null) => {
        if (!targetTokenId) { addToast("Select a target!", "error"); return; }
        setIsRollingCompanionAction(true);
        const companionToken = mapState?.tokens.find(t => t.npcInstanceId === companion.instanceId);
        if (companionToken) handleAttack(companionToken.id, action, false, targetTokenId);
        setIsRollingCompanionAction(false);
    }, [addToast, handleAttack, mapState]);

    const handleShortRest = useCallback(() => { if (character) { dispatch(uiActions.openShortRestModal()); } }, [character, dispatch]);
    
    const handleLongRest = useCallback(() => {
        if (window.confirm("Are you sure you want to take a long rest?")) {
            if (character) {
                dispatch(vitalsActions.applyLongRest());
                dispatch(playStateActions.applyLongRest());
                dispatch(logEvent({ type: 'system', message: `${character.name} took a long rest.`}));
                addToast("Long rest complete.");
            }
        }
    }, [character, dispatch, addToast]);

    const handleArcaneRecovery = useCallback(() => dispatch(uiActions.openArcaneRecoveryModal()), [dispatch]);
    const handleFontOfMagic = useCallback(() => dispatch(uiActions.openFontOfMagicModal()), [dispatch]);
    
    const onSummon = useCallback((blueprint: CompanionBlueprint, quantity: number) => {
        const event: Omit<UseFeatureEvent, 'sourceId'> = { type: 'USE_FEATURE', featureId: 'summon_from_library', choices: { blueprintId: blueprint.id, quantity } };
        postEvent(event);
        addToast(`Summoned ${quantity} ${blueprint.name}!`);
    }, [postEvent, addToast]);

    const onConfirmSummonChoice = useCallback((blueprintId: string, quantity: number) => {
        const event: Omit<UseFeatureEvent, 'sourceId'> = { type: 'USE_FEATURE', featureId: 'confirm_summon_choice', choices: { blueprintId, quantity } };
        postEvent(event);
    }, [postEvent]);
    
    const handleUseCreatorFeature = useCallback((feature: ClassFeature) => dispatch(uiActions.openCreatorsWorkbenchModal({ feature })), [dispatch]);
    
    const handleAttackObject = useCallback((objectId: string) => {
        if (!character?.attackActions?.[0]) return;
        const event: Omit<DealDamageToObjectEvent, 'sourceId'> = { type: 'DEAL_DAMAGE_TO_OBJECT', objectId, damageParts: character.attackActions[0].damageParts || [], isCrit: false };
        postEvent(event);
        addToast(`Attacking the object!`);
    }, [character, postEvent, addToast]);

    const handleDodge = useCallback(() => {
        const event: Omit<DodgeActionEvent, 'sourceId'> = { type: 'DODGE_ACTION' };
        postEvent(event);
    }, [postEvent]);

    const handleHelp = useCallback((targetId: string | null) => { 
        if (targetId) {
            const event: Omit<HelpActionEvent, 'sourceId'> = { type: 'HELP_ACTION', targetId };
            postEvent(event);
        } 
    }, [postEvent]);

    const handleHide = useCallback(() => {
        if (!character) return;
        const stealthMod = character.skillCheckItems?.find(s => s.id === 'stealth')?.modifier ?? 0;
        const event: Omit<HideActionEvent, 'sourceId'> = { type: 'HIDE_ACTION', stealthModifier: stealthMod };
        postEvent(event);
    }, [character, postEvent]);

    const handleSearch = useCallback(() => {
        if (!character) return;
        const perceptionMod = character.skillCheckItems?.find(s => s.id === 'perception')?.modifier ?? 0;
        const event: Omit<SearchActionEvent, 'sourceId'> = { type: 'SEARCH_ACTION', perceptionModifier: perceptionMod };
        postEvent(event);
    }, [character, postEvent]);

    const handleMove = useCallback((path: { x: number; y: number }[]) => {
        const event: Omit<MoveTokenEvent, 'sourceId'> = { type: 'MOVE_TOKEN', path };
        postEvent(event);
    }, [postEvent]);

    const handleCastInvocationSpell = useCallback((spellId: string) => {
        if (!character) return;
        const event: Omit<CastSpellEvent, 'sourceId'> = { 
            type: 'CAST_SPELL', 
            spellId, 
            upcastLevel: 0,
            targets: { tokenIds: [character.id] } 
        };
        postEvent(event);
        addToast(`Casting ${spellId.replace(/-/g, ' ')}!`);
    }, [character, postEvent, addToast]);

    const handleToggleRage = useCallback(() => postEvent({ type: 'USE_FEATURE', featureId: 'rage' } as Omit<UseFeatureEvent, 'sourceId'>), [postEvent]);
    const handleToggleFrenzy = useCallback(() => postEvent({ type: 'USE_FEATURE', featureId: 'berserker-frenzy-3' } as Omit<UseFeatureEvent, 'sourceId'>), [postEvent]);
    const handleSecondWind = useCallback(() => postEvent({ type: 'USE_FEATURE', featureId: 'second-wind' } as Omit<UseFeatureEvent, 'sourceId'>), [postEvent]);
    const handleFlurryOfBlows = useCallback(() => postEvent({ type: 'USE_FEATURE', featureId: 'monk-flurry-of-blows' } as Omit<UseFeatureEvent, 'sourceId'>), [postEvent]);
    const handlePatientDefense = useCallback(() => postEvent({ type: 'USE_FEATURE', featureId: 'monk-patient-defense' } as Omit<UseFeatureEvent, 'sourceId'>), [postEvent]);
    const handleStepOfTheWind = useCallback(() => postEvent({ type: 'USE_FEATURE', featureId: 'monk-step-of-the-wind' } as Omit<UseFeatureEvent, 'sourceId'>), [postEvent]);
    const handleBardicInspiration = useCallback(() => {
        dispatch(uiActions.openInteractionModal({ type: 'bardic_inspiration', featureId: 'bardic-inspiration' }));
    }, [dispatch]);

    const handleHuntersMark = useCallback((targetId: string | null) => {
        if (!targetId || !character) {
            addToast("You must select a target for Hunter's Mark.", "error");
            return;
        }
        const event: Omit<CastSpellEvent, 'sourceId'> = { type: 'CAST_SPELL', spellId: "hunter's-mark", upcastLevel: 1, targets: { tokenIds: [targetId] } };
        postEvent(event);
    }, [character, postEvent, addToast]);

    const handleVowOfEnmity = useCallback((targetId: string | null) => {
        if (!targetId) {
            addToast("You must select a target for your Vow of Enmity.", "error");
            return;
        }
        const event: Omit<UseFeatureEvent, 'sourceId'> = { type: 'USE_FEATURE', featureId: 'vengeance-channel-divinity-vow-of-enmity-3', targetId };
        postEvent(event);
    }, [postEvent, addToast]);

    return {
        handleRoll,
        handleAttack,
        handleSneakAttack,
        handleCompanionRoll,
        isRollingCompanionAction,
        handleShortRest,
        handleLongRest,
        handleArcaneRecovery,
        handleFontOfMagic,
        onSummon,
        onConfirmSummonChoice,
        handleUseCreatorFeature,
        handleDodge,
        handleHelp,
        handleHide,
        handleSearch,
        handleAttackObject,
        handleMove,
        handleCastInvocationSpell,
        handleToggleRage,
        handleToggleFrenzy,
        handleSecondWind,
        handleFlurryOfBlows,
        handlePatientDefense,
        handleStepOfTheWind,
        handleBardicInspiration,
        handleHuntersMark,
        handleVowOfEnmity,
    };
};