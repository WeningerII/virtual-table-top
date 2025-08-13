import { AIBlackboard, BTNode, BTNodeStatus, ActionItem, DamagePart, Token } from './types';
import { findBestTarget, findLastAttackerTarget, findMostWoundedEnemy } from './perception/threatAssessment';
import { hasLineOfSight } from './perception/lineOfSight';
import { findCover } from './perception/cover';
import { rollDice } from '../../utils/dice';

const getDistance = (a: { x: number, y: number }, b: { x: number, y: number }) => {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
};

// --- CONDITION NODES ---
export class HasVisibleEnemiesNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        return board.visibleEnemies && board.visibleEnemies.length > 0 ? BTNodeStatus.SUCCESS : BTNodeStatus.FAILURE;
    }
}

export class IsEnemyInMeleeNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        const { self } = board.battlefieldState;
        if (!board.battlefieldState.spatialIndex) return BTNodeStatus.FAILURE;
        
        const nearbyTokens = board.battlefieldState.spatialIndex.queryRadius(self.position, 1.5);
        const nearbyEnemy = nearbyTokens.find(token => token.teamId !== self.teamId);

        if (nearbyEnemy) {
            board.currentTargetId = nearbyEnemy.id;
            return BTNodeStatus.SUCCESS;
        }
        return BTNodeStatus.FAILURE;
    }
}

export class HasSquadTargetNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        return board.battlefieldState.self.squadTargetId ? BTNodeStatus.SUCCESS : BTNodeStatus.FAILURE;
    }
}

export class IsHealthLowNode extends BTNode {
    private threshold: number;
    constructor(threshold = 0.25, metadata?: any) { 
        super(metadata);
        this.threshold = threshold;
    }
    protected execute(board: AIBlackboard): BTNodeStatus {
        const { self } = board.battlefieldState;
        const hpPercentage = self.currentHp / self.maxHp;
        return hpPercentage <= this.threshold ? BTNodeStatus.SUCCESS : BTNodeStatus.FAILURE;
    }
}

// --- ACTION NODES ---

export class FindVisibleEnemiesNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        const { self, enemies, terrainGrid, obstacles, activeMap } = board.battlefieldState;
        if(!activeMap) return BTNodeStatus.FAILURE;
        
        // Use spatial index for a first pass to get nearby enemies
        const nearbyEnemyTokens = board.battlefieldState.spatialIndex!.queryRadius(self.position, 20) // 100ft range
            .filter(t => t.teamId !== self.teamId);

        board.visibleEnemies = nearbyEnemyTokens
            .filter(token => {
                 const enemyData = enemies.find(e => e.id === token.id);
                 if (!enemyData) return false;
                 return hasLineOfSight(self.position, enemyData.position, terrainGrid, obstacles);
            })
            .map(t => t.id);
            
        return BTNodeStatus.SUCCESS;
    }
}

export class FindClosestEnemyNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        const { self, enemies } = board.battlefieldState;
        const visibleEnemies = enemies.filter(e => board.visibleEnemies?.includes(e.id));
        if (visibleEnemies.length === 0) return BTNodeStatus.FAILURE;

        let closestEnemy = visibleEnemies[0];
        let minDistance = getDistance(self.position, closestEnemy.position);

        for (let i = 1; i < visibleEnemies.length; i++) {
            const distance = getDistance(self.position, visibleEnemies[i].position);
            if (distance < minDistance) {
                minDistance = distance;
                closestEnemy = visibleEnemies[i];
            }
        }
        board.currentTargetId = closestEnemy.id;
        return BTNodeStatus.SUCCESS;
    }
}

export class FindMostWoundedEnemyNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        const { enemies } = board.battlefieldState;
        const visibleEnemies = enemies.filter(e => board.visibleEnemies?.includes(e.id));
        if (visibleEnemies.length === 0) return BTNodeStatus.FAILURE;

        const mostWounded = findMostWoundedEnemy(visibleEnemies);
        if (mostWounded) {
            board.currentTargetId = mostWounded.id;
            return BTNodeStatus.SUCCESS;
        }
        return BTNodeStatus.FAILURE;
    }
}


