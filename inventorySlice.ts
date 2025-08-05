import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InventoryState, CharacterItemInstance, EquippedItems, Currency } from '../../types';

const initialState: InventoryState = {
    inventory: [],
    equippedItems: {},
    money: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    infusedItems: [],
    attunedItemIds: [],
    startingEquipmentGranted: false,
};

const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        setInventoryState: (state, action: PayloadAction<InventoryState>) => {
            return action.payload;
        },
        updateMoney: (state, action: PayloadAction<Currency>) => {
            state.money = action.payload;
        },
        updateInventory: (state, action: PayloadAction<CharacterItemInstance[]>) => {
            state.inventory = action.payload;
        },
        grantEquipment: (state, action: PayloadAction<{ items: { itemId: string, quantity: number }[], money: Currency }>) => {
            action.payload.items.forEach(newItem => {
                const existingItem = state.inventory.find(i => i.itemId === newItem.itemId);
                if (existingItem) {
                    existingItem.quantity += newItem.quantity;
                } else {
                    state.inventory.push({ instanceId: crypto.randomUUID(), itemId: newItem.itemId, quantity: newItem.quantity });
                }
            });
            state.money = action.payload.money;
            state.startingEquipmentGranted = true;
        },
        equipItem: (state, action: PayloadAction<{ instanceId: string, slot: keyof EquippedItems }>) => {
            state.equippedItems[action.payload.slot] = action.payload.instanceId;
        },
        unequipItem: (state, action: PayloadAction<{ slot: keyof EquippedItems }>) => {
            delete state.equippedItems[action.payload.slot];
        },
        setArcaneArmor: (state, action: PayloadAction<{ arcaneArmorItemId?: string, armorModel?: 'guardian' | 'infiltrator' }>) => {
            state.arcaneArmorItemId = action.payload.arcaneArmorItemId;
        },
        useItem: (state, action: PayloadAction<{ instanceId: string }>) => {
            const item = state.inventory.find(i => i.instanceId === action.payload.instanceId);
            if (item) {
                item.quantity -= 1;
                if (item.quantity <= 0) {
                    state.inventory = state.inventory.filter(i => i.instanceId !== action.payload.instanceId);
                }
            }
        },
        attuneItem: (state, action: PayloadAction<string>) => {
            if (!state.attunedItemIds.includes(action.payload)) {
                state.attunedItemIds.push(action.payload);
            }
        },
        endAttunement: (state, action: PayloadAction<string>) => {
            state.attunedItemIds = state.attunedItemIds.filter(id => id !== action.payload);
        },
        updateInfusedItems: (state, action: PayloadAction<{ instanceId: string, infusionId: string }[]>) => {
            state.infusedItems = action.payload;
        },
        removeItemInstance: (state, action: PayloadAction<{ instanceId: string, quantity: number }>) => {
             state.inventory = state.inventory.filter(i => i.instanceId !== action.payload.instanceId);
        },
        createItemInstance: (state, action: PayloadAction<Partial<CharacterItemInstance> & { itemId: string, quantity: number }>) => {
            state.inventory.push({ instanceId: crypto.randomUUID(), ...action.payload });
        },
        updateItemInstance: (state, action: PayloadAction<Partial<CharacterItemInstance> & { instanceId: string }>) => {
            const index = state.inventory.findIndex(i => i.instanceId === action.payload.instanceId);
            if (index !== -1) {
                state.inventory[index] = { ...state.inventory[index], ...action.payload };
            }
        },
        forgePactWeapon: (state, action: PayloadAction<{ itemId: string, instanceId?: string, name?: string }>) => {
            // This logic is complex and better handled in a thunk or the component, for now we just add/update the item.
        },
    },
});

export const inventoryActions = inventorySlice.actions;
export default inventorySlice;
