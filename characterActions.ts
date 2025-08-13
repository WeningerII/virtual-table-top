
import { metaActions } from './metaSlice';
import { abilitiesActions } from './abilitiesSlice';
import { proficienciesActions } from './proficienciesSlice';
import { inventoryActions } from './inventorySlice';
import { spellsActions } from './spellsSlice';
import { vitalsActions } from './vitalsSlice';
import { playStateActions } from './playStateSlice';

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