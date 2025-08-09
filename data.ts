import { EffectInstance } from './effects';
import { FeatEffect, ChoiceOption, Prerequisite, EnvironmentalInteractionEffect } from './effects';
import { CasterType, DamagePart, EffectDuration, ItemRarity, MonsterType, Movement, SpellTemplate, TerrainCell, WeaponProperty, ActionItem, MonsterAbilityScores, ActionType } from './primitives';
import type { ObjectBlueprint } from './vtt';
import { EffectType, ActionCost, Ability } from './enums';

// --- Core Gameplay & Combat ---
export interface ActionCategory {
    title: string;
    subtitle?: string;
    description?: string;
    items: ActionItem[];
}

// --- Spells ---
export interface SpellDamage {
    dice: string;
    type: string;
}

export interface SpellSave {
    ability: Ability;
    effect: string;
}

export interface ApplyConditionEffect {
    type: EffectType.ApplyCondition;
    conditionId: string;
    duration: EffectDuration;
    target?: 'self' | 'allies_in_aoe' | 'enemies_in_aoe';
    maxTargets?: number;
}
export interface ApplyConditionOnFailEffect {
    type: EffectType.ApplyConditionOnFail;
    conditionId: string;
    duration: EffectDuration;
}
export interface ModifyTerrainEffect {
    type: EffectType.ModifyTerrain;
    terrainType: TerrainCell['type'];
    damageOnMove?: string;
}
export interface SummonCreatureEffect {
    type: EffectType.SummonCreature;
    companionId: string;
}
export interface SummonChoiceEffect {
    type: EffectType.SummonChoice;
    options: {
        label: string;
        cr: string;
        count: number;
    }[];
    filter: {
        type: MonsterType;
    };
}

export type SpellEffect = ApplyConditionEffect | ApplyConditionOnFailEffect | ModifyTerrainEffect | SummonCreatureEffect | SummonChoiceEffect | EnvironmentalInteractionEffect;

export interface Spell {
    id: string;
    name: string;
    description: string;
    higherLevel?: string;
    level: number;
    school: string;
    castingTime: string;
    range: string;
    components: string;
    duration: string;
    requiresConcentration: boolean;
    ritual: boolean;
    classIds?: string[];
    attackType?: 'melee' | 'ranged';
    damage?: SpellDamage;
    savingThrow?: SpellSave;
    summonsCompanionId?: string; 
    template?: SpellTemplate;
    effects?: SpellEffect[];
    cost?: ActionCost;
    interactionType?: string;
}

// --- Monsters ---
export interface MonsterAction { name: string; description: string; }
export interface SpecialTrait { name: string; description: string; savingThrow?: { ability: Ability; dc: number; effect: string }; areaOfEffect?: { type: 'sphere' | 'cone' | 'line' | 'cube', size: number }; }
export interface LegendaryAction { name: string; description: string; }
export interface LairAction { description: string; name?: string; }

export interface Monster {
    id: string;
    name: string;
    description?: string;
    size: string;
    type: MonsterType;
    tags?: string[];
    alignment: string;
    ac: { value: number; type?: string };
    hp: { average: number; formula: string };
    speed: Movement;
    abilityScores: MonsterAbilityScores;
    savingThrows?: { ability: string; bonus: number }[];
    skills?: { skill: string; bonus: number }[];
    damageVulnerabilities?: string[];
    damageResistances?: string[];
    damageImmunities?: string[];
    conditionImmunities?: string[];
    senses: { [sense: string]: number };
    languages: string[];
    challengeRating: string;
    xp: number;
    specialTraits?: SpecialTrait[];
    actions?: ActionItem[];
    reactions?: ActionItem[];
    legendaryActions?: LegendaryAction[];
    lairActions?: LairAction[];
    archetype?: 'brute' | 'skirmisher' | 'leader' | 'controller' | 'follower' | 'artillery';
    personalityTraits?: string[];
    bonds?: string[];
    goals?: string[];
}

// --- Classes & Progression ---
export interface ClassFeature {
    id?: string;
    name: string;
    description: string;
    level: number;
    effects?: FeatEffect[];
    choiceOptions?: ChoiceOption[];
    limitedUse?: {
        id?: string;
        usesByLevel: (number | string)[];
        per: 'shortRest' | 'longRest';
        dieSizeByLevel?: { [level: number]: number };
    };
    interactionType?: string;
    template?: SpellTemplate;
    duration?: string;
    cost?: ActionCost;
}
export interface Subclass {
    id: string;
    name: string;
    source: string;
    features: ClassFeature[];
    grantedSpells?: { level: number; spellIds: string[] }[];
}
export type StartingEquipmentOption =
    | { itemId: string; quantity: number }
    | { packId: string }
    | { choice: StartingEquipmentOption[][] }
    | { gold: number }
    | { goldRoll: string };

