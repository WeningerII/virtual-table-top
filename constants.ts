import { Ability } from './enums';

export const DEBUG_MODE = true;
export const PERFORMANCE_WARNING_THRESHOLD_MS = 5;

export const ABILITIES: {id: Ability, name: string}[] = [
    { id: Ability.Strength, name: 'Strength' },
    { id: Ability.Dexterity, name: 'Dexterity' },
    { id: Ability.Constitution, name: 'Constitution' },
    { id: Ability.Intelligence, name: 'Intelligence' },
    { id: Ability.Wisdom, name: 'Wisdom' },
    { id: Ability.Charisma, name: 'Charisma' }
];

export const SKILLS: { id: string, name: string, ability: Ability }[] = [
    { id: 'acrobatics', name: 'Acrobatics', ability: Ability.Dexterity },
    { id: 'animal-handling', name: 'Animal Handling', ability: Ability.Wisdom },
    { id: 'arcana', name: 'Arcana', ability: Ability.Intelligence },
    { id: 'athletics', name: 'Athletics', ability: Ability.Strength },
    { id: 'deception', name: 'Deception', ability: Ability.Charisma },
    { id: 'history', name: 'History', ability: Ability.Intelligence },
    { id: 'insight', name: 'Insight', ability: Ability.Wisdom },
    { id: 'intimidation', name: 'Intimidation', ability: Ability.Charisma },
    { id: 'investigation', name: 'Investigation', ability: Ability.Intelligence },
    { id: 'medicine', name: 'Medicine', ability: Ability.Wisdom },
    { id: 'nature', name: 'Nature', ability: Ability.Intelligence },
    { id: 'perception', name: 'Perception', ability: Ability.Wisdom },
    { id: 'performance', name: 'Performance', ability: Ability.Charisma },
    { id: 'persuasion', name: 'Persuasion', ability: Ability.Charisma },
    { id: 'religion', name: 'Religion', ability: Ability.Intelligence },
    { id: 'sleight-of-hand', name: 'Sleight of Hand', ability: Ability.Dexterity },
    { id: 'stealth', name: 'Stealth', ability: Ability.Dexterity },
    { id: 'survival', name: 'Survival', ability: Ability.Wisdom },
];

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];