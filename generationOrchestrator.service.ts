


import { Character, StaticGameDataCache, GenerationStep, ValidationError, GenerationProgress, SelectedFeat, SelectedProficiency, Currency, StartingEquipmentOption, Item, EquipmentPack, PartialCharacter, CharacterState, Ability, SelectedClass } from './types';
import { CharacterValidator } from '../validation/characterValidator.service';
import { ai, textModel } from './client';
import { prompts, schemas } from './prompts';
import { selectCharacter } from './engine';
import { calculatePendingChoices } from './engine/pendingChoicesSelector';
import { rollGold } from '../../utils/dice';
import { inventoryActions } from './engine/slices/inventorySlice';
import { createNewCharacterObject, toCharacterState } from '../../state/characterUtils';

// Helper to call Gemini API with a structured schema
async function callGemini(prompt: string, schema: any): Promise<any> {
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            maxOutputTokens: 4096,
            thinkingConfig: { thinkingBudget: 2048 },
        }
    });
    return JSON.parse(response.text.trim());
}

export class GenerationOrchestrator {
    private staticData: StaticGameDataCache;
    private validator: CharacterValidator;

    constructor(staticData: StaticGameDataCache) {
        this.staticData = staticData;
        this.validator = new CharacterValidator(staticData);
    }

    private mergeFundamentals(character: PartialCharacter, response: any): PartialCharacter {
        const species = this.staticData.allSpecies.find(s => s.name === response.speciesName);
        const background = this.staticData.allBackgrounds.find(b => b.name === response.backgroundName);
        
        const newClasses = response.classPlan.map((p: any) => {
            const classData = this.staticData.allClasses.find(c => c.name === p.className);
            if (!classData) {
                console.warn(`Genesis AI returned an invalid class name: "${p.className}". This entry will be ignored.`);
                return null;
            }
            const subclassData = classData?.subclasses.find(sc => sc.name === p.subclassName);
            return {
                id: classData.id,
                level: p.levels || 1,
                subclassId: subclassData?.id,
            };
        }).filter((c): c is SelectedClass => c !== null);

        return {
            ...character,
            name: response.name,
            classes: newClasses,
            heritage: species ? { ancestries: [species], resolvedHeritage: species, isCustom: false } : character.heritage,
            background: background || character.background,
        };
    }

    private mergeAbilitiesAndFeats(character: PartialCharacter, response: any): PartialCharacter {
        const newCharacter = { ...character };

        // 1. Update base ability scores from Point Buy
        newCharacter.abilityScores = { ...character.abilityScores };
        for (const key of Object.keys(response.baseScores)) {
            const abilityKey = key as Ability;
            if (newCharacter.abilityScores && newCharacter.abilityScores[abilityKey]) {
                newCharacter.abilityScores[abilityKey] = {
                    ...newCharacter.abilityScores[abilityKey],
                    base: response.baseScores[abilityKey],
                };
            }
        }

        // 2. Process ASI and Feat selections
        const newFeats: SelectedFeat[] = [];
        const newProficiencies: SelectedProficiency[] = [...(character.selectedProficiencies || [])];
        
        response.asiSelections.forEach((selection: any) => {
            if (selection.type === 'ASI') {
                newFeats.push({
                    featId: 'ability-score-improvement',
                    source: selection.sourceId,
                    choices: { bonuses: selection.asiBonuses }
                });
            } else if (selection.type === 'FEAT') {
                 // Convert the array of choices back into a key-value object
                const featChoicesObject: { [key: string]: any } = {};
                if (selection.choices && Array.isArray(selection.choices)) {
                    selection.choices.forEach((choice: { id: string; selection: string[] }) => {
                        const featData = this.staticData.allFeats.find(f => f.id === selection.featId);
                        const choiceOption = featData?.choiceOptions?.find(opt => opt.id === choice.id);
                        // Single choices should be a string, multi-choices should be an array.
                        const isMultiSelect = choiceOption && choiceOption.count > 1;
                        
                        if (choice.selection.length === 1 && !isMultiSelect) {
                            featChoicesObject[choice.id] = choice.selection[0];
                        } else {
                            featChoicesObject[choice.id] = choice.selection;
                        }
                    });
                }

                newFeats.push({
                    featId: selection.featId,
                    source: selection.sourceId,
                    choices: featChoicesObject
                });

                // Handle feat sub-choices that grant proficiencies
                const featData = this.staticData.allFeats.find(f => f.id === selection.featId);
                featData?.choiceOptions?.forEach(choiceOpt => {
                    if (featChoicesObject && featChoicesObject[choiceOpt.id]) {
                        const choicesArray = Array.isArray(featChoicesObject[choiceOpt.id]) ? featChoicesObject[choiceOpt.id] : [featChoicesObject[choiceOpt.id]];
                        if (['skill', 'tool', 'language', 'skill_or_tool'].includes(choiceOpt.type)) {
                            newProficiencies.push({
                                id: choiceOpt.id,
                                source: `${featData.name} Feat`,
                                proficiencyType: choiceOpt.type === 'skill_or_tool' ? 'skill' : choiceOpt.type as any,
                                choices: choicesArray
                            });
                        }
                    }
                });
            }
        });

        newCharacter.feats = newFeats;
        newCharacter.selectedProficiencies = newProficiencies;

        return newCharacter;
    }

