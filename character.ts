import { Feat, Background, ClassFeature, DndClass, Item, Monster, Species, Spell, Trait, SummonChoiceEffect, Invocation, EncounterStrategy } from './data';
import { FeatEffect, EffectInstance } from './effects';
import { Ability, Currency, EffectDuration, EncumbranceStatus, InnateSpellFrequency, MonsterType, Movement, WildShapeEquipmentOption, DamagePart, ActionItem, GameEventType, PlayerChoiceType } from './primitives';

export type { ActionItem };

// --- Backstory & Physical ---
export interface BackstoryDetails {
    personality: string;
    ideals: string;
    bonds: string;
    flaws: string;
    backstory: string;
    notes: string;
}
export interface PhysicalCharacteristics {
    age: string;
    height: string;
    weight: string;
    eyes: string;
    skin: string;
    hair: string;
    gender: string;
    alignment: string;
    faith: string;
}

// --- NPC Instance on Map ---
export interface NpcBehavior {
    type: 'patrol';
    points: { x: number; y: number }[];
    currentPatrolIndex?: number;
}

export interface MapNpcInstance {
    instanceId: string;
    monsterId: string;
    currentHp: number;
    maxHp: number;
    isHidden?: boolean;
    behavior?: NpcBehavior;
    memory?: string[];
    conditions?: EffectInstance[];
    teamId?: string;
    lastAttackerId?: string;
    isLeader?: boolean;
    squadId?: string;
    squadTargetId?: string;
    strategy?: EncounterStrategy;
}

// --- AI Tactical Decision Types ---
export interface NpcActionDecision {
    actionId: string;
    targetId: string | null;
    destination: { x: number; y: number } | null;
    rationale: string;
    narrative: string;
}

// --- AI Character Generation ---
export interface CharacterConcept {
    name: string;
    backstory: {
        personality: string;
        ideals: string;
        bonds: string;
        flaws: string;
    };
    speciesName: string;
    backgroundName: string;
    abilityScores: {
        STRENGTH: number;
        DEXTERITY: number;
        CONSTITUTION: number;
        INTELLIGENCE: number;
        WISDOM: number;
        CHARISMA: number;
    };
    classPlan: {
        className: string;
        subclassName: string;
        levels: number;
    }[];
    skillProficiencies: string[];
    featNames: string[];
    fightingStyleName?: string;
    suggestedSpells?: string[];
    suggestedInfusions?: string[];
    suggestedManeuvers?: string[];
    suggestedMetamagic?: string[];
    suggestedInvocations?: string[];
    magicInitiateClassName?: string;
    magicInitiateCantrip?: string;
    magicInitiateLevel1Spell?: string;
}

export type PartialCharacter = Partial<Character>;

// --- Game Events & Player Choices (NEW FOR ADJUDICATOR ENGINE) ---
export interface BaseGameEvent {
  type: GameEventType;
  sourceId: string;
}
export interface DeclareAttackEvent extends BaseGameEvent {
  type: 'DECLARE_ATTACK';
  targetId: string;
  action: ActionItem;
  isReckless?: boolean;
}
export interface DealDamageEvent extends BaseGameEvent {
  type: 'DEAL_DAMAGE';
  targetId: string;
  damageParts: DamagePart[];
  isCrit: boolean;
}
export interface DealDamageToObjectEvent extends BaseGameEvent {
  type: 'DEAL_DAMAGE_TO_OBJECT';
  objectId: string;
  damageParts: DamagePart[];
  isCrit: boolean;
}
export interface CastSpellEvent extends BaseGameEvent {
    type: 'CAST_SPELL';
    spellId: string;
    upcastLevel: number;
    targets: {
        position?: { x: number, y: number, z: number };
        tokenIds?: string[];
    };
}
export interface HealEvent extends BaseGameEvent {
    type: 'HEAL_TARGET';
    targetId: string;
    amount: number;
}
export interface ApplyEffectEvent extends BaseGameEvent {
    type: 'APPLY_EFFECT';
    targetId: string;
    effect: EffectInstance;
}
export interface DodgeActionEvent extends BaseGameEvent {
    type: 'DODGE_ACTION';
}
export interface MoveTokenEvent extends BaseGameEvent {
    type: 'MOVE_TOKEN';
    path: { x: number; y: number }[];
}
export interface UseFeatureEvent extends BaseGameEvent {
    type: 'USE_FEATURE';
    featureId: string;
    targetId?: string;
    choices?: Record<string, any>;
}
export interface SpendResourceEvent extends BaseGameEvent {
    type: 'SPEND_RESOURCE';
    resourceId: string;
    amount: number;
}
export interface SpendActionEvent extends BaseGameEvent {
    type: 'SPEND_ACTION';
    actionType: 'action' | 'bonusAction' | 'reaction';
}
export interface AttemptGrappleEscapeEvent extends BaseGameEvent {
    type: 'ATTEMPT_GRAPPLE_ESCAPE';
    ability: 'acrobatics' | 'athletics';
}
export interface HelpActionEvent extends BaseGameEvent {
  type: 'HELP_ACTION';
  targetId: string;
}
export interface HideActionEvent extends BaseGameEvent {
  type: 'HIDE_ACTION';
  stealthModifier: number;
}
export interface SearchActionEvent extends BaseGameEvent {
  type: 'SEARCH_ACTION';
  perceptionModifier: number;
}
export interface LogEvent extends BaseGameEvent {
  type: 'LOG_EVENT';
  message: string;
  isPublic?: boolean;
}

