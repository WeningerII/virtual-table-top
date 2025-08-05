import { describe, it, expect } from 'vitest';
import { selectCombatUIData } from '../combatSelectors';
import { RootState } from '../../state/store';
import { PersistPartial } from 'redux-persist/es/persistReducer';

// Create a representative mock state
const createMockRootState = (): RootState & PersistPartial => ({
    combatFlow: {
        currentState: { phase: 'AWAITING_PLAYER_ACTION', round: 1, activeTokenId: 'token-1' },
        history: [],
        transitionLog: [],
    },
    entity: {
        activeMap: {
            id: 'map1',
            name: 'Test Arena',
            grid: { width: 30, height: 30, cellSize: 50 },
            terrain: [],
            features: [],
            objects: [],
            tokens: Array.from({ length: 10 }, (_, i) => ({
                id: `token-${i}`, name: `Creature ${i}`, x: i, y: i, size: 1, color: 'red',
                teamId: i < 5 ? 'players' : 'enemies',
                npcInstanceId: i >= 5 ? `npc-${i}` : undefined,
            })),
            initiativeOrder: [],
            activeInitiativeIndex: 0
        },
        mapNpcInstances: Array.from({ length: 5 }, (_, i) => ({
            instanceId: `npc-${i+5}`, monsterId: 'goblin', currentHp: 7, maxHp: 7,
        })),
        mapImageUrl: '',
        currentSceneImageUrl: null,
        spatialIndex: null,
    },
    animations: {
        animationState: null,
        lastDamageInfo: null,
        lastVFXRequest: null
    },
    ai: {
        isAiThinking: false,
        pendingAiAction: null
    },
    // Add other minimal required state slices
    app: {} as any,
    roster: {} as any,
    genesis: {} as any,
    characterData: {} as any,
    log: {} as any,
    ui: {} as any,
    worldbuilder: {} as any,
    builder: {} as any,
    events: {} as any,
    _persist: { version: -1, rehydrated: true },
});

describe('Performance Benchmark: selectCombatUIData', () => {
    it('should execute in under 1 millisecond on average', () => {
        const mockState = createMockRootState();
        const iterations = 1000;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            selectCombatUIData(mockState);
        }

        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const averageTime = totalTime / iterations;

        console.log(`selectCombatUIData benchmark: ${averageTime.toFixed(4)} ms/op`);

        // Assert that the average time is very low, confirming memoization is effective.
        // A real-world threshold might be higher, but for a simple state access, it should be very fast.
        expect(averageTime).toBeLessThan(1);
    });
});