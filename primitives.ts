import type { Character, PartialCharacter } from './character';
import type { GenerationStep } from './generation';
import type { StaticGameDataCache } from './data';
import type { TriggeredEffect } from './effects';
import { Ability } from './enums';

export { Ability };

export type AppMode = 'home' | 'builder' | 'play' | 'bestiary' | 'genesis' | 'crucible' | 'worldbuilder';

export type MonsterType = 'Aberration' | 'Beast' | 'Celestial' | 'Construct' | 'Dragon' | 'Elemental' | 'Fey' | 'Fiend' | 'Giant' | 'Humanoid' | 'Monstrosity' | 'Ooze' | 'Plant' | 'Undead';

export type CasterType = 'full' | 'half' | 'third' | 'pact' | 'none';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary' | 'artifact';

export type WeaponProperty = 'ammunition' | 'finesse' | 'heavy' | 'light' | 'loading' | 'range' | 'reach' | 'special' | 'thrown' | 'versatile' | 'two-handed';

export type EncumbranceStatus = 'none' | 'encumbered' | 'heavily_encumbered';

export type EffectDuration =
    | 'concentration'
    | '1_round'
    | '1_minute'
    | '10_minutes'
    | '1_hour'
    | '8_hours'
    | '24_hours'
    | 'short_rest'
    | 'long_rest'
    | 'permanent'
    | 'special';

export type InnateSpellFrequency = 'at-will' | '1/long_rest' | '1/short_rest';

export type LogEntryType = 'roll' | 'attack' | 'damage' | 'heal' | 'narrative' | 'system' | 'spell' | 'dialogue';

export type ActionType = 'action' | 'bonus' | 'reaction' | 'free';

export type EventTrigger = 'on_attack_roll' | 'on_damage_roll' | 'on_ability_check' | 'on_saving_throw';

export type WildShapeEquipmentOption = 'merge' | 'drop' | 'wear';

export type SpellTemplateType = 'cone' | 'sphere' | 'line' | 'cube';

export type VTTTool = 'select' | 'pan' | 'build' | 'terrainPainter' | 'castSpell' | 'delete' | 'measure';

export type SimState = 'idle' | 'generating' | 'ready' | 'running' | 'paused' | 'finished';

// --- NEW for Adjudicator Engine ---
export type GameEventType =
  | 'DECLARE_ATTACK'
  | 'DEAL_DAMAGE'
  | 'DEAL_DAMAGE_TO_OBJECT'
  | 'APPLY_EFFECT'
  | 'CAST_SPELL'
  | 'MOVE_TOKEN'
  | 'HEAL_TARGET'
  | 'DODGE_ACTION'
  | 'USE_FEATURE'
  | 'SPEND_RESOURCE'
  | 'SPEND_ACTION'
  | 'ATTEMPT_GRAPPLE_ESCAPE'
  | 'HELP_ACTION'
  | 'HIDE_ACTION'
  | 'SEARCH_ACTION'
  | 'LOG_EVENT';

export type PlayerChoiceType =
  | 'saving_throw'
  | 'reaction'
  | 'select_target';

// --- NEW for Local AI ---
export enum BTNodeStatus {
    SUCCESS,
    FAILURE,
    RUNNING,
}

export type NodeMetadata = Readonly<{
    name?: string;
    description?: string;
    debugColor?: string;
    breakpoints?: boolean;
}>;

export enum ParallelPolicy {
    RequireOne, // Succeeds as soon as one child succeeds. Fails if all children fail.
    RequireAll, // Succeeds if all children succeed. Fails as soon as one child fails.
}
// --- END NEW ---

export interface Movement {
    walk?: number;
    fly?: number;
    swim?: number;
    climb?: number;
    burrow?: number;
    hover?: boolean;
}

export interface DamagePart {
    dice: string;
    bonus: number;
    type: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: LogEntryType;
  message: string;
}

export interface Currency {
    pp: number;
    gp: number;
    ep: number;
    sp: number;
    cp: number;
}

export interface SpellTemplate {
    type: SpellTemplateType;
    size: number; // e.g., radius for sphere, length for cone/line
    size2?: number; // e.g., width for line
}

export interface TerrainCell {
    type: 'grass' | 'water' | 'difficult' | 'wall' | 'dirt' | 'stone' | 'sand';
    elevation?: number;
}

export interface ActionItem {
    name: string;
    description?: string;
    cost?: string;
    modifier?: string;
    attackBonus?: number;
    damageParts?: DamagePart[];
    savingThrow?: { ability: Ability; dc: number; effect: string };
    triggeredEffects?: TriggeredEffect[];
    attackRoll?: string; // For companion AI rolls
    damageRoll?: string; // For companion AI rolls
    rerollDamage?: number[];
    critRange?: number;
    brutalCritDice?: number;
    canSmite?: boolean;
    range?: number;
    reach?: number;
    areaOfEffect?: { type: 'sphere' | 'cone' | 'line' | 'cube', size: number };
    properties?: WeaponProperty[];
    attackType?: 'melee' | 'ranged';
    usage?: { type: 'recharge' | 'per_day' | 'at_will', value?: number | string };
}

export interface MonsterAbilityScores { STR: number; DEX: number; CON: number; INT: number; WIS: number; CHA: number; }

export type GeometryDef =
| { type: 'box', size: [number, number, number] }
| { type: 'sphere', radius: number, widthSegments?: number, heightSegments?: number }
| { type: 'cylinder', radiusTop?: number, radiusBottom?: number, height?: number, radialSegments?: number }
| { type: 'dodecahedron', radius: number, detail?: number }
| { type: 'icosahedron', radius: number, detail?: number }
| { type: 'cone', radius?: number, height?: number, radialSegments?: number }
| { type: 'gltf', url: string };

export interface MaterialDef {
    color?: string;
    roughness?: number;
    metalness?: number;
    emissive?: string;
    transparent?: boolean;
    opacity?: number;
}

export interface ObjectComponent {
    geometry: GeometryDef;
    material: MaterialDef;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
}

export interface GenesisState {
    isLoading: boolean;
    progressMessage: string;
    character: PartialCharacter | null;
    currentStep: GenerationStep | null;
    error: string | null;
    prompt: string | null;
}

export interface AppState {
    roster: Character[];
    activeCharacterId: string | null;
    mode: AppMode;
    isDmMode: boolean;
    staticDataCache: StaticGameDataCache | null;
    monsterToSummon: string | null;
    dataStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    genesisState: GenesisState;
}