import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BuilderState } from './types';

const initialState: BuilderState = {
    currentStep: 0,
};

const builderSlice = createSlice({
    name: 'builder',
    initialState,
    reducers: {
        setCurrentStep: (state, action: PayloadAction<number>) => {
            state.currentStep = action.payload;
        },
    },
});

export const { setCurrentStep } = builderSlice.actions;

export default builderSlice.reducer;
