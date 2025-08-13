import { ActionItem, FeatEffect, CritRangeEffect, Ability, MonsterAbilityScores } from './types';

export const selectCriticalHitRange = (allEffects: FeatEffect[]): number => {
    const critRangeEffects = allEffects.filter(e => e.type === 'crit_range') as CritRangeEffect[];
    if (critRangeEffects.length === 0) {
        return 20;
    }
    return Math.min(20, ...critRangeEffects.map(e => e.value));
};

export const mapAbilityToShort = (ability: Ability): keyof MonsterAbilityScores => {
    switch (ability) {
        case 'STRENGTH': return 'STR';
        case 'DEXTERITY': return 'DEX';
        case 'CONSTITUTION': return 'CON';
        case 'INTELLIGENCE': return 'INT';
        case 'WISDOM': return 'WIS';
        case 'CHARISMA': return 'CHA';
    }
};
