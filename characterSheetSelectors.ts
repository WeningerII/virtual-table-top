
import {
    Character, CharacterState, StaticGameDataCache, Trait, ClassFeature, Feat,
    Ability, SelectedClass, AbilityScores, CharacterProficiencies, ResolvedProficiency,
    SavingThrowItem, SkillCheckItem, Armor, Shield, Weapon, DndClass, CasterType,
    SpellcastingInfo, Spell, InnateSpell, Resource, PendingChoice, EffectType,
    AbilityScoreIncreaseEffect, ProficiencyEffect, BonusEffect, AdvantageEffect,
    SelectedFeat, SelectedFightingStyle, SelectedProficiency, UnarmoredDefenseEffect,
    Item, CharacterItemInstance, HitDicePool, FeatEffect, ActionItem, WeaponProperty, EncumbranceStatus, HalfProficiencyBonusEffect
} from './types';
import { ABILITIES, SKILLS } from '../constants';
import { createSelector } from './createSelector';
import { calculatePendingChoices } from './pendingChoicesSelector';

// --- Input Selectors for raw state slices ---
const selectMeta = (state: CharacterState) => state.meta;
const selectAbilities = (state: CharacterState) => state.abilities;
const selectProficienciesSlice = (state: CharacterState) => state.proficiencies;
const selectInventory = (state: CharacterState) => state.inventory;
const selectSpells = (state: CharacterState) => state.spells;
const selectVitals = (state: CharacterState) => state.vitals;
const selectPlayState = (state: CharacterState) => state.playState;
const selectStaticData = (_: CharacterState, staticData: StaticGameDataCache) => staticData;

// --- Base Level & Proficiency ---
const selectTotalLevel = createSelector(
    [selectMeta],
    (meta): number => meta.classes.reduce((sum, c) => sum + c.level, 0) || 1
);

const selectProficiencyBonus = createSelector(
    [selectTotalLevel],
    (level): number => Math.ceil(level / 4) + 1
);

// --- Aggregate all Traits, Features, and Feats ---
const selectAllSources = createSelector(
    [selectMeta, selectProficienciesSlice, selectStaticData],
    (meta, proficiencies, staticData) => {
        const allTraits: Trait[] = [];
        const allFeatures: ClassFeature[] = [];
        const allFeats: Feat[] = [];

        if (meta.heritage.resolvedHeritage) allTraits.push(...meta.heritage.resolvedHeritage.traits);
        if (meta.background) allTraits.push(...meta.background.traits);

        meta.classes.forEach(c => {
            const classData = staticData.allClasses.find(cd => cd.id === c.id);
            if (!classData) return;
            allFeatures.push(...classData.features.filter(f => f.level <= c.level));
            if (c.subclassId) {
                const subclass = classData.subclasses.find(sc => sc.id === c.subclassId);
                if (subclass) allFeatures.push(...subclass.features.filter(f => f.level <= c.level));
            }
        });

        proficiencies.feats.forEach(selectedFeat => {
            const featData = staticData.allFeats.find(f => f.id === selectedFeat.featId);
            if (featData) allFeats.push(featData);
        });

        return { allTraits, allFeatures, allFeats };
    }
);

// --- Aggregate all Effects from all sources ---
const selectAllEffects = createSelector(
    [selectAllSources],
    ({ allTraits, allFeatures, allFeats }): FeatEffect[] => {
        const effects: FeatEffect[] = [];
        allTraits.forEach(t => t.effects && effects.push(...t.effects));
        allFeatures.forEach(f => f.effects && effects.push(...f.effects));
        allFeats.forEach(f => f.effects && effects.push(...f.effects));
        return effects;
    }
);

// --- Final Ability Scores and Modifiers ---
const selectFinalAbilityScores = createSelector(
    [selectAbilities, selectAllEffects, selectProficienciesSlice],
    (abilities, allEffects, proficiencies): AbilityScores => {
        const finalScores = JSON.parse(JSON.stringify(abilities.abilityScores));

        allEffects.forEach(effect => {
            if (effect.type === EffectType.AbilityScoreIncrease) {
                const asiEffect = effect as AbilityScoreIncreaseEffect;
                if (asiEffect.abilities && Array.isArray(asiEffect.abilities)) {
                    asiEffect.abilities.forEach(ability => {
                        finalScores[ability].bonus = (finalScores[ability].bonus || 0) + asiEffect.value;
                    });
                }
            }
        });

        proficiencies.feats.forEach(feat => {
            if (feat.featId === 'ability-score-improvement') {
                feat.choices?.bonuses?.forEach(bonus => {
                    finalScores[bonus.ability].bonus = (finalScores[bonus.ability].bonus || 0) + bonus.value;
                });
            }
        });

        return finalScores;
    }
);