export type GameEvent = 
    DeclareAttackEvent | 
    DealDamageEvent | 
    CastSpellEvent | 
    HealEvent | 
    ApplyEffectEvent | 
    DodgeActionEvent | 
    MoveTokenEvent | 
    UseFeatureEvent | 
    SpendResourceEvent | 
    SpendActionEvent | 
    AttemptGrappleEscapeEvent | 
    DealDamageToObjectEvent |
    HelpActionEvent |
    HideActionEvent |
    SearchActionEvent |
    LogEvent;

export type SavingThrowConsequence = 
    | { type: 'break_concentration' }
    | { type: 'apply_condition', effect: EffectInstance }
    | { type: 'deal_damage', damage: DamagePart[] };


export interface BasePlayerChoicePrompt {
    choiceId: string;
    type: PlayerChoiceType;
    sourceId: string; // The character/NPC who must make the choice
}
export interface SavingThrowChoice extends BasePlayerChoicePrompt {
    type: 'saving_throw';
    ability: Ability;
    dc: number;
    effectDescription: string;
    consequence: SavingThrowConsequence;
}
export interface ReactionChoice extends BasePlayerChoicePrompt {
    type: 'reaction';
    trigger: string; // e.g., "being hit by an attack"
    options: { id: string; name: string; description: string }[];
    context?: any; // To store event context
}
export interface OpportunityAttackChoice extends ReactionChoice {
    trigger: 'opportunity_attack';
    attackerId: string;
    targetId: string;
}

export type PlayerChoicePrompt = SavingThrowChoice | ReactionChoice | OpportunityAttackChoice;


// --- Core Character Definition ---
export interface AbilityScore {
    base: number;
    bonus: number;
}
export type AbilityScores = {
    [key in Ability]: AbilityScore;
};
export interface SelectedFeat {
    featId: string;
    source: string; // e.g. "Level 4 ASI", "Variant Human"
    choices?: {
        [key: string]: any;
        bonuses?: { ability: Ability, value: number }[];
        classId?: string;
        spellIds?: string[];
    };
}
export interface SelectedClass {
    id: string;
    level: number;
    subclassId?: string;
    name?: string; // Derived data from engine
    subclassName?: string; // Derived data from engine
    // Warlock specific
    pactBoon?: 'blade' | 'chain' | 'tome' | 'talisman';
    // Artificer specific
    armorModel?: 'guardian' | 'infiltrator';
    artilleristCannonChoice?: 'flamethrower' | 'force-ballista' | 'protector';
}
export interface Heritage {
    ancestries: Species[];
    resolvedHeritage: Species | null;
    isCustom?: boolean;
}
export type PendingChoice =
    | { type: 'asi_or_feat', source: string, level: number, id: string, status: 'pending' | 'complete' }
    | { type: 'proficiency', source: string, id: string, options: string[] | 'any', count: number, proficiencyType: 'skill' | 'tool' | 'language' | 'ability' }
    | { type: 'fighting_style', source: string, id: string, options: string[] }
    | { type: 'maneuver', source: string, id: string, count: number, level: number }
    | { type: 'invocation', source: string, id: string, count: number, level: number }
    | { type: 'metamagic', source: string, id: string, count: number, level: number }
    | { type: 'totem_animal', source: string, id: string, level: number }
    | { type: 'feat', source: string, id: string, options: string[] | 'any' }
    | { type: 'magic_initiate', source: string, id: string }
    | { type: 'spell', source: string, id: string, count: number, level: number }
    | { type: 'rune', source: string, id: string, count: number, from?: string[] | 'any', level: number }
    | { type: 'dedicated_weapon', source: string, id: string };

