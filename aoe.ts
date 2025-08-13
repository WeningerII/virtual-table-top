import * as THREE from 'three';
import { SpellTemplate, Token } from './types';

/**
 * Calculates which tokens are within a given spell template area.
 * @param template - The shape and size of the AoE.
 * @param sourceId - The ID of the token casting the spell.
 * @param targetPosition - The world-space position where the AoE is centered or originates from.
 * @param allTokens - An array of all tokens on the map.
 * @param cellSize - The size of one grid cell in world units.
 * @returns An array of token IDs that are affected by the AoE.
 */
export const calculateAoETargets = (
    template: SpellTemplate,
    sourceId: string,
    targetPosition: { x: number; y: number; z: number; },
    allTokens: Token[],
    cellSize: number
): string[] => {
    const affectedTokenIds: string[] = [];
    const targetVec = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
    const sourceToken = allTokens.find(t => t.id === sourceId || t.characterId === sourceId || t.npcInstanceId === sourceId);

    for (const token of allTokens) {
        const tokenPosition = new THREE.Vector3(token.x * cellSize, 2, token.y * cellSize);
        let isAffected = false;

        switch (template.type) {
            case 'sphere':
            case 'cube': // Treat cube as a sphere for simple distance check
                const radius = template.size * (cellSize / 5); // Template size is in feet
                if (tokenPosition.distanceTo(targetVec) <= radius) {
                    isAffected = true;
                }
                break;

            case 'cone':
                if (sourceToken) {
                    const sourcePosition = new THREE.Vector3(sourceToken.x * cellSize, 2, sourceToken.y * cellSize);
                    const coneLength = template.size * (cellSize / 5);
                    const coneAngle = Math.PI / 4; // 90-degree cone

                    const directionToTarget = new THREE.Vector3().subVectors(targetVec, sourcePosition).normalize();
                    const directionToToken = new THREE.Vector3().subVectors(tokenPosition, sourcePosition);
                    const distanceToToken = directionToToken.length();
                    directionToToken.normalize();

                    const angle = directionToToken.angleTo(directionToTarget);

                    if (distanceToToken <= coneLength && angle <= coneAngle) {
                        isAffected = true;
                    }
                }
                break;
            
            case 'line':
                 if (sourceToken) {
                    const sourcePosition = new THREE.Vector3(sourceToken.x * cellSize, 2, sourceToken.y * cellSize);
                     const lineLength = template.size * (cellSize / 5);
                    const lineWidth = (template.size2 || 5) * (cellSize / 5);

                    const direction = new THREE.Vector3().subVectors(targetVec, sourcePosition).normalize();
                    const lineSegment = new THREE.Line3(sourcePosition, sourcePosition.clone().addScaledVector(direction, lineLength));
                    
                    const closestPointOnLine = new THREE.Vector3();
                    lineSegment.closestPointToPoint(tokenPosition, true, closestPointOnLine);
                    const distanceToLine = tokenPosition.distanceTo(closestPointOnLine);

                    if (distanceToLine <= lineWidth / 2) {
                        isAffected = true;
                    }
                }
                break;
        }

        if (isAffected) {
            affectedTokenIds.push(token.id);
        }
    }

    return affectedTokenIds;
};