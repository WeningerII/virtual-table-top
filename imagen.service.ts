
import { Character, EnvironmentalData } from '../../types';
import { ai, imageModel, GeminiError } from '../geminiService';
import { dataService } from '../dataService';

export interface GeneratedTextures {
    skybox: string | null;
    textures: Record<string, string>;
}

/**
 * A generic function to generate an image using the Imagen API.
 * @param prompt The descriptive prompt for the image.
 * @param aspectRatio The desired aspect ratio.
 * @returns A base64 encoded JPEG string, or null on failure.
 */
export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' = '1:1'): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    try {
        const response = await ai.models.generateImages({
            model: imageModel,
            prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio,
            },
        });

        if (response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        return null;
    } catch (error) {
        throw new GeminiError(`Error generating image for prompt "${prompt}"`, error);
    }
};

/**
 * Generates a character avatar portrait.
 * @param character The character object.
 * @returns A base64 encoded JPEG string, or null on failure.
 */
export const generateAvatarImage = async (character: Character): Promise<string | null> => {
    const heritageName = character.heritage.resolvedHeritage?.name || 'person';
    
    const classPromises = character.classes.map(c => dataService.getClassById(c.id));
    const classDataObjects = await Promise.all(classPromises);
    const classNames = classDataObjects.filter(Boolean).map(c => c!.name).join(' / ') || 'adventurer';
    
    const prompt = `A D&D character portrait of a ${heritageName} ${classNames}. Fantasy art, detailed, high quality, character centered, circular portrait.`;
    
    return generateImage(prompt, '1:1');
};

/**
 * Generates a wide-aspect scene image.
 * @param prompt The descriptive prompt for the scene.
 * @returns A base64 encoded JPEG string, or null on failure.
 */
export const generateScene = async (prompt: string): Promise<string | null> => {
    const fullPrompt = `Epic fantasy landscape painting of ${prompt}. Digital art, atmospheric, high detail, cinematic lighting, trending on artstation.`;
    return generateImage(fullPrompt, '16:9');
};

/**
 * Generates a set of textures and a skybox for a given map theme and mood.
 */
export const generateMapTextures = async (theme: string, mood: EnvironmentalData['mood']): Promise<GeneratedTextures> => {
    console.log(`Generating textures for theme: ${theme}, mood: ${mood}`);
    
    const texturePrompts: Record<string, string> = {
        ground: `Seamless, tileable PBR texture of ${mood} ${theme} ground. Photorealistic, 4k.`,
        wood: `Seamless, tileable PBR texture of weathered, ${mood} ${theme} wood planks. Photorealistic, 4k.`,
        stone: `Seamless, tileable PBR texture of ${mood} ${theme} stone bricks or rocks. Photorealistic, 4k.`
    };
    
    const skyboxPrompt = `360-degree equirectangular skybox image of a ${mood} ${theme} sky at ${mood}. Epic fantasy, atmospheric, cinematic lighting.`;

    const skyboxPromise = generateScene(skyboxPrompt);
    
    const texturePromises = Object.entries(texturePrompts).map(async ([key, prompt]) => {
        const imageData = await generateImage(prompt, '1:1');
        return { key, imageData };
    });

    const results = await Promise.all([skyboxPromise, ...texturePromises]);
    
    const skybox = results.shift() as string | null;
    const textures = (results as { key: string, imageData: string | null }[]).reduce((acc, result) => {
        if (result.imageData) {
            acc[result.key] = result.imageData;
        }
        return acc;
    }, {} as Record<string, string>);

    return { skybox, textures };
};
