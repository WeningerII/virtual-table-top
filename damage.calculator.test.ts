import { describe, it, expect } from 'vitest';
import { DamageCalculator } from '../rules/damage.calculator';
import { DamagePart, StaticGameDataCache } from './types';

// Mock static data cache - not needed for basic damage calculation, but required by constructor
const mockStaticData: StaticGameDataCache = {} as any;

describe('DamageCalculator', () => {
    const calculator = new DamageCalculator(mockStaticData);

    it('should calculate standard damage correctly from multiple parts', () => {
        const damageParts: DamagePart[] = [
            { dice: '1d8', bonus: 3, type: 'slashing' },
            { dice: '1d6', bonus: 0, type: 'fire' },
        ];
        // Mocking rolls isn't straightforward in vitest without more setup,
        // so we'll check if the damage is within the expected range.
        const result = calculator.calculateDamage(damageParts, false);

        expect(result.finalDamage).toBeGreaterThanOrEqual(1 + 1 + 3); // Min rolls + bonus
        expect(result.finalDamage).toBeLessThanOrEqual(8 + 6 + 3); // Max rolls + bonus
        expect(result.critical).toBe(false);
        expect(result.primaryType).toBe('slashing');
    });

    it('should calculate critical hit damage correctly (doubling dice)', () => {
        const damageParts: DamagePart[] = [
            { dice: '2d6', bonus: 4, type: 'piercing' },
        ];
        const result = calculator.calculateDamage(damageParts, true);

        // A crit rolls dice twice, so 4d6 total + bonus
        expect(result.finalDamage).toBeGreaterThanOrEqual(4 * 1 + 4); // Min crit roll + bonus
        expect(result.finalDamage).toBeLessThanOrEqual(4 * 6 + 4); // Max crit roll + bonus
        expect(result.critical).toBe(true);
    });

    it('should handle flat damage parts correctly', () => {
        const damageParts: DamagePart[] = [
            { dice: '1d8', bonus: 0, type: 'slashing' },
            { dice: '5', bonus: 0, type: 'fire' }, // Flat damage
        ];
        const result = calculator.calculateDamage(damageParts, false);
        expect(result.finalDamage).toBeGreaterThanOrEqual(1 + 5);
        expect(result.finalDamage).toBeLessThanOrEqual(8 + 5);
    });
});
