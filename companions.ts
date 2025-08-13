import { Companion } from './types';

interface CompanionGroups {
    single: Companion[];
    hordes: Companion[][];
}

export const groupCompanions = (companions: Companion[]): CompanionGroups => {
    if (!companions) {
        return { single: [], hordes: [] };
    }
    const groups: { [key: string]: Companion[] } = {};

    for (const companion of companions) {
        // Use the blueprint ID for grouping
        if (!groups[companion.id]) {
            groups[companion.id] = [];
        }
        groups[companion.id].push(companion);
    }

    const result: CompanionGroups = {
        single: [],
        hordes: [],
    };

    for (const key in groups) {
        const group = groups[key];
        // If a group has more than one member AND its blueprint allows it to be a horde, group them.
        if (group.length > 1 && group[0].canBeHorde) {
            result.hordes.push(group);
        } else {
            // Otherwise, they are treated as single companions.
            result.single.push(...group);
        }
    }

    return result;
};
