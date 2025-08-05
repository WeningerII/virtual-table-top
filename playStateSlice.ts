import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlayState, Character, StaticGameDataCache, EffectInstance, UncannyDodgePrompt, InteractionPrompt, SummonChoicePrompt, Companion, ExperimentalElixir, InnateSpell, Spell, StateInstance } from '../../types';

const initialState: PlayState = {
    activeConcentration: undefined,
    concentrationSaveDc: null,
    activeEffects: [],
    uncannyDodgePrompt: null,
    interactionPrompt: null,
    summonChoicePrompt: null,
    activeCompanions: [],
    experimentalElixirs: [],
    wildShapeForm: null,
    wildShapeEquipmentOption: 'merge',
    symbioticEntityActive: false,
    activeStates: [],
    turnData: { attacked: false, tookDamage: false },
    usedSneakAttackThisTurn: false,
    resources: [],
    expendedSpellSlots: {},
    expendedPactSlots: 0,
    innateSpellUses: {},
    featureUses: {},
    actionEconomy: {
        action: true,
        bonusAction: true,
        reaction: true,
    },
    activeHuntersMarkTargetId: undefined,
    activeVowOfEnmityTargetId: undefined,
};

const FONT_OF_MAGIC_COSTS = [0, 2, 3, 5, 6, 7]; // Index is spell level

