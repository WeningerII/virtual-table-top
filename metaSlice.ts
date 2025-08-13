import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MetaState, SelectedClass, Heritage, Background, BackstoryDetails, PhysicalCharacteristics } from './types';

const initialState: MetaState = {
    id: '',
    name: '',
    level: 1,
    classes: [],
    heritage: { ancestries: [], resolvedHeritage: null },
    background: null,
    backstoryDetails: { personality: '', ideals: '', bonds: '', flaws: '', backstory: '', notes: '' },
    physicalCharacteristics: { age: '', height: '', weight: '', eyes: '', skin: '', hair: '', gender: '', alignment: '', faith: '' },
    characterPortraitUrl: '',
};

const metaSlice = createSlice({
  name: 'meta',
  initialState,
  reducers: {
    setMetaState: (state, action: PayloadAction<MetaState>) => {
        return action.payload;
    },
    updatePartial: (state, action: PayloadAction<Partial<MetaState>>) => {
      Object.assign(state, action.payload);
    },
    updateClasses: (state, action: PayloadAction<SelectedClass[]>) => {
      state.classes = action.payload;
    },
    setHeritage: (state, action: PayloadAction<Heritage>) => {
        state.heritage = action.payload;
    },
    setBackground: (state, action: PayloadAction<Background | null>) => {
        state.background = action.payload;
    },
    updateBackstoryDetails: (state, action: PayloadAction<Partial<BackstoryDetails>>) => {
        state.backstoryDetails = { ...state.backstoryDetails, ...action.payload };
    },
    updatePhysicalCharacteristics: (state, action: PayloadAction<Partial<PhysicalCharacteristics>>) => {
        state.physicalCharacteristics = { ...state.physicalCharacteristics, ...action.payload };
    },
    setArtificerSubclassChoice: (state, action: PayloadAction<{ key: 'armorModel' | 'artilleristCannonChoice', value: any }>) => {
        const artificerClass = state.classes.find(c => c.id === 'artificer');
        if (artificerClass) {
            (artificerClass as any)[action.payload.key] = action.payload.value;
        }
    }
  },
});

export const metaActions = metaSlice.actions;
export default metaSlice;
