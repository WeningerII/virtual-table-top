import { EncounterConcept } from '../types';

type MapObjectConcept = EncounterConcept['mapObjects'][0];

/**
 * Applies procedural decorations to an array of map object concepts.
 * This adds natural-feeling "jitter" to AI placements.
 * @param objects - The array of map object concepts from the AI.
 * @returns A new array of decorated map object concepts.
 */
const decorateObjects = (objects: MapObjectConcept[]): MapObjectConcept[] => {
    return objects.map(obj => {
        // Add random "jitter" to rotation to make it feel more natural
        // A small random rotation helps break up grid alignment.
        const rotationJitter = (Math.random() - 0.5) * 0.2; // ~ +/- 6 degrees in radians
        const newRotationY = obj.rotationY + rotationJitter;

        // Add slight random scaling to make objects of the same type look different.
        const scaleJitter = 1.0 + (Math.random() - 0.5) * 0.15; // +/- 7.5%
        const newScaleModifier = obj.scaleModifier * scaleJitter;

        return {
            ...obj,
            rotationY: newRotationY,
            scaleModifier: newScaleModifier,
        };
    });
};

/**
 * The mapDecorator service enhances AI-generated encounter concepts with procedural detail.
 */
export const mapDecorator = {
    /**
     * Takes a raw encounter concept from the AI and applies all decoration passes.
     * @param concept - The AI-generated encounter concept.
     * @returns The decorated encounter concept, ready for rendering.
     */
    decorate: (concept: EncounterConcept): EncounterConcept => {
        return {
            ...concept,
            mapObjects: decorateObjects(concept.mapObjects),
        };
    },
};
