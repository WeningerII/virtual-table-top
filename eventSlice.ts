import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { GameEvent, PlayerChoicePrompt, SimulationState } from '../types';
import { RootState } from './store';
// Minimal processor scaffold retained for future engine integration
class EventProcessor { constructor(_cf: any, _static: any) {} processEvents(queue: any[], state: any) { return { finalState: state, pendingChoices: [] }; } }
class CommandFactory {}
import { animationActions } from './animationSlice';
import { entitySlice } from './entitySlice';
import { endCombat, advanceTurn, startCombat } from './combatFlowSlice';
import { rollDice, rollD20 } from './dice';
import { logEvent } from './logSlice';
import { loadEncounter } from './entitySlice';

export interface EventState {
    eventQueue: GameEvent[];
    pendingChoice: PlayerChoicePrompt | null;
}

const initialState: EventState = {
    eventQueue: [],
    pendingChoice: null,
};

export const postGameEvent = createAsyncThunk(
    'events/postGameEvent',
    async (event: GameEvent, { dispatch }) => {
        dispatch(eventSlice.actions.enqueueEvent(event));
        await dispatch(processEventQueue());
    }
);

const handleEvent = async (evt: any, getState: () => RootState, dispatch: any) => {
    const state = getState();
    switch (evt.type) {
        // Core combat
        case 'ATTACK_ROLL': {
            const d20 = rollD20();
            const total = d20 + (evt.attackBonus || 0);
            const isCrit = d20 === 20 || !!evt.forceCrit;
            dispatch(logEvent({ type: 'system', message: `Attack roll: ${d20} + ${evt.attackBonus || 0} = ${total}${isCrit ? ' (CRIT)' : ''}` }));
            if (evt.autoApply) {
                const hit = total >= (evt.ac || 10);
                if (hit) {
                    const dmgRoll = isCrit && evt.damage ? evt.damage.replace(/(\d+)d(\d+)/, (m: string, a: string, b: string) => `${Number(a) * 2}d${b}`) : (evt.damage || '1d6');
                    const dmg = rollDice(dmgRoll).total + (evt.damageBonus || 0);
                    await dispatch(postGameEvent({ type: 'APPLY_DAMAGE', targetId: evt.targetId, amount: dmg, damageType: evt.damageType || 'bludgeoning' }));
                } else {
                    dispatch(logEvent({ type: 'system', message: `Attack missed (needed ${evt.ac || 10}).` }));
                }
            }
            break;
        }
        case 'DECLARE_ATTACK': {
            const d20 = rollD20();
            const isCrit = d20 === 20;
            const hit = d20 + (evt.action?.attackBonus || 0) >= (evt.ac || 12);
            if (hit) {
                const dmgStr = evt.action?.damage?.[0]?.damageRoll || '1d6';
                const dmgRoll = isCrit ? dmgStr.replace(/(\d+)d(\d+)/, (m: string, a: string, b: string) => `${Number(a) * 2}d${b}`) : dmgStr;
                const dmg = rollDice(dmgRoll).total + (evt.action?.damageBonus || 0);
                const targetToken = state.entity.activeMap?.tokens.find(t => t.id === evt.targetId);
                if (targetToken) {
                    dispatch(animationActions.setLastDamageInfo({ targetId: targetToken.id, amount: dmg, damageType: evt.action?.damage?.[0]?.damageType || 'bludgeoning', isCrit }));
                    const npc = state.entity.mapNpcInstances.find(n => n.instanceId === targetToken.npcInstanceId);
                    if (npc) {
                        const newHp = Math.max(0, (npc as any).currentHp - dmg);
                        dispatch(entitySlice.actions.setNpcHp({ instanceId: npc.instanceId, newHp }));
                    }
                }
            } else {
                dispatch(logEvent({ type: 'system', message: `Attack missed (roll ${d20}).` }));
            }
            break;
        }
        case 'APPLY_DAMAGE': {
            const targetToken = state.entity.activeMap?.tokens.find(t => t.id === evt.targetId);
            if (targetToken) {
                dispatch(animationActions.setLastDamageInfo({ targetId: targetToken.id, amount: evt.amount || 0, damageType: evt.damageType || 'untyped', isCrit: !!evt.isCrit }));
                const npc = state.entity.mapNpcInstances.find(n => n.instanceId === targetToken.npcInstanceId);
                if (npc) {
                    const newHp = Math.max(0, (npc as any).currentHp - Math.abs(evt.amount || 0));
                    dispatch(entitySlice.actions.setNpcHp({ instanceId: npc.instanceId, newHp }));
                }
            }
            break;
        }
        case 'APPLY_HEALING': {
            const targetToken = state.entity.activeMap?.tokens.find(t => t.id === evt.targetId);
            const npc = targetToken ? state.entity.mapNpcInstances.find(n => n.instanceId === targetToken.npcInstanceId) : null;
            if (npc) {
                const healed = Math.min((npc as any).maxHp, (npc as any).currentHp + Math.abs(evt.amount || 0));
                dispatch(entitySlice.actions.setNpcHp({ instanceId: npc.instanceId, newHp: healed }));
            }
            break;
        }
        case 'CRIT_ROLL': {
            dispatch(logEvent({ type: 'system', message: `Critical Hit!` }));
            break;
        }
        case 'SAVE_THROW': {
            const d20 = rollD20();
            const total = d20 + (evt.mod || 0);
            const success = total >= (evt.dc || 10);
            dispatch(logEvent({ type: 'system', message: `Save ${evt.ability || ''}: ${d20} + ${evt.mod || 0} = ${total} vs DC ${(evt.dc || 10)} -> ${success ? 'Success' : 'Fail'}` }));
            if (evt.onSuccess) await dispatch(postGameEvent(evt.onSuccess));
            if (!success && evt.onFail) await dispatch(postGameEvent(evt.onFail));
            break;
        }
        case 'APPLY_CONDITION': {
            if (evt.instanceId && evt.effect) dispatch(entitySlice.actions.addNpcCondition({ instanceId: evt.instanceId, effect: evt.effect }));
            break;
        }
        case 'REMOVE_CONDITION': {
            if (evt.instanceId && evt.effectId) dispatch(entitySlice.actions.removeNpcCondition({ instanceId: evt.instanceId, effectId: evt.effectId }));
            break;
        }
        case 'TEMP_HP_APPLY': {
            if (evt.instanceId && evt.amount) dispatch(entitySlice.actions.applyTempHp({ instanceId: evt.instanceId, amount: evt.amount }));
            break;
        }
        case 'DEATH_SAVE': {
            const d20 = rollD20();
            const isSuccess = d20 >= 10;
            dispatch(logEvent({ type: 'system', message: `Death Save: ${d20} -> ${isSuccess ? 'Success' : 'Fail'}` }));
            break;
        }
        case 'CONCENTRATION_CHECK': {
            const d20 = rollD20();
            const dc = Math.max(10, Math.floor((evt.damage || 0) / 2));
            const success = d20 + (evt.conMod || 0) >= dc;
            dispatch(logEvent({ type: 'system', message: `Concentration Check: ${d20} + ${(evt.conMod || 0)} vs DC ${dc} -> ${success ? 'Maintain' : 'Break'}` }));
            break;
        }
        case 'USE_REACTION': {
            dispatch(logEvent({ type: 'system', message: `Reaction used${evt.name ? ': ' + evt.name : ''}.` }));
            break;
        }
        case 'USE_BONUS_ACTION': {
            dispatch(logEvent({ type: 'system', message: `Bonus action used${evt.name ? ': ' + evt.name : ''}.` }));
            break;
        }
        case 'END_TURN': {
            await dispatch(advanceTurn());
            break;
        }
        // Movement/positioning
        case 'MOVE_TOKEN': {
            const tokenId = evt.sourceId;
            const end = evt.path?.[evt.path.length - 1];
            if (tokenId && end && state.entity.activeMap) {
                dispatch(entitySlice.actions.updateTokenPosition({ tokenId, x: end.x, y: end.y }));
            }
            break;
        }
        case 'TELEPORT_TOKEN': {
            if (evt.tokenId && evt.x != null && evt.y != null) dispatch(entitySlice.actions.teleportToken({ tokenId: evt.tokenId, x: evt.x, y: evt.y }));
            break;
        }
        case 'PUSH_PULL_SLIDE': {
            if (evt.tokenId && (evt.dx != null || evt.dy != null)) dispatch(entitySlice.actions.pushPullSlide({ tokenId: evt.tokenId, dx: evt.dx || 0, dy: evt.dy || 0 }));
            break;
        }
        case 'DISENGAGE': {
            if (evt.tokenId) dispatch(entitySlice.actions.setDisengaged({ tokenId: evt.tokenId, value: true }));
            break;
        }
        // Casting and abilities
        case 'CAST_SPELL_START': {
            dispatch(logEvent({ type: 'system', message: `Casting ${evt.spellName || 'Spell'} (Level ${evt.level || 1})...` }));
            break;
        }
        case 'CAST_SPELL_RESOLVE': {
            // Default: for each target, either apply damage or save
            if (evt.targets && Array.isArray(evt.targets)) {
                for (const tgt of evt.targets) {
                    if (evt.save) {
                        await dispatch(postGameEvent({ type: 'SAVE_THROW', ability: evt.save.ability, dc: evt.save.dc, mod: tgt.mod || 0, onFail: { type: 'APPLY_DAMAGE', targetId: tgt.tokenId, amount: rollDice(evt.damage || '1d6').total }, onSuccess: evt.onSaveSuccess }));
                    } else {
                        await dispatch(postGameEvent({ type: 'APPLY_DAMAGE', targetId: tgt.tokenId, amount: rollDice(evt.damage || '1d6').total }));
                    }
                }
            }
            break;
        }
        case 'CONSUME_SLOT': {
            dispatch(logEvent({ type: 'system', message: `Spell slot consumed (Level ${evt.level}).` }));
            break;
        }
        case 'CHANNEL_DIVINITY':
        case 'RAGE_START':
        case 'RAGE_END':
        case 'WILD_SHAPE': {
            dispatch(logEvent({ type: 'system', message: `${evt.type.replace('_', ' ')} activated.` }));
            break;
        }
        // Resources and items
        case 'CONSUME_ITEM': {
            dispatch(logEvent({ type: 'system', message: `Consumed ${evt.itemName || 'item'}.` }));
            break;
        }
        case 'REPLENISH_RESOURCE': {
            dispatch(logEvent({ type: 'system', message: `Resource replenished (${evt.name || ''}).` }));
            break;
        }
        case 'USE_FEATURE': {
            dispatch(logEvent({ type: 'system', message: `Feature used (${evt.name || ''}).` }));
            break;
        }
        // Initiative/flow
        case 'ROLL_INITIATIVE': {
            await dispatch(startCombat());
            break;
        }
        case 'SET_INITIATIVE_ORDER': {
            if (evt.order) dispatch(entitySlice.actions.setInitiativeOrder(evt.order));
            break;
        }
        case 'NEXT_TURN': {
            await dispatch(advanceTurn());
            break;
        }
        case 'START_COMBAT': {
            await dispatch(startCombat());
            break;
        }
        case 'END_COMBAT': {
            await dispatch(endCombat(evt.result || { ended: true, victor: 'Unknown' }));
            break;
        }
        // VTT-specific
        case 'TARGET_SELECT': {
            dispatch(entitySlice.actions.setActiveTargetToken(evt.tokenId || null));
            break;
        }
        case 'MEASURE_LINE': {
            dispatch(logEvent({ type: 'system', message: `Measure from ${JSON.stringify(evt.start)} to ${JSON.stringify(evt.end)}` }));
            break;
        }
        case 'SUMMON_CREATURE': {
            const monster = state.app.staticDataCache?.allMonsters?.find((m: any) => m.id === evt.monsterId);
            if (monster && evt.position) {
                dispatch(entitySlice.actions.addMonsterToMap({ monster, position: evt.position }));
            }
            break;
        }
        case 'DESPAWN_ENTITY': {
            if (evt.tokenId) dispatch(entitySlice.actions.despawnToken({ tokenId: evt.tokenId }));
            break;
        }
        // Worldbuilder/story
        case 'LOAD_ENCOUNTER': {
            if (evt.concept) await dispatch(loadEncounter({ concept: evt.concept, imageUrl: evt.imageUrl || null }));
            break;
        }
        case 'SET_SCENE_IMAGE': {
            dispatch(entitySlice.actions.setSceneImage(evt.imageUrl || null));
            break;
        }
        case 'NARRATIVE_LOG': {
            if (evt.message) dispatch(logEvent({ type: 'narrative', message: evt.message }));
            break;
        }
        // Effects over time
        case 'START_CONDITION_TICK': {
            dispatch(logEvent({ type: 'system', message: `Start of turn effects.` }));
            break;
        }
        case 'APPLY_DOT_TICK': {
            if (evt.instanceId && evt.amount) {
                const token = state.entity.activeMap?.tokens.find(t => t.npcInstanceId === evt.instanceId);
                if (token) await dispatch(postGameEvent({ type: 'APPLY_DAMAGE', targetId: token.id, amount: evt.amount, damageType: evt.damageType || 'dot' }));
            }
            break;
        }
        case 'APPLY_HOT_TICK': {
            if (evt.instanceId && evt.amount) {
                const token = state.entity.activeMap?.tokens.find(t => t.npcInstanceId === evt.instanceId);
                if (token) await dispatch(postGameEvent({ type: 'APPLY_HEALING', targetId: token.id, amount: evt.amount }));
            }
            break;
        }
        case 'EXPIRE_EFFECT': {
            if (evt.instanceId && evt.effectId) dispatch(entitySlice.actions.removeNpcCondition({ instanceId: evt.instanceId, effectId: evt.effectId }));
            break;
        }
        default: {
            dispatch(logEvent({ type: 'system', message: `Unhandled event: ${evt.type}` }));
        }
    }
};

