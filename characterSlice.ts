import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Character } from '../types';

interface CalculatedCharacterState {
    sheet: Character | null;
}

const initialState: CalculatedCharacterState = {
    sheet: null,
};

export const calculatedCharacterSlice = createSlice({
    name: 'calculatedCharacter',
    initialState,
    reducers: {
        setSheet: (state, action: PayloadAction<Character | null>) => {
            state.sheet = action.payload;
        },
    },
});

export const { setSheet } = calculatedCharacterSlice.actions;