export class FindBestTargetNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        const { self, enemies } = board.battlefieldState;
        const visibleEnemies = enemies.filter(e => board.visibleEnemies?.includes(e.id));
        if (visibleEnemies.length === 0) return BTNodeStatus.FAILURE;

        const bestTarget = findBestTarget(self, visibleEnemies, self.strategy);
        if (bestTarget) {
            board.currentTargetId = bestTarget.id;
            return BTNodeStatus.SUCCESS;
        }
        return BTNodeStatus.FAILURE;
    }
}

export class PrioritizeLastAttackerNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        const { self, enemies } = board.battlefieldState;
        const lastAttacker = findLastAttackerTarget(self, enemies.filter(e => board.visibleEnemies?.includes(e.id)));
        if (lastAttacker) {
            board.currentTargetId = lastAttacker.id;
            return BTNodeStatus.SUCCESS;
        }
        return BTNodeStatus.FAILURE;
    }
}

export class AssignSquadTargetNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        const { self, enemies } = board.battlefieldState;
        const visibleEnemies = enemies.filter(e => board.visibleEnemies?.includes(e.id));
        if (visibleEnemies.length === 0) return BTNodeStatus.FAILURE;
        
        const bestTarget = findBestTarget(self, visibleEnemies, self.strategy);
        if (bestTarget) {
            board.currentTargetId = bestTarget.id;
            board.result.squadTargetId = bestTarget.id;
            return BTNodeStatus.SUCCESS;
        }
        return BTNodeStatus.FAILURE;
    }
}

export class SetTargetToSquadTargetNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        if (board.battlefieldState.self.squadTargetId) {
            board.currentTargetId = board.battlefieldState.self.squadTargetId;
            return BTNodeStatus.SUCCESS;
        }
        return BTNodeStatus.FAILURE;
    }
}

export class MoveToTargetNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        const { self, enemies, obstacles, terrainGrid, activeMap } = board.battlefieldState;

        if(!activeMap) return BTNodeStatus.FAILURE;

        let targetPosition: {x: number, y: number} | null = null;
        let reach = 1;

        // Prioritize a specific move target point if set on the blackboard (e.g., from FindCoverNode)
        if (board.moveTarget) {
            targetPosition = board.moveTarget;
            reach = 0; // We want to land ON the spot
        } else if (board.currentTargetId) {
            const targetToken = activeMap.tokens.find(t => t.id === board.currentTargetId);
            const target = enemies.find(e => e.id === board.currentTargetId);
            if (!target || !targetToken) return BTNodeStatus.FAILURE;
            targetPosition = target.position;

            const weapon = self.actions.find(a => a.attackType === 'melee');
            reach = weapon?.reach ? weapon.reach / 5 : 1;
        }

        if (!targetPosition) return BTNodeStatus.FAILURE;

        const distance = getDistance(self.position, targetPosition);
        if (distance <= reach) {
            board.result.destination = null; // No move needed
            return BTNodeStatus.SUCCESS;
        }

        // Find the best adjacent/target square to move to
        const possibleTargets: {x: number, y: number}[] = [];
        if (reach === 0) {
            possibleTargets.push(targetPosition);
        } else {
             for(let dx = -reach; dx <= reach; dx++) {
                for (let dy = -reach; dy <= reach; dy++) {
                     if(Math.max(Math.abs(dx), Math.abs(dy)) === reach) {
                         possibleTargets.push({x: targetPosition.x + dx, y: targetPosition.y + dy});
                    }
                }
            }
        }
        
        let bestPath: {x: number, y: number}[] | null = null;
        for(const pos of possibleTargets) {
            if (pos.x < 0 || pos.y < 0 || pos.y >= terrainGrid.length || pos.x >= terrainGrid[0].length) continue;
            
            const path = board.pathfinder(self.position.x, self.position.y, pos.x, pos.y, terrainGrid as any, obstacles);
            if(path && (!bestPath || path.length < bestPath.length)) {
                bestPath = path;
            }
        }
        
        if (bestPath && bestPath.length > 1) {
            const maxSteps = Math.floor(self.speed / 5);
            const moveIndex = Math.min(bestPath.length - 1, maxSteps);
            const destination = bestPath[moveIndex];
            
            if (destination.x !== self.position.x || destination.y !== self.position.y) {
                 board.result.destination = destination;
            } else {
                 board.result.destination = null;
            }
            board.moveTarget = undefined; // Clear moveTarget after using it
            return BTNodeStatus.SUCCESS;
        } else if (bestPath && bestPath.length <= 1) { // Already there
            board.result.destination = null;
            board.moveTarget = undefined;
            return BTNodeStatus.SUCCESS;
        }

        return BTNodeStatus.FAILURE;
    }
}

