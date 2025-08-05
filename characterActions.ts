
import { metaActions } from '../engine/slices/metaSlice';
import { abilitiesActions } from '../engine/slices/abilitiesSlice';
import { proficienciesActions } from '../engine/slices/proficienciesSlice';
import { inventoryActions } from '../engine/slices/inventorySlice';
import { spellsActions } from '../engine/slices/spellsSlice';
import { vitalsActions } from '../engine/slices/vitalsSlice';
import { playStateActions } from '../engine/slices/playStateSlice';

// This is a bit of a trick to get a union of all action types

type MetaActionCreators = typeof metaActions;
type AbilitiesActionCreators = typeof abilitiesActions;
type ProficienciesActionCreators = typeof proficienciesActions;
type InventoryActionCreators = typeof inventoryActions;
type SpellsActionCreators = typeof spellsActions;
type VitalsActionCreators = typeof vitalsActions;
type PlayStateActionCreators = typeof playStateActions;

type ActionCreatorMap =
  | MetaActionCreators[keyof MetaActionCreators]
  | AbilitiesActionCreators[keyof AbilitiesActionCreators]
  | ProficienciesActionCreators[keyof ProficienciesActionCreators]
  | InventoryActionCreators[keyof InventoryActionCreators]
  | SpellsActionCreators[keyof SpellsActionCreators]
  | VitalsActionCreators[keyof VitalsActionCreators]
  | PlayStateActionCreators[keyof PlayStateActionCreators];

export type Action = ReturnType<ActionCreatorMap>;