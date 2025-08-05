import { PlayerChoicePrompt, GameEvent } from './types/character';
import { DEBUG_MODE, PERFORMANCE_WARNING_THRESHOLD_MS } from '../constants';


export * from './types/primitives';
export * from './types/effects';
export * from './types/character';
export * from './types/vtt';
export * from './types/data';
export * from './types/generation';
export * from './types/enums';
export * from './types/combat';
export type { CombatState, CombatFlowState, CombatResult } from './types/combat';

import { EncounterConcept, VFXRequest, SpatialGrid } from './types/vtt';
import { ActionItem } from './types/primitives';
import { VTTMap, MapNpcInstance, NpcAnimationState } from './types/vtt';

// This type represents the combined state needed for the simulation/event processing engine during play mode.
// It is an aggregation of multiple, more focused state slices.
export interface SimulationState {
    activeMap: VTTMap | null;
    mapNpcInstances: MapNpcInstance[];
    currentSceneImageUrl: string | null;
    mapImageUrl: string | null;
    animationState: NpcAnimationState | null;
    isAiThinking: boolean;
    lastVFXRequest: VFXRequest | null;
    eventQueue: GameEvent[];
    pendingChoice: PlayerChoicePrompt | null;
    spatialIndex: SpatialGrid | null; 
    lastDamageInfo: { targetId: string; amount: number; damageType: string, isCrit: boolean } | null;
    pendingAiAction: { action: ActionItem; targetId: string } | null;
}

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