import { DamagePart, StaticGameDataCache, Monster, Character } from '../../types';
import { rollDice } from '../../utils/dice';

export interface DamageResult {
    finalDamage: number;
    primaryType: string;
    critical: boolean;
    resistancesApplied: string[];
    vulnerabilitiesApplied: string[];
    immunitiesApplied: string[];
}

export class DamageCalculator {
    private staticData: StaticGameDataCache;

    constructor(staticData: StaticGameDataCache) {
        this.staticData = staticData;
    }

    public calculateDamage(
        damageParts: readonly DamagePart[],
        isCrit: boolean,
        target?: Monster | Character
    ): DamageResult {
        let totalDamage = 0;
        const resistancesApplied: string[] = [];
        const vulnerabilitiesApplied: string[] = [];
        const immunitiesApplied: string[] = [];

        for (const part of damageParts) {
            const baseRoll = rollDice(part.dice);
            let partDamage = baseRoll.total + (part.bonus || 0);

            if (isCrit && part.dice) {
                const critRoll = rollDice(part.dice);
                partDamage += critRoll.total;
            }

            if (target) {
                const monsterTarget = target as Monster; // For now, only handle monster defenses
                 if (monsterTarget.damageImmunities?.includes(part.type)) {
                    partDamage = 0;
                    immunitiesApplied.push(part.type);
                } else if (monsterTarget.damageResistances?.includes(part.type)) {
                    partDamage = Math.floor(partDamage / 2);
                    resistancesApplied.push(part.type);
                } else if (monsterTarget.damageVulnerabilities?.includes(part.type)) {
                    partDamage *= 2;
                    vulnerabilitiesApplied.push(part.type);
                }
            }

            totalDamage += partDamage;
        }

        return {
            finalDamage: Math.max(0, totalDamage),
            primaryType: damageParts[0]?.type || 'unknown',
            critical: isCrit,
            resistancesApplied,
            vulnerabilitiesApplied,
            immunitiesApplied,
        };
    }
}