import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PlayState {
  mapImageUrl: string | null;
}

const initialState: PlayState = {
  mapImageUrl: null,
};

const playStateSlice = createSlice({
  name: 'playState',
  initialState,
  reducers: {
    setMapImageUrl(state, action: PayloadAction<string | null>) {
      state.mapImageUrl = action.payload;
    },
  },
});

export const { setMapImageUrl } = playStateSlice.actions;
export default playStateSlice.reducer;