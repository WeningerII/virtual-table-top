import { Type } from "@google/genai";

const prompt_fundamentals = `
You are a D&D 5e expert character creator. Based on the user's concept, generate the character's fundamentals.
Adhere strictly to the provided JSON schema.

**Available Options:**
- Valid Species: {{validSpecies}}
- Valid Backgrounds: {{validBackgrounds}}
- Valid Classes: {{validClasses}}
**You MUST select names exactly from these lists. Do not invent new names.**

User Concept: {{prompt}}

**TASK: GENERATE CHARACTER FUNDAMENTALS**
*   **Race & Subrace:** Select a specific, official D&D 5e race and subrace (where applicable).
*   **Class & Subclass:** Based on the user's concept, define the character's class or classes. For each class, provide its name, subclass name, and the number of levels. **CRITICAL: Only use official D&D 5e class names from the 'Valid Classes' list provided. Do NOT mistake a character's race (like 'Human' or 'Elf') for a class.**
*   **Background:** Select a specific, official D&D 5e background.
*   **Level:** Determine an appropriate total character level based on the user's concept (typically between 3 and 10). The sum of levels in the class plan should equal this.
*   **Name:** Generate a fitting character name.
`;

const schema_fundamentals = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        speciesName: { type: Type.STRING },
        backgroundName: { type: Type.STRING },
        classPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    className: { type: Type.STRING },
                    subclassName: { type: Type.STRING },
                    levels: { type: Type.INTEGER },
                }
            }
        }
    },
    required: ["name", "speciesName", "backgroundName", "classPlan"]
};

const prompt_abilities = `
You are a D&D 5e expert character creator. Based on the character's fundamentals and user concept, generate the character's ability scores and all feat/ASI selections up to the specified level.

**Available Options:**
- Valid Feat IDs: {{validFeats}}
**When choosing a feat, you MUST select a featId exactly from this list.**

**User Concept:** {{prompt}}

**Character State So Far (with unresolved choices):**
{{characterSoFar}}

**TASK: GENERATE ABILITY SCORES & FEATS**
1.  **Ability Scores (Point Buy):**
    *   You have **27 points** to buy ability scores.
    *   Scores before racial modifiers must be between 8 and 15.
    *   Costs: 8=0, 9=1, 10=2, 11=3, 12=4, 13=5, 14=7, 15=9.
    *   Assign the six scores based on the character concept and class. Return ONLY the six base scores before racial modifiers are applied.

2.  **Feat & ASI Selections:**
    *   The character has several opportunities for an Ability Score Improvement (ASI) or a Feat, identified by 'asi_or_feat' in the 'pendingChoices' array of the character state.
    *   For EACH of these pending choices, you must decide whether to take an ASI or a Feat.
    *   **If ASI:** Choose to either increase one score by 2, or two scores by 1.
    *   **If Feat:** Choose a feat that fits the character concept.
    *   **Feat Sub-Choices:** If a chosen feat requires further choices (like 'Skilled' or 'Resilient'), you MUST provide them in the 'choices' array. Each item in the array should be an object with an 'id' (matching the feat's choice option ID) and a 'selection' (an array of chosen strings). For single selections like an ability score, the 'selection' array will have only one element (e.g., {"id": "resilient-ability", "selection": ["DEXTERITY"]}).

**RESPONSE FORMAT:**
Your response must be a single, valid JSON object matching the schema. Provide all decisions.
`;

const schema_abilities = {
    type: Type.OBJECT,
    properties: {
        baseScores: {
            type: Type.OBJECT,
            properties: {
                STRENGTH: { type: Type.INTEGER },
                DEXTERITY: { type: Type.INTEGER },
                CONSTITUTION: { type: Type.INTEGER },
                INTELLIGENCE: { type: Type.INTEGER },
                WISDOM: { type: Type.INTEGER },
                CHARISMA: { type: Type.INTEGER },
            },
            required: ["STRENGTH", "DEXTERITY", "CONSTITUTION", "INTELLIGENCE", "WISDOM", "CHARISMA"]
        },
        asiSelections: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    sourceId: { type: Type.STRING, description: "The 'id' of the corresponding 'asi_or_feat' pending choice." },
                    type: { type: Type.STRING, description: "Either 'ASI' or 'FEAT'." },
                    featId: { type: Type.STRING, description: "The ID of the chosen feat (e.g., 'skilled'). Required if type is 'FEAT'." },
                    asiBonuses: {
                        type: Type.ARRAY,
                        description: "Required if type is 'ASI'.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                ability: { type: Type.STRING },
                                value: { type: Type.INTEGER }
                            },
                            required: ["ability", "value"]
                        }
                    },
                    choices: {
                        type: Type.ARRAY,
                        description: "An array of objects for any sub-choices required by the selected feat.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING, description: "The 'id' of the choiceOption from the feat data (e.g., 'skilled-proficiencies')." },
                                selection: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: "An array of the selected option(s). For single choices like an ability score, this will be an array with one string (e.g., ['DEXTERITY'])."
                                }
                            },
                            required: ["id", "selection"]
                        }
                    }
                },
                required: ["sourceId", "type"]
            }
        }
    },
    required: ["baseScores", "asiSelections"]
};

