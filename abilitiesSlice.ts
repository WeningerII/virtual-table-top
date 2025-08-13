import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AbilitiesState, Ability, AbilityScores } from './types';

const ABILITIES_IDS: Ability[] = [Ability.Strength, Ability.Dexterity, Ability.Constitution, Ability.Intelligence, Ability.Wisdom, Ability.Charisma];

const initialState: AbilitiesState = {
    abilityScores: ABILITIES_IDS.reduce((acc, ability) => {
        acc[ability] = { base: 10, bonus: 0 };
        return acc;
    }, {} as AbilityScores),
};

const abilitiesSlice = createSlice({
  name: 'abilities',
  initialState,
  reducers: {
    setAbilitiesState: (state, action: PayloadAction<AbilitiesState>) => {
        return action.payload;
    },
    updateAbilityScores: (state, action: PayloadAction<AbilityScores>) => {
      state.abilityScores = action.payload;
    },
  },
});

export const abilitiesActions = abilitiesSlice.actions;
export default abilitiesSlice;