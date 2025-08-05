import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProficienciesState, SelectedFeat, SelectedProficiency, SelectedFightingStyle } from '../../types';

const initialState: ProficienciesState = {
    feats: [],
    selectedProficiencies: [],
    selectedFightingStyles: [],
    selectedInvocations: [],
    selectedMetamagic: [],
    fighter: { selectedManeuvers: [], selectedRunes: [] },
    monk: {},
    barbarian: { totemChoices: [] },
};

const proficienciesSlice = createSlice({
    name: 'proficiencies',
    initialState,
    reducers: {
        setProficienciesState: (state, action: PayloadAction<ProficienciesState>) => {
            return action.payload;
        },
        updateFeats: (state, action: PayloadAction<SelectedFeat[]>) => {
            state.feats = action.payload;
        },
        setProficiencyChoices: (state, action: PayloadAction<SelectedProficiency>) => {
            state.selectedProficiencies = state.selectedProficiencies.filter(p => p.source !== action.payload.source && p.id !== action.payload.id);
            state.selectedProficiencies.push(action.payload);
        },
        setFightingStyleChoice: (state, action: PayloadAction<SelectedFightingStyle>) => {
            state.selectedFightingStyles = state.selectedFightingStyles.filter(f => f.source !== action.payload.source);
            state.selectedFightingStyles.push(action.payload);
        },
        setInvocations: (state, action: PayloadAction<string[]>) => {
            state.selectedInvocations = action.payload;
        },
        setMetamagic: (state, action: PayloadAction<string[]>) => {
            state.selectedMetamagic = action.payload;
        },
        setFighterManeuvers: (state, action: PayloadAction<string[]>) => {
            if (!state.fighter) state.fighter = {};
            state.fighter.selectedManeuvers = action.payload;
        },
        setFighterRunes: (state, action: PayloadAction<string[]>) => {
            if (!state.fighter) state.fighter = {};
            state.fighter.selectedRunes = action.payload;
        },
        setBarbarianTotemChoice: (state, action: PayloadAction<{ level: number; totem: string }>) => {
            if (!state.barbarian) state.barbarian = {};
            if (!state.barbarian.totemChoices) state.barbarian.totemChoices = [];
            state.barbarian.totemChoices = state.barbarian.totemChoices.filter(t => t.level !== action.payload.level);
            state.barbarian.totemChoices.push(action.payload);
        },
    },
});

export const proficienciesActions = proficienciesSlice.actions;
export default proficienciesSlice;
