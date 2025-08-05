
import { DEBUG_MODE, PERFORMANCE_WARNING_THRESHOLD_MS } from './constants';


export * from './types/primitives';
export * from './types/effects';
export * from './types/character';
export * from './types/vtt';
export * from './types/data';
export * from './types/generation';
export * from './types/enums';
export * from './types/combat';

import { EncounterConcept } from './types/vtt';

// Import the specific state shapes from the new simulation slices
import type { EntityState } from './state/entitySlice';
import type { EventState } from './state/eventSlice';
import type { AnimationState } from './state/animationSlice';
import type { AIState } from './state/aiSlice';
import type { CombatFlowState } from './types/combat';

// This composite type represents the full state for "Play" mode, assembled from individual state slices.
export interface PlayModeState {
    entity: EntityState;
    events: EventState;
    animations: AnimationState;
    ai: AIState;
    combatFlow: CombatFlowState;
}

// This flattened type is used by the event processor, providing a unified view of the simulation.
export type SimulationState = EntityState & EventState & AnimationState & AIState & CombatFlowState;


// Added for Sprint 2
export interface WorldbuilderState {
    context: string;
    theme: string;
    partyLevel: number;
    partySize: number;
    difficulty: string;
    generatedConcept: EncounterConcept | null;
    generationStatus: 'idle' | 'generating' | 'partial' | 'success' | 'error';
    generationStage: string | null;
    generationError: string | null;
}

// Added for Sprint 3
export interface BuilderState {
    currentStep: number;
}