import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { VTTMap, Token, MapNpcInstance, Character, EncounterConcept, InitiativeEntry, Monster, EffectInstance } from '../types';
import { createDefaultMap, generateMapFromConcept, buildSpatialIndex } from './map';
import { rollD20 } from './dice';
import { RootState } from './store';
import { SpatialGrid } from '../engine/spatialGrid.service';
import { selectCalculatedActiveCharacterSheet } from './selectors';

export interface EntityState {
    activeMap: VTTMap | null;
    mapNpcInstances: MapNpcInstance[];
    currentSceneImageUrl: string | null;
    mapImageUrl: string | null;
    spatialIndex: SpatialGrid | null;
    selectedTargetTokenId?: string | null;
    disengagedTokens?: Record<string, boolean>;
}

const initialState: EntityState = {
    activeMap: null,
    mapNpcInstances: [],
    currentSceneImageUrl: null,
    mapImageUrl: null,
    spatialIndex: null,
    selectedTargetTokenId: null,
    disengagedTokens: {},
};

export const loadEncounter = createAsyncThunk(
    'entity/loadEncounter',
    ({ concept, imageUrl }: { concept: EncounterConcept, imageUrl: string | null }, { getState }) => {
        const state = getState() as RootState;
        const { staticDataCache } = state.app;
        const character = selectCalculatedActiveCharacterSheet(state);
        if (!staticDataCache || !character) throw new Error("Static data or character not available");
        
        const { map, npcInstances } = generateMapFromConcept(concept, [character], staticDataCache);
        return { map, npcInstances, imageUrl };
    }
);

export const loadCrucibleEncounter = createAsyncThunk(
    'entity/loadCrucibleEncounter',
    ({ concept, imageUrl }: { concept: EncounterConcept, imageUrl: string | null }, { getState }) => {
        const state = getState() as RootState;
        const { staticDataCache } = state.app;
        if (!staticDataCache) throw new Error("Static data not available");

        const { map, npcInstances } = generateMapFromConcept(concept, [], staticDataCache);
        
        const freeForAllNpcs = npcInstances.map(npc => ({ ...npc, teamId: npc.instanceId }));
        const freeForAllTokens = map.tokens.map(token => {
            const correspondingNpc = freeForAllNpcs.find(npc => npc.instanceId === token.npcInstanceId);
            return correspondingNpc ? { ...token, teamId: correspondingNpc.teamId } : token;
        });
        
        const ffaMap = { ...map, tokens: freeForAllTokens };
        return { map: ffaMap, npcInstances: freeForAllNpcs, imageUrl };
    }
);


export const rollInitiative = createAsyncThunk(
    'entity/rollInitiative',
    (_, { getState }) => {
        const state = getState() as RootState;
        const { activeMap, mapNpcInstances } = state.entity;
        const { staticDataCache } = state.app;
        const character = selectCalculatedActiveCharacterSheet(state);
        if (!activeMap || !staticDataCache) throw new Error("Map or static data not available for initiative roll");

        const rolledOrder = activeMap.initiativeOrder.map(entry => {
            let initiative = rollD20();
            if (entry.characterId && character) {
                initiative += (character as any).initiative || 0;
            } else if (entry.npcInstanceId) {
                const npc = mapNpcInstances.find(i => i.instanceId === entry.npcInstanceId);
                const monster = staticDataCache.allMonsters.find(m => m.id === npc?.monsterId);
                if (monster) {
                    // @ts-ignore
                    initiative += Math.floor(((monster as any).abilityScores?.DEX || 10 - 10) / 2);
                }
            }
            return { ...entry, initiative } as any;
        });

        rolledOrder.sort((a: any, b: any) => (b.initiative || 0) - (a.initiative || 0));
        return { initiativeOrder: rolledOrder } as any;
    }
);


