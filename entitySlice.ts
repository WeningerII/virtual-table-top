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
}

const initialState: EntityState = {
    activeMap: null,
    mapNpcInstances: [],
    currentSceneImageUrl: null,
    mapImageUrl: null,
    spatialIndex: null,
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
        
        // Override team IDs for a free-for-all
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
                initiative += character.initiative;
            } else if (entry.npcInstanceId) {
                const npc = mapNpcInstances.find(i => i.instanceId === entry.npcInstanceId);
                const monster = staticDataCache.allMonsters.find(m => m.id === npc?.monsterId);
                if (monster) {
                    initiative += Math.floor((monster.abilityScores.DEX - 10) / 2);
                }
            }
            return { ...entry, initiative };
        });

        rolledOrder.sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
        return { initiativeOrder: rolledOrder };
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
            state.spatialIndex = buildSpatialIndex(map);
        },
        resetSimulation: () => initialState,
        updateTokenPosition: (state, action: PayloadAction<{ tokenId: string, x: number, y: number }>) => {
            if (state.activeMap) {
                const token = state.activeMap.tokens.find(t => t.id === action.payload.tokenId);
                if (token) {
                    state.spatialIndex?.update(token, token.x, token.y);
                    token.x = action.payload.x;
                    token.y = action.payload.y;
                    state.spatialIndex?.add(token);
                }
            }
        },
        setNpcHp: (state, action: PayloadAction<{ instanceId: string, newHp: number }>) => {
            const npc = state.mapNpcInstances.find(i => i.instanceId === action.payload.instanceId);
            if (npc) npc.currentHp = Math.max(0, action.payload.newHp);
        },
        addNpcCondition: (state, action: PayloadAction<{ instanceId: string; effect: EffectInstance }>) => {
            const npc = state.mapNpcInstances.find(i => i.instanceId === action.payload.instanceId);
            if (npc) {
                if (!npc.conditions) npc.conditions = [];
                npc.conditions.push(action.payload.effect);
            }
        },
        removeNpcCondition: (state, action: PayloadAction<{ instanceId: string; effectId: string }>) => {
            const npc = state.mapNpcInstances.find(i => i.instanceId === action.payload.instanceId);
            if (npc && npc.conditions) {
                npc.conditions = npc.conditions.filter(e => e.id !== action.payload.effectId);
            }
        },
        removeNpcFromMap: (state, action: PayloadAction<{ instanceId: string }>) => {
            state.mapNpcInstances = state.mapNpcInstances.filter(i => i.instanceId !== action.payload.instanceId);
            if (state.activeMap) {
                const tokenToRemove = state.activeMap.tokens.find(t => t.npcInstanceId === action.payload.instanceId);
                if (tokenToRemove) state.spatialIndex?.remove(tokenToRemove);
                state.activeMap.tokens = state.activeMap.tokens.filter(t => t.npcInstanceId !== action.payload.instanceId);
            }
        },
        toggleNpcVisibility: (state, action: PayloadAction<string>) => {
            const npc = state.mapNpcInstances.find(i => i.instanceId === action.payload);
            if (npc) npc.isHidden = !npc.isHidden;
        },
        addMonsterToMap: (state, action: PayloadAction<{ monster: Monster; position: { x: number; y: number } }>) => {
            if (!state.activeMap) return;
            const { monster, position } = action.payload;
            const instanceId = crypto.randomUUID();
            const npcInstance: MapNpcInstance = { instanceId, monsterId: monster.id, maxHp: monster.hp.average, currentHp: monster.hp.average, teamId: `team-${monster.id}` };
            const token: Token = { id: `token-${instanceId}`, npcInstanceId: instanceId, name: monster.name, x: position.x, y: position.y, size: 1, color: '#a83232', teamId: npcInstance.teamId };
            state.mapNpcInstances.push(npcInstance);
            state.activeMap.tokens.push(token);
            state.spatialIndex?.add(token);
        },
        setSquadStrategies: (state, action: PayloadAction<Record<string, any>>) => {
            Object.entries(action.payload).forEach(([leaderId, strategy]) => {
                const leader = state.mapNpcInstances.find(npc => npc.instanceId === leaderId);
                if (leader) {
                    leader.strategy = strategy;
                    state.mapNpcInstances.forEach(npc => {
                        if (npc.squadId === leader.squadId) npc.strategy = strategy;
                    });
                }
            });
        },
        resetInitiative: (state) => {
            if (state.activeMap) {
                state.activeMap.initiativeOrder = [];
            }
        },
        addTokensToInitiative: (state, action: PayloadAction<InitiativeEntry[]>) => {
            if (state.activeMap) state.activeMap.initiativeOrder.push(...action.payload);
        },
        removeFromInitiative: (state, action: PayloadAction<string>) => {
            if (state.activeMap) {
                state.activeMap.initiativeOrder = state.activeMap.initiativeOrder.filter(e => e.id !== action.payload);
            }
        },
        setSceneImage: (state, action: PayloadAction<string | null>) => {
            state.currentSceneImageUrl = action.payload;
        },
        applyProcessingResult: (state, action: PayloadAction<any>) => {
            const result = action.payload;
            state.mapNpcInstances = result.finalState.mapNpcInstances;
            if (state.activeMap) {
                const deadNpcIds = new Set(
                    state.mapNpcInstances.filter(npc => npc.currentHp <= 0).map(npc => npc.instanceId)
                );
                const currentTokens = state.activeMap.tokens;
                const newTokens = currentTokens.filter(t => !t.npcInstanceId || !deadNpcIds.has(t.npcInstanceId));
                
                if (currentTokens.length !== newTokens.length) {
                    state.activeMap.tokens = newTokens;
                    state.activeMap.initiativeOrder = state.activeMap.initiativeOrder.filter(
                        e => !e.npcInstanceId || !deadNpcIds.has(e.npcInstanceId)
                    );
                    state.spatialIndex = buildSpatialIndex(state.activeMap);
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
                state.spatialIndex = buildSpatialIndex(action.payload.map);
            })
            .addCase(loadCrucibleEncounter.fulfilled, (state, action) => {
                state.activeMap = action.payload.map;
                state.mapNpcInstances = action.payload.npcInstances;
                state.mapImageUrl = action.payload.imageUrl;
                state.currentSceneImageUrl = null;
                state.spatialIndex = buildSpatialIndex(action.payload.map);
            })
            .addCase(rollInitiative.fulfilled, (state, action) => {
                if (state.activeMap) {
                    state.activeMap.initiativeOrder = action.payload.initiativeOrder;
                }
            });
    }
});

export const { addMonsterToMap, setSquadStrategies } = entitySlice.actions;
export default entitySlice.reducer;