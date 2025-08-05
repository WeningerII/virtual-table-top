import { EffectDuration, InnateSpellFrequency, ActionType } from './primitives';
import { EffectType, Ability } from './enums';

export type Prerequisite =
    | { type: 'level'; value: number }
    | { type: 'ability'; ability: Ability; value: number }
    | { type: 'spellcasting' }
    | { type: 'proficiency'; proficiencyType: 'armor'; proficiencyId: string }
    | { type: 'pact_boon'; value: 'blade' | 'chain' | 'tome' | 'talisman' }
    | { type: 'spell'; id: string };

export interface ChoiceOption {
    id: string;
    label: string;
    type: string;
    count: number;
    from?: string[] | 'any';
}

export type TriggerType = 'on_hit' | 'on_miss' | 'on_damage';

// Evolved from OnHitEffect to handle more triggers
export type TriggeredEffect =
    | {
        trigger: TriggerType;
        type: 'saving_throw';
        ability: Ability;
        dc: number;
        effectOnFail:
            | { type: 'apply_condition'; condition: string; duration?: EffectDuration }
            | { type: 'deal_damage'; damage: { dice: string, bonus: number, type: string } }
            | { type: 'move_target', distance: number, direction: 'towards' | 'away' };
      }
    | {
        trigger: TriggerType;
        type: 'apply_condition';
        condition: string;
        duration?: EffectDuration
      }
    | {
        trigger: TriggerType;
        type: 'deal_damage';
        damage: { dice: string, bonus: number, type: string };
        description?: string;
      };


// --- Effects ---
export interface Effect {
    type: EffectType;
    description?: string;
}

export interface AbilityScoreIncreaseEffect extends Effect {
    type: EffectType.AbilityScoreIncrease;
    abilities?: Ability[] | 'any'; // if specified, choice is limited to these
    count: number;
    value: number;
}

export interface AdvantageEffect extends Effect {
    type: EffectType.Advantage;
    on: 'saving_throw' | 'check' | 'initiative' | 'attack_roll';
    ability?: Ability; // for saves or checks
    skill?: string; // for checks
    condition: string;
}

export interface DisadvantageEffect extends Effect {
    type: EffectType.Disadvantage;
    on: 'attack_roll' | 'check' | 'saving_throw';
    skill?: string;
    ability?: Ability;
    condition: string;
}

export interface ProficiencyEffect extends Effect {
    type: EffectType.Proficiency;
    proficiencyType: 'skill' | 'tool' | 'armor' | 'weapon' | 'language' | 'saving_throw';
    options?: string[] | 'any'; // list of specific ids, or 'any'
    count: number;
}

export interface ExpertiseEffect extends Effect {
    type: EffectType.Expertise;
    proficiencyType: 'skill' | 'tool';
    options?: string[] | 'any';
    count: number;
}

export interface ResistanceEffect extends Effect {
    type: EffectType.Resistance;
    damageType: string;
    condition?: string;
}

export interface BonusEffect extends Effect {
    type: EffectType.Bonus;
    to: 'ac' | 'initiative' | 'hp_per_level' | 'speed' | 'passive_perception' | 'passive_investigation' | 'attack_roll' | 'damage_roll' | 'rage_damage' | 'healing_spell' | 'saving_throw' | 'max_attunement_slots' | 'max_infused_items';
    value: number | string;
    valueByLevel?: { [level: number]: number };
    condition?: string;
}

export interface GrantSpeedEffect extends Effect {
    type: EffectType.GrantSpeed;
    speedType: 'flying' | 'swimming' | 'climbing';
    value: number | string;
    condition?: string;
}

export interface SpecialAbilityEffect extends Effect {
    type: EffectType.SpecialAbility;
    name: string;
}

export interface UnarmoredDefenseEffect extends Effect {
    type: EffectType.UnarmoredDefense;
    ability: Ability;
}

export interface UnarmoredMovementEffect extends Effect {
    type: EffectType.UnarmoredMovement;
    // Value is derived from monk level in the engine
}

export interface ImmunityEffect extends Effect {
    type: EffectType.Immunity;
    to: 'disease' | 'poison' | 'charmed' | 'frightened' | 'magical_sleep' | string;
    condition?: string;
}

export interface CritRangeEffect extends Effect {
    type: EffectType.CritRange;
    value: number; // The number you now crit on, e.g., 19
}

export interface RerollDamageEffect extends Effect {
    type: EffectType.RerollDamage;
    diceValues: number[]; // e.g., [1, 2]
    condition?: string;
}

export interface SetBaseSpeedEffect extends Effect {
    type: EffectType.SetBaseSpeed;
    value: number;
}

export interface InnateSpellcastingEffect extends Effect {
    type: EffectType.InnateSpellcasting;
    spells: {
        id: string;
        levelRequirement?: number;
        frequency: InnateSpellFrequency;
        description?: string;
    }[];
    ability: Ability;
}

export interface NaturalWeaponEffect extends Effect {
    type: EffectType.NaturalWeapon;
    name: string;
    damageDice: string;
    damageType: string;
}

