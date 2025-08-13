

import { EnvironmentalData } from './types';
import { generateMapTextures as generate } from './imagen.service';

export interface GeneratedTextures {
    skybox: string | null;
    textures: Record<string, string>;
}

export const generateMapTextures = generate;