// --- Inventory & Equipment ---
export interface CharacterItemInstance {
    instanceId: string; // Unique identifier for this specific item instance
    itemId: string;
    quantity: number;
    infusionId?: string;
    source?: string; // e.g., 'Artisan's Blessing', 'Starting Equipment'
    isTemporary?: boolean;
    customProperties?: Record<string, any>; // For Magical Tinkering, etc.
    charges?: { current: number; max: number };
    storedSpell?: { spellId: string, level: number, dc: number };
    inscribedRune?: string; // For Rune Knight
    pactWeaponForm?: string; // For Pact of the Blade
}
export interface EquippedItems {
    armor?: string;
    shield?: string;
    mainHand?: string;
    offHand?: string;
}

// --- Derived/Calculated Data ---
export interface ResolvedProficiency {
    id: string;
    name: string;
    source: string;
}
export interface CharacterProficiencies {
    skills: ResolvedProficiency[];
    tools: ResolvedProficiency[];
    saving_throws: ResolvedProficiency[]; // id will be Ability, name will be ability name
    languages: ResolvedProficiency[];
    armor: ResolvedProficiency[];
    weapons: ResolvedProficiency[];
}
export interface InnateSpell {
    spell: Spell;
    uses: InnateSpellFrequency;
    source: string;
}
export interface SpellcastingInfo {
    spellSlots: number[];
    pactSlots: { count: number; level: number };
    availableSpells: Spell[];
    alwaysPreparedSpells: Spell[];
    innateSpells: InnateSpell[];
    spellcastingAbilities: { [classIdOrFeat: string]: Ability };
    spellSaveDCs: { [classIdOrFeat: string]: number };
    spellAttackBonuses: { [classIdOrFeat: string]: number };
    maxPreparedSpells: number;
    maxKnownSpells: number;
}
export interface ArtificerInfo {
    maxKnownInfusions: number;
    maxInfusedItems: number;
}
export interface BarbarianInfo {
    brutalCriticalDice: number;
}
export interface PaladinInfo {
    layOnHandsPool: {
        current: number;
        max: number;
    };
}
export interface SkillCheckItem {
    id: string;
    name: string;
    ability: Ability;
    isProficient: boolean;
    modifier: number;
    hasReliableTalent: boolean;
}
export interface SavingThrowItem {
    id: Ability;
    name: string;
    isProficient: boolean;
    modifier: number;
}
export interface ToolCheckItem {
    id: string;
    name: string;
    isProficient: boolean;
}

// --- Play Mode & State ---
export type HitDicePool = {
    [die: string]: { max: number; current: number }; // e.g. { d6: {max: 1, current: 1}, d8: {max: 2, current: 2} }
};

export interface FeatureUses {
    current: number;
    max: number;
    per: 'shortRest' | 'longRest';
}

export interface AdjudicationTarget {
    tokenId: string;
    npcInstanceId?: string;
    name: string;
    status: 'pending' | 'succeeded' | 'failed';
    roll?: number;
    modifier?: number;
    total?: number;
}

export interface UncannyDodgePrompt {
    damage: number;
    source: string;
}
export interface InteractionPrompt {
    type: 'bardic_inspiration' | 'cutting_words' | 'combat_inspiration' | 'unsettling_words' | 'lay_on_hands' | 'pact_of_the_blade' | 'wildShape';
    sourceFeatureId: string;
}
export interface SummonChoicePrompt {
    spell: Spell;
    effect: SummonChoiceEffect;
}
export interface StateInstance {
    id: string;
    sourceFeatureId: string;
    durationInRounds?: number;
    data?: any;
}
export interface Resource {
    id: string;
    name: string;
    current: number;
    max: number;
    dieSize?: number;
    per: 'shortRest' | 'longRest';
}
export interface Aura {
    id: string;
    radius: number;
    effects: FeatEffect[];
}
export interface Companion {
    id: string;
    instanceId: string;
    name: string;
    creatureType: string;
    hpFormula?: string;
    acFormula?: string;
    hp?: number;
    maxHp: number;
    currentHp: number;
    ac?: number;
    speed: Movement;
    actions: ActionItem[];
    reactions?: ActionItem[];
    canBeHorde?: boolean;
}
export interface ExperimentalElixir {
    id: string;
    effect: 'Healing' | 'Swiftness' | 'Resilience' | 'Boldness' | 'Flight' | 'Transformation';
    description: string;
}
export interface BardicInspiration {
    currentUses: number;
    maxUses: number;
    dieSize: number;
    givenTo: string[];
}

export interface SelectedProficiency {
    source: string;
    id: string;
    choices: string[];
    proficiencyType: 'skill' | 'tool' | 'language' | 'ability';
}
export interface SelectedFightingStyle {
    id: string;
    source: string;
}

