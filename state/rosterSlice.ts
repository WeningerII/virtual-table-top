import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RosterState {
  activeCharacterId: string | null;
}

const initialState: RosterState = {
  activeCharacterId: null,
};

const rosterSlice = createSlice({
  name: 'roster',
  initialState,
  reducers: {
    setActiveCharacterId(state, action: PayloadAction<string | null>) {
      state.activeCharacterId = action.payload;
    },
  },
});

export const { setActiveCharacterId } = rosterSlice.actions;
export default rosterSlice.reducer;