export const processEventQueue = createAsyncThunk(
    'events/processEventQueue',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        if (state.events.pendingChoice) return; 

        const queue = state.events.eventQueue.slice();
        if (queue.length === 0) return;

        for (const evt of queue) {
            await handleEvent(evt, () => getState() as RootState, dispatch);
        }

        dispatch(eventSlice.actions.clearQueue());

        if (state.combatFlow.currentState.phase === 'AWAITING_PLAYER_ACTION' && state.app.mode !== 'crucible') {
            await dispatch(advanceTurn());
        }
    }
);

export const resolvePlayerChoice = createAsyncThunk(
    'events/resolvePlayerChoice',
    async (payload: { choiceId: string; selection: any }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const { pendingChoice } = state.events;

        if (!pendingChoice || pendingChoice.choiceId !== payload.choiceId) return;

        dispatch(eventSlice.actions.clearPendingChoice());
        await dispatch(processEventQueue());
    }
);


const eventSlice = createSlice({
    name: 'events',
    initialState,
    reducers: {
        enqueueEvent: (state, action: PayloadAction<GameEvent>) => {
            state.eventQueue.push(action.payload);
        },
        setPendingChoice: (state, action: PayloadAction<PlayerChoicePrompt | null>) => {
            state.pendingChoice = action.payload;
        },
        clearPendingChoice: (state) => {
            state.pendingChoice = null;
        },
        clearQueue: (state) => {
            state.eventQueue = [];
        },
    },
});

export const { clearPendingChoice } = eventSlice.actions;
export default eventSlice.reducer;