// types/enums.ts

export enum EffectType {
    AbilityScoreIncrease = 'ability_score_increase',
    Advantage = 'advantage',
    Disadvantage = 'disadvantage',
    Proficiency = 'proficiency',
    Expertise = 'expertise',
    Resistance = 'resistance',
    Bonus = 'bonus',
    GrantSpeed = 'grant_speed',
    SpecialAbility = 'special_ability',
    UnarmoredDefense = 'unarmored_defense',
    UnarmoredMovement = 'unarmored_movement',
    Immunity = 'immunity',
    CritRange = 'crit_range',
    RerollDamage = 'reroll_damage',
    SetBaseSpeed = 'set_base_speed',
    InnateSpellcasting = 'innate_spellcasting',
    NaturalWeapon = 'natural_weapon',
    GrantAction = 'grant_action',
    SetBaseAc = 'set_base_ac',
    BonusCritDamage = 'bonus_crit_damage',
    TemporaryHitPoints = 'temporary_hit_points',
    ReachBonus = 'reach_bonus',
    BonusDamage = 'bonus_damage',
    AttackPenaltyDamageBonus = 'attack_penalty_damage_bonus',
    HalfProficiencyBonus = 'half_proficiency_bonus',
    SetAbilityScore = 'set_ability_score',
    Heal = 'heal',
    CostReduction = 'cost_reduction',
    SetMaxPreparedSpells = 'set_max_prepared_spells',
    ModifyFeature = 'modify_feature',
    RollFloor = 'roll_floor',
    ExtraAttack = 'extra_attack',
    ResourceRecovery = 'resource_recovery',
    Regeneration = 'regeneration',
    SetAbilityScoreMax = 'set_ability_score_max',
    ApplyConditionOnHit = 'apply_condition_on_hit',
    ApplyCondition = 'apply_condition',
    Condition = 'condition',
    // Spell-specific effects
    ApplyConditionOnFail = 'apply_condition_on_fail',
    ModifyTerrain = 'modify_terrain',
    SummonCreature = 'summon_creature',
    SummonChoice = 'summon_choice',
    EnvironmentalInteraction = 'environmental_interaction',
}

export enum ProficiencyType {
    Skill = 'skill',
    Tool = 'tool',
    Armor = 'armor',
    Weapon = 'weapon',
    Language = 'language',
    SavingThrow = 'saving_throw',
}

export enum ActionCost {
    Action = 'action',
    BonusAction = 'bonus action',
    Reaction = 'reaction',
}

export enum Ability {
    Strength = 'STRENGTH',
    Dexterity = 'DEXTERITY',
    Constitution = 'CONSTITUTION',
    Intelligence = 'INTELLIGENCE',
    Wisdom = 'WISDOM',
    Charisma = 'CHARISMA',
}