import { MapNpcInstance } from './character';

export type CombatVictor = 'players' | 'npcs' | 'draw' | string | null;

export interface CombatResult {
    ended: boolean;
    victor: CombatVictor;
}

// New, more granular state machine phases for the Adjudicator
export type CombatPhase = 
    | 'IDLE'
    | 'ENCOUNTER_LOADING'
    | 'INITIATIVE_ROLLING'
    | 'ROUND_START'
    | 'TURN_START'
    | 'AWAITING_PLAYER_ACTION'
    | 'PROCESSING_PLAYER_ACTION'
    | 'AI_PROCESSING'
    | 'TURN_END'
    | 'COMBAT_ENDED';

export interface CombatState {
    phase: CombatPhase;
    round?: number;
    activeTokenId?: string | null;
    result?: CombatResult;
}

export interface TransitionLogEntry {
    from: CombatPhase;
    to: CombatPhase;
    timestamp: number;
    isRollback?: boolean;
}

export interface CombatFlowState {
    currentState: CombatState;
    history: CombatState[];
    transitionLog: TransitionLogEntry[];
}
