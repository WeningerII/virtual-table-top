
import { useAppSelector, useAppDispatch } from '../.././state/hooks';
import { useToast } from './state/ToastContext';
import { useVttController } from '../../../hooks/useVttController';
import { GeminiError } from '../.././services/geminiService';
import { generationStart, generationStageUpdate, generationSuccess, generationPartialSuccess, generationFailed } from '../../../state/worldbuilderSlice';
import { EncounterConcept } from './types';
import { generateMapImage } from '../.././services/ai/world.service';


export const useEncounterGeneration = () => {
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const { handleDmGenerateEncounter } = useVttController();
    const { context, theme, partyLevel, partySize, difficulty, generationStatus, generatedConcept } = useAppSelector(state => state.worldbuilder);
    
    const isGenerating = generationStatus === 'generating';

    const generate = async (retryImagesOnly: boolean = false) => {
        if (!context.trim() && !retryImagesOnly) {
            addToast("Please describe the encounter.", "error");
            return;
        }

        if (!retryImagesOnly) {
            dispatch(generationStart());
        } else {
             dispatch(generationStageUpdate({ stage: 'Retrying Image Generation...', concept: null }));
        }

        try {
            let concept: EncounterConcept | null = null;
            if (!retryImagesOnly) {
                dispatch(generationStageUpdate({ stage: 'Generating Concept...', concept: null }));
                concept = await handleDmGenerateEncounter({ context, theme, partyLevel, partySize, difficulty });
                 if (!concept) throw new Error("InvalidAIResult");
            } else {
                concept = generatedConcept;
                if (!concept) throw new Error("No concept to retry images for.");
            }
            
            dispatch(generationStageUpdate({ stage: 'Generating Map Image...', concept }));
            
            await new Promise(res => setTimeout(res, 500)); // Brief pause for UI feedback

            try {
                const imageUrl = await generateMapImage(concept);
                if (!imageUrl) throw new Error("Image generation returned null.");
                
                // In a full implementation, this URL would be stored. For now, success implies it exists.
                console.log("Generated map image successfully.");

                dispatch(generationSuccess(concept));

            } catch (imageError) {
                console.error("Image generation failed:", imageError);
                dispatch(generationPartialSuccess({ concept, error: "Map image generation failed." }));
                addToast("Encounter concept generated, but map image failed.", "error");
            }
            
        } catch (error) {
            console.error("Encounter generation failed:", error);
            let userMessage = "An unexpected error occurred while generating the encounter.";
            
            if (error instanceof Error && error.message === "InvalidAIResult") {
                userMessage = "Failed to generate encounter. The AI may not have returned a valid result.";
            } else if (error instanceof GeminiError) {
                userMessage = error.isQuotaError 
                    ? "AI features are temporarily unavailable due to high usage. Please try again later."
                    : "An AI error occurred during concept generation.";
            }
            addToast(userMessage, "error");
            dispatch(generationFailed(userMessage));
        }
    };

    return { generate, isGenerating };
};