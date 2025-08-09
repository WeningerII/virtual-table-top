import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { GameEvent, PlayerChoicePrompt, SimulationState } from '../types';
import { RootState } from './store';
// TODO: integrate event processor engine
class EventProcessor { constructor(_cf: any, _static: any) {} processEvents(queue: any[], state: any) { return { finalState: state, pendingChoices: [] }; } }
class CommandFactory {}
import { animationActions } from './animationSlice';
import { entitySlice } from './entitySlice';
import { endCombat, advanceTurn } from './combatFlowSlice';
import { rollDice, rollD20 } from './dice';

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

export const processEventQueue = createAsyncThunk(
    'events/processEventQueue',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        if (state.events.pendingChoice) return; 

        const queue = state.events.eventQueue.slice();
        if (queue.length === 0) return;

        // Minimal inline processing for MOVE_TOKEN and DECLARE_ATTACK
        let newState = state;
        for (const evt of queue) {
            if (evt.type === 'MOVE_TOKEN') {
                const tokenId = evt.sourceId;
                const end = evt.path?.[evt.path.length - 1];
                if (tokenId && end && state.entity.activeMap) {
                    dispatch(entitySlice.actions.updateTokenPosition({ tokenId, x: end.x, y: end.y }));
                }
            }
            if (evt.type === 'DECLARE_ATTACK') {
                // Roll to hit: d20 vs AC 12 baseline
                const d20 = rollD20();
                const hit = d20 + (evt.action?.attackBonus || 0) >= 12;
                if (hit) {
                    const dmgStr = evt.action?.damage?.[0]?.damageRoll || '1d6';
                    const dmg = rollDice(dmgStr).total;
                    // Post-apply damage: set last damage for animation and reduce target HP if mapped to NPC
                    const targetToken = state.entity.activeMap?.tokens.find(t => t.id === evt.targetId);
                    if (targetToken) {
                        dispatch(animationActions.setLastDamageInfo({ targetId: targetToken.id, amount: dmg, damageType: evt.action?.damage?.[0]?.damageType || 'bludgeoning', isCrit: d20 === 20 }));
                        // If it's an NPC token, adjust NPC hp in entity slice
                        const npc = state.entity.mapNpcInstances.find(n => n.instanceId === targetToken.npcInstanceId);
                        if (npc) {
                            const newHp = Math.max(0, npc.currentHp - dmg);
                            dispatch(entitySlice.actions.setNpcHp({ instanceId: npc.instanceId, newHp }));
                        }
                    }
                }
            }
        }

        // Clear queue after processing
        dispatch(eventSlice.actions.clearQueue());

        // No pending choices in this minimal pass; advance turn if in player phase
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