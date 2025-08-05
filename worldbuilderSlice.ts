
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WorldbuilderState, EncounterConcept } from '../types';

const initialState: WorldbuilderState = {
    context: '',
    theme: 'Forest',
    partyLevel: 5,
    partySize: 4,
    difficulty: 'Medium',
    generatedConcept: null,
    generationStatus: 'idle',
    generationStage: null,
    generationError: null,
};

const worldbuilderSlice = createSlice({
    name: 'worldbuilder',
    initialState,
    reducers: {
        setContext: (state, action: PayloadAction<string>) => {
            state.context = action.payload;
        },
        setTheme: (state, action: PayloadAction<string>) => {
            state.theme = action.payload;
        },
        setPartyLevel: (state, action: PayloadAction<number>) => {
            state.partyLevel = action.payload;
        },
        setPartySize: (state, action: PayloadAction<number>) => {
            state.partySize = action.payload;
        },
        setDifficulty: (state, action: PayloadAction<string>) => {
            state.difficulty = action.payload;
        },
        setGeneratedConcept: (state, action: PayloadAction<EncounterConcept | null>) => {
            state.generatedConcept = action.payload;
        },
        generationStart: (state) => {
            state.generationStatus = 'generating';
            state.generationStage = 'Initializing...';
            state.generationError = null;
            state.generatedConcept = null;
        },
        generationStageUpdate: (state, action: PayloadAction<{ stage: string; concept: EncounterConcept | null }>) => {
            state.generationStage = action.payload.stage;
            if(action.payload.concept) {
                state.generatedConcept = action.payload.concept;
            }
        },
        generationSuccess: (state, action: PayloadAction<EncounterConcept>) => {
            state.generationStatus = 'success';
            state.generatedConcept = action.payload;
            state.generationStage = 'Complete!';
        },
        generationPartialSuccess: (state, action: PayloadAction<{ concept: EncounterConcept; error: string }>) => {
            state.generationStatus = 'partial';
            state.generatedConcept = action.payload.concept;
            state.generationError = action.payload.error;
            state.generationStage = 'Partial result available.';
        },
        generationFailed: (state, action: PayloadAction<string>) => {
            state.generationStatus = 'error';
            state.generationError = action.payload;
            state.generationStage = 'Failed.';
        },
        clearWorldbuilderState: () => initialState,
    },
});

export const {
    setContext,
    setTheme,
    setPartyLevel,
    setPartySize,
    setDifficulty,
    setGeneratedConcept,
    generationStart,
    generationStageUpdate,
    generationSuccess,
    generationPartialSuccess,
    generationFailed,
    clearWorldbuilderState
} = worldbuilderSlice.actions;

export default worldbuilderSlice.reducer;