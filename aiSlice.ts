import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ActionItem, AiTurnIntent, Monster, GameEvent } from '../types';
import { RootState } from './store';
import { logEvent } from './logSlice';
import { postGameEvent } from './eventSlice';
import { animationActions } from './animationSlice';
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
        const { activeTokenId } = state.combatFlow.currentState;

        try {
            if (!activeTokenId || !activeMap) {
                await dispatch(advanceTurn());
                return;
            }

            const self = activeMap.tokens.find(t => t.id === activeTokenId);
            if (!self || !self.npcInstanceId) {
                await dispatch(advanceTurn());
                return;
            }

            // Identify enemies by different teamId
            const enemies = activeMap.tokens.filter(t => t.teamId && t.teamId !== self.teamId);
            if (enemies.length === 0) {
                await dispatch(advanceTurn());
                return;
            }

            // Manhattan distance in grid coordinates
            const dist = (a: any, b: any) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
            const nearest = enemies.reduce((best, t) => (dist(self, t) < dist(self, best) ? t : best), enemies[0]);

            const distance = dist(self, nearest);
            if (distance > 1) {
                // Step one cell toward target
                const stepX = self.x + Math.sign(nearest.x - self.x);
                const stepY = self.y + Math.sign(nearest.y - self.y);
                await dispatch(postGameEvent({ type: 'MOVE_TOKEN', sourceId: self.id, path: [{ x: stepX, y: stepY }] } as any));
            } else {
                // Attack if adjacent
                const action = { attackBonus: 3, damage: [{ damageRoll: '1d6', damageType: 'slashing' }], damageBonus: 0 } as any;
                await dispatch(postGameEvent({ type: 'DECLARE_ATTACK', sourceId: self.id, targetId: nearest.id, action } as any));
            }
        } finally {
            dispatch(aiSlice.actions.setIsAiThinking(false));
            await dispatch(advanceTurn());
        }
    }
);

export const attackAfterAiMove = createAsyncThunk(
    'ai/attackAfterAiMove',
    async (_, { getState, dispatch }) => {
        // No-op for minimal AI; movement already followed by advanceTurn
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