import { combineReducers } from '@reduxjs/toolkit';

// Import all slice reducers
import metaSlice from './slices/metaSlice';
import abilitiesSlice from './slices/abilitiesSlice';
import proficienciesSlice from './slices/proficienciesSlice';
import inventorySlice from './slices/inventorySlice';
import spellsSlice from './slices/spellsSlice';
import vitalsSlice from './slices/vitalsSlice';
import playStateSlice from './slices/playStateSlice';

// This reducer now combines only the raw character data slices.
export const characterDataReducer = combineReducers({
    meta: metaSlice.reducer,
    abilities: abilitiesSlice.reducer,
    proficiencies: proficienciesSlice.reducer,
    inventory: inventorySlice.reducer,
    spells: spellsSlice.reducer,
    vitals: vitalsSlice.reducer,
    playState: playStateSlice.reducer,
});