export class MoveAwayFromTargetNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        const { self, enemies, terrainGrid, obstacles } = board.battlefieldState;
        const target = enemies.find(e => e.id === board.currentTargetId);
        if (!target) return BTNodeStatus.FAILURE;
        
        const maxSteps = Math.floor(self.speed / 5);
        let bestSpot: { x: number; y: number } | null = null;
        let maxDistance = getDistance(self.position, target.position);

        // Check 8 directions around the AI
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const endX = self.position.x + dx * maxSteps;
                const endY = self.position.y + dy * maxSteps;

                const path = board.pathfinder(self.position.x, self.position.y, endX, endY, terrainGrid, obstacles);
                if (path && path.length > 1) {
                    const destination = path[Math.min(path.length - 1, maxSteps)];
                    const dist = getDistance(destination, target.position);
                    if (dist > maxDistance) {
                        maxDistance = dist;
                        bestSpot = destination;
                    }
                }
            }
        }

        if (bestSpot) {
            board.moveTarget = bestSpot;
            return BTNodeStatus.SUCCESS;
        }
        
        return BTNodeStatus.FAILURE;
    }
}


export class AttackTargetNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        const { self, enemies, activeMap } = board.battlefieldState;
        if (!activeMap) return BTNodeStatus.FAILURE;

        const target = enemies.find(e => e.id === board.currentTargetId);
        if (!target || self.actions.length === 0) return BTNodeStatus.FAILURE;

        const action = board.chosenAction || self.actions.find(a => a.attackType === 'melee' || a.attackType === 'ranged');
        if(!action) return BTNodeStatus.FAILURE;
        
        const currentPosition = board.result.destination || self.position;
        const distance = getDistance(currentPosition, target.position);
        
        let reach = 1;
        if (action.attackType === 'melee') {
             reach = action.reach ? action.reach / 5 : 1;
        } else if (action.attackType === 'ranged') {
            reach = action.range ? action.range / 5 : Infinity;
        }

        if (distance > reach) return BTNodeStatus.FAILURE;

        board.result.actionId = action.name;
        board.result.targetId = target.id;
        return BTNodeStatus.SUCCESS;
    }
}

