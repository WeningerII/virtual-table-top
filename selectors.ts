import { RootState } from './store';
import { Character } from '../types';

export const selectCalculatedActiveCharacterSheet = (state: RootState): Character | null => {
    const id = state.roster.activeCharacterId;
    if (!id) return null;
    // Placeholder character sheet with basic stats; replace with real calculation engine
    return {
        id,
        name: 'Hero',
        level: 1,
        classes: [],
        abilityScores: {},
        armorClass: 12,
        initiative: 2,
    } as any;
};