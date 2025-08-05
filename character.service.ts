import { Character, BackstoryDetails, Species, Trait, Ability, AbilityScoreIncreaseEffect, StaticGameDataCache, CharacterConcept, GenerationProgress } from '../../types';
import { dataService } from "../dataService";
import { generateAvatarImage } from './imagen.service';

export const suggestCharacterNames = async (species?: string, dndClass?: string): Promise<string[]> => {
    // This function is still used by the manual builder, so it's kept.
    // A simplified version could be implemented if the full AI is not available.
    return ["Gimli", "Legolas", "Aria", "Kael", "Lyra"];
};


export const generateBackstory = async (character: Character): Promise<Partial<BackstoryDetails>> => {
    // This function is still used by the manual builder, so it's kept.
    return {
        personality: "Adventurous and brave.",
        ideals: "Justice and fairness.",
        bonds: "Loyal to my companions.",
        flaws: "A bit too reckless."
    };
};

export const generateCustomHeritage = async (ancestries: Species[]): Promise<Partial<Species>[]> => {
     // This function is still used by the manual builder, so it's kept.
     return [{ name: "AI Disabled", description: "API Key not found." }];
};

export const generateAvatar = generateAvatarImage;