     private mergeEquipment(character: PartialCharacter, response: any): PartialCharacter {
        const startingClass = this.staticData.allClasses.find(c => c.id === character.classes?.[0].id);
        if (!startingClass) return character;

        let items: { itemId: string; quantity: number }[] = [];
        let money: Currency = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
        const itemMap = new Map(this.staticData.allItems.map(i => [i.name, i.id]));
        
        if (response.method === 'package') {
            const fixedItems = (startingClass.startingEquipment || []).filter(opt => !('choice' in opt) && !('goldRoll' in opt) && !('gold' in opt));
            fixedItems.forEach(opt => {
                if ('itemId' in opt) items.push({ itemId: opt.itemId, quantity: opt.quantity });
                if ('packId' in opt) {
                    const pack = this.staticData.equipmentPacks.find(p => p.id === opt.packId);
                    if (pack) items.push(...pack.contents);
                }
            });

            response.packageSelections.forEach((sel: { selectedOption: string }) => {
                const itemId = itemMap.get(sel.selectedOption);
                const pack = this.staticData.equipmentPacks.find(p => p.name === sel.selectedOption);
                if (itemId) items.push({ itemId, quantity: 1 }); // Assuming qty 1 for simplicity in choices
                if (pack) items.push(...pack.contents);
            });
            const goldOption = (startingClass.startingEquipment || []).find(opt => 'gold' in opt);
            if(goldOption && 'gold' in goldOption) {
                money.gp = goldOption.gold;
            }

        } else { // gold
            money.gp = rollGold(startingClass.startingGoldRoll || '0');
            response.purchasedItems?.forEach((item: { itemName: string, quantity: number }) => {
                const itemId = itemMap.get(item.itemName);
                if (itemId) items.push({ itemId, quantity: item.quantity });
            });
        }
        
        const backgroundGold = character.background?.startingGold || 0;
        money.gp += backgroundGold;

        const grantAction = inventoryActions.grantEquipment({ items, money });
        return { ...character, inventory: grantAction.payload.items.map(i => ({...i, instanceId: crypto.randomUUID(), source: 'Starting'})), money: grantAction.payload.money, startingEquipmentGranted: true };
    }

    private mergeDetailsAndSpells(character: PartialCharacter, response: any): PartialCharacter {
        const newCharacter = { ...character };
        newCharacter.backstoryDetails = {
            personality: response.personalityTraits,
            ideals: response.ideals,
            bonds: response.bonds,
            flaws: response.flaws,
            backstory: character.backstoryDetails?.backstory || '',
            notes: character.backstoryDetails?.notes || '',
        };

        const spellMap = new Map(this.staticData.allSpells.map(s => [s.name, s.id]));
        const { knownSpells = [], preparedSpells = [] } = response.spellSelections || {};

        newCharacter.knownSpells = knownSpells.map((name: string) => spellMap.get(name)).filter(Boolean);
        newCharacter.preparedSpells = preparedSpells.map((name: string) => spellMap.get(name)).filter(Boolean);
        
        return newCharacter;
    }


