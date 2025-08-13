
import { BattlefieldState } from './types';
import { hasLineOfSight } from './lineOfSight';

const getDistance = (a: { x: number, y: number }, b: { x: number, y: number }) => {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
};

export const findCover = (battlefieldState: BattlefieldState): { x: number; y: number } | null => {
    const { self, enemies, environmentalObjects, terrainGrid, obstacles } = battlefieldState;
    if (!environmentalObjects || environmentalObjects.length === 0 || enemies.length === 0) {
        return null;
    }

    const coverObjects = environmentalObjects.filter(obj => obj.providesCover);
    if (coverObjects.length === 0) {
        return null;
    }

    let bestCoverSpot: { x: number; y: number } | null = null;
    let bestSpotScore = -Infinity;

    const allObstacles = new Set(obstacles.map(o => `${o.x},${o.y}`));

    for (const coverObj of coverObjects) {
        // Check adjacent tiles to the cover object
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;

                const potentialSpot = {
                    x: coverObj.position.x + dx,
                    y: coverObj.position.y + dy,
                };

                // Check if the spot is valid (walkable, not occupied)
                if (
                    potentialSpot.y < 0 || potentialSpot.y >= terrainGrid.length ||
                    potentialSpot.x < 0 || potentialSpot.x >= terrainGrid[0].length ||
                    terrainGrid[potentialSpot.y][potentialSpot.x].type === 'wall' ||
                    allObstacles.has(`${potentialSpot.x},${potentialSpot.y}`)
                ) {
                    continue;
                }

                // Check if the spot has line of sight to at least one enemy
                const hasLOS = enemies.some(enemy => hasLineOfSight(potentialSpot, enemy.position, terrainGrid, obstacles));
                if (!hasLOS) continue;

                // Score the spot: further from enemies is better
                const closestEnemyDist = Math.min(...enemies.map(e => getDistance(potentialSpot, e.position)));
                const distFromSelf = getDistance(self.position, potentialSpot);

                // Simple score: prioritize being far from enemies but close to current position
                const score = closestEnemyDist - (distFromSelf / 2);

                if (score > bestSpotScore) {
                    bestSpotScore = score;
                    bestCoverSpot = potentialSpot;
                }
            }
        }
    }
    
    return bestCoverSpot;
};