const prompt_equipment = `
You are a D&D 5e expert character creator. Your task is to select starting equipment.

**User Concept:** {{prompt}}
**Character State So Far:**
{{characterSoFar}}
**Starting Equipment Context:**
{{equipmentContext}}

**TASK: SELECT STARTING EQUIPMENT**
You have two methods:
1.  **Class Package:** Take the standard equipment package. You MUST resolve every choice within it.
2.  **Roll for Gold:** Forego the package, calculate starting gold based on the class roll, and 'purchase' a complete and logical set of starting gear (weapons, armor, adventuring pack, tools).

**You MUST select item names exactly from the 'allItems' list provided in the context if you choose the gold method.**

Choose the most thematically appropriate method and provide the complete list of equipment.
`;

const schema_equipment = {
    type: Type.OBJECT,
    properties: {
        method: { type: Type.STRING, description: "'package' or 'gold'" },
        packageSelections: {
            type: Type.ARRAY,
            description: "Required if method is 'package'. List all choices made.",
            items: {
                type: Type.OBJECT,
                properties: {
                    choiceDescription: { type: Type.STRING, description: "A summary of the choice, e.g., 'Chain Mail OR Leather Armor & Longbow'" },
                    selectedOption: { type: Type.STRING, description: "The name of the single option selected, e.g., 'Chain Mail'" }
                }
            }
        },
        purchasedItems: {
            type: Type.ARRAY,
            description: "Required if method is 'gold'. List all items purchased.",
            items: {
                type: Type.OBJECT,
                properties: {
                    itemName: { type: Type.STRING },
                    quantity: { type: Type.INTEGER }
                }
            }
        }
    },
    required: ["method"]
};


const prompt_details = `
You are a D&D 5e expert character creator. Your task is to finalize the character with personality details and a full spell list.

**User Concept:** {{prompt}}
**Character State So Far:**
{{characterSoFar}}
**Spellcasting Context:**
{{spellcastingContext}}

**TASK: FINALIZE CHARACTER**
1.  **Personality:** Based on the concept, write compelling, concise entries for Personality Traits, Ideals, Bonds, and Flaws.
2.  **Spell Selection:**
    *   Refer to the provided 'spellcastingContext' for the character's limits (spells known, spells prepared, cantrips known).
    *   **You MUST select spell names exactly from the 'allSpells' list provided in the context.**
    *   Select a complete list of spells that are thematically and mechanically appropriate for the character.
    *   Provide the full list of chosen spell names for both 'knownSpells' and 'preparedSpells' as required by the character's class(es).
`;

const schema_details = {
    type: Type.OBJECT,
    properties: {
        personalityTraits: { type: Type.STRING },
        ideals: { type: Type.STRING },
        bonds: { type: Type.STRING },
        flaws: { type: Type.STRING },
        spellSelections: {
            type: Type.OBJECT,
            properties: {
                knownSpells: { type: Type.ARRAY, items: { type: Type.STRING } },
                preparedSpells: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        }
    },
    required: ["personalityTraits", "ideals", "bonds", "flaws", "spellSelections"]
};


export const prompts = {
    'Fundamentals': prompt_fundamentals,
    'Abilities & Feats': prompt_abilities,
    'Equipment': prompt_equipment,
    'Details & Spells': prompt_details,
};

export const schemas = {
    'Fundamentals': schema_fundamentals,
    'Abilities & Feats': schema_abilities,
    'Equipment': schema_equipment,
    'Details & Spells': schema_details,
};