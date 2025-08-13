import { Spell, EncounterStrategy } from './data';
import { SpellTemplate, VTTTool, ObjectComponent, ActionItem, TerrainCell, BTNodeStatus, NodeMetadata, ParallelPolicy } from './primitives';
import * as THREE from 'three';
import { MapNpcInstance } from './character';
export type { MapNpcInstance };
import { DEBUG_MODE } from '../../constants';
import { SpatialGrid } from './engine/spatialGrid.service';

// Re-export for use in other modules
export { SpatialGrid } from './engine/spatialGrid.service';

// Reconstructing types based on usage in the app

export interface Zone {
    name: string;
    polygon: { x: number; y: number }[];
    description: string;
    tags: string[];
}

// Complex Path for map generation concepts
export interface Path {
    name: string;
    points: { x: number; y: number }[];
    width: number;
    type: 'dirt' | 'stone' | 'worn';
}

export interface MapComposition {
    focalPoint: {
        x: number;
        y: number;
        description: string;
    };
    sightlines?: {
        from: { x: number; y: number };
        to: { x: number; y: number };
        description: string;
    }[];
}

export interface EnvironmentalData {
    mood: string;
    timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
    lighting: string;
    weather: 'clear' | 'rain' | 'snow' | 'fog' | 'storm';
}

export interface EncounterConcept {
    description: string;
    theme: string;
    placementStrategy: string;
    environmentalData: EnvironmentalData;
    composition: MapComposition;
    zones: Zone[];
    paths?: Path[];
    monsters: {
        monsterId: string;
        name: string;
        position: { x: number; y: number };
    }[];
    mapObjects: {
        blueprintId: string;
        position: { x: number; y: number };
        rotationY: number;
        scaleModifier: number;
    }[];
    playerStartZone: {
        x: number;
        y: number;
        width: number;
        height: number;
        rationale: string;
    };
    mapFeatures?: any[];
    generatedBlueprints?: ObjectBlueprint[];
    environmentalDescriptors?: {
        vegetation?: string;
        stone?: string;
        atmosphere?: string;
        [key: string]: string | undefined;
    };
}

export type OnDestructionEffect =
    | { type: 'create_terrain'; terrainType: TerrainCell['type']; radius: number }
    | { type: 'deal_damage'; damageType: string; damageDice: string; radius: number }
    | { type: 'create_hazard'; hazardType: 'fire' | 'oil'; radius: number }
    | { type: 'create_obscurement'; radius: number };

export interface VTTObject {
    id: string;
    blueprintId: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
    color: string;
    // Environmental Interaction properties
    interactable?: boolean;
    integrity?: number; // HP for objects
    ac?: number;
    onDestruction?: OnDestructionEffect;
    status?: 'burning';
}


export interface Token {
    id: string;
    characterId?: string;
    npcInstanceId?: string;
    name: string;
    x: number;
    y: number;
    size: number;
    color: string;
    imageUrl?: string;
    teamId?: string;
}

export interface InitiativeEntry {
    id: string;
    name: string;
    initiative: number | null;
    characterId?: string;
    npcInstanceId?: string;
    imageUrl?: string;
}

export interface VTTMap {
    id: string;
    name: string;
    grid: {
        width: number;
        height: number;
        cellSize: number;
    };
    terrain: TerrainCell[][];
    features: Zone[];
    objects: VTTObject[];
    tokens: Token[];
    initiativeOrder: InitiativeEntry[];
    currentSceneImageUrl?: string | null;
    activeInitiativeIndex: number | null;
}

export interface Viewport {
    panOffset: { x: number; y: number };
    zoom: number;
}

export interface SpellTargetingState {
    spell: Spell;
    template: SpellTemplate;
}

export interface TerrainModificationRequest {
    position: THREE.Vector3;
    template: SpellTemplate;
    terrainType: TerrainCell['type'];
}

// Simple path for pathfinding results. Renamed to avoid conflict.
export type PointPath = { x: number; y: number }[];

export interface NpcAnimationState {
    tokenId: string;
    path: PointPath; // Using the renamed PointPath
    startTime: number;
    duration: number;
}

export interface TacticalObject {
    id: string;
    blueprintId: string;
    name: string;
    position: { x: number; y: number };
    providesCover: boolean;
    isDestructible: boolean;
    isFlammable?: boolean;
    toppleDC?: number;
    description: string;
}

export interface BattlefieldState {
    self: {
        monsterId: string;
        instanceId: string;
        instanceName: string;
        teamId: string;
        currentHp: number;
        maxHp: number;
        actions: ActionItem[];
        position: { x: number; y: number; };
        speed: number;
        conditions: string[];
        lastAttackerId?: string;
        archetype?: string;
        strategy?: EncounterStrategy;
        squadId?: string;
        squadTargetId?: string;
        personalityTraits?: string[];
        bonds?: string[];
        goals?: string[];
    };
    allies: {
        id: string;
        name: string;
        hpPercentage: number;
        position: { x: number; y: number; };
        conditions: string[];
        ac?: number;
        archetype?: string;
        isLeader?: boolean;
        squadId?: string;
    }[];
    enemies: {
        id: string;
        name: string;
        hpPercentage: number;
        position: { x: number; y: number; };
        conditions: string[];
        ac?: number;
        archetype?: string;
    }[];
    terrainGrid: TerrainCell[][];
    obstacles: { x: number; y: number }[];
    environmentalObjects?: TacticalObject[];
    activeMap?: VTTMap | null;
    spatialIndex?: SpatialGrid | null;
}

