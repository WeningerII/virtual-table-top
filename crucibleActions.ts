import { VTTMap, Token, VTTObject, TerrainCell, AdjudicationTarget, NpcTurnResult, Monster, MapNpcInstance, Character, EncounterConcept, SimState, NpcAnimationState, CrucibleActionResult } from "../types";

export type CrucibleAction =
  | { type: 'SET_SIM_STATE'; payload: SimState }
  | { type: 'SET_WINNER'; payload: string | null }
  | { type: 'SET_ANIMATION_STATE'; payload: NpcAnimationState | null }
  | { type: 'SET_ACTION_RESULT'; payload: CrucibleActionResult | null }
  | { type: 'SET_IS_AI_THINKING'; payload: boolean }
  | { type: 'RESET_SIMULATION' }
  | { type: 'LOAD_ENCOUNTER', payload: EncounterConcept }
  | { type: 'UPDATE_TOKENS', payload: Token[] }
  | { type: 'DEAL_DAMAGE_TO_NPC', payload: { instanceId: string, damage: number, attackerName?: string } }
  | { type: 'ADVANCE_INITIATIVE' }
  | { type: 'ADD_TOKENS_TO_INITIATIVE' }
  | { type: 'ROLL_INITIATIVE' }
  | { type: 'RESET_INITIATIVE' }
  | { type: 'REMOVE_FROM_INITIATIVE'; payload: string };