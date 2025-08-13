import { BattlefieldState, Monster, AiTurnIntent, NpcTurnResult } from './types';
import { generateNpcTurn } from './dm.service';
import { getLocalAiTurn } from './engine/ai/localAiService';

/**
 * Determines the AI's turn action.
 * This service acts as a dispatcher, attempting to use a fast, local AI first,
 * and falling back to the more powerful generative AI if needed.
 * 
 * Flow:
 * 1. Check if the monster has a pre-defined AI archetype (e.g., 'brute', 'skirmisher').
 * 2. If an archetype exists, attempt to get a turn decision from the local behavior tree AI (`getLocalAiTurn`).
 *    This is very fast and predictable, suitable for simple monsters or followers.
 * 3. If the local AI provides a valid action (either a move or an ability use), return that intent immediately.
 * 4. If there's no archetype, or if the local AI fails to produce a valid action, fallback to the generative AI (`generateNpcTurn.generate`).
 *    This uses Gemini to analyze the battlefield and make a more nuanced, creative, and tactical decision.
 * 5. If the generative AI returns a valid result, map it to the required `AiTurnIntent` format.
 * 6. If both systems fail, return null, indicating the AI is unable to decide on an action.
 */
const getNpcTurn = async (
    battlefield: BattlefieldState,
    activeMonsterData: Monster,
): Promise<AiTurnIntent | null> => {
    
    // 1. Attempt to use local, deterministic AI first if an archetype is defined.
    if (activeMonsterData.archetype) {
        try {
            const localIntent = await getLocalAiTurn(battlefield);
            // 2. If the local AI provides a valid action or move, use it.
            if (localIntent && (localIntent.actionId || localIntent.destination)) {
                return localIntent;
            }
        } catch (e) {
            console.warn("Local AI failed, falling back to generative AI.", e);
        }
    }
    
    // 3. Fallback to Gemini if no local AI or if local AI fails.
    const cloudResult: NpcTurnResult | null = await generateNpcTurn.generate(battlefield);
    
    if (cloudResult) {
        // 4. Map the full cloud result to the simpler intent object for the simulation engine.
        return {
            actionId: cloudResult.actionId,
            targetId: cloudResult.targetId,
            destination: cloudResult.destination,
            rationale: cloudResult.rationale,
            dialogue: cloudResult.dialogue,
            squadTargetId: cloudResult.squadTargetId,
        };
    }
    
    // 5. If all systems fail, the AI cannot act.
    return null;
};

export const aiDecisionService = {
    getNpcTurn,
};