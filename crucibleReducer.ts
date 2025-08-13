import { CrucibleActionResult, NpcAnimationState, SimState, VTTMap, MapNpcInstance, Token, InitiativeEntry, Monster, TerrainCell, EncounterConcept, VTTObject, StaticGameDataCache } from './types';
import { CrucibleAction } from './crucibleActions';
import { rollD20 } from '../utils/dice';
import { generateMapFromConcept } from '../utils/map';

export interface CrucibleState {
    simState: SimState;
    winner: string | null;
    animationState: NpcAnimationState | null;
    actionResult: CrucibleActionResult | null;
    isAiThinking: boolean;
    activeMap: VTTMap | null;
    mapNpcInstances: MapNpcInstance[];
}

export const initialCrucibleState: CrucibleState = {
    simState: 'idle',
    winner: null,
    animationState: null,
    actionResult: null,
    isAiThinking: false,
    activeMap: null,
    mapNpcInstances: [],
};

const sizeToGridUnits = (size: string): number => {
    switch (size.toLowerCase()) {
        case 'tiny': return 0.5;
        case 'small': return 0.8;
        case 'medium': return 1;
        case 'large': return 2;
        case 'huge': return 3;
        case 'gargantuan': return 4;
        default: return 1;
    }
};

const rollInitiative = (state: CrucibleState, staticDataCache: StaticGameDataCache | null): VTTMap | null => {
    if (!state.activeMap || !staticDataCache) return null;
    const rolledOrder = state.activeMap.initiativeOrder.map(entry => {
        let initiative = rollD20();
        if (entry.npcInstanceId) {
            const npc = state.mapNpcInstances.find(i => i.instanceId === entry.npcInstanceId);
            const monster = staticDataCache.allMonsters.find((m: Monster) => m.id === npc?.monsterId);
            if (monster) {
                const dexMod = Math.floor((monster.abilityScores.DEX - 10) / 2);
                initiative += dexMod;
            }
        }
        return { ...entry, initiative };
    });

    rolledOrder.sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
    return { ...state.activeMap, initiativeOrder: rolledOrder, activeInitiativeIndex: 0 };
}


