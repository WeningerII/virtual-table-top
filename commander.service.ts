import { GoogleGenAI, Type } from "@google/genai";
import { EncounterStrategy, BattlefieldState } from "../../types";
import { ai, textModel, GeminiError } from '../geminiService';

const getEncounterStrategy = async (
    battlefieldSummary: string
): Promise<Record<string, EncounterStrategy> | null> => {
    if (!process.env.API_KEY) return null;

    const targetingTypes = [
        'lowest_hp', 'highest_hp', 'closest', 'farthest', 'highest_damage_output',
        'lowest_ac', 'highest_ac', 'healer', 'controller', 'brute', 'skirmisher', 'leader', 'follower'
    ].join('", "');

    const prompt = `You are a master tactician AI for a D&D game. Analyze the provided battlefield summary and generate a high-level combat strategy for each distinct squad leader. Your response must be a valid JSON object mapping each leader's instanceId to their strategy.

**Battlefield Summary:**
${battlefieldSummary}

**Your Task:**
For each squad leader on the battlefield, devise a unique and intelligent strategy.
- **Objective:** What is the squad's primary goal? (e.g., "Eliminate the enemy leader," "Protect the objective," "Ambush the spellcasters").
- **Rationale:** Briefly explain your tactical reasoning.
- **Targeting Priorities:** Define how the squad should select targets. Assign 'PRIMARY', 'SECONDARY', or 'AVOID' priorities to different target types.
  - **Valid Target Types:** You must choose from this list: "${targetingTypes}".
  - **Weight:** Use a weight from 0.1 to 2.0 to indicate the importance of a priority. Higher is more important. AVOID should have a low weight (e.g., 0.1).

Your entire response must be a single JSON object where keys are leader instanceIds and values are strategy objects matching the schema.`;

    try {
        const targetingPrioritySchema = {
            type: Type.OBJECT,
            properties: {
                priority: { type: Type.STRING, enum: ['PRIMARY', 'SECONDARY', 'AVOID'] },
                targetType: { type: Type.STRING, description: `One of: ${targetingTypes}` },
                weight: { type: Type.NUMBER, description: "A multiplier for this priority, e.g., 1.5 for high priority." }
            },
            required: ["priority", "targetType", "weight"]
        };

        const strategySchema = {
            type: Type.OBJECT,
            properties: {
                objective: { type: Type.STRING },
                rationale: { type: Type.STRING },
                targetingPriorities: { type: Type.ARRAY, items: targetingPrioritySchema }
            },
            required: ["objective", "rationale", "targetingPriorities"]
        };

        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    description: "A map of leader instance IDs to their encounter strategy. Each key must be a leader's instanceId from the summary, and the value must be a strategy object.",
                    properties: {},
                    additionalProperties: strategySchema
                }
            }
        });
        
        const textResponse = response.text.trim();
        return JSON.parse(textResponse) as Record<string, EncounterStrategy>;

    } catch (error) {
        throw new GeminiError("Error generating encounter strategy", error);
    }
};

const generateNewStrategyForLeader = async (
    battlefieldSummary: string,
    newObjective: string
): Promise<EncounterStrategy | null> => {
    if (!process.env.API_KEY) return null;

    const targetingTypes = [
        'lowest_hp', 'highest_hp', 'closest', 'farthest', 'highest_damage_output',
        'lowest_ac', 'highest_ac', 'healer', 'controller', 'brute', 'skirmisher', 'leader', 'follower'
    ].join('", "');
    
    const prompt = `You are a master tactician AI for a D&D game. A squad leader has been given a new objective mid-combat. Generate a new strategy based on this.

**Battlefield Summary:**
${battlefieldSummary}

**New Top-Level Objective from the DM:**
"${newObjective}"

**Your Task:**
Generate a single, complete strategy object based on the new objective.
- **Objective:** Rephrase the DM's command into a clear, actionable goal for the AI squad.
- **Rationale:** Briefly explain the tactical reasoning for this new strategy.
- **Targeting Priorities:** Define how the squad should now select targets to achieve this new objective.

Your entire response must be a single JSON object matching the schema.`;

    try {
        const targetingPrioritySchema = {
            type: Type.OBJECT,
            properties: {
                priority: { type: Type.STRING, enum: ['PRIMARY', 'SECONDARY', 'AVOID'] },
                targetType: { type: Type.STRING, description: `One of: ${targetingTypes}` },
                weight: { type: Type.NUMBER, description: "A multiplier for this priority, e.g., 1.5 for high priority." }
            },
            required: ["priority", "targetType", "weight"]
        };

        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        objective: { type: Type.STRING },
                        rationale: { type: Type.STRING },
                        targetingPriorities: { type: Type.ARRAY, items: targetingPrioritySchema }
                    },
                    required: ["objective", "rationale", "targetingPriorities"]
                }
            }
        });
        
        return JSON.parse(response.text.trim()) as EncounterStrategy;
    } catch (error) {
        throw new GeminiError("Error generating new strategy", error);
    }
};


export const commanderService = {
    getEncounterStrategy,
    generateNewStrategyForLeader,
};