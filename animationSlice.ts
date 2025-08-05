import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NpcAnimationState, VFXRequest } from '../types';

export interface AnimationState {
    animationState: NpcAnimationState | null;
    lastDamageInfo: { targetId: string; amount: number; damageType: string, isCrit: boolean } | null;
    lastVFXRequest: VFXRequest | null;
}

const initialState: AnimationState = {
    animationState: null,
    lastDamageInfo: null,
    lastVFXRequest: null,
};

const animationSlice = createSlice({
    name: 'animations',
    initialState,
    reducers: {
        setAnimationState: (state, action: PayloadAction<NpcAnimationState | null>) => {
            state.animationState = action.payload;
        },
        setLastDamageInfo: (state, action: PayloadAction<AnimationState['lastDamageInfo']>) => {
            state.lastDamageInfo = action.payload;
        },
        setLastVFXRequest: (state, action: PayloadAction<VFXRequest | null>) => {
            state.lastVFXRequest = action.payload;
        },
    },
});

export const animationActions = animationSlice.actions;
export default animationSlice.reducer;