export const crucibleReducer = (state: CrucibleState, action: CrucibleAction, staticDataCache: StaticGameDataCache | null): CrucibleState => {
    switch (action.type) {
        case 'SET_SIM_STATE':
            return { ...state, simState: action.payload };
        case 'SET_WINNER':
            return { ...state, winner: action.payload, simState: 'finished' };
        case 'SET_ANIMATION_STATE':
            return { ...state, animationState: action.payload };
        case 'SET_ACTION_RESULT':
            return { ...state, actionResult: action.payload };
        case 'SET_IS_AI_THINKING':
            return { ...state, isAiThinking: action.payload };
        case 'RESET_SIMULATION':
            return { ...initialCrucibleState, simState: 'idle' };
        
        case 'LOAD_ENCOUNTER': {
            const encounter = action.payload;
            if (!staticDataCache) return state;

            // Use the utility to generate the base map and instances
            const { map: baseMap, npcInstances: baseNpcInstances } = generateMapFromConcept(encounter, [], staticDataCache);

            // Override team IDs for a free-for-all scenario
            const freeForAllNpcInstances: MapNpcInstance[] = baseNpcInstances.map(npc => ({
                ...npc,
                teamId: `team-${crypto.randomUUID()}`
            }));
            
            const instanceTeamMap = new Map(freeForAllNpcInstances.map(i => [i.instanceId, i.teamId]));

            const freeForAllTokens: Token[] = baseMap.tokens.map(token => {
                if (token.npcInstanceId && instanceTeamMap.has(token.npcInstanceId)) {
                    return { ...token, teamId: instanceTeamMap.get(token.npcInstanceId) };
                }
                return token;
            });

            const initiativeEntries: InitiativeEntry[] = freeForAllTokens.map(token => ({
                id: token.id, name: token.name, initiative: null,
                characterId: token.characterId, npcInstanceId: token.npcInstanceId, imageUrl: token.imageUrl,
            }));
            
            let newMap: VTTMap = {
                ...baseMap,
                tokens: freeForAllTokens,
                initiativeOrder: initiativeEntries,
            };

            const tempState = { ...state, activeMap: newMap, mapNpcInstances: freeForAllNpcInstances };
            const rolledMap = rollInitiative(tempState, staticDataCache);

            return { ...tempState, activeMap: rolledMap, simState: 'ready' };
        }
        
        case 'UPDATE_TOKENS':
            if (!state.activeMap) return state;
            return { ...state, activeMap: { ...state.activeMap, tokens: action.payload } };
        
        case 'DEAL_DAMAGE_TO_NPC': {
            const { instanceId, damage } = action.payload;
            
            const updatedNpcs = state.mapNpcInstances.map(npc => {
                if (npc.instanceId === instanceId) {
                    return { ...npc, currentHp: Math.max(0, npc.currentHp - damage) };
                }
                return npc;
            });
        
            const deadInstanceIds = new Set(
                updatedNpcs.filter(n => n.currentHp <= 0).map(n => n.instanceId)
            );
        
            if (deadInstanceIds.size === 0) {
                return { ...state, mapNpcInstances: updatedNpcs };
            }
        
            const livingNpcs = updatedNpcs.filter(npc => npc.currentHp > 0);
            
            if (!state.activeMap) {
                return { ...state, mapNpcInstances: livingNpcs };
            }
            
            const oldInitiativeOrder = state.activeMap.initiativeOrder;
            const oldActiveIndex = state.activeMap.activeInitiativeIndex;
        
            const remainingNpcInstanceIds = new Set(livingNpcs.map(n => n.instanceId));
            
            const newTokens = state.activeMap.tokens.filter(t => !t.npcInstanceId || remainingNpcInstanceIds.has(t.npcInstanceId));
            const newInitiativeOrder = oldInitiativeOrder.filter(entry => !entry.npcInstanceId || (entry.npcInstanceId && remainingNpcInstanceIds.has(entry.npcInstanceId)));
        
            let newActiveIndex = oldActiveIndex;
            if (oldActiveIndex !== null && oldInitiativeOrder.length > newInitiativeOrder.length) {
                const removedBeforeCount = oldInitiativeOrder.slice(0, oldActiveIndex).filter(entry => 
                    entry.npcInstanceId && deadInstanceIds.has(entry.npcInstanceId)
                ).length;
                newActiveIndex -= removedBeforeCount;
                if (newActiveIndex >= newInitiativeOrder.length) {
                    newActiveIndex = newInitiativeOrder.length > 0 ? 0 : null;
                }
            }
            
            const newActiveMap = { 
                ...state.activeMap,
                tokens: newTokens,
                initiativeOrder: newInitiativeOrder,
                activeInitiativeIndex: newActiveIndex,
            };
        
            return { ...state, mapNpcInstances: livingNpcs, activeMap: newActiveMap };
        }

        case 'ADVANCE_INITIATIVE': {
            if (!state.activeMap || state.activeMap.activeInitiativeIndex === null || state.activeMap.initiativeOrder.length === 0) return state;
            const newIndex = (state.activeMap.activeInitiativeIndex + 1) % state.activeMap.initiativeOrder.length;
            return { ...state, activeMap: { ...state.activeMap, activeInitiativeIndex: newIndex } };
        }
        
        case 'ADD_TOKENS_TO_INITIATIVE': {
            if (!state.activeMap) return state;
            const initiativeEntries: InitiativeEntry[] = state.activeMap.tokens.map(token => ({
                id: token.id, name: token.name, initiative: null,
                characterId: token.characterId, npcInstanceId: token.npcInstanceId, imageUrl: token.imageUrl,
            }));
            return { ...state, activeMap: { ...state.activeMap, initiativeOrder: initiativeEntries, activeInitiativeIndex: null } };
        }
        case 'ROLL_INITIATIVE': {
            const rolledMap = rollInitiative(state, staticDataCache);
            if (!rolledMap) return state;
            return { ...state, activeMap: rolledMap };
        }
        case 'RESET_INITIATIVE': {
            if (!state.activeMap) return state;
            return { ...state, activeMap: { ...state.activeMap, initiativeOrder: [], activeInitiativeIndex: null } };
        }
        case 'REMOVE_FROM_INITIATIVE': {
            if (!state.activeMap) return state;
            return { ...state, activeMap: { ...state.activeMap, initiativeOrder: state.activeMap.initiativeOrder.filter(e => e.id !== action.payload) } };
        }

        default:
            return state;
    }
};