const selectAbilityModifiers = createSelector(
    [selectFinalAbilityScores],
    (finalScores): Record<Ability, number> => {
        const modifiers: any = {};
        ABILITIES.forEach(ability => {
            const total = (finalScores[ability.id]?.base || 0) + (finalScores[ability.id]?.bonus || 0);
            modifiers[ability.id] = Math.floor((total - 10) / 2);
        });
        return modifiers;
    }
);

// --- Core Combat Stats ---
const selectMaxHP = createSelector(
    [selectMeta, selectAbilityModifiers, selectAllEffects, selectStaticData, selectTotalLevel],
    (meta, modifiers, effects, staticData, level): number => {
        if (meta.classes.length === 0) return 8 + modifiers.CONSTITUTION;

        const firstClassData = staticData.allClasses.find(c => c.id === meta.classes[0].id);
        if (!firstClassData) return 8 + modifiers.CONSTITUTION;

        let totalHp = firstClassData.hitDie + modifiers.CONSTITUTION;

        meta.classes.forEach((c, index) => {
            const classData = staticData.allClasses.find(cd => cd.id === c.id);
            if (!classData) return;
            const avgHitDie = (classData.hitDie / 2) + 1;
            const levelsInThisClass = (index === 0) ? c.level - 1 : c.level;
            if (levelsInThisClass > 0) {
                totalHp += levelsInThisClass * (avgHitDie + modifiers.CONSTITUTION);
            }
        });
        
        const toughFeat = effects.find(e => e.type === 'bonus' && (e as BonusEffect).to === 'hp_per_level');
        if (toughFeat) {
            totalHp += (toughFeat as BonusEffect).value as number * level;
        }

        return totalHp;
    }
);

const selectAC = createSelector(
    [selectInventory, selectAbilityModifiers, selectAllEffects, selectStaticData],
    (inventory, modifiers, effects, staticData): { ac: number, stealthDisadvantage: boolean } => {
        let baseAc = 10;
        let ac = 10 + modifiers.DEXTERITY;
        let stealthDisadvantage = false;

        const equippedArmorInstance = inventory.inventory.find(i => i.instanceId === inventory.equippedItems.armor);
        const equippedArmorData = equippedArmorInstance ? staticData.allItems.find(i => i.id === equippedArmorInstance.itemId) as Armor : null;
        
        const unarmoredDefenseFeatures = effects.filter((e): e is UnarmoredDefenseEffect => e.type === 'unarmored_defense');

        if (equippedArmorData) {
            baseAc = equippedArmorData.baseAc;
            stealthDisadvantage = equippedArmorData.stealthDisadvantage || false;
            let dexBonus = modifiers.DEXTERITY;
            if (equippedArmorData.armorType === 'medium') dexBonus = Math.min(dexBonus, 2);
            if (equippedArmorData.armorType === 'heavy') dexBonus = 0;
            ac = baseAc + dexBonus;
        } else if (unarmoredDefenseFeatures.length > 0) {
            const unarmoredAcs = unarmoredDefenseFeatures.map(ud => {
                const statBonus = modifiers[ud.ability] || 0;
                return 10 + modifiers.DEXTERITY + statBonus;
            });
            ac = Math.max(ac, ...unarmoredAcs);
        }

        const equippedShieldInstance = inventory.inventory.find(i => i.instanceId === inventory.equippedItems.shield);
        if (equippedShieldInstance) {
            const shieldData = staticData.allItems.find(i => i.id === equippedShieldInstance.itemId) as Shield;
            if (shieldData) {
                ac += shieldData.acBonus;
            }
        }
        
        effects.forEach(effect => {
            if (effect.type === 'bonus' && (effect as BonusEffect).to === 'ac') {
                ac += (effect as BonusEffect).value as number;
            }
        });

        return { ac, stealthDisadvantage };
    }
);

const selectTotalWeight = createSelector(
    [selectInventory, selectStaticData],
    (inventory, staticData): number => {
        return inventory.inventory.reduce((sum, charItem) => {
            const itemData = staticData.allItems.find(i => i.id === charItem.itemId);
            return sum + (itemData?.weight || 0) * charItem.quantity;
        }, 0);
    }
);

const selectEncumbranceStatus = createSelector(
    [selectTotalWeight, selectFinalAbilityScores],
    (totalWeight, scores): EncumbranceStatus => {
        const strengthScore = ((scores.STRENGTH?.base || 0) + (scores.STRENGTH?.bonus || 0));
        if (totalWeight > strengthScore * 10) return 'heavily_encumbered';
        if (totalWeight > strengthScore * 5) return 'encumbered';
        return 'none';
    }
);

