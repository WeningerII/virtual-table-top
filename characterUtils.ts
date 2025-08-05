

import { Character, CharacterState, Ability, AbilityScores, BackstoryDetails, PhysicalCharacteristics, SelectedClass, Heritage, Background, SelectedFeat, SelectedProficiency, SelectedFightingStyle, CharacterItemInstance, EquippedItems, Currency, HitDicePool, WildShapeEquipmentOption, Resource, StateInstance, ExperimentalElixir, BardicInspiration, PaladinInfo, InteractionPrompt, SummonChoicePrompt, UncannyDodgePrompt, EffectInstance, Monster } from '../types';

export const createNewCharacterObject = (): Character => {
    const ABILITIES_IDS = ['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA'];
    const initialAbilityScores = ABILITIES_IDS.reduce((acc, ability) => {
        acc[ability] = { base: 10, bonus: 0 };
        return acc;
    }, {} as any);

    return {
        id: crypto.randomUUID(),
        name: 'New Character',
        level: 1,
        classes: [],
        heritage: { ancestries: [], resolvedHeritage: null },
        background: null,
        abilityScores: initialAbilityScores,
        feats: [],
        inventory: [],
        equippedItems: {},
        money: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
        backstoryDetails: { personality: '', ideals: '', bonds: '', flaws: '', backstory: '', notes: '' },
        physicalCharacteristics: { age: '', height: '', weight: '', eyes: '', skin: '', hair: '', gender: '', alignment: '', faith: '' },
        characterPortraitUrl: '',
        hp: 10, currentHp: 10, tempHp: 0, ac: 10, initiative: 0, speed: 30, flyingSpeed: 0, swimmingSpeed: 0, climbingSpeed: 0,
        encumbranceStatus: 'none', stealthDisadvantage: false, passivePerception: 10, passiveInvestigation: 10,
        pendingChoices: [], selectedProficiencies: [], selectedFightingStyles: [],
        selectedInvocations: [], selectedMetamagic: [],
        preparedSpells: [], knownSpells: [], spellbook: [], mysticArcanum: {},
        attunedItemIds: [], knownInfusions: [], infusedItems: [],
        hitDice: {},
        expendedSpellSlots: {}, expendedPactSlots: 0, innateSpellUses: {}, 
        featureUses: {},
        startingEquipmentGranted: false, activeConcentration: undefined,
        concentrationSaveDc: null, activeEffects: [],
        deathSaves: { successes: 0, failures: 0 },
        uncannyDodgePrompt: null, interactionPrompt: null, summonChoicePrompt: null,
        activeCompanions: [],
        experimentalElixirs: [], arcaneWard: { current: 0, max: 0 }, wildShapeForm: null,
        wildShapeEquipmentOption: 'merge', symbioticEntityActive: false,
        activeStates: [], exhaustionLevel: 0, turnData: { attacked: false, tookDamage: false },
        usedSneakAttackThisTurn: false, resources: [],
        actionEconomy: { action: true, bonusAction: true, reaction: true },
        activeHuntersMarkTargetId: undefined,
        activeVowOfEnmityTargetId: undefined,
    };
};

export const toCharacterState = (character: Partial<Character>): CharacterState => {
    const merged: Character = { ...createNewCharacterObject(), ...character };
    const state: CharacterState = {
        meta: { id: merged.id, name: merged.name, level: merged.level, classes: merged.classes, heritage: merged.heritage, background: merged.background, backstoryDetails: merged.backstoryDetails, physicalCharacteristics: merged.physicalCharacteristics, characterPortraitUrl: merged.characterPortraitUrl },
        abilities: { abilityScores: merged.abilityScores },
        proficiencies: { feats: merged.feats, selectedProficiencies: merged.selectedProficiencies, selectedFightingStyles: merged.selectedFightingStyles, selectedInvocations: merged.selectedInvocations, selectedMetamagic: merged.selectedMetamagic, fighter: merged.fighter, monk: merged.monk, barbarian: merged.barbarian },
        inventory: { inventory: merged.inventory, equippedItems: merged.equippedItems, money: merged.money, infusedItems: merged.infusedItems, arcaneArmorItemId: merged.arcaneArmorItemId, startingEquipmentGranted: merged.startingEquipmentGranted, attunedItemIds: merged.attunedItemIds },
        spells: { preparedSpells: merged.preparedSpells, knownSpells: merged.knownSpells, spellbook: merged.spellbook, mysticArcanum: merged.mysticArcanum, knownInfusions: merged.knownInfusions },
        vitals: { hp: merged.hp, currentHp: merged.currentHp, tempHp: merged.tempHp, hitDice: merged.hitDice, deathSaves: merged.deathSaves, arcaneWard: merged.arcaneWard, exhaustionLevel: merged.exhaustionLevel },
        playState: { activeConcentration: merged.activeConcentration, concentrationSaveDc: merged.concentrationSaveDc, activeEffects: merged.activeEffects, uncannyDodgePrompt: merged.uncannyDodgePrompt, interactionPrompt: merged.interactionPrompt, summonChoicePrompt: merged.summonChoicePrompt, activeCompanions: merged.activeCompanions, experimentalElixirs: merged.experimentalElixirs, wildShapeForm: merged.wildShapeForm, wildShapeEquipmentOption: merged.wildShapeEquipmentOption, symbioticEntityActive: merged.symbioticEntityActive, activeStates: merged.activeStates, turnData: merged.turnData, usedSneakAttackThisTurn: merged.usedSneakAttackThisTurn, resources: merged.resources, expendedSpellSlots: merged.expendedSpellSlots, expendedPactSlots: merged.expendedPactSlots, innateSpellUses: merged.innateSpellUses, featureUses: merged.featureUses, bardicInspiration: merged.bardicInspiration, paladin: merged.paladin, actionEconomy: merged.actionEconomy, activeHuntersMarkTargetId: merged.activeHuntersMarkTargetId, activeVowOfEnmityTargetId: merged.activeVowOfEnmityTargetId }
    };
    return state;
};

export const fromCharacterState = (characterState: CharacterState, existingCharacter: Character): Character => {
    const flatState = {
        ...characterState.meta,
        ...characterState.abilities,
        ...characterState.proficiencies,
        ...characterState.inventory,
        ...characterState.spells,
        ...characterState.vitals,
        ...characterState.playState
    };
    return { ...existingCharacter, ...flatState };
};