export interface DndClass {
    id: string;
    name: string;
    source: string;
    hitDie: number;
    traits: Trait[];
    features: ClassFeature[];
    subclasses: Subclass[];
    progressionTable?: { [key: string]: any }[];
    casterType: CasterType;
    spellcasting?: {
        ability: Ability;
        preparationType: 'prepared' | 'known';
        schoolRestrictions?: string[];
    };
    startingEquipment?: StartingEquipmentOption[];
    startingGoldRoll?: string;
    iconId?: string;
}
export interface FightingStyle { id: string; name: string; description: string; effects?: FeatEffect[]; }
export interface Maneuver { id: string; name: string; description: string; effects?: FeatEffect[]; }
export interface Invocation { id: string; name: string; description: string; prerequisites: Prerequisite[]; effects?: FeatEffect[]; }
export interface Metamagic { id: string; name: string; description: string; sorceryPointCost: number | string; effects?: FeatEffect[]; }
export interface ArtificerInfusion { id: string; name: string; description: string; minLevel?: number; itemTypeFilter: string[]; attunement?: boolean; createsCompanionId?: string; effects?: FeatEffect[]; }
export interface Rune { id: string; name: string; description: string; passiveEffect: string; activeEffect: string; }

// --- AI Strategy Types ---
export interface TargetingPriority {
    priority: 'PRIMARY' | 'SECONDARY' | 'AVOID';
    targetType: 'lowest_hp' | 'highest_hp' | 'closest' | 'farthest' | 'highest_damage_output' | 'lowest_ac' | 'highest_ac' | 'healer' | 'controller' | 'brute' | 'skirmisher' | 'leader' | 'follower';
    weight: number;
}

export interface EncounterStrategy {
    objective: string;
    rationale: string;
    targetingPriorities: TargetingPriority[];
}

// --- AI Archetype Types ---
export interface AiArchetypeIndexEntry {
    id: string;
    name: string;
}
export interface AiArchetype {
    id: string;
    description: string;
    root: any; // JSON representation of BT root node
}

// --- Backgrounds ---
export interface BackgroundFeature {
    name: string;
    description: string;
    effects?: FeatEffect[];
}
export interface Background {
    id: string;
    name: string;
    source: string;
    feature: BackgroundFeature;
    traits: Trait[];
    startingGold: number;
}
// --- Companions ---
export interface CompanionBlueprint {
    id: string;
    name: string;
    creatureType: string;
    speed: Movement;
    actions: ActionItem[];
    reactions?: ActionItem[];
    canBeHorde?: boolean;
    hpFormula?: string;
    acFormula?: string;
    hp?: number;
    ac?: number;
}

// --- Species & Feats ---
export interface Trait {
    id: string;
    name: string;
    description: string;
    effects?: FeatEffect[];
    choiceOptions?: ChoiceOption[];
}
export interface Species {
    id:string;
    name: string;
    source: string;
    iconUrl: string;
    traits: Trait[];
    description?: string;
    creatureType?: 'Humanoid' | 'Fey' | 'Construct' | 'Celestial' | 'Monstrosity' | 'Undead' | 'Object' | 'Ooze' | 'Giant';
    subraces?: Omit<Species, 'subraces'>[];
}
export interface Feat {
    id: string;
    name:string;
    description: string;
    prerequisites: Prerequisite[];
    effects?: FeatEffect[];
    choiceOptions?: ChoiceOption[];
}

// --- Items ---
export interface Item {
    id: string;
    name: string;
    costInCopper: number;
    weight: number;
    description: string;
    tags: string[];
    category?: string;
    rarity?: ItemRarity;
    requiresAttunement?: boolean;
    effects?: FeatEffect[];
}
export interface Tool extends Item {
    tags: string[];
    category: "Artisan's Tools" | "Gaming Set" | "Musical Instrument" | "Tool" | "Kit";
}

export interface Language {
    id: string;
    name: string;
    description: string;
    script: string;
    typicalSpeakers: string[];
}

export interface Armor extends Item {
    tags: string[];
    armorType: 'light' | 'medium' | 'heavy' | 'none';
    baseAc: number;
    strengthRequirement?: number;
    stealthDisadvantage?: boolean;
}
export interface Shield extends Item {
    tags: string[];
    acBonus: number;
}
export interface Weapon extends Item {
    tags: string[];
    weaponType: 'simple' | 'martial';
    damageDice: string;
    damageType: string;
    properties: WeaponProperty[];
    range?: {
        normal: number;
        long?: number;
    };
    versatileDamage?: string;
}
export interface EquipmentPack {
    id: string;
    name: string;
    costInCopper: number;
    contents: { itemId: string, quantity: number }[];
}

// --- Static Data Cache ---
export interface StaticGameDataCache {
    allFeats: Feat[];
    allFightingStyles: FightingStyle[];
    allManeuvers: Maneuver[];
    allInvocations: Invocation[];
    allMetamagic: Metamagic[];
    allInfusions: ArtificerInfusion[];
    allCompanions: { [key: string]: CompanionBlueprint };
    allConditions: Omit<EffectInstance, 'id'>[];
    allTools: Tool[];
    allLanguages: Language[];
    allRunes: Rune[];
    allSpells: Spell[];
    equipmentPacks: EquipmentPack[];
    multiclassingData: any;
    spellcastingTables: any;
    allClasses: DndClass[];
    allSpecies: Species[];
    allBackgrounds: Background[];
    allItems: Item[];
    allMonsters: Monster[];
    objectBlueprints: ObjectBlueprint[];
    terrainTypes: string[];
    allAiArchetypes: AiArchetype[];
    actionsAndConditions?: {
        actionCategories: ActionCategory[];
        conditionsCategory: ActionCategory;
    };
}
