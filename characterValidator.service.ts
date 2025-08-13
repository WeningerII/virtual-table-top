


import { Character, StaticGameDataCache, ValidationError, GenerationStep, Ability, CharacterState } from './types';
import { calculatePendingChoices } from 'engine/pendingChoicesSelector';
import { selectCharacter } from 'engine';
import { toCharacterState } from 'state/characterUtils';

const POINT_BUY_COST: { [key: number]: number } = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const ABILITIES_ARRAY: Ability[] = [Ability.Strength, Ability.Dexterity, Ability.Constitution, Ability.Intelligence, Ability.Wisdom, Ability.Charisma];


export class CharacterValidator {
    private staticData: StaticGameDataCache;

    constructor(staticData: StaticGameDataCache) {
        this.staticData = staticData;
    }

    public validate(character: Partial<Character>, step: GenerationStep): ValidationError[] {
        switch (step) {
            case 'Fundamentals':
                return this.validateFundamentals(character);
            case 'Abilities & Feats':
                return this.validateAbilitiesAndFeats(character as Character);
            case 'Equipment':
                return this.validateEquipment(character as Character);
            case 'Details & Spells':
                 return this.validateDetailsAndSpells(character as Character);
            default:
                return [];
        }
    }

    private validateFundamentals(character: Partial<Character>): ValidationError[] {
        const errors: ValidationError[] = [];
        
        if (!character.heritage?.resolvedHeritage?.id) {
            errors.push({ field: 'heritage', message: 'No race was selected by the AI.' });
        } else if (!this.staticData.allSpecies.some(s => s.id === character.heritage!.resolvedHeritage!.id)) {
            errors.push({ field: 'heritage', message: `AI selected an invalid race ID: ${character.heritage.resolvedHeritage.id}` });
        }

        if (!character.classes || character.classes.length === 0) {
            errors.push({ field: 'classes', message: 'No class was selected by the AI.' });
        } else {
            character.classes.forEach(c => {
                if (!this.staticData.allClasses.some(data => data.id === c.id)) {
                    errors.push({ field: 'classes', message: `AI selected an invalid class ID: ${c.id}` });
                }
                if (c.level <= 0) {
                     errors.push({ field: 'classes.level', message: `AI selected an invalid level for ${c.id}: ${c.level}` });
                }
            });
        }
        
        if (!character.background?.id) {
            errors.push({ field: 'background', message: 'No background was selected by the AI.' });
        } else if (!this.staticData.allBackgrounds.some(b => b.id === character.background!.id)) {
             errors.push({ field: 'background', message: `AI selected an invalid background ID: ${character.background.id}` });
        }

        return errors;
    }

    private validateAbilitiesAndFeats(character: Character): ValidationError[] {
        const errors: ValidationError[] = [];

        // 1. Validate Point Buy
        let totalCost = 0;
        let invalidScoreFound = false;
        if (character.abilityScores) {
            for (const ability of ABILITIES_ARRAY) {
                const baseScore = character.abilityScores[ability]?.base || 0;
                if (baseScore < 8 || baseScore > 15 || !POINT_BUY_COST.hasOwnProperty(baseScore)) {
                    invalidScoreFound = true;
                    errors.push({ field: `abilityScores.${ability}`, message: `Invalid base score of ${baseScore}. Must be between 8 and 15.` });
                    break;
                }
                totalCost += POINT_BUY_COST[baseScore];
            }
        }

        if (!invalidScoreFound && totalCost > 27) {
            errors.push({ field: 'abilityScores', message: `Point buy total cost is ${totalCost}, which exceeds the 27 point limit.` });
        }

        // 2. Validate that all required choices have been made
        const characterState = toCharacterState(character);
        const pendingChoicesAfterMerge = calculatePendingChoices(characterState, this.staticData);
        
        pendingChoicesAfterMerge.forEach(choice => {
            // If an ASI/Feat choice is still pending, the AI failed to address it.
            if (choice.type === 'asi_or_feat') {
                errors.push({ field: 'asiSelections', message: `AI failed to resolve a required choice: ${choice.source}` });
            }
            // If a choice generated from a feat is still pending, the AI failed to make a sub-choice.
            const featSource = character.feats.find(f => choice.source.includes(f.featId));
            if (featSource) {
                 errors.push({ field: 'feat.choices', message: `AI selected the feat '${featSource.featId}' but failed to make a required sub-choice for '${choice.source}'.` });
            }
        });
        
        return errors;
    }

    private validateEquipment(character: Character): ValidationError[] {
        const errors: ValidationError[] = [];
        if (character.startingEquipmentGranted === false) {
            errors.push({ field: 'startingEquipmentGranted', message: 'AI failed to grant equipment.' });
        }
        if (character.inventory.length === 0) {
            errors.push({ field: 'inventory', message: 'AI chose to grant equipment but inventory is empty.' });
        }
        return errors;
    }

    private validateDetailsAndSpells(character: Character): ValidationError[] {
        const errors: ValidationError[] = [];
        const details = character.backstoryDetails;
        if (!details?.personality || !details.ideals || !details.bonds || !details.flaws) {
            errors.push({ field: 'backstoryDetails', message: 'AI failed to fill out all personality fields.' });
        }

        const characterState = toCharacterState(character);
        const calculatedSheet = selectCharacter(characterState, this.staticData);
        const { spellcastingInfo } = calculatedSheet;
        
        if (spellcastingInfo) {
            if (spellcastingInfo.maxKnownSpells > 0 && (character.knownSpells?.length || 0) > spellcastingInfo.maxKnownSpells) {
                errors.push({ field: 'knownSpells', message: `AI selected ${character.knownSpells.length} known spells, but the maximum is ${spellcastingInfo.maxKnownSpells}.`});
            }
            const preparedSpellsCount = character.preparedSpells.filter(id => !spellcastingInfo.alwaysPreparedSpells.some(s => s.id === id)).length;
            if (spellcastingInfo.maxPreparedSpells > 0 && preparedSpellsCount > spellcastingInfo.maxPreparedSpells) {
                 errors.push({ field: 'preparedSpells', message: `AI prepared ${preparedSpellsCount} spells, but the maximum is ${spellcastingInfo.maxPreparedSpells}.`});
            }
        }

        return errors;
    }
}