// --- SLICE STATES ---
export interface MetaState {
    id: string;
    name: string;
    level: number;
    classes: SelectedClass[];
    heritage: Heritage;
    background: Background | null;
    backstoryDetails: BackstoryDetails;
    physicalCharacteristics: PhysicalCharacteristics;
    characterPortraitUrl: string;
}

export interface AbilitiesState {
    abilityScores: AbilityScores;
}

export interface ProficienciesState {
    feats: SelectedFeat[];
    selectedProficiencies: SelectedProficiency[];
    selectedFightingStyles: SelectedFightingStyle[];
    selectedInvocations: string[];
    selectedMetamagic: string[];
    fighter?: {
        selectedManeuvers?: string[];
        selectedRunes?: string[];
    };
    monk?: {
        dedicatedWeapon?: string;
    };
    barbarian?: {
        totemChoices?: { level: number; totem: string }[];
    };
}

export interface InventoryState {
    inventory: CharacterItemInstance[];
    equippedItems: EquippedItems;
    money: Currency;
    infusedItems: { instanceId: string, infusionId: string }[];
    arcaneArmorItemId?: string;
    startingEquipmentGranted: boolean;
    attunedItemIds: string[];
}

export interface SpellsState {
    preparedSpells: string[];
    knownSpells: string[];
    spellbook?: string[];
    mysticArcanum?: { [level: number]: string | null };
    knownInfusions: string[];
}

export interface VitalsState {
    hp: number;
    currentHp: number;
    tempHp: number;
    hitDice: HitDicePool;
    deathSaves: { successes: number; failures: number };
    arcaneWard: { current: number; max: number };
    exhaustionLevel: number;
}

export interface PlayState {
    activeConcentration?: { spellId: string; spellName: string };
    concentrationSaveDc: number | null;
    activeEffects: EffectInstance[];
    uncannyDodgePrompt: UncannyDodgePrompt | null;
    interactionPrompt: InteractionPrompt | null;
    summonChoicePrompt: SummonChoicePrompt | null;
    activeCompanions: Companion[];
    experimentalElixirs: ExperimentalElixir[];
    wildShapeForm: (Monster & { currentHp: number }) | null;
    wildShapeEquipmentOption: WildShapeEquipmentOption;
    symbioticEntityActive: boolean;
    activeStates: StateInstance[];
    turnData: {
        attacked: boolean;
        tookDamage: boolean;
    };
    usedSneakAttackThisTurn: boolean;
    resources: Resource[];
    expendedSpellSlots: { [level: number]: number };
    expendedPactSlots: number;
    innateSpellUses: { [spellId: string]: { expended: number, frequency: InnateSpellFrequency } };
    featureUses: { [featureId: string]: number };
    bardicInspiration?: BardicInspiration;
    paladin?: {
        layOnHandsPool?: { current: number; max: number };
    };
    actionEconomy: {
        action: boolean;
        bonusAction: boolean;
        reaction: boolean;
    };
    activeHuntersMarkTargetId?: string;
    activeVowOfEnmityTargetId?: string;
}

// --- The Root Character Interface (Internal Store Shape) ---
export interface CharacterState {
    meta: MetaState;
    abilities: AbilitiesState;
    proficiencies: ProficienciesState;
    inventory: InventoryState;
    spells: SpellsState;
    vitals: VitalsState;
    playState: PlayState;
}

// --- The Character Interface (Calculated/External Shape) ---
export interface Character extends MetaState, AbilitiesState, VitalsState, ProficienciesState, InventoryState, SpellsState, PlayState {
    // This is the flat structure used by components and selectors
    // It will be composed by the main character selector.
    // All original properties of Character are now part of the slice states.
    
    // Additional derived stats for convenience
    proficiencies?: CharacterProficiencies;
    skillCheckItems?: SkillCheckItem[];
    toolCheckItems?: ToolCheckItem[];
    savingThrowItems?: SavingThrowItem[];
    spellcastingInfo?: SpellcastingInfo;
    artificerInfo?: ArtificerInfo;
    barbarianInfo?: BarbarianInfo;
    paladinInfo?: PaladinInfo;
    sneakAttackDice?: string;
    resolvedInvocations?: Invocation[];
    maxAttunementSlots?: number;
    allTraits?: Trait[];
    allFeatures?: ClassFeature[];
    attackActions?: ActionItem[];
    specialActions?: ActionItem[];
    critRange?: number;
    auras?: Aura[];
    calculatedFeatureUses?: { [featureId: string]: FeatureUses };
    pendingChoices: PendingChoice[];
    ac: number;
    stealthDisadvantage: boolean;
    passivePerception: number;
    passiveInvestigation: number;
    initiative: number;
    speed: number;
    flyingSpeed: number;
    swimmingSpeed: number;
    climbingSpeed: number;
    encumbranceStatus: EncumbranceStatus;
}