
import {
    Character, CharacterState, StaticGameDataCache, Trait, ClassFeature, Feat,
    Ability, SelectedClass, AbilityScores, CharacterProficiencies, ResolvedProficiency,
    SavingThrowItem, SkillCheckItem, Armor, Shield, Weapon, DndClass, CasterType,
    SpellcastingInfo, Spell, InnateSpell, Resource, PendingChoice, EffectType,
    AbilityScoreIncreaseEffect, ProficiencyEffect, BonusEffect, AdvantageEffect,
    SelectedFeat, SelectedFightingStyle, SelectedProficiency, UnarmoredDefenseEffect,
    Item, CharacterItemInstance, HitDicePool, FeatEffect, ActionItem, WeaponProperty, EncumbranceStatus, HalfProficiencyBonusEffect
} from '../types';
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

// --- Final Assembly ---
export const calculateCharacterSheet: (state: CharacterState, staticData: StaticGameDataCache) => Character = createSelector(
    [
        selectMeta, selectAbilities, selectProficienciesSlice, selectInventory, selectSpells, selectVitals, selectPlayState,
        selectTotalLevel, selectProficiencyBonus, selectFinalAbilityScores, selectAbilityModifiers,
        selectMaxHP, selectAC, selectAllSources, selectEncumbranceStatus, selectStaticData
    ],
    (meta, abilities, proficiencies, inventory, spells, vitals, playState,
     level, profBonus, finalAbilityScores, modifiers,
     maxHp, acInfo, allSources, encumbranceStatus, staticData) => {

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
            speed: 30, // Placeholder, needs effect system
            flyingSpeed: 0,
            swimmingSpeed: 0,
            climbingSpeed: 0,
            passivePerception: 10 + modifiers.WISDOM,
            passiveInvestigation: 10 + modifiers.INTELLIGENCE,
            encumbranceStatus: encumbranceStatus,
            // Deeply Calculated Properties
            abilityScores: finalAbilityScores,
            pendingChoices: calculatePendingChoices(characterState, staticData),
            // TODO: Fill these in with more selectors
            proficiencies: { skills: [], tools: [], saving_throws: [], languages: [], armor: [], weapons: [] },
            skillCheckItems: [],
            savingThrowItems: [],
            spellcastingInfo: undefined,
            allTraits: allSources.allTraits,
            allFeatures: allSources.allFeatures,
            attackActions: [],
            specialActions: [],
        };
        
        return fullCharacter;
    }
);

// Re-exporting with a more descriptive name for use in other files.
export { calculateCharacterSheet as selectCharacter };