export const entitySlice = createSlice({
    name: 'entity',
    initialState,
    reducers: {
        createDefaultSession: (state, action: PayloadAction<Character>) => {
            const map = createDefaultMap([action.payload]);
            state.activeMap = map;
            state.mapImageUrl = '/maps/default.jpg';
            state.spatialIndex = buildSpatialIndex(map) as any;
        },
        resetSimulation: () => initialState,
        updateTokenPosition: (state, action: PayloadAction<{ tokenId: string, x: number, y: number }>) => {
            if (state.activeMap) {
                const token = state.activeMap.tokens.find(t => t.id === action.payload.tokenId);
                if (token) {
                    state.spatialIndex?.update(token as any, (token as any).x, (token as any).y);
                    (token as any).x = action.payload.x;
                    (token as any).y = action.payload.y;
                    state.spatialIndex?.add(token as any);
                }
            }
        },
        teleportToken: (state, action: PayloadAction<{ tokenId: string, x: number, y: number }>) => {
            if (!state.activeMap) return;
            const token = state.activeMap.tokens.find(t => t.id === action.payload.tokenId);
            if (token) {
                (token as any).x = action.payload.x;
                (token as any).y = action.payload.y;
            }
        },
        pushPullSlide: (state, action: PayloadAction<{ tokenId: string, dx: number, dy: number }>) => {
            if (!state.activeMap) return;
            const token = state.activeMap.tokens.find(t => t.id === action.payload.tokenId);
            if (token) {
                (token as any).x = Math.max(0, Math.min((state.activeMap.grid.width - 1), (token as any).x + action.payload.dx));
                (token as any).y = Math.max(0, Math.min((state.activeMap.grid.height - 1), (token as any).y + action.payload.dy));
            }
        },
        setNpcHp: (state, action: PayloadAction<{ instanceId: string, newHp: number }>) => {
            const npc = state.mapNpcInstances.find(i => i.instanceId === action.payload.instanceId);
            if (npc) (npc as any).currentHp = Math.max(0, action.payload.newHp);
        },
        addNpcCondition: (state, action: PayloadAction<{ instanceId: string; effect: EffectInstance }>) => {
            const npc = state.mapNpcInstances.find(i => i.instanceId === action.payload.instanceId);
            if (npc) {
                (npc as any).conditions = (npc as any).conditions || [];
                (npc as any).conditions.push(action.payload.effect);
            }
        },
        removeNpcCondition: (state, action: PayloadAction<{ instanceId: string; effectId: string }>) => {
            const npc = state.mapNpcInstances.find(i => i.instanceId === action.payload.instanceId);
            if (npc && (npc as any).conditions) {
                (npc as any).conditions = (npc as any).conditions.filter((e: any) => e.id !== action.payload.effectId);
            }
        },
        removeNpcFromMap: (state, action: PayloadAction<{ instanceId: string }>) => {
            state.mapNpcInstances = state.mapNpcInstances.filter(i => i.instanceId !== action.payload.instanceId);
            if (state.activeMap) {
                const tokenToRemove = state.activeMap.tokens.find(t => t.npcInstanceId === action.payload.instanceId);
                if (tokenToRemove) state.spatialIndex?.remove(tokenToRemove as any);
                state.activeMap.tokens = state.activeMap.tokens.filter(t => t.npcInstanceId !== action.payload.instanceId);
            }
        },
        despawnToken: (state, action: PayloadAction<{ tokenId: string }>) => {
            if (!state.activeMap) return;
            state.activeMap.tokens = state.activeMap.tokens.filter(t => t.id !== action.payload.tokenId);
        },
        toggleNpcVisibility: (state, action: PayloadAction<string>) => {
            const npc = state.mapNpcInstances.find(i => i.instanceId === action.payload);
            if (npc) (npc as any).isHidden = !(npc as any).isHidden;
        },
        addMonsterToMap: (state, action: PayloadAction<{ monster: Monster; position: { x: number; y: number } }>) => {
            if (!state.activeMap) return;
            const { monster, position } = action.payload;
            const instanceId = crypto.randomUUID();
            const npcInstance: MapNpcInstance = { instanceId, monsterId: monster.id, maxHp: (monster as any).hp?.average || 10, currentHp: (monster as any).hp?.average || 10, teamId: `team-${monster.id}` } as any;
            const token: Token = { id: `token-${instanceId}`, npcInstanceId: instanceId, name: (monster as any).name || monster.id, x: position.x, y: position.y, size: 1, color: '#a83232', teamId: (npcInstance as any).teamId } as any;
            state.mapNpcInstances.push(npcInstance);
            state.activeMap.tokens.push(token);
            state.spatialIndex?.add(token as any);
        },
        setSquadStrategies: (state, action: PayloadAction<Record<string, any>>) => {
            Object.entries(action.payload).forEach(([leaderId, strategy]) => {
                const leader = state.mapNpcInstances.find(npc => npc.instanceId === leaderId);
                if (leader) {
                    (leader as any).strategy = strategy;
                    state.mapNpcInstances.forEach(npc => {
                        if ((npc as any).squadId === (leader as any).squadId) (npc as any).strategy = strategy;
                    });
                }
            });
        },
        resetInitiative: (state) => {
            if (state.activeMap) {
                state.activeMap.initiativeOrder = [] as any;
            }
        },
        addTokensToInitiative: (state, action: PayloadAction<InitiativeEntry[]>) => {
            if (state.activeMap) (state.activeMap.initiativeOrder as any).push(...(action.payload as any));
        },
        removeFromInitiative: (state, action: PayloadAction<string>) => {
            if (state.activeMap) {
                (state.activeMap.initiativeOrder as any) = (state.activeMap.initiativeOrder as any).filter((e: any) => e.id !== action.payload);
            }
        },
        setInitiativeOrder: (state, action: PayloadAction<any[]>) => {
            if (state.activeMap) (state.activeMap.initiativeOrder as any) = action.payload as any;
        },
        setSceneImage: (state, action: PayloadAction<string | null>) => {
            state.currentSceneImageUrl = action.payload;
        },
        setActiveTargetToken: (state, action: PayloadAction<string | null>) => {
            state.selectedTargetTokenId = action.payload;
        },
        setDisengaged: (state, action: PayloadAction<{ tokenId: string; value: boolean }>) => {
            state.disengagedTokens = state.disengagedTokens || {};
            state.disengagedTokens[action.payload.tokenId] = action.payload.value;
        },
        applyTempHp: (state, action: PayloadAction<{ instanceId: string; amount: number }>) => {
            const npc = state.mapNpcInstances.find(i => i.instanceId === action.payload.instanceId);
            if (npc) (npc as any).tempHp = Math.max((npc as any).tempHp || 0, action.payload.amount);
        },
        setActiveMapFromTokens: (state, action: PayloadAction<{ width: number; height: number; tokens: Array<{ id: string; name: string; xNorm: number; yNorm: number; size?: number; color?: string }> }>) => {
            const { width, height, tokens } = action.payload;
            state.activeMap = {
                id: `map-${crypto.randomUUID()}`,
                name: 'Debug Map',
                grid: { width, height, cellSize: 50 } as any,
                terrain: Array(height).fill(0).map(() => Array(width).fill({ type: 'grass', elevation: 0 })),
                features: [],
                objects: [],
                tokens: tokens.map(t => ({
                    id: t.id,
                    name: t.name,
                    x: Math.max(0, Math.min(width - 1, Math.floor(t.xNorm * width))),
                    y: Math.max(0, Math.min(height - 1, Math.floor(t.yNorm * height))),
                    size: t.size || 1,
                    color: t.color || '#64748b',
                })) as any,
                initiativeOrder: [],
                activeInitiativeIndex: null,
            } as any;
            state.spatialIndex = buildSpatialIndex(state.activeMap) as any;
        },
        applyProcessingResult: (state, action: PayloadAction<any>) => {
            const result = action.payload;
            state.mapNpcInstances = result.finalState.mapNpcInstances;
            if (state.activeMap) {
                const deadNpcIds = new Set(
                    state.mapNpcInstances.filter(npc => (npc as any).currentHp <= 0).map(npc => npc.instanceId)
                );
                const currentTokens = state.activeMap.tokens;
                const newTokens = currentTokens.filter(t => !t.npcInstanceId || !deadNpcIds.has(t.npcInstanceId));
                
                if (currentTokens.length !== newTokens.length) {
                    state.activeMap.tokens = newTokens as any;
                    (state.activeMap.initiativeOrder as any) = (state.activeMap.initiativeOrder as any).filter(
                        (e: any) => !e.npcInstanceId || !deadNpcIds.has(e.npcInstanceId)
                    );
                    state.spatialIndex = buildSpatialIndex(state.activeMap) as any;
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadEncounter.fulfilled, (state, action) => {
                state.activeMap = action.payload.map;
                state.mapNpcInstances = action.payload.npcInstances;
                state.mapImageUrl = action.payload.imageUrl;
                state.currentSceneImageUrl = null;
                state.spatialIndex = buildSpatialIndex(action.payload.map) as any;
            })
            .addCase(loadCrucibleEncounter.fulfilled, (state, action) => {
                state.activeMap = action.payload.map;
                state.mapNpcInstances = action.payload.npcInstances;
                state.mapImageUrl = action.payload.imageUrl;
                state.currentSceneImageUrl = null;
                state.spatialIndex = buildSpatialIndex(action.payload.map) as any;
            })
            .addCase(rollInitiative.fulfilled, (state, action) => {
                if (state.activeMap) {
                    (state.activeMap.initiativeOrder as any) = (action.payload as any).initiativeOrder;
                }
            });
    }
});

export const { addMonsterToMap, setSquadStrategies, teleportToken, pushPullSlide, applyTempHp, despawnToken, setActiveTargetToken, setInitiativeOrder, setDisengaged, setActiveMapFromTokens } = entitySlice.actions;
export default entitySlice.reducer;