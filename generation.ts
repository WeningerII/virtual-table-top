export type GenerationStep = 'Fundamentals' | 'Abilities & Feats' | 'Equipment' | 'Details & Spells';

export interface ValidationError {
    field: string;
    message: string;
    details?: any;
}

export interface GenerationProgress {
    step: GenerationStep;
    message: string;
    isError?: boolean;
}