export class FleeNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        const { self, enemies, terrainGrid, obstacles } = board.battlefieldState;
        if (enemies.length === 0) {
            board.result.rationale = "No enemies present, no need to flee.";
            return BTNodeStatus.FAILURE;
        }

        const avgEnemyPos = enemies.reduce((acc, e) => ({ x: acc.x + e.position.x, y: acc.y + e.position.y }), { x: 0, y: 0 });
        avgEnemyPos.x /= enemies.length;
        avgEnemyPos.y /= enemies.length;

        const fleeVector = { x: self.position.x - avgEnemyPos.x, y: self.position.y - avgEnemyPos.y };
        const fleeMagnitude = Math.sqrt(fleeVector.x ** 2 + fleeVector.y ** 2) || 1;
        const fleeTarget = {
            x: Math.round(self.position.x + (fleeVector.x / fleeMagnitude) * (self.speed / 5)),
            y: Math.round(self.position.y + (fleeVector.y / fleeMagnitude) * (self.speed / 5)),
        };

        const path = board.pathfinder(self.position.x, self.position.y, fleeTarget.x, fleeTarget.y, terrainGrid, obstacles);
        if (path && path.length > 1) {
            const maxSteps = Math.floor(self.speed / 5);
            const destination = path[Math.min(path.length - 1, maxSteps)];
            board.result.destination = destination;
            board.result.rationale = "Health is low, attempting to flee from enemies.";
            board.result.dialogue = "You'll never take me alive!";
            board.result.actionId = null;
            board.result.targetId = null;
            return BTNodeStatus.SUCCESS;
        }

        return BTNodeStatus.FAILURE;
    }
}

export class FindCoverNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        const coverPosition = findCover(board.battlefieldState);
        if (coverPosition) {
            board.moveTarget = coverPosition;
            return BTNodeStatus.SUCCESS;
        }
        return BTNodeStatus.FAILURE;
    }
}

export class UseMostDamagingAbilityNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        const { self, enemies } = board.battlefieldState;
        const target = enemies.find(e => e.id === board.currentTargetId);
        if (!target) return BTNodeStatus.FAILURE;

        let bestAction: ActionItem | null = null;
        let maxDamage = -1;

        self.actions.forEach(action => {
            if (action.damageParts) {
                const avgDamage = action.damageParts.reduce((sum, part) => {
                    if (typeof part.dice === 'string' && part.dice.includes('d')) {
                        const [num, die] = part.dice.split('d').map(Number);
                        return sum + (num * (die / 2 + 0.5)) + (part.bonus || 0);
                    } else if (typeof part.dice === 'string') {
                        return sum + parseInt(part.dice, 10) + (part.bonus || 0);
                    }
                    return sum + (part.bonus || 0);
                }, 0);

                if (avgDamage > maxDamage) {
                    maxDamage = avgDamage;
                    bestAction = action;
                }
            }
        });

        if (bestAction) {
            board.chosenAction = bestAction;
            return BTNodeStatus.SUCCESS;
        }
        return BTNodeStatus.FAILURE;
    }
}

export class UseBestAreaOfEffectNode extends BTNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        const { self, enemies, allies, activeMap, spatialIndex } = board.battlefieldState;
        if(!activeMap || !spatialIndex) return BTNodeStatus.FAILURE;

        let bestAction: ActionItem | null = null;
        let bestTargetPos: { x: number, y: number } | null = null;
        let maxScore = -1;

        const aoeActions = self.actions.filter(a => a.areaOfEffect);
        if (aoeActions.length === 0) return BTNodeStatus.FAILURE;

        // Check potential AoE placements centered on each enemy
        enemies.forEach(enemy => {
            const pos = enemy.position;
            
            aoeActions.forEach(action => {
                const radiusInGrid = action.areaOfEffect!.size / 5;
                const hitTokens = spatialIndex.queryRadius(pos, radiusInGrid);
                const hitEnemies = hitTokens.filter(t => t.teamId !== self.teamId).length;
                const hitAllies = hitTokens.filter(t => t.teamId === self.teamId).length;
                
                const score = hitEnemies - (hitAllies * 2); // Heavily penalize friendly fire

                if (score > maxScore) {
                    maxScore = score;
                    bestAction = action;
                    bestTargetPos = pos;
                }
            });
        });

        if (bestAction && bestTargetPos && maxScore > 1) { // Only use if it hits more than 1 enemy without significant friendly fire
            board.chosenAction = bestAction;
            // The target for an AoE is a point on the ground, not a creature
            board.currentTargetId = enemies.find(e => e.position.x === bestTargetPos!.x && e.position.y === bestTargetPos!.y)?.id;
            return BTNodeStatus.SUCCESS;
        }

        return BTNodeStatus.FAILURE;
    }
}