export interface GrantActionEffect extends Effect {
    type: EffectType.GrantAction;
    name: string;
    actionType?: ActionType;
}

export interface SetBaseAcEffect extends Effect {
    type: EffectType.SetBaseAc;
    value: number;
    ability?: Ability; // Optional ability to add to the base value
}

export interface BonusCritDamageEffect extends Effect {
    type: EffectType.BonusCritDamage;
    dice: number; // number of additional weapon dice
    valueByLevel?: { [level: number]: number };
}

export interface TemporaryHitPointsEffect extends Effect {
    type: EffectType.TemporaryHitPoints;
    value: string; // e.g. "level + CON_MOD", "1d6 + level"
    frequency?: 'per_long_rest' | 'per_short_rest';
    condition?: string;
}

export interface ReachBonusEffect extends Effect {
    type: EffectType.ReachBonus;
    value: number;
    condition?: string;
}

export interface BonusDamageEffect extends Effect {
    type: EffectType.BonusDamage;
    value: string; // e.g. "2d6", "1d6+HALF_BARBARIAN_LEVEL"
    valueByLevel?: { [level: number]: string };
    damageType?: string;
    condition: string; // e.g. "on first turn of combat against surprised creature"
    description?: string;
}

export interface AttackPenaltyDamageBonusEffect extends Effect {
    type: EffectType.AttackPenaltyDamageBonus;
    penalty: number;
    bonus: number;
    condition: string;
}

export interface HalfProficiencyBonusEffect extends Effect {
    type: EffectType.HalfProficiencyBonus;
    to: 'ability_check';
    abilities?: Ability[];
}

export interface SetAbilityScoreEffect extends Effect {
    type: EffectType.SetAbilityScore;
    ability: Ability;
    value: number;
}

export interface HealEffect extends Effect {
    type: EffectType.Heal;
    value: string; // dice string like "2d4+2"
}

export interface CostReductionEffect extends Effect {
    type: EffectType.CostReduction;
    activity: 'scribing';
    school: string;
    value: number; // e.g., 0.5 for half
}

export interface SetMaxPreparedSpellsEffect extends Effect {
    type: EffectType.SetMaxPreparedSpells;
    value: string; // e.g., "INT_MOD + WIZARD_LEVEL"
}

export interface ModifyFeatureEffect extends Effect {
    type: EffectType.ModifyFeature;
    featureId: string;
    modification: string;
}

export interface RollFloorEffect extends Effect {
    type: EffectType.RollFloor;
    value: number | string; // e.g., 10 or "STRENGTH_SCORE"
    condition: string;
}

export interface ExtraAttackEffect extends Effect {
    type: EffectType.ExtraAttack;
    count: number;
}

export interface ResourceRecoveryEffect extends Effect {
    type: EffectType.ResourceRecovery;
    resourceId: string;
    amount: number;
    on: 'short_rest' | 'long_rest';
}

export interface RegenerationEffect extends Effect {
    type: EffectType.Regeneration;
    value: string; // e.g., "5 + CON_MOD"
    condition: string;
}

export interface SetAbilityScoreMaxEffect extends Effect {
    type: EffectType.SetAbilityScore;
    ability: Ability;
    value: number;
}

export interface ApplyConditionOnHitEffect extends Effect {
    type: EffectType.ApplyConditionOnHit;
    conditionId: string;
    duration: EffectDuration;
}

export type FeatEffect = 
    | AbilityScoreIncreaseEffect 
    | AdvantageEffect 
    | DisadvantageEffect
    | ProficiencyEffect 
    | ExpertiseEffect
    | ResistanceEffect 
    | BonusEffect 
    | GrantSpeedEffect 
    | SpecialAbilityEffect 
    | UnarmoredDefenseEffect 
    | UnarmoredMovementEffect 
    | ImmunityEffect 
    | CritRangeEffect 
    | RerollDamageEffect 
    | SetBaseSpeedEffect
    | InnateSpellcastingEffect
    | NaturalWeaponEffect
    | GrantActionEffect
    | SetBaseAcEffect
    | BonusCritDamageEffect
    | TemporaryHitPointsEffect
    | ReachBonusEffect
    | BonusDamageEffect
    | AttackPenaltyDamageBonusEffect
    | HalfProficiencyBonusEffect
    | SetAbilityScoreEffect
    | HealEffect
    | CostReductionEffect
    | SetMaxPreparedSpellsEffect
    | ModifyFeatureEffect
    | RollFloorEffect
    | ExtraAttackEffect
    | ResourceRecoveryEffect
    | RegenerationEffect
    | SetAbilityScoreMaxEffect
    | ApplyConditionOnHitEffect
    | Effect;

export interface EffectInstance {
    id: string;
    source: string;
    effect: FeatEffect;
    duration?: EffectDuration;
    sourceId?: string; // ID of the creature/feature that applied the effect
    durationInRounds?: number;
}
export interface EnvironmentalInteractionEffect {
    type: EffectType.EnvironmentalInteraction;
    interaction: 'ignite' | 'shatter_fragile';
}