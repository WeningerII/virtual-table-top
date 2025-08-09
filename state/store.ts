import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import appReducer from './appSlice';
import rosterReducer from './rosterSlice';
import uiReducer from './uiSlice';
import worldbuilderReducer from '../worldbuilderSlice';
import genesisReducer from '../genesisSlice';
import playStateReducer from '../playStateSlice';
import tokensReducer from '../state/tokensSlice';
import entityReducer from '../entitySlice';
import combatFlowReducer from '../combatFlowSlice';
import aiReducer from '../aiSlice';
import eventsReducer from '../eventSlice';
import animationsReducer from '../animationSlice';
import actionEconomyReducer from '../state/actionEconomySlice';

const persistConfig = {
  key: 'vtt-cathedral-root',
  storage,
  whitelist: ['app', 'roster', 'tokens', 'playState', 'worldbuilder'],
};

const rootReducer = combineReducers({
  app: appReducer,
  roster: rosterReducer,
  ui: uiReducer,
  worldbuilder: worldbuilderReducer,
  genesis: genesisReducer,
  playState: playStateReducer,
  tokens: tokensReducer,
  entity: entityReducer,
  combatFlow: combatFlowReducer,
  ai: aiReducer,
  events: eventsReducer,
  animations: animationsReducer,
  actionEconomy: actionEconomyReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: true,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;