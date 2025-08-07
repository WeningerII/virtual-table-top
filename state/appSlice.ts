import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

export type AppMode = 'home' | 'builder' | 'play' | 'bestiary' | 'genesis' | 'worldbuilder' | 'crucible';

type DataStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface AppState {
  mode: AppMode;
  isDmMode: boolean;
  dataStatus: DataStatus;
}

const initialState: AppState = {
  mode: 'home',
  isDmMode: false,
  dataStatus: 'idle',
};

export const initializeApp = createAsyncThunk('app/initializeApp', async () => {
  // Placeholder for data bootstrap. In future, call dataService.fetchAllStaticData().
  return true;
});

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
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeApp.pending, (state) => {
        state.dataStatus = 'loading';
      })
      .addCase(initializeApp.fulfilled, (state) => {
        state.dataStatus = 'succeeded';
      })
      .addCase(initializeApp.rejected, (state) => {
        state.dataStatus = 'failed';
      });
  },
});

export const { setMode, toggleDmMode } = appSlice.actions;
export const changeAppMode = (mode: AppMode) => setMode(mode);
export default appSlice.reducer;