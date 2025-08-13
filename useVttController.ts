import { useAppSelector, useAppDispatch } from './hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';
import { startCombat, advanceTurn } from 'state/combatFlowSlice';
import { generateEncounterConcept } from 'services./ai/map.service';
import { EncounterConcept, MapNpcInstance, Token } from './types';
import { loadEncounter as loadEncounterAction, loadCrucibleEncounter } from 'state/entitySlice';
import { useToast } from 'state/ToastContext';
import { GeminiError } from 'services./geminiService';

interface DmGenerateEncounterParams {
    context: string;
    theme: string;
    partyLevel: number;
    partySize: number;
    difficulty: string;
}

/**
 * A hook to centralize fetching all data required for the VTT 'Play' view.
 * It combines character data, app state, and combat UI data into a single,
 * convenient object for the PlayView and its children. Also includes core
 * simulation control logic.
 */
export const useVttController = (options?: { isCrucible?: boolean }) => {
    const appState = useAppSelector(gState => gState.app);
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const combatState = useAppSelector(gState => gState.combatFlow.currentState);
    const entityState = useAppSelector(gState => gState.entity);
    const aiState = useAppSelector(gState => gState.ai);
    const animationState = useAppSelector(gState => gState.animations);
    const dispatch = useAppDispatch();
    const { addToast } = useToast();

    const handleStartCombat = () => {
        dispatch(startCombat());
    };

    const handleAdvanceTurn = () => {
        dispatch(advanceTurn());
    };
    
     const handleDmGenerateEncounter = async (params: DmGenerateEncounterParams): Promise<EncounterConcept | null> => {
        if (!appState.staticDataCache) {
            addToast("Static data not loaded, cannot generate encounter.", "error");
            return null;
        }
        try {
            const concept = await generateEncounterConcept(params.context, params.theme, params.partyLevel, params.partySize, params.difficulty, appState.staticDataCache);
            if (concept) {
                const placeholderImageUrl = '/maps/default_forest.jpg'; // Placeholder until image gen is re-enabled
                dispatch(loadEncounterAction({ concept, imageUrl: placeholderImageUrl }));
                addToast("Encounter generated and loaded!", "success");
                return concept;
            }
        } catch (error) {
            console.error("Encounter generation failed:", error);
            const message = error instanceof GeminiError && error.isQuotaError
                ? "AI features are temporarily unavailable due to high usage."
                : "Failed to generate encounter concept from AI.";
            addToast(message, "error");
        }
        return null;
    };
    
    const handleCrucibleGenerate = async (prompt: string) => {
         if (!appState.staticDataCache) return;
         try {
            const concept = await generateEncounterConcept(prompt, 'Arena', 5, 4, 'Deadly', appState.staticDataCache);
            if (concept) {
                 const placeholderImageUrl = '/maps/crucible_arena.jpg';
                 dispatch(loadCrucibleEncounter({ concept, imageUrl: placeholderImageUrl }));
            }
         } catch (error) {
             addToast("Failed to generate Crucible encounter.", "error");
         }
    };


    return {
        character,
        isDmMode: appState.isDmMode,
        staticDataCache: appState.staticDataCache,
        mapState: entityState.activeMap,
        simState: combatState.phase,
        winner: combatState.phase === 'COMBAT_ENDED' ? combatState.result?.victor : null,
        mapNpcInstances: entityState.mapNpcInstances,
        currentSceneImageUrl: entityState.currentSceneImageUrl,
        mapImageUrl: entityState.mapImageUrl,
        isAiThinking: aiState.isAiThinking,
        animationState: animationState.animationState,
        lastDamageInfo: animationState.lastDamageInfo,
        pendingAiAction: aiState.pendingAiAction,
        handleStartCombat,
        handleAdvanceTurn,
        handleDmGenerateEncounter,
        handleCrucibleGenerate,
    };
};