import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ObjectBlueprint } from './types';

class AssetManager {
    private gltfLoader = new GLTFLoader();
    private modelCache = new Map<string, THREE.Group>();

    public async preload(blueprints: ObjectBlueprint[], onProgress: (progress: { loaded: number, total: number, url: string }) => void): Promise<void> {
        // 3D object preloading is no longer required for the primary map view.
        // This function can be expanded in the future for other asset types.
        onProgress({ loaded: 1, total: 1, url: 'Asset check complete.' });
        return Promise.resolve();
    }

    public getClonedModel(blueprintId: string): THREE.Group | null {
        const original = this.modelCache.get(blueprintId);
        if (!original) {
            return null;
        }
        
        // Cloning is essential so that each instance in the scene is a unique object
        const clone = original.clone(true);
        return clone;
    }
}

// Export a singleton instance of the AssetManager
export const assetManager = new AssetManager();