import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ActionItem, AiTurnIntent, Monster, GameEvent } from '../types';
import { RootState } from './store';
import { aiDecisionService } from '../services/ai/aiDecision.service';
import { generateNpcTurn } from '../services/ai/dm.service';
import { logEvent } from './logSlice';
import { postGameEvent } from './eventSlice';
import { animationActions } from './animationSlice';
import { buildSpatialIndex } from '../utils/map';
import { advanceTurn } from './combatFlowSlice';

export interface AIState {
    isAiThinking: boolean;
    pendingAiAction: AiTurnIntent | null;
}

const initialState: AIState = {
    isAiThinking: false,
    pendingAiAction: null,
};

export const triggerAiTurn = createAsyncThunk(
    'ai/triggerAiTurn',
    async (_, { getState, dispatch }) => {
        dispatch(aiSlice.actions.setIsAiThinking(true));
        const state = getState() as RootState;
        const { activeMap, mapNpcInstances } = state.entity;
        const { staticDataCache } = state.app;
        const { activeTokenId } = state.combatFlow.currentState;

        if (!activeTokenId || !activeMap || !staticDataCache) {
            dispatch(aiSlice.actions.setIsAiThinking(false));
            console.error("AI Turn Trigger failed: Missing critical state.");
            await dispatch(advanceTurn()); // Failsafe
            return;
        }
        
        const activeToken = activeMap.tokens.find(t => t.id === activeTokenId);
        const activeNpc = mapNpcInstances.find(i => i.instanceId === activeToken?.npcInstanceId);
        
        if (!activeToken || !activeNpc) {
            dispatch(aiSlice.actions.setIsAiThinking(false));
            console.error("AI Turn Trigger failed: Active combatant not found.");
            await dispatch(advanceTurn()); // Failsafe
            return;
        }

        const monsterData = staticDataCache.allMonsters.find(m => m.id === activeNpc.monsterId);
        if (!monsterData) {
            dispatch(aiSlice.actions.setIsAiThinking(false));
            console.error(`AI Turn Trigger failed: Monster data not found for ${activeNpc.monsterId}`);
            await dispatch(advanceTurn()); // Failsafe
            return;
        }

        try {
            const monsterCache: Map<string, Monster> = new Map(staticDataCache.allMonsters.map(m => [m.id, m]));
            const liveSpatialIndex = buildSpatialIndex(activeMap);

            const battlefieldState = generateNpcTurn.buildBattlefieldState(
                activeToken, activeNpc, monsterData, activeMap.tokens, mapNpcInstances, monsterCache, activeMap.terrain, activeMap.objects, staticDataCache, activeMap, liveSpatialIndex
            );

            const intent = await aiDecisionService.getNpcTurn(battlefieldState, monsterData);
            
            if (intent) {
                dispatch(logEvent({ type: 'narrative', message: `Rationale: ${intent.rationale}` }));
                if (intent.dialogue) {
                     dispatch(logEvent({ type: 'dialogue', message: `${activeToken.name}: "${intent.dialogue}"` }));
                }

                const eventsToPost: GameEvent[] = [];
                if(intent.destination) {
                    eventsToPost.push({ type: 'MOVE_TOKEN', sourceId: activeToken.id, path: [intent.destination] });
                }
                if(intent.actionId && intent.targetId) {
                    const action = monsterData.actions?.find(a => a.name === intent.actionId);
                    if (action) {
                         eventsToPost.push({ type: 'DECLARE_ATTACK', sourceId: activeToken.id, targetId: intent.targetId, action });
                    }
                }
                
                if (eventsToPost.length > 0) {
                    for (const event of eventsToPost) {
                       await dispatch(postGameEvent(event));
                    }
                } else {
                    // If AI decides to do nothing, just log it.
                    await dispatch(postGameEvent({ type: 'LOG_EVENT', sourceId: activeToken.id, message: `${activeToken.name} takes no action.`}));
                }
            } else {
                // Failsafe: If AI returns no intent, dispatch a Dodge action.
                dispatch(logEvent({ type: 'system', message: `AI for ${activeToken.name} could not decide on an action and will Dodge.`}));
                await dispatch(postGameEvent({ type: 'DODGE_ACTION', sourceId: activeToken.id }));
            }
        } catch (error) {
            console.error(`Error during AI turn for ${activeToken.name}:`, error);
            dispatch(logEvent({ type: 'system', message: `AI for ${activeToken.name} encountered an error and will Dodge.`}));
            await dispatch(postGameEvent({ type: 'DODGE_ACTION', sourceId: activeToken.id }));
        } finally {
            dispatch(aiSlice.actions.setIsAiThinking(false));
            await dispatch(advanceTurn());
        }
    }
);

export const attackAfterAiMove = createAsyncThunk(
    'ai/attackAfterAiMove',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const { pendingAiAction } = state.ai;
        const { activeMap } = state.entity;
        const { activeTokenId } = state.combatFlow.currentState;

        if (!pendingAiAction || !activeTokenId || !activeMap) return;

        const activeEntry = activeMap.initiativeOrder.find(e => e.id === activeTokenId);
        const action = pendingAiAction.actionId ? state.app.staticDataCache?.allMonsters.find(m => m.id === (state.entity.mapNpcInstances.find(i => i.instanceId === activeEntry?.npcInstanceId)?.monsterId))?.actions?.find(a => a.name === pendingAiAction.actionId) : null;
        
        if (action && pendingAiAction.targetId) {
            await dispatch(postGameEvent({ type: 'DECLARE_ATTACK', sourceId: activeEntry!.id, targetId: pendingAiAction.targetId, action }));
        }

        dispatch(aiSlice.actions.clearPendingAiAction());
    }
);


const aiSlice = createSlice({
    name: 'ai',
    initialState,
    reducers: {
        setIsAiThinking: (state, action: PayloadAction<boolean>) => {
            state.isAiThinking = action.payload;
        },
        setPendingAiAction: (state, action: PayloadAction<AiTurnIntent | null>) => {
            state.pendingAiAction = action.payload;
        },
        clearPendingAiAction: (state) => {
            state.pendingAiAction = null;
        },
    },
});

export const { setIsAiThinking, setPendingAiAction, clearPendingAiAction } = aiSlice.actions;
export default aiSlice.reducer;