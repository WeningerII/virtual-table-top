
import { Type } from "@google/genai";
import { StaticGameDataCache, EncounterConcept, ObjectBlueprint } from '../../types';
import { ai, textModel, GeminiError } from '../geminiService';

export const generateEncounterConcept = async (
    promptContext: string,
    theme: string,
    partyLevel: number,
    partySize: number,
    difficulty: string,
    staticData: StaticGameDataCache
): Promise<EncounterConcept | null> => {
    if (!process.env.API_KEY || !staticData.objectBlueprints || !staticData.allMonsters) return null;

    const validObjectBlueprints = staticData.objectBlueprints.filter(bp => bp.tags.includes(theme.toLowerCase()) || bp.tags.includes('common'));
    const blueprintGuidance = `Your response MUST use object blueprint IDs ONLY from this list: ${validObjectBlueprints.map(bp => bp.id).join(', ')}. Do not invent new IDs.`;

    try {
        const prompt = `You are a professional Dungeons & Dragons level designer and encounter creator. Your task is to generate a complete and compelling 3D encounter concept for a 30x30 grid map based on the user's request.

**Encounter Details:**
- **Party:** ${partySize} characters, average level ${partyLevel}.
- **Difficulty:** ${difficulty}
- **Theme:** ${theme}
- **User Prompt:** "${promptContext}"

**Your Task:**
Generate a JSON object that strictly adheres to the provided JSON schema. You must think like a designer to create a scene that is not just a random collection of items, but a cohesive, tactical, and atmospheric environment.

**Core Design Principles:**
1.  **Composition:** Every map needs a visual anchor. Define a clear 'focalPoint'.
2.  **Zoning:** Do not place objects randomly. Define logical 'zones' (e.g., "dense forest," "rocky outcrop," "ruined foundation") as polygons and place objects and monsters *within* or *along the edges* of these zones.
3.  **Environmental Storytelling:** Use the 'description', 'environmentalData', object placement, and the new 'environmentalDescriptors' to tell a story about the location.
4.  **Tactics:** Use your 'placementStrategy' and monster/player positions to create an interesting tactical puzzle. Consider cover, sightlines, and elevation.
5.  **Art Direction (NEW):** Use the 'environmentalDescriptors' field to provide high-level styling instructions for categories of objects. For example, for a 'vegetation' key, you might describe "All trees and plants are gnarled and twisted, with dark, weeping leaves." For a 'stone' key, "All stone surfaces are covered in a faint, glowing green moss." This directs the procedural styling of the map.

**Creative Freedom:**
You have creative freedom. Occasionally, instead of using an existing object from the list, you may design a NEW, simple object blueprint. If you do:
1. Define it in a 'generatedBlueprints' array in your JSON response.
2. The blueprint 'id' must be a unique, descriptive, hyphenated string (e.g., "cracked-stone-altar", "glowing-crystal-cluster").
3. Generated blueprints should be simple, composed of 1-3 primitive shapes ('box', 'sphere', 'cylinder', 'cone').
4. Use this new 'id' in the 'mapObjects' array for placement.

**Available Assets:**
- **Object Blueprints:** ${blueprintGuidance}
- **Monster Guidance:** Choose monsters that fit the theme and difficulty. You have access to a standard D&D 5e bestiary. The 'monsterId' field in your response MUST be a valid hyphenated ID (e.g., 'black-dragon-wyrmling', 'giant-wolf-spider', 'goblin', 'orc', 'zombie').

Your entire response MUST be a single, valid JSON object matching the schema.
`;

        const componentProperties = {
            geometry: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "e.g., 'box', 'sphere', 'cylinder', 'cone'" },
                    size: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "For 'box': [width, height, depth]" },
                    radius: { type: Type.NUMBER, description: "For 'sphere', 'cone', 'cylinder'" },
                    height: { type: Type.NUMBER, description: "For 'cone', 'cylinder'" },
                    radialSegments: { type: Type.INTEGER, description: "For 'cone', 'cylinder'" },
                    radiusTop: { type: Type.NUMBER, description: "For 'cylinder'" },
                    radiusBottom: { type: Type.NUMBER, description: "For 'cylinder'" },
                }
            },
            material: {
                type: Type.OBJECT,
                properties: {
                    color: { type: Type.STRING, description: "Hex color code, e.g., '#808080'" },
                    emissive: { type: Type.STRING, description: "Hex color code for glowing parts." },
                }
            },
            position: { type: Type.ARRAY, items: { type: Type.NUMBER } }
        };

        const blueprintProperties = {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            icon: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            components: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: componentProperties
                }
            }
        };

        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING, description: "A 2-3 sentence atmospheric description of the scene." },
                        theme: { type: Type.STRING, description: `The primary theme, e.g., "${theme}".` },
                        placementStrategy: { type: Type.STRING, description: "A short rationale for monster and player placements." },
                        environmentalData: {
                            type: Type.OBJECT,
                            properties: {
                                mood: { type: Type.STRING, description: "e.g., 'eerie', 'serene', 'ominous'" },
                                timeOfDay: { type: Type.STRING, description: "'dawn', 'day', 'dusk', or 'night'" },
                                lighting: { type: Type.STRING, description: "e.g., 'bright sunlight', 'low, blueish tint from magical crystals'" },
                                weather: { type: Type.STRING, description: "'clear', 'rain', 'snow', 'fog', or 'storm'" }
                            },
                            required: ["mood", "timeOfDay", "lighting", "weather"]
                        },
                        environmentalDescriptors: {
                            type: Type.OBJECT,
                            description: "High-level art direction for categories of objects.",
                            properties: {
                                vegetation: { type: Type.STRING, description: "Stylistic description for trees, plants, etc." },
                                stone: { type: Type.STRING, description: "Stylistic description for rocks, pillars, etc." },
                                atmosphere: { type: Type.STRING, description: "Description of fog, mist, or other atmospheric effects." },
                            }
                        },
                        composition: {
                            type: Type.OBJECT,
                            properties: {
                                focalPoint: {
                                    type: Type.OBJECT,
                                    properties: {
                                        x: { type: Type.INTEGER },
                                        y: { type: Type.INTEGER },
                                        description: { type: Type.STRING, description: "The main visual anchor of the map." }
                                    },
                                    required: ["x", "y", "description"]
                                }
                            },
                            required: ["focalPoint"]
                        },
                        zones: {
                            type: Type.ARRAY,
                            description: "Polygonal areas defining different parts of the map.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    polygon: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: { x: { type: Type.INTEGER }, y: { type: Type.INTEGER } },
                                            required: ["x", "y"]
                                        }
                                    },
                                    description: { type: Type.STRING },
                                    tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["name", "polygon", "description", "tags"]
                            }
                        },
                        paths: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    points: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { x: { type: Type.INTEGER }, y: { type: Type.INTEGER } } } },
                                    width: { type: Type.INTEGER },
                                    type: { type: Type.STRING }
                                }
                            }
                        },
                        playerStartZone: {
                            type: Type.OBJECT,
                            properties: {
                                x: { type: Type.INTEGER }, y: { type: Type.INTEGER },
                                width: { type: Type.INTEGER }, height: { type: Type.INTEGER },
                                rationale: { type: Type.STRING }
                            },
                            required: ["x", "y", "width", "height", "rationale"]
                        },
                        monsters: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    monsterId: { type: Type.STRING }, name: { type: Type.STRING },
                                    position: { type: Type.OBJECT, properties: { x: { type: Type.INTEGER }, y: { type: Type.INTEGER } }, required: ["x", "y"] }
                                },
                                required: ["monsterId", "name", "position"]
                            }
                        },
                        mapObjects: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    blueprintId: { type: Type.STRING },
                                    position: { type: Type.OBJECT, properties: { x: { type: Type.INTEGER }, y: { type: Type.INTEGER } }, required: ["x", "y"] },
                                    rotationY: { type: Type.NUMBER },
                                    scaleModifier: { type: Type.NUMBER }
                                },
                                required: ["blueprintId", "position", "rotationY", "scaleModifier"]
                            }
                        },
                        generatedBlueprints: {
                            type: Type.ARRAY,
                            description: "Optional array of dynamically generated object blueprints for this specific encounter.",
                            items: {
                                type: Type.OBJECT,
                                properties: blueprintProperties,
                                required: ["id", "name", "components", "tags"]
                            }
                        }
                    },
                    required: ["description", "theme", "placementStrategy", "environmentalData", "composition", "zones", "monsters", "mapObjects", "playerStartZone"]
                }
            }
        });

        return JSON.parse(response.text.trim()) as EncounterConcept;

    } catch (error) {
        throw new GeminiError("Error generating encounter concept", error);
    }
};
