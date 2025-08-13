import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VitalsState } from './types';

const initialState: VitalsState = {
    hp: 10,
    currentHp: 10,
    tempHp: 0,
    hitDice: {},
    deathSaves: { successes: 0, failures: 0 },
    arcaneWard: { current: 0, max: 0 },
    exhaustionLevel: 0,
};

const vitalsSlice = createSlice({
    name: 'vitals',
    initialState,
    reducers: {
        setVitalsState: (state, action: PayloadAction<VitalsState>) => {
            return action.payload;
        },
        updateCurrentHp: (state, action: PayloadAction<number>) => {
            state.currentHp = action.payload;
        },
        updateTempHp: (state, action: PayloadAction<number>) => {
            state.tempHp = Math.max(state.tempHp, action.payload);
        },
        resolveDamage: (state, action: PayloadAction<{ amount: number }>) => {
            let damage = action.payload.amount;
            if (state.tempHp > 0) {
                const tempDamage = Math.min(damage, state.tempHp);
                state.tempHp -= tempDamage;
                damage -= tempDamage;
            }
            state.currentHp -= damage;
            if (state.currentHp < 0) state.currentHp = 0;
        },
        makeDeathSave: (state, action: PayloadAction<{ roll: number }>) => {
            if (action.payload.roll >= 10) {
                state.deathSaves.successes += (action.payload.roll === 20 ? 2 : 1);
            } else {
                state.deathSaves.failures += (action.payload.roll === 1 ? 2 : 1);
            }
        },
        spendHitDice: (state, action: PayloadAction<{ die: number, count: number }>) => {
            const dieKey = `d${action.payload.die}`;
            if (state.hitDice[dieKey]) {
                state.hitDice[dieKey].current -= action.payload.count;
            }
        },
        applyLongRest: (state) => {
            state.currentHp = state.hp;
            state.tempHp = 0;

            const newHitDice = { ...state.hitDice };
            for (const die in newHitDice) {
                const recoveryAmount = Math.max(1, Math.floor(newHitDice[die].max / 2));
                newHitDice[die].current = Math.min(newHitDice[die].max, newHitDice[die].current + recoveryAmount);
            }
            state.hitDice = newHitDice;

            state.exhaustionLevel = Math.max(0, state.exhaustionLevel - 1);
            state.deathSaves = { successes: 0, failures: 0 };
        },
    },
});

export const vitalsActions = vitalsSlice.actions;
export default vitalsSlice;