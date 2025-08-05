import { createSlice, PayloadAction, createEntityAdapter, createAsyncThunk } from '@reduxjs/toolkit';
import { Character, CharacterState } from '../types';
import { RootState } from './store';
import { setSheet as setCalculatedSheet } from './characterSlice';
import { fromCharacterState, toCharacterState, createNewCharacterObject } from './characterUtils';
import { testDummies } from './testDummies';
import { setMode } from './appSlice';
import { metaActions } from '../engine/slices/metaSlice';
import { abilitiesActions } from '../engine/slices/abilitiesSlice';
import { proficienciesActions } from '../engine/slices/proficienciesSlice';
import { inventoryActions } from '../engine/slices/inventorySlice';
import { spellsActions } from '../engine/slices/spellsSlice';
import { vitalsActions } from '../engine/slices/vitalsSlice';
import { playStateActions } from '../engine/slices/playStateSlice';

const charactersAdapter = createEntityAdapter<Character>();

const initialState = charactersAdapter.addMany(
    charactersAdapter.getInitialState(),
    testDummies
);

const augmentedInitialState = {
    ...initialState,
    activeCharacterId: null as string | null,
};

// --- THUNKS ---
export const saveActiveCharacter = createAsyncThunk(
    'roster/saveActiveCharacter',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const activeCharacterState = state.characterData;
        const activeCharacterId = state.roster.activeCharacterId;

        if (activeCharacterState && activeCharacterId) {
            const rosterChar = state.roster.entities[activeCharacterId];
            if (rosterChar) {
                const updatedCharacter = fromCharacterState(activeCharacterState as CharacterState, rosterChar);
                dispatch(rosterSlice.actions.updateCharacter(updatedCharacter));
            }
        }
    }
);

const setCharacterData = createAsyncThunk(
    'roster/setCharacterData',
    async (character: Character, { dispatch }) => {
        const charState = toCharacterState(character);
        dispatch(metaActions.setMetaState(charState.meta));
        dispatch(abilitiesActions.setAbilitiesState(charState.abilities));
        dispatch(proficienciesActions.setProficienciesState(charState.proficiencies));
        dispatch(inventoryActions.setInventoryState(charState.inventory));
        dispatch(spellsActions.setSpellsState(charState.spells));
        dispatch(vitalsActions.setVitalsState(charState.vitals));
        dispatch(playStateActions.setPlayState(charState.playState));
    }
);

export const createCharacter = createAsyncThunk(
    'roster/createCharacter',
    async (_, { dispatch }) => {
        await dispatch(saveActiveCharacter());
        const newChar = createNewCharacterObject();
        dispatch(rosterSlice.actions.addCharacter(newChar));
        await dispatch(setCharacterData(newChar));
        dispatch(rosterSlice.actions.setActiveCharacterId(newChar.id));
        dispatch(setMode('builder'));
    }
);

export const loadCharacter = createAsyncThunk(
    'roster/loadCharacter',
    async (id: string, { dispatch, getState }) => {
        await dispatch(saveActiveCharacter());
        const state = getState() as RootState;
        const characterToLoad = state.roster.entities[id];
        if (characterToLoad) {
            await dispatch(setCharacterData(characterToLoad));
            dispatch(rosterSlice.actions.setActiveCharacterId(id));
            dispatch(setMode('builder'));
        }
    }
);

const rosterSlice = createSlice({
    name: 'roster',
    initialState: augmentedInitialState,
    reducers: {
        addCharacter: charactersAdapter.addOne,
        updateCharacter: (state, action: PayloadAction<Character>) => {
            charactersAdapter.updateOne(state, { id: action.payload.id, changes: action.payload });
        },
        deleteCharacter: (state, action: PayloadAction<string>) => {
            charactersAdapter.removeOne(state, action.payload);
            if (state.activeCharacterId === action.payload) {
                state.activeCharacterId = null;
            }
        },
        setActiveCharacterId(state, action: PayloadAction<string | null>) {
            state.activeCharacterId = action.payload;
        },
    },
});

export const { addCharacter, deleteCharacter, setActiveCharacterId } = rosterSlice.actions;

const adapterSelectors = charactersAdapter.getSelectors();
export const rosterSelectors = {
    selectAll: (state: RootState) => adapterSelectors.selectAll(state.roster),
    selectById: (state: RootState, id: string) => adapterSelectors.selectById(state.roster, id),
    selectIds: (state: RootState) => adapterSelectors.selectIds(state.roster),
    selectEntities: (state: RootState) => adapterSelectors.selectEntities(state.roster),
    selectTotal: (state: RootState) => adapterSelectors.selectTotal(state.roster),
};

export default rosterSlice.reducer;