    public async runStep(
        step: GenerationStep,
        userConcept: string,
        characterSoFar: PartialCharacter,
        onProgress: (progress: { message: string }) => void
    ): Promise<PartialCharacter | null> {
        let promptTemplate = prompts[step];
        const schema = schemas[step];
        
        let attempts = 0;
        const maxAttempts = 3;
        let lastErrors: ValidationError[] = [];

        while (attempts < maxAttempts) {
            const fullCharacterForSelectors: Character = {
                ...createNewCharacterObject(),
                ...characterSoFar,
            };
            const characterStateForSelectors = toCharacterState(fullCharacterForSelectors);

            const characterWithChoices = {
                ...characterSoFar,
                pendingChoices: calculatePendingChoices(characterStateForSelectors, this.staticData)
            };

            let context = '';

            // Dynamically inject valid options into the prompts
            if (step === 'Fundamentals') {
                const validSpecies = this.staticData.allSpecies.map(s => s.name).join('", "');
                const validBackgrounds = this.staticData.allBackgrounds.map(b => b.name).join('", "');
                const validClasses = this.staticData.allClasses.map(c => c.name).join('", "');
                promptTemplate = promptTemplate
                    .replace('{{validSpecies}}', `["${validSpecies}"]`)
                    .replace('{{validBackgrounds}}', `["${validBackgrounds}"]`)
                    .replace('{{validClasses}}', `["${validClasses}"]`);
            }
            if (step === 'Abilities & Feats') {
                const validFeats = this.staticData.allFeats.map(f => f.id).join('", "');
                promptTemplate = promptTemplate.replace('{{validFeats}}', `["${validFeats}"]`);
            }

            if (step === 'Equipment') {
                 const startingClass = this.staticData.allClasses.find(c => c.id === characterSoFar.classes?.[0].id);
                 context = JSON.stringify({
                     startingEquipmentOptions: startingClass?.startingEquipment,
                     goldRoll: startingClass?.startingGoldRoll,
                     allItems: this.staticData.allItems.map(i => i.name)
                 }, null, 2);
            } else if (step === 'Details & Spells') {
                const sheet = selectCharacter(characterStateForSelectors, this.staticData);
                context = JSON.stringify({
                    spellcastingAbilities: sheet.spellcastingInfo?.spellcastingAbilities,
                    maxKnownSpells: sheet.spellcastingInfo?.maxKnownSpells,
                    maxPreparedSpells: sheet.spellcastingInfo?.maxPreparedSpells,
                    allSpells: sheet.spellcastingInfo?.availableSpells.map(s => s.name)
                }, null, 2);
            }

            const prompt = promptTemplate
                .replace('{{prompt}}', userConcept)
                .replace('{{characterSoFar}}', JSON.stringify(characterWithChoices, null, 2))
                .replace('{{lastErrors}}', JSON.stringify(lastErrors, null, 2))
                .replace('{{equipmentContext}}', context)
                .replace('{{spellcastingContext}}', context);

            try {
                onProgress({ message: `Generating ${step}... (Attempt ${attempts + 1})` });
                const jsonResponse = await callGemini(prompt, schema);
                
                let updatedCharacter: PartialCharacter = { ...characterSoFar };
                if (step === 'Fundamentals') {
                    updatedCharacter = this.mergeFundamentals(characterSoFar, jsonResponse);
                } else if (step === 'Abilities & Feats') {
                    updatedCharacter = this.mergeAbilitiesAndFeats(characterSoFar, jsonResponse);
                } else if (step === 'Equipment') {
                    updatedCharacter = this.mergeEquipment(characterSoFar, jsonResponse);
                } else if (step === 'Details & Spells') {
                    updatedCharacter = this.mergeDetailsAndSpells(characterSoFar, jsonResponse);
                }

                onProgress({ message: `Validating ${step}...` });
                const errors = this.validator.validate(updatedCharacter, step);
                if (errors.length === 0) {
                    return updatedCharacter; // Success!
                }
                
                lastErrors = errors;
                attempts++;
                onProgress({ message: `AI response had issues. Attempting correction...` });
                console.warn("Validation errors:", errors);

            } catch (e) {
                console.error(`AI call failed on step ${step}:`, e);
                attempts++;
                onProgress({ message: `AI call failed. Retrying...` });
            }
        }
        
        return null;
    }
}