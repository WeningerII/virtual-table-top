import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SpellsState } from './types';

const initialState: SpellsState = {
    preparedSpells: [],
    knownSpells: [],
    spellbook: [],
    mysticArcanum: {},
    knownInfusions: [],
};

const spellsSlice = createSlice({
    name: 'spells',
    initialState,
    reducers: {
        setSpellsState: (state, action: PayloadAction<SpellsState>) => {
            return action.payload;
        },
        updateKnownSpells: (state, action: PayloadAction<string[]>) => {
            state.knownSpells = action.payload;
        },
        setMysticArcanum: (state, action: PayloadAction<{ level: number; spellId: string | null }>) => {
            if (!state.mysticArcanum) state.mysticArcanum = {};
            state.mysticArcanum[action.payload.level] = action.payload.spellId;
        },
        scribeSpell: (state, action: PayloadAction<{ spellId: string }>) => {
            if (!state.spellbook) state.spellbook = [];
            state.spellbook.push(action.payload.spellId);
        },
        prepareSpell: (state, action: PayloadAction<string>) => {
            state.preparedSpells.push(action.payload);
        },
        unprepareSpell: (state, action: PayloadAction<string>) => {
            state.preparedSpells = state.preparedSpells.filter(id => id !== action.payload);
        },
        updateKnownInfusions: (state, action: PayloadAction<string[]>) => {
            state.knownInfusions = action.payload;
        },
    },
});

export const spellsActions = spellsSlice.actions;
export default spellsSlice;
