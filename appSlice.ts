import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { AppState, AppMode, Character, StaticGameDataCache, ObjectBlueprint, CharacterState, GenesisState, PartialCharacter, GenerationStep } from './types';
import { dataService } from './dataService';
import { RootState } from './store';
import { entitySlice } from './entitySlice';
import { saveActiveCharacter, setActiveCharacterId as setActiveCharIdInRoster } from './rosterSlice';

const initialState: Omit<AppState, 'roster' | 'activeCharacterId' | 'genesisState'> = {
    mode: 'home',
    isDmMode: false,
    staticDataCache: null,
    monsterToSummon: null,
    dataStatus: 'idle',
};

// --- THUNKS ---

export const initializeApp = createAsyncThunk('app/initializeApp', async () => {
    return dataService.fetchAllStaticData();
});

export const changeAppMode = createAsyncThunk(
    'app/changeAppMode',
    async (newMode: AppMode, { dispatch, getState }) => {
        await dispatch(saveActiveCharacter());

        if (newMode === 'play') {
            const state = getState() as RootState;
            if (!state.entity.activeMap) {
                const activeCharacter = state.roster.entities[state.roster.activeCharacterId!];
                if (activeCharacter) {
                    dispatch(entitySlice.actions.createDefaultSession(activeCharacter));
                }
            }
        }

        dispatch(appSlice.actions.setMode(newMode));
         if (newMode === 'home' || newMode === 'bestiary' || newMode === 'genesis' || newMode === 'worldbuilder' || newMode === 'crucible') {
            dispatch(setActiveCharIdInRoster(null));
        }
    }
);


const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setMode(state, action: PayloadAction<AppMode>) {
            state.mode = action.payload;
        },
        toggleDmMode(state) {
            state.isDmMode = !state.isDmMode;
        },
        addDynamicBlueprints(state, action: PayloadAction<ObjectBlueprint[]>) {
            if (state.staticDataCache?.objectBlueprints) {
                state.staticDataCache.objectBlueprints.push(...action.payload);
            }
        },
        queueMonsterSummon(state, action: PayloadAction<string>) {
            state.monsterToSummon = action.payload;
        },
        clearMonsterSummon(state) {
            state.monsterToSummon = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(initializeApp.pending, (state) => { state.dataStatus = 'loading'; })
            .addCase(initializeApp.fulfilled, (state, action) => {
                state.staticDataCache = action.payload as StaticGameDataCache;
                state.dataStatus = 'succeeded';
            })
            .addCase(initializeApp.rejected, (state) => { state.dataStatus = 'failed'; });
    }
});

export const { 
    toggleDmMode, addDynamicBlueprints,
    queueMonsterSummon, clearMonsterSummon, setMode
} = appSlice.actions;

export default appSlice.reducer;