export interface DialogueTurn {
    speaker: 'player' | 'npc';
    text: string;
}

export interface Conversation {
    npcInstanceId: string;
    npcName: string;
    history: DialogueTurn[];
}

export interface ActionRollResult {
    attackerId: string;
    attackRoll: number;
    attackTotal: number;
    hit: boolean;
    damageRoll: string;
    damageTotal: number;
    narrative: string;
}

export type CrucibleActionResult = ActionRollResult & { attackerName: string; actionName: string };

export interface NpcTurnResult {
    rationale: string;
    dialogue: string;
    destination: { x: number; y: number } | null;
    actionId: string;
    targetId: string | null;
    squadTargetId?: string | null;
    attackRoll: number;
    attackTotal: number;
    hit: boolean;
    damageRoll: string;
    damageTotal: number;
    narrative: string;
}

export interface VFXRequest {
    type: string;
    position: THREE.Vector3;
    targetPosition?: THREE.Vector3;
    spell?: Spell;
}

export interface UIRollResult {
    title: string;
    roll: number;
    modifier: number;
    total: number;
    isCrit: boolean;
    isCritFail: boolean;
    damage?: { result: string, type: string };
    brutalCritDice?: number;
    targetName?: string;
    outcome?: 'HIT' | 'MISS' | 'CRITICAL' | 'FAIL';
    action?: ActionItem;
}

export interface ObjectBlueprint {
    id: string;
    name: string;
    icon?: string;
    components: ObjectComponent[];
    tags: string[];
    color?: string;
    interactable?: boolean;
    integrity?: number;
    ac?: number;
    flammable?: boolean;
    fragile?: boolean;
    strengthCheckDC?: number;
    onDestruction?: OnDestructionEffect;
}

// --- Local AI Behavior Tree Types ---

export interface Point {
    x: number;
    y: number;
}
export interface AiTurnIntent {
    actionId: string | null;
    targetId: string | null;
    destination: Point | null;
    squadTargetId?: string | null;
    rationale: string;
    dialogue: string;
}
export interface AIBlackboard {
    battlefieldState: BattlefieldState;
    pathfinder: (startX: number, startY: number, endX: number, endY: number, grid: TerrainCell[][], obstacles: Point[]) => Point[] | null;
    result: AiTurnIntent;
    currentTargetId?: string | null;
    visibleEnemies?: string[];
    moveTarget?: Point;
    chosenAction?: ActionItem;
}
export type NodeTypeName = 'Sequence' | 'Selector' | 'Parallel' | 'FindVisibleEnemiesNode' | 'HasVisibleEnemiesNode' | 'FindClosestEnemyNode' | 'MoveToTargetNode' | 'AttackTargetNode' | 'IsEnemyInMeleeNode' | 'MoveAwayFromTargetNode' | 'FindBestTargetNode' | 'PrioritizeLastAttackerNode' | 'AssignSquadTargetNode' | 'HasSquadTargetNode' | 'SetTargetToSquadTargetNode' | 'IsHealthLowNode' | 'FleeNode' | 'FindCoverNode' | 'UseMostDamagingAbilityNode' | 'UseBestAreaOfEffectNode' | 'FindMostWoundedEnemyNode';
export interface BehaviorTreeNodeDefinition {
    type: NodeTypeName;
    args?: any[];
    children?: BehaviorTreeNodeDefinition[];
    metadata?: NodeMetadata;
}

// This is the abstract class that all nodes will extend.
export abstract class BTNode {
    public readonly id: string;
    protected readonly metadata: NodeMetadata;
    private executionStats: { totalExecutions: number; totalExecutionTime: number; resultCounts: { [key in BTNodeStatus]: number; }; };

    constructor(metadata?: NodeMetadata) {
        this.id = crypto.randomUUID();
        this.metadata = metadata || {};
        this.executionStats = { totalExecutions: 0, totalExecutionTime: 0, resultCounts: { [BTNodeStatus.SUCCESS]: 0, [BTNodeStatus.FAILURE]: 0, [BTNodeStatus.RUNNING]: 0, } };
    }
    public tick(board: AIBlackboard): BTNodeStatus {
        const startTime = performance.now();
        if (this.metadata.breakpoints && DEBUG_MODE) {
          console.log(`%c[BT BREAKPOINT] %cNode: %c${this.constructor.name} (${this.metadata.name || this.id})`, 'color: #8A2BE2; font-weight: bold;', 'color: default;', 'color: #3498DB; font-weight: bold;', { blackboard: board, stats: this.executionStats });
        }
        try {
            const result = this.execute(board);
            this.updateExecutionStats(startTime, result);
            return result;
        } catch (error) {
            console.error(`Error executing BT node ${this.constructor.name} (${this.id}):`, error);
            this.updateExecutionStats(startTime, BTNodeStatus.FAILURE);
            return BTNodeStatus.FAILURE;
        }
    }
    private updateExecutionStats(startTime: number, result: BTNodeStatus): void {
        const executionTime = performance.now() - startTime;
        this.executionStats.totalExecutions++;
        this.executionStats.totalExecutionTime += executionTime;
        this.executionStats.resultCounts[result]++;
        const PERFORMANCE_WARNING_THRESHOLD_MS = 5;
        if (executionTime > PERFORMANCE_WARNING_THRESHOLD_MS) {
            console.warn(`Slow BT node execution: ${this.constructor.name} (${this.metadata.name || 'Unnamed'}) took ${executionTime.toFixed(2)}ms`);
        }
    }
    protected abstract execute(board: AIBlackboard): BTNodeStatus;
}
