import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIRollResult, CrucibleActionResult, ActionItem, Spell, ClassFeature } from '../types';

interface UIState {
    lastRollResult: UIRollResult | null;
    actionResult: CrucibleActionResult | null;
    isShortRestModalOpen: boolean;
    divineSmiteModalContext: ActionItem | null;
    layOnHandsModalOpen: boolean;
    arcaneRecoveryModalOpen: boolean;
    fontOfMagicModalOpen: boolean;
    summoningModalContext: { spell?: Spell | null } | null;
    creatorsWorkbenchContext: { feature: ClassFeature } | null;
    interactionModalContext: { type: 'bardic_inspiration' | 'cutting_words', featureId: string } | null;
    isInventoryModalOpen: boolean;
    isSpellsModalOpen: boolean;
    isActionsModalOpen: boolean;
}

const initialState: UIState = {
    lastRollResult: null,
    actionResult: null,
    isShortRestModalOpen: false,
    divineSmiteModalContext: null,
    layOnHandsModalOpen: false,
    arcaneRecoveryModalOpen: false,
    fontOfMagicModalOpen: false,
    summoningModalContext: null,
    creatorsWorkbenchContext: null,
    interactionModalContext: null,
    isInventoryModalOpen: false,
    isSpellsModalOpen: false,
    isActionsModalOpen: false,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setLastRollResult: (state, action: PayloadAction<UIRollResult | null>) => {
            state.lastRollResult = action.payload;
        },
        setActionResult: (state, action: PayloadAction<CrucibleActionResult | null>) => {
            state.actionResult = action.payload;
        },
        openShortRestModal: (state) => {
            state.isShortRestModalOpen = true;
        },
        openDivineSmiteModal: (state, action: PayloadAction<ActionItem>) => {
            state.divineSmiteModalContext = action.payload;
        },
        openLayOnHandsModal: (state) => {
            state.layOnHandsModalOpen = true;
        },
        openArcaneRecoveryModal: (state) => {
            state.arcaneRecoveryModalOpen = true;
        },
        openFontOfMagicModal: (state) => {
            state.fontOfMagicModalOpen = true;
        },
        openSummoningModal: (state, action: PayloadAction<{ spell?: Spell | null } | undefined>) => {
            state.summoningModalContext = action.payload || {};
        },
        openCreatorsWorkbenchModal: (state, action: PayloadAction<{ feature: ClassFeature }>) => {
            state.creatorsWorkbenchContext = action.payload;
        },
         openInteractionModal: (state, action: PayloadAction<{ type: 'bardic_inspiration' | 'cutting_words', featureId: string }>) => {
            state.interactionModalContext = action.payload;
        },
        openInventoryModal: (state) => {
            state.isInventoryModalOpen = true;
        },
        openSpellsModal: (state) => {
            state.isSpellsModalOpen = true;
        },
        openActionsModal: (state) => {
            state.isActionsModalOpen = true;
        },
        closeAllModals: (state) => {
            state.isShortRestModalOpen = false;
            state.divineSmiteModalContext = null;
            state.layOnHandsModalOpen = false;
            state.arcaneRecoveryModalOpen = false;
            state.fontOfMagicModalOpen = false;
            state.summoningModalContext = null;
            state.creatorsWorkbenchContext = null;
            state.interactionModalContext = null;
            state.isInventoryModalOpen = false;
            state.isSpellsModalOpen = false;
            state.isActionsModalOpen = false;
        },
    },
});

export const uiActions = uiSlice.actions;
export const { setLastRollResult, setActionResult } = uiSlice.actions;
export default uiSlice.reducer;