
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { GenesisState, PartialCharacter, GenerationStep, Character, CharacterState, StaticGameDataCache } from './types';
import { RootState } from './store';
import { GenerationOrchestrator } from './generationOrchestrator.service';
import { selectCharacter } from './';
import { toCharacterState, createNewCharacterObject } from './characterUtils';

const initialGenesisState: GenesisState = {
    isLoading: false,
    progressMessage: '',
    character: null,
    currentStep: null,
    error: null,
    prompt: null,
};

export const startOrResumeGeneration = createAsyncThunk(
    'genesis/startOrResumeGeneration',
    async (prompt: string, { getState, dispatch }) => {
        const state = getState() as RootState;
        const staticData = state.app.staticDataCache;
        if (!staticData) {
            dispatch(genesisSlice.actions.generationFailure({ message: 'Static game data is not loaded.', character: null }));
            return;
        }

        dispatch(genesisSlice.actions.generationStart(prompt));

        const orchestrator = new GenerationOrchestrator(staticData);
        let character: PartialCharacter = state.genesis.character || createNewCharacterObject();
        let currentStepIndex = 0;
        const steps: GenerationStep[] = ['Fundamentals', 'Abilities & Feats', 'Equipment', 'Details & Spells'];
        
        if (state.genesis.currentStep) {
            currentStepIndex = steps.indexOf(state.genesis.currentStep);
        }

        try {
            for (let i = currentStepIndex; i < steps.length; i++) {
                const step = steps[i];
                const onProgress = (progress: { message: string }) => {
                    dispatch(genesisSlice.actions.generationProgress({ step, message: progress.message, character: character as PartialCharacter }));
                };
                
                const result = await orchestrator.runStep(step, prompt, character, onProgress);
                
                if (result) {
                    character = result;
                    dispatch(genesisSlice.actions.generationProgress({ step, message: `${step} completed successfully.`, character: character as PartialCharacter }));
                } else {
                    throw new Error(`AI failed to generate a valid response for the ${step} step after multiple attempts.`);
                }
            }
            const finalCharacter = selectCharacter(toCharacterState(character), staticData);
            dispatch(genesisSlice.actions.generationSuccess(finalCharacter));
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred during generation.";
            dispatch(genesisSlice.actions.generationFailure({ message, character: character as PartialCharacter }));
        }
    }
);


const genesisSlice = createSlice({
    name: 'genesis',
    initialState: initialGenesisState,
    reducers: {
        generationStart(state, action: PayloadAction<string>) {
            state.isLoading = true;
            state.prompt = action.payload;
            state.progressMessage = "Initializing Genesis Forge...";
            state.character = state.character || null;
            state.error = null;
        },
        generationProgress(state, action: PayloadAction<{ step: GenerationStep; message: string; character: PartialCharacter }>) {
            state.currentStep = action.payload.step;
            state.progressMessage = action.payload.message;
            state.character = action.payload.character;
            state.error = null;
        },
        generationSuccess(state, action: PayloadAction<Character>) {
            state.isLoading = false;
            state.character = action.payload;
            state.error = null;
            state.progressMessage = "Character Forged Successfully!";
        },
        generationFailure(state, action: PayloadAction<{ message: string; character: PartialCharacter | null }>) {
            state.isLoading = false;
            state.error = action.payload.message;
            state.character = action.payload.character;
        },
        clearGenesisState: () => initialGenesisState,
    },
});

export const { clearGenesisState } = genesisSlice.actions;

export default genesisSlice.reducer;
