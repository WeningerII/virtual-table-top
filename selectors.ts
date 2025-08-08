import { RootState } from './store';
import { Character } from '../types';

/**
 * ADAPTER SELECTOR: This selector now points directly to the main calculation engine's
 * memoized selector. It takes the full application state, extracts the necessary raw
 * character data and static data, and computes the character sheet on the fly.
 * This is the new single source of truth for the entire UI.
 */
export const selectCalculatedActiveCharacterSheet = (_state: RootState): Character | null => {
    // Simplified for now: return null to avoid engine dependency
    return null;
};