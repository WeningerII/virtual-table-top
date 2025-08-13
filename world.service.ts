

import { generateEncounterConcept } from './map.service';
import { generateScene, generateImage } from './imagen.service';
import { EncounterConcept } from './types';

export const generateEncounter = generateEncounterConcept;
export const generateSceneImage = generateScene;

export const generateMapImage = async (concept: EncounterConcept): Promise<string | null> => {
    const prompt = `Top-down, high-detail, photorealistic, D&D battle map. Theme: ${concept.theme}. Mood: ${concept.environmentalData.mood}. Scene: ${concept.description}. Fantasy art, vibrant colors, tabletop RPG style, gridless.`;
    return generateImage(prompt, '1:1');
};
