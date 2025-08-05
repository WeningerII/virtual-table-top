import { SimulationState, GameEvent, PlayerChoicePrompt, StaticGameDataCache } from '../../types';

export interface ValidationResult {
    valid: boolean;
    reason?: string;
}

export interface CommandResult {
    success: boolean;
    newState: SimulationState;
    events: readonly GameEvent[];
    visualEffects: readonly any[]; // VFXRequest[]
    audioEvents: readonly any[]; // AudioEvent[]
    errors: readonly any[]; // CommandError[]
    prompt?: PlayerChoicePrompt;
}

export interface CommandContext {
    staticData: StaticGameDataCache;
}

export interface GameCommand {
    canExecute(state: SimulationState, context: CommandContext): ValidationResult;
    execute(state: SimulationState, context: CommandContext): CommandResult;
}