// --- Speed Calculation Selectors ---
const selectBaseSpeed = createSelector(
    [selectAllSources],
    (allSources): number => {
        let baseSpeed = 30; // Default humanoid speed
        
        // Check for species-based speed modifications
        allSources.allTraits.forEach(trait => {
            if (trait.effects) {
                trait.effects.forEach(effect => {
                    if (effect.type === 'set_base_speed') {
                        baseSpeed = effect.value as number;
                    }
                });
            }
        });
        
        return baseSpeed;
    }
);

const selectSpeedModifiers = createSelector(
    [selectAllSources, selectFinalAbilityScores],
    (allSources, abilityScores): { walk: number; fly: number; swim: number; climb: number; burrow: number } => {
        const modifiers = { walk: 0, fly: 0, swim: 0, climb: 0, burrow: 0 };
        
        allSources.allFeatures.forEach(feature => {
            if (feature.effects) {
                feature.effects.forEach(effect => {
                    if (effect.type === 'bonus' && effect.to === 'speed') {
                        modifiers.walk += effect.value as number;
                    } else if (effect.type === 'grant_speed') {
                        const speedType = effect.speedType;
                        if (speedType === 'flying') modifiers.fly = effect.value as number;
                        else if (speedType === 'swimming') modifiers.swim = effect.value as number;
                        else if (speedType === 'climbing') modifiers.climb = effect.value as number;
                    }
                });
            }
        });
        
        // Apply ability score bonuses (e.g., Barbarian Fast Movement)
        if (modifiers.walk > 0) {
            modifiers.walk += abilityScores.DEXTERITY?.bonus || 0;
        }
        
        return modifiers;
    }
);

const selectFinalSpeeds = createSelector(
    [selectBaseSpeed, selectSpeedModifiers],
    (baseSpeed, modifiers) => ({
        speed: Math.max(0, baseSpeed + modifiers.walk),
        flyingSpeed: Math.max(0, modifiers.fly),
        swimmingSpeed: Math.max(0, modifiers.swim),
        climbingSpeed: Math.max(0, modifiers.climb),
        burrowSpeed: Math.max(0, modifiers.burrow)
    })
);

// --- Passive Perception & Investigation Calculation ---
const selectPassivePerception = createSelector(
    [selectFinalAbilityScores, selectAllSources, selectProficienciesSlice, selectTotalLevel],
    (abilityScores, allSources, proficiencies, level): number => {
        let baseValue = 10;
        const wisdomModifier = abilityScores.WISDOM?.bonus || 0;
        
        // Check if proficient in Perception
        const isProficientInPerception = proficiencies.selectedProficiencies.some(
            p => p.proficiencyType === 'skill' && p.id === 'perception'
        );
        
        // Apply proficiency bonus if proficient
        if (isProficientInPerception) {
            // Calculate level-based proficiency bonus using actual character level
            const proficiencyBonus = Math.floor((level - 1) / 4) + 2;
            baseValue += proficiencyBonus;
        }
        
        // Apply effects that modify passive perception
        allSources.allFeatures.forEach(feature => {
            if (feature.effects) {
                feature.effects.forEach(effect => {
                    if (effect.type === 'bonus' && effect.to === 'passive_perception') {
                        baseValue += effect.value as number;
                    }
                });
            }
        });
        
        return baseValue + wisdomModifier;
    }
);

const selectPassiveInvestigation = createSelector(
    [selectFinalAbilityScores, selectAllSources, selectProficienciesSlice, selectTotalLevel],
    (abilityScores, allSources, proficiencies, level): number => {
        let baseValue = 10;
        const intelligenceModifier = abilityScores.INTELLIGENCE?.bonus || 0;
        
        // Check if proficient in Investigation
        const isProficientInInvestigation = proficiencies.selectedProficiencies.some(
            p => p.proficiencyType === 'skill' && p.id === 'investigation'
        );
        
        // Apply proficiency bonus if proficient
        if (isProficientInInvestigation) {
            // Calculate level-based proficiency bonus using actual character level
            const proficiencyBonus = Math.floor((level - 1) / 4) + 2;
            baseValue += proficiencyBonus;
        }
        
        // Apply effects that modify passive investigation
        allSources.allFeatures.forEach(feature => {
            if (feature.effects) {
                feature.effects.forEach(effect => {
                    if (effect.type === 'bonus' && effect.to === 'passive_investigation') {
                        baseValue += effect.value as number;
                    }
                });
            }
        });
        
        return baseValue + intelligenceModifier;
    }
);

// --- Final Assembly ---
export const calculateCharacterSheet: (state: CharacterState, staticData: StaticGameDataCache) => Character = createSelector(
    [
        selectMeta, selectAbilities, selectProficienciesSlice, selectInventory, selectSpells, selectVitals, selectPlayState,
        selectTotalLevel, selectProficiencyBonus, selectFinalAbilityScores, selectAbilityModifiers,
        selectMaxHP, selectAC, selectAllSources, selectFinalSpeeds, selectPassivePerception, selectPassiveInvestigation, selectEncumbranceStatus, selectStaticData
    ],
    (meta, abilities, proficiencies, inventory, spells, vitals, playState,
     level, profBonus, finalAbilityScores, modifiers,
     maxHp, acInfo, allSources, speeds, passivePerception, passiveInvestigation, encumbranceStatus, staticData) => {

        const characterState: CharacterState = { meta, abilities, proficiencies, inventory, spells, vitals, playState };

        // Combine all parts into the final flat Character object
        const fullCharacter: Character = {
            // Raw State Slices
            ...meta,
            ...abilities,
            ...proficiencies,
            ...inventory,
            ...spells,
            ...vitals,
            ...playState,
            // Calculated Base Stats
            level,
            hp: maxHp,
            ac: acInfo.ac,
            stealthDisadvantage: acInfo.stealthDisadvantage,
            initiative: modifiers.DEXTERITY,
            speed: speeds.speed,
            flyingSpeed: speeds.flyingSpeed,
            swimmingSpeed: speeds.swimmingSpeed,
            climbingSpeed: speeds.climbingSpeed,
            passivePerception: passivePerception,
            passiveInvestigation: passiveInvestigation,
            encumbranceStatus: encumbranceStatus,
            // Deeply Calculated Properties
            abilityScores: finalAbilityScores,
            pendingChoices: calculatePendingChoices(characterState, staticData),
            proficiencies: calculateProficiencies(characterState, staticData),
            skillCheckItems: calculateSkillCheckItems(characterState, staticData),
            savingThrowItems: calculateSavingThrowItems(characterState, staticData),
            spellcastingInfo: calculateSpellcastingInfo(characterState, staticData),
            allTraits: allSources.allTraits,
            allFeatures: allSources.allFeatures,
            attackActions: calculateAttackActions(characterState, staticData),
            specialActions: calculateSpecialActions(characterState, staticData),
        };
        
        return fullCharacter;
    }
);

// --- Helper Functions for Calculated Properties ---
const calculateProficiencies = (characterState: CharacterState, staticData: StaticGameDataCache): CharacterProficiencies => {
    const proficiencies: CharacterProficiencies = {
        skills: [],
        tools: [],
        saving_throws: [],
        languages: [],
        armor: [],
        weapons: []
    };
    
    // Process selected proficiencies
    characterState.proficiencies.selectedProficiencies.forEach(selected => {
        const resolved: ResolvedProficiency = {
            id: selected.id,
            name: getProficiencyName(selected.id, selected.proficiencyType, staticData),
            source: selected.source
        };
        
        switch (selected.proficiencyType) {
            case 'skill':
                proficiencies.skills.push(resolved);
                break;
            case 'tool':
                proficiencies.tools.push(resolved);
                break;
            case 'language':
                proficiencies.languages.push(resolved);
                break;
            case 'armor':
                proficiencies.armor.push(resolved);
                break;
            case 'weapon':
                proficiencies.weapons.push(resolved);
                break;
            case 'ability':
                proficiencies.saving_throws.push(resolved);
                break;
        }
    });
    
    return proficiencies;
};

const calculateSkillCheckItems = (characterState: CharacterState, staticData: StaticGameDataCache): SkillCheckItem[] => {
    // This would calculate all skill check items based on proficiencies and effects
    // For now, returning empty array - will be implemented in full proficiency system
    return [];
};

const calculateSavingThrowItems = (characterState: CharacterState, staticData: StaticGameDataCache): SavingThrowItem[] => {
    // This would calculate all saving throw items based on proficiencies and effects
    // For now, returning empty array - will be implemented in full proficiency system
    return [];
};

const calculateSpellcastingInfo = (characterState: CharacterState, staticData: StaticGameDataCache): SpellcastingInfo | undefined => {
    // This would calculate comprehensive spellcasting information
    // For now, returning undefined - will be implemented in full spellcasting system
    return undefined;
};

const calculateAttackActions = (characterState: CharacterState, staticData: StaticGameDataCache): ActionItem[] => {
    // This would calculate all available attack actions based on equipment and features
    // For now, returning empty array - will be implemented in full action system
    return [];
};

const calculateSpecialActions = (characterState: CharacterState, staticData: StaticGameDataCache): ActionItem[] => {
    // This would calculate all available special actions based on features and effects
    // For now, returning empty array - will be implemented in full action system
    return [];
};

const getProficiencyName = (id: string, type: string, staticData: StaticGameDataCache): string => {
    // This would resolve proficiency names from static data
    // For now, returning the ID as a fallback
    return id;
};

// Re-exporting with a more descriptive name for use in other files.
export { calculateCharacterSheet as selectCharacter };