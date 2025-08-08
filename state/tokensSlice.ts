import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ToolMode = 'select' | 'place' | 'measure' | 'fog';

export interface Token {
  id: string;
  name: string;
  x: number; // 0..1 normalized across width
  y: number; // 0..1 normalized across height
  size: number; // in grid cells
  color: string;
  imageUrl?: string;
}

export interface Point {
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
}

interface TokensState {
  tokens: Token[];
  selectedTokenId: string | null;
  toolMode: ToolMode;
  measure: { start: Point; end: Point } | null;
  fogEnabled: boolean;
  reveals: { x: number; y: number; radius: number }[]; // normalized center + radius
}

const initialState: TokensState = {
  tokens: [],
  selectedTokenId: null,
  toolMode: 'select',
  measure: null,
  fogEnabled: false,
  reveals: [],
};

const tokensSlice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    setToolMode(state, action: PayloadAction<ToolMode>) {
      state.toolMode = action.payload;
      if (action.payload !== 'measure') state.measure = null;
    },
    addToken(state, action: PayloadAction<Partial<Token> & { x: number; y: number }>) {
      const token: Token = {
        id: action.payload.id || crypto.randomUUID(),
        name: action.payload.name || 'NPC',
        x: Math.max(0, Math.min(1, action.payload.x)),
        y: Math.max(0, Math.min(1, action.payload.y)),
        size: action.payload.size ?? 1,
        color: action.payload.color || '#2563eb',
        imageUrl: action.payload.imageUrl,
      };
      state.tokens.push(token);
      state.selectedTokenId = token.id;
    },
    moveToken(state, action: PayloadAction<{ id: string; x: number; y: number }>) {
      const t = state.tokens.find((tk) => tk.id === action.payload.id);
      if (t) {
        t.x = Math.max(0, Math.min(1, action.payload.x));
        t.y = Math.max(0, Math.min(1, action.payload.y));
      }
    },
    removeToken(state, action: PayloadAction<string>) {
      state.tokens = state.tokens.filter((t) => t.id !== action.payload);
      if (state.selectedTokenId === action.payload) state.selectedTokenId = null;
    },
    setSelectedToken(state, action: PayloadAction<string | null>) {
      state.selectedTokenId = action.payload;
    },
    startMeasure(state, action: PayloadAction<Point>) {
      state.measure = { start: action.payload, end: action.payload };
    },
    updateMeasure(state, action: PayloadAction<Point>) {
      if (state.measure) state.measure.end = action.payload;
    },
    endMeasure(state) {
      state.measure = null;
    },
    setFogEnabled(state, action: PayloadAction<boolean>) {
      state.fogEnabled = action.payload;
    },
    reveal(state, action: PayloadAction<{ x: number; y: number; radius?: number }>) {
      state.reveals.push({ x: action.payload.x, y: action.payload.y, radius: action.payload.radius ?? 0.1 });
    },
    clearReveals(state) {
      state.reveals = [];
    },
  },
});

export const {
  setToolMode,
  addToken,
  moveToken,
  removeToken,
  setSelectedToken,
  startMeasure,
  updateMeasure,
  endMeasure,
  setFogEnabled,
  reveal,
  clearReveals,
} = tokensSlice.actions;

export default tokensSlice.reducer;