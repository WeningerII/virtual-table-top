import { combineReducers } from '@reduxjs/toolkit';

// Import all slice reducers
import metaSlice from './metaSlice';
import abilitiesSlice from './abilitiesSlice';
import proficienciesSlice from './proficienciesSlice';
import inventorySlice from './inventorySlice';
import spellsSlice from './spellsSlice';
import vitalsSlice from './vitalsSlice';
import playStateSlice from './playStateSlice';

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
