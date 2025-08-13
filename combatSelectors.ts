import { createSelector } from './createSelector';
import { RootState } from '../state/store';
import { Character, MapNpcInstance, Token, VTTMap } from './types';
import { hasLineOfSight } from './ai/perception/lineOfSight';

const selectAllTokens = (state: RootState) => state.entity.activeMap?.tokens || [];
const selectAllNpcs = (state: RootState) => state.entity.mapNpcInstances;
const selectTerrainGrid = (state: RootState) => state.entity.activeMap?.grid;
const selectSourceTokenId = (_: RootState, props: { sourceTokenId: string }) => props.sourceTokenId;

export const selectVisibleEnemiesForToken = createSelector(
    [selectAllTokens, selectAllNpcs, selectTerrainGrid, selectSourceTokenId],
    (allTokens, allNpcs, grid, sourceTokenId) => {
        if (!grid) return [];

        const sourceToken = allTokens.find(t => t.id === sourceTokenId);
        if (!sourceToken) return [];
        
        const obstacles = allTokens.filter(t => t.id !== sourceToken.id).map(t => ({ x: t.x, y: t.y }));

        return allTokens.filter(targetToken => {
            if (targetToken.id === sourceToken.id || targetToken.teamId === sourceToken.teamId) {
                return false; // Not an enemy
            }
            
            // Check if target is hidden (DM feature)
            if(targetToken.npcInstanceId) {
                const npc = allNpcs.find(n => n.instanceId === targetToken.npcInstanceId);
                if (npc?.isHidden) return false;
            }

            // TODO: Implement proper terrain grid for LoS checks
            // For now, we assume an empty grid and just check for token obstacles
            const mockTerrain: any[][] = Array(grid.height).fill(0).map(() => Array(grid.width).fill({ type: 'grass' }));

            return hasLineOfSight(
                { x: sourceToken.x, y: sourceToken.y },
                { x: targetToken.x, y: targetToken.y },
                mockTerrain,
                obstacles
            );
        });
    }
);

// --- SPRINT 5: BATCH SELECTOR FOR UI PERFORMANCE ---

const selectCombatState = (state: RootState) => state.combatFlow.currentState;
const selectEntityState = (state: RootState) => state.entity;
const selectAnimationState = (state: RootState) => state.animations;
const selectAiState = (state: RootState) => state.ai;

export const selectCombatUIData = createSelector(
    [selectCombatState, selectEntityState, selectAnimationState, selectAiState],
    (combatState, entityState, animationState, aiState) => {
        return {
            mapState: entityState.activeMap,
            simState: combatState.phase,
            winner: combatState.phase === 'COMBAT_ENDED' ? combatState.result.victor : null,
            mapNpcInstances: entityState.mapNpcInstances,
            currentSceneImageUrl: entityState.currentSceneImageUrl,
            mapImageUrl: entityState.mapImageUrl,
            isAiThinking: aiState.isAiThinking,
            animationState: animationState.animationState,
            lastDamageInfo: animationState.lastDamageInfo,
            pendingAiAction: aiState.pendingAiAction
        };
    }
);