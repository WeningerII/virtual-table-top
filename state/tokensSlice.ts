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
  hp?: { current: number; max: number };
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
  // Grid and units config
  gridCellsAcross: number; // e.g., 20
  unitsPerCell: number; // e.g., 5 ft
  snapToGrid: boolean;
  // Initiative tracking
  initiativeOrder: string[]; // token ids
  activeIndex: number;
}

const initialState: TokensState = {
  tokens: [],
  selectedTokenId: null,
  toolMode: 'select',
  measure: null,
  fogEnabled: false,
  reveals: [],
  gridCellsAcross: 20,
  unitsPerCell: 5,
  snapToGrid: true,
  initiativeOrder: [],
  activeIndex: 0,
};

const tokensSlice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    setToolMode(state, action: PayloadAction<ToolMode>) {
      state.toolMode = action.payload;
      if (action.payload !== 'measure') state.measure = null;
    },
    setGridCellsAcross(state, action: PayloadAction<number>) {
      state.gridCellsAcross = Math.max(5, Math.min(200, Math.round(action.payload || 20)));
    },
    setUnitsPerCell(state, action: PayloadAction<number>) {
      state.unitsPerCell = Math.max(1, Math.min(100, Math.round(action.payload || 5)));
    },
    setSnapToGrid(state, action: PayloadAction<boolean>) {
      state.snapToGrid = action.payload;
    },
    addToken(state, action: PayloadAction<Partial<Token> & { x: number; y: number }>) {
      const snap = (v: number) => {
        if (!state.snapToGrid) return Math.max(0, Math.min(1, v));
        const n = state.gridCellsAcross;
        return (Math.round(v * n - 0.5) + 0.5) / n;
      };
      const token: Token = {
        id: action.payload.id || crypto.randomUUID(),
        name: action.payload.name || 'Unit',
        x: snap(action.payload.x),
        y: snap(action.payload.y),
        size: action.payload.size ?? 1,
        color: action.payload.color || '#2563eb',
        imageUrl: action.payload.imageUrl,
        hp: action.payload.hp || { current: 10, max: 10 },
      };
      state.tokens.push(token);
      state.selectedTokenId = token.id;
      if (!state.initiativeOrder.includes(token.id)) state.initiativeOrder.push(token.id);
    },
    updateToken(state, action: PayloadAction<{ id: string; changes: Partial<Token> }>) {
      const t = state.tokens.find((tk) => tk.id === action.payload.id);
      if (t) {
        Object.assign(t, action.payload.changes);
      }
    },
    moveToken(state, action: PayloadAction<{ id: string; x: number; y: number }>) {
      const t = state.tokens.find((tk) => tk.id === action.payload.id);
      if (t) {
        const snap = (v: number) => {
          if (!state.snapToGrid) return Math.max(0, Math.min(1, v));
          const n = state.gridCellsAcross;
          return (Math.round(v * n - 0.5) + 0.5) / n;
        };
        t.x = snap(action.payload.x);
        t.y = snap(action.payload.y);
      }
    },
    setTokens(state, action: PayloadAction<TokensState['tokens']>) {
      state.tokens = action.payload;
      state.initiativeOrder = action.payload.map((t) => t.id);
      state.activeIndex = 0;
    },
    removeToken(state, action: PayloadAction<string>) {
      state.tokens = state.tokens.filter((t) => t.id !== action.payload);
      state.initiativeOrder = state.initiativeOrder.filter((id) => id !== action.payload);
      if (state.selectedTokenId === action.payload) state.selectedTokenId = null;
      if (state.activeIndex >= state.initiativeOrder.length) state.activeIndex = 0;
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
    setInitiative(state, action: PayloadAction<string[]>) {
      state.initiativeOrder = action.payload.filter((id) => state.tokens.some((t) => t.id === id));
      state.activeIndex = 0;
    },
    nextTurn(state) {
      if (state.initiativeOrder.length === 0) return;
      state.activeIndex = (state.activeIndex + 1) % state.initiativeOrder.length;
    },
    loadTokensState(state, action: PayloadAction<Partial<TokensState>>) {
      Object.assign(state, action.payload);
      state.gridCellsAcross = Math.max(5, Math.min(200, Math.round(state.gridCellsAcross)));
      state.unitsPerCell = Math.max(1, Math.min(100, Math.round(state.unitsPerCell)));
      if (state.activeIndex >= state.initiativeOrder.length) state.activeIndex = 0;
    },
    damageToken(state, action: PayloadAction<{ id: string; amount: number }>) {
      const t = state.tokens.find((tk) => tk.id === action.payload.id);
      if (t && t.hp) t.hp.current = Math.max(0, t.hp.current - Math.abs(action.payload.amount));
    },
    healToken(state, action: PayloadAction<{ id: string; amount: number }>) {
      const t = state.tokens.find((tk) => tk.id === action.payload.id);
      if (t && t.hp) t.hp.current = Math.min(t.hp.max, t.hp.current + Math.abs(action.payload.amount));
    },
  },
});

export const {
  setToolMode,
  setGridCellsAcross,
  setUnitsPerCell,
  setSnapToGrid,
  addToken,
  updateToken,
  moveToken,
  setTokens,
  removeToken,
  setSelectedToken,
  startMeasure,
  updateMeasure,
  endMeasure,
  setFogEnabled,
  reveal,
  clearReveals,
  setInitiative,
  nextTurn,
  loadTokensState,
  damageToken,
  healToken,
} = tokensSlice.actions;

export default tokensSlice.reducer;