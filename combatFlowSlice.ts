import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { CombatFlowState, CombatState, CombatResult } from '../types';
import { RootState } from './store';
import { rollInitiative, loadCrucibleEncounter, entitySlice } from './entitySlice';
import { triggerAiTurn } from './aiSlice';
import { processEventQueue } from './eventSlice';
import { logEvent, clearLog } from './logSlice';

const initialState: CombatFlowState = {
    currentState: { phase: 'IDLE' },
    history: [],
    transitionLog: [],
};

export const startCombat = createAsyncThunk(
    'combatFlow/startCombat',
    async (_, { dispatch, getState }) => {
        const state = getState() as RootState;
        if (state.combatFlow.currentState.phase !== 'IDLE' && state.combatFlow.currentState.phase !== 'INITIATIVE_ROLLING') return;

        dispatch(combatFlowSlice.actions.transitionTo({ phase: 'INITIATIVE_ROLLING' }));
        const rollResultAction = await dispatch(rollInitiative());
        const initiativeOrder = (rollResultAction.payload as any)?.initiativeOrder;

        if (initiativeOrder && initiativeOrder.length > 0) {
            const firstCombatant = initiativeOrder[0];
            const firstCombatantId = firstCombatant.id;
            const currentRound = 1;
            dispatch(logEvent({ type: 'system', message: 'Combat started! Initiative rolled.' }));
            
            // Transition to the first turn
            dispatch(combatFlowSlice.actions.transitionTo({
                phase: 'TURN_START',
                round: currentRound,
                activeTokenId: firstCombatantId,
            }));

            // Handle the first turn directly without calling advanceTurn
            if (firstCombatant.characterId) {
                dispatch(logEvent({ type: 'system', message: `It's ${firstCombatant.name}'s turn.` }));
                dispatch(combatFlowSlice.actions.transitionTo({
                    phase: 'AWAITING_PLAYER_ACTION',
                    round: currentRound,
                    activeTokenId: firstCombatant.id,
                }));
            } else if (firstCombatant.npcInstanceId) {
                dispatch(combatFlowSlice.actions.transitionTo({
                    phase: 'AI_PROCESSING',
                    round: currentRound,
                    activeTokenId: firstCombatant.id,
                }));
                // The triggerAiTurn thunk will handle processing and then call advanceTurn.
                await dispatch(triggerAiTurn());
            }
        } else {
            dispatch(combatFlowSlice.actions.transitionTo({ phase: 'IDLE' }));
        }
    }
);

export const advanceTurn = createAsyncThunk(
    'combatFlow/advanceTurn',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const { initiativeOrder } = state.entity.activeMap || {};
        const { currentState } = state.combatFlow;

        if (!initiativeOrder || initiativeOrder.length === 0 || (currentState.phase !== 'TURN_START' && currentState.phase !== 'AWAITING_PLAYER_ACTION' && currentState.phase !== 'AI_PROCESSING')) {
            return; 
        }

        const activeIndex = initiativeOrder.findIndex(e => e.id === currentState.activeTokenId);
        
        let newIndex = activeIndex + 1;
        let currentRound = currentState.round || 1;
        
        if (newIndex >= initiativeOrder.length) {
            newIndex = 0;
            currentRound++;
            dispatch(logEvent({ type: 'system', message: `--- Round ${currentRound} ---` }));
        }
        
        const nextCombatant = initiativeOrder[newIndex];
        
        dispatch(combatFlowSlice.actions.transitionTo({
            phase: 'TURN_START',
            round: currentRound,
            activeTokenId: nextCombatant.id
        }));

        if (nextCombatant.characterId) {
            dispatch(logEvent({ type: 'system', message: `It's ${nextCombatant.name}'s turn.` }));
            dispatch(combatFlowSlice.actions.transitionTo({
                phase: 'AWAITING_PLAYER_ACTION',
                round: currentRound,
                activeTokenId: nextCombatant.id,
            }));
        } else if (nextCombatant.npcInstanceId) {
            dispatch(combatFlowSlice.actions.transitionTo({
                phase: 'AI_PROCESSING',
                round: currentRound,
                activeTokenId: nextCombatant.id,
            }));
            // The triggerAiTurn thunk is now responsible for calling advanceTurn again when it's done.
            await dispatch(triggerAiTurn());
        }
    }
);

export const endCombat = createAsyncThunk(
    'combatFlow/endCombat',
    async (result: CombatResult, { dispatch }) => {
        dispatch(logEvent({ type: 'system', message: `Combat has ended! Victor: ${result.victor}` }));
        dispatch(combatFlowSlice.actions.transitionTo({ phase: 'COMBAT_ENDED', result }));
    }
);

// --- CRUCIBLE-SPECIFIC THUNKS ---
export const startCrucibleCombat = createAsyncThunk(
    'combatFlow/startCrucibleCombat',
    async (_, { dispatch }) => {
        dispatch(startCombat());
    }
);

export const pauseCrucible = createAsyncThunk(
    'combatFlow/pauseCrucible',
    async (_, { dispatch, getState }) => {
        const state = getState() as RootState;
        const currentCombatState = state.combatFlow.currentState;
        if (currentCombatState.phase === 'AI_PROCESSING') {
            dispatch(combatFlowSlice.actions.transitionTo({ ...currentCombatState, phase: 'AWAITING_PLAYER_ACTION' }));
        }
    }
);

export const resumeCrucible = createAsyncThunk(
    'combatFlow/resumeCrucible',
    async (_, { dispatch }) => {
        // Resume by triggering the next turn logic.
        await dispatch(advanceTurn());
    }
);

export const resetCrucible = createAsyncThunk(
    'combatFlow/resetCrucible',
    async (_, { dispatch }) => {
        dispatch(entitySlice.actions.resetSimulation());
        dispatch(clearLog());
        dispatch(combatFlowSlice.actions.transitionTo({ phase: 'IDLE' }));
    }
);


const combatFlowSlice = createSlice({
    name: 'combatFlow',
    initialState,
    reducers: {
        transitionTo: (state, action: PayloadAction<CombatState>) => {
            state.transitionLog.push({
                from: state.currentState.phase,
                to: action.payload.phase,
                timestamp: Date.now()
            });
            state.history.push(state.currentState);
            if(state.history.length > 50) state.history.shift();

            state.currentState = { ...state.currentState, ...action.payload };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loadCrucibleEncounter.fulfilled, (state) => {
            state.currentState = { phase: 'INITIATIVE_ROLLING' };
        });
        builder.addCase(processEventQueue.fulfilled, (state, action) => {
            const rootState = action.meta.arg as unknown as RootState;
            // After player actions are processed, if combat is not over, we advance the turn.
            if(state.currentState.phase === 'AWAITING_PLAYER_ACTION' && rootState.events.pendingChoice === null && rootState.app.mode !== 'crucible') {
                // The advanceTurn thunk will now handle this transition logic.
            }
        });
    }
});

// entitySlice imported above with rollInitiative to avoid circular import end-of-file hack

export const { transitionTo } = combatFlowSlice.actions;
export default combatFlowSlice.reducer;