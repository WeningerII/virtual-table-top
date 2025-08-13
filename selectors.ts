import { RootState } from './store';
import { Character, CharacterState } from './types';
import { selectCharacter } from './engine/characterSelectors';

/**
 * ADAPTER SELECTOR: This selector now points directly to the main calculation engine's
 * memoized selector. It takes the full application state, extracts the necessary raw
 * character data and static data, and computes the character sheet on the fly.
 * This is the new single source of truth for the entire UI.
 */
export const selectCalculatedActiveCharacterSheet = (state: RootState): Character | null => {
    const activeCharacterId = state.roster.activeCharacterId;
    const characterData = state.characterData;
    const staticDataCache = state.app.staticDataCache;

    if (!activeCharacterId || !characterData || !staticDataCache) {
        return null;
    }
    
    // The `selectCharacter` selector is the heart of the new architecture.
    return selectCharacter(characterData as CharacterState, staticDataCache);
};