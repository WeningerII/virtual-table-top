
import { BattlefieldState, EncounterStrategy } from './types';

type Enemy = BattlefieldState['enemies'][0];

/**
 * Finds the enemy with the lowest absolute HP.
 * @param enemies - An array of enemy objects from the battlefield state.
 * @returns The enemy with the lowest HP, or null if the list is empty.
 */
export const findMostWoundedEnemy = (enemies: Enemy[]): Enemy | null => {
    if (enemies.length === 0) {
        return null;
    }
    return enemies.reduce((lowest, current) => {
        return current.hpPercentage < lowest.hpPercentage ? current : lowest;
    });
};

/**
 * Finds the enemy that last attacked the AI.
 * @param self - The AI's own state.
 * @param enemies - An array of all enemies.
 * @returns The enemy who was the last attacker, or null if not found or no last attacker.
 */
export const findLastAttackerTarget = (self: BattlefieldState['self'], enemies: Enemy[]): Enemy | null => {
    if (!self.lastAttackerId) {
        return null;
    }
    return enemies.find(e => e.id === self.lastAttackerId) || null;
};


const getDistance = (a: { x: number, y: number }, b: { x: number, y: number }) => {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
};

/**
 * Finds the best target based on a given strategy.
 * @param self - The AI's own state.
 * @param enemies - An array of enemy objects.
 * @param strategy - The high-level strategy from the commander.
 * @returns The best enemy to target, or null if no valid target is found.
 */
export const findBestTarget = (self: BattlefieldState['self'], enemies: Enemy[], strategy?: EncounterStrategy): Enemy | null => {
    if (enemies.length === 0) return null;
    if (!strategy) {
        // Fallback: if no strategy, attack closest
        return enemies.reduce((closest, current) => {
            const currentDist = getDistance(self.position, current.position);
            const closestDist = getDistance(self.position, closest.position);
            return currentDist < closestDist ? current : closest;
        });
    }

    let bestTarget: Enemy | null = null;
    let highestScore = -Infinity;

    for (const enemy of enemies) {
        let score = 100; // Base score

        // Tactical Modifiers (can be adjusted for more nuance)
        const distance = getDistance(self.position, enemy.position);
        score -= distance; // Closer is better
        score += (100 - enemy.hpPercentage) / 5; // Lower health is better
        if (enemy.conditions.length > 0) score += 15; // Vulnerable targets are better

        // Apply strategy weights
        for (const priority of strategy.targetingPriorities) {
            let match = false;
            switch (priority.targetType) {
                case 'lowest_hp': if (enemy.hpPercentage < 40) match = true; break;
                case 'highest_hp': if (enemy.hpPercentage > 90) match = true; break;
                case 'closest': if (distance < 4) match = true; break;
                // Add more complex checks for other target types like 'healer' if that data is available
                case 'brute':
                case 'skirmisher':
                case 'controller':
                case 'leader':
                case 'follower':
                    if (enemy.archetype === priority.targetType) match = true;
                    break;
            }

            if (match) {
                if (priority.priority === 'AVOID') {
                    score *= (1 - (priority.weight || 1)); // Drastically reduce score for avoided targets
                } else {
                    score *= (priority.weight || 1);
                }
            }
        }
        
        if (score > highestScore) {
            highestScore = score;
            bestTarget = enemy;
        }
    }

    return bestTarget;
};