const playStateSlice = createSlice({
    name: 'playState',
    initialState,
    reducers: {
        setPlayState: (state, action: PayloadAction<PlayState>) => {
            return action.payload;
        },
        startNewTurn: (state) => {
            state.usedSneakAttackThisTurn = false;
            state.actionEconomy = { action: true, bonusAction: true, reaction: true };
            // Handle effect durations
            state.activeEffects = state.activeEffects
                .map(effect => {
                    if (effect.durationInRounds !== undefined && effect.durationInRounds > 0) {
                        return { ...effect, durationInRounds: effect.durationInRounds - 1 };
                    }
                    return effect;
                })
                .filter(effect => effect.durationInRounds === undefined || effect.durationInRounds > 0);
            // Handle state durations
             state.activeStates = state.activeStates
                .map(s => {
                    if (s.durationInRounds !== undefined && s.durationInRounds > 0) {
                        return { ...s, durationInRounds: s.durationInRounds - 1 };
                    }
                    return s;
                })
                .filter(s => s.durationInRounds === undefined || s.durationInRounds > 0);
        },
        spendAction: (state) => { state.actionEconomy.action = false; },
        spendBonusAction: (state) => { state.actionEconomy.bonusAction = false; },
        spendReaction: (state) => { state.actionEconomy.reaction = false; },
        setUsedSneakAttack: (state, action: PayloadAction<boolean>) => {
            state.usedSneakAttackThisTurn = action.payload;
        },
        setConcentration: (state, action: PayloadAction<{ spellId: string; spellName: string } | undefined>) => {
            // Remove previous concentration effect if one exists
            if (state.activeConcentration) {
                state.activeEffects = state.activeEffects.filter(e => e.source !== state.activeConcentration?.spellName);
            }
            state.activeConcentration = action.payload;
            if (!action.payload) {
                // If concentration is broken, clear related states
                state.activeHuntersMarkTargetId = undefined;
                state.activeVowOfEnmityTargetId = undefined;
            }
        },
        addCompanion: (state, action: PayloadAction<Companion>) => {
            state.activeCompanions.push(action.payload);
        },
        removeCompanion: (state, action: PayloadAction<string>) => {
            state.activeCompanions = state.activeCompanions.filter(c => c.instanceId !== action.payload);
        },
        updateCompanionHp: (state, action: PayloadAction<{ instanceId: string, newHp: number }>) => {
            const companion = state.activeCompanions.find(c => c.instanceId === action.payload.instanceId);
            if (companion) {
                companion.currentHp = action.payload.newHp;
            }
        },
        useElixir: (state, action: PayloadAction<string>) => {
            state.experimentalElixirs = state.experimentalElixirs.filter(e => e.id !== action.payload);
        },
        useFeature: (state, action: PayloadAction<{ featureId: string }>) => {
            if (state.featureUses[action.payload.featureId]) {
                state.featureUses[action.payload.featureId] -= 1;
            }
        },
        spendResource: (state, action: PayloadAction<{ id: string, amount: number }>) => {
            const resource = state.resources.find(r => r.id === action.payload.id);
            if (resource) {
                resource.current -= action.payload.amount;
            }
        },
        regainResource: (state, action: PayloadAction<{ id: string, amount: number }>) => {
            const resource = state.resources.find(r => r.id === action.payload.id);
            if (resource) {
                resource.current = Math.min(resource.max, resource.current + action.payload.amount);
            }
        },
        castInnateSpell: (state, action: PayloadAction<{ spell: InnateSpell['spell'], uses: InnateSpell['uses'] }>) => {
            if (!state.innateSpellUses[action.payload.spell.id]) {
                state.innateSpellUses[action.payload.spell.id] = { expended: 0, frequency: action.payload.uses };
            }
            state.innateSpellUses[action.payload.spell.id].expended += 1;
        },
        expendSpellSlot: (state, action: PayloadAction<{ level: number, quantity: number }>) => {
            if (!state.expendedSpellSlots[action.payload.level]) state.expendedSpellSlots[action.payload.level] = 0;
            state.expendedSpellSlots[action.payload.level] += action.payload.quantity;
        },
        expendPactSlot: (state) => {
            state.expendedPactSlots += 1;
        },
        recoverSpellSlots: (state, action: PayloadAction<Record<number, number>>) => {
            for (const level in action.payload) {
                state.expendedSpellSlots[level] -= action.payload[level];
            }
        },
        convertSpellSlotToSp: (state, action: PayloadAction<{ level: number }>) => {
            const { level } = action.payload;
            const sorcererResource = state.resources.find(r => r.id === 'sorcery-points');
            if (!sorcererResource) return;

            state.expendedSpellSlots[level] = (state.expendedSpellSlots[level] || 0) + 1;
            sorcererResource.current = Math.min(sorcererResource.max, sorcererResource.current + level);
        },
        convertSpToSpellSlot: (state, action: PayloadAction<{ level: number }>) => {
            const { level } = action.payload;
            const cost = FONT_OF_MAGIC_COSTS[level];
            const sorcererResource = state.resources.find(r => r.id === 'sorcery-points');

            if (!sorcererResource || sorcererResource.current < cost) return;

            sorcererResource.current -= cost;
            state.expendedSpellSlots[level] = (state.expendedSpellSlots[level] || 0) - 1;
        },
        setTurnFlag: (state, action: PayloadAction<{ flag: 'attacked' | 'tookDamage', value: boolean }>) => {
            state.turnData[action.payload.flag] = action.payload.value;
        },
        addActiveEffect: (state, action: PayloadAction<EffectInstance>) => {
            state.activeEffects.push(action.payload);
        },
        removeActiveEffect: (state, action: PayloadAction<string>) => {
            state.activeEffects = state.activeEffects.filter(e => e.id !== action.payload);
        },
        addActiveState: (state, action: PayloadAction<StateInstance>) => {
            if (!state.activeStates.some(s => s.id === action.payload.id)) {
                state.activeStates.push(action.payload);
            }
        },
        removeActiveState: (state, action: PayloadAction<string>) => {
            state.activeStates = state.activeStates.filter(s => s.id !== action.payload);
        },
        setUncannyDodgePrompt: (state, action: PayloadAction<UncannyDodgePrompt | null>) => {
            state.uncannyDodgePrompt = action.payload;
        },
        setInteractionPrompt: (state, action: PayloadAction<InteractionPrompt | null>) => {
            state.interactionPrompt = action.payload;
        },
        setSummonChoicePrompt: (state, action: PayloadAction<SummonChoicePrompt | null>) => {
            state.summonChoicePrompt = action.payload;
        },
        giveBardicInspiration: (state, action: PayloadAction<{ allyName: string }>) => {
            if (state.bardicInspiration) state.bardicInspiration.givenTo.push(action.payload.allyName);
        },
        useBardicInspiration: (state, action: PayloadAction<{ allyName: string }>) => {
             if (state.bardicInspiration) state.bardicInspiration.currentUses -= 1;
        },
        useLayOnHands: (state, action: PayloadAction<{ amount: number, cure: boolean }>) => {
            if (state.paladin?.layOnHandsPool) {
                state.paladin.layOnHandsPool.current -= (action.payload.cure ? 5 : action.payload.amount);
            }
        },
        castSpell: (state, action: PayloadAction<{ spell: Spell, level: number, usePactSlot: boolean, character: Character, affectedTokens?: any[] }>) => {
            const { spell, level, usePactSlot, character } = action.payload;
            if (spell.requiresConcentration) {
                state.activeConcentration = { spellId: spell.id, spellName: spell.name };
            }
            if (level > 0) {
                if (usePactSlot) {
                    state.expendedPactSlots += 1;
                } else {
                    if (!state.expendedSpellSlots[level]) state.expendedSpellSlots[level] = 0;
                    state.expendedSpellSlots[level] += 1;
                }
            }
        },
        exitWildShape: (state) => {
            state.wildShapeForm = null;
        },
        setHuntersMark: (state, action: PayloadAction<string | undefined>) => {
            state.activeHuntersMarkTargetId = action.payload;
        },
        setVowOfEnmity: (state, action: PayloadAction<string | undefined>) => {
            state.activeVowOfEnmityTargetId = action.payload;
        },
        applyShortRest: (state) => {
            state.expendedPactSlots = 0; // Warlocks rejoice
            state.resources.forEach(resource => {
                if (resource.per === 'shortRest') {
                    resource.current = resource.max;
                }
            });
            // Note: Feature uses also need resetting. Assuming they are represented in `resources`.
        },
        applyLongRest: (state) => {
            state.expendedSpellSlots = {};
            state.expendedPactSlots = 0;
            state.innateSpellUses = {};
            state.featureUses = {};
            state.resources.forEach(resource => {
                resource.current = resource.max;
            });
            state.activeEffects = state.activeEffects.filter(effect => effect.duration === 'permanent');
            state.activeConcentration = undefined;
            state.activeHuntersMarkTargetId = undefined;
            state.activeVowOfEnmityTargetId = undefined;
            state.wildShapeForm = null;
            state.symbioticEntityActive = false;
        },
    }
});

export const playStateActions = playStateSlice.actions;
export default playStateSlice;