import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface EconomyStateByToken {
  [tokenId: string]: { action: boolean; bonus: boolean; reaction: boolean };
}

const initialState: EconomyStateByToken = {};

const ensureToken = (state: EconomyStateByToken, tokenId: string) => {
  if (!state[tokenId]) state[tokenId] = { action: true, bonus: true, reaction: true };
};

const actionEconomySlice = createSlice({
  name: 'actionEconomy',
  initialState,
  reducers: {
    resetForToken(state, action: PayloadAction<string>) {
      state[action.payload] = { action: true, bonus: true, reaction: true };
    },
    spendAction(state, action: PayloadAction<string>) {
      ensureToken(state, action.payload);
      state[action.payload].action = false;
    },
    spendBonus(state, action: PayloadAction<string>) {
      ensureToken(state, action.payload);
      state[action.payload].bonus = false;
    },
    spendReaction(state, action: PayloadAction<string>) {
      ensureToken(state, action.payload);
      state[action.payload].reaction = false;
    },
  },
});

export const { resetForToken, spendAction, spendBonus, spendReaction } = actionEconomySlice.actions;
export default actionEconomySlice.reducer;