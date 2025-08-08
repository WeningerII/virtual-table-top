import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { GameEvent, PlayerChoicePrompt, SimulationState } from '../types';
import { RootState } from './store';
// TODO: integrate event processor engine
class EventProcessor { constructor(_cf: any, _static: any) {} processEvents(queue: any[], state: any) { return { finalState: state, pendingChoices: [] }; } }
class CommandFactory {}
import { animationActions } from './animationSlice';
import { entitySlice } from './entitySlice';
import { endCombat, advanceTurn } from './combatFlowSlice';

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

        const { eventQueue } = state.events;
        if (eventQueue.length === 0) return;

        const { staticDataCache } = state.app;
        const simulationState: SimulationState = { ...state.entity, ...state.events, ...state.animations, ...state.ai } as any;
        
        if (!staticDataCache) return;
        
        const commandFactory = new CommandFactory();
        const processor = new EventProcessor(commandFactory, staticDataCache);
        
        const result = processor.processEvents(eventQueue, simulationState);
        
        dispatch(eventSlice.actions.clearQueue());

        // Apply state changes from the event processing
        dispatch(entitySlice.actions.applyProcessingResult(result));
        dispatch(animationActions.setLastDamageInfo(result.finalState.lastDamageInfo || null));

        if (result.pendingChoices.length > 0) {
            dispatch(eventSlice.actions.setPendingChoice(result.pendingChoices[0]));
        } else {
            // Check for combat end conditions
            const finalNpcs = result.finalState.mapNpcInstances;
            const livingPlayerTeam = result.finalState.activeMap?.tokens.some(t => t.characterId && finalNpcs.find(npc => npc.instanceId === t.npcInstanceId)?.currentHp > 0);
            const livingNpcTeams = new Set(finalNpcs.filter(n => n.currentHp > 0).map(n => n.teamId));

            if ((livingPlayerTeam && livingNpcTeams.size === 0) || (!livingPlayerTeam && livingNpcTeams.size <= 1)) {
                const victor = livingPlayerTeam ? 'Players' : livingNpcTeams.size === 1 ? state.entity.activeMap?.tokens.find(t => t.teamId === [...livingNpcTeams][0])?.name + ' team' : 'Draw';
                dispatch(endCombat({ ended: true, victor: victor || 'Unknown' }));
            } else if (state.combatFlow.currentState.phase === 'AWAITING_PLAYER_ACTION' && state.app.mode !== 'crucible') {
                // After player actions are processed, if combat is not over, we advance the turn.
                 await dispatch(advanceTurn());
            }
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
        
        // This is where resolving a choice could create new events.
        // For now, it just continues the main loop.
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