
import React, { useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { changeAppMode } from '../../state/appSlice';
import { loadEncounter as loadEncounterAction } from '../../state/entitySlice';
import { useEncounterGeneration } from './hooks/useEncounterGeneration';
import EncounterForm from './components/EncounterForm';
import ConceptDisplay from './components/ConceptDisplay';
import GenerationProgress from './components/GenerationProgress';

const WorldbuilderView: React.FC = () => {
    const dispatch = useAppDispatch();
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);
    const worldbuilderState = useAppSelector(state => state.worldbuilder);

    const { generate, isGenerating } = useEncounterGeneration();

    const themes = useMemo(() => {
        if (!staticDataCache) return [];
        const allTags = staticDataCache.objectBlueprints.flatMap(bp => bp.tags);
        const uniqueTags = [...new Set(allTags)]
            .filter(tag => tag !== 'common')
            .map((tag: string) => tag.charAt(0).toUpperCase() + tag.slice(1));
        return ['Forest', ...uniqueTags.filter(t => t !== 'Forest').sort()];
    }, [staticDataCache]);

    const handleLoadEncounter = async () => {
        if (worldbuilderState.generatedConcept) {
            const placeholderImageUrl = '/maps/default_forest.jpg';
            dispatch(loadEncounterAction({ concept: worldbuilderState.generatedConcept, imageUrl: placeholderImageUrl }));
            dispatch(changeAppMode('play'));
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-gray-800 bg-opacity-70 rounded-lg shadow-2xl p-6 md:p-8 relative animate-fade-in-up">
            <div className="text-center">
                <h2 className="text-4xl font-bold font-teko tracking-wider text-purple-300">WORLDBUILDER</h2>
                <p className="text-gray-400 mt-2">Describe an encounter, and the AI Dungeon Master will generate a map, select monsters, and set the scene.</p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <EncounterForm
                    themes={themes}
                    isGenerating={isGenerating}
                    onGenerate={() => generate()}
                />
                <div className="bg-gray-900/50 p-4 rounded-lg min-h-[300px] flex flex-col">
                    <h3 className="font-bold text-lg text-purple-200 mb-2">Generated Encounter Concept</h3>
                    {worldbuilderState.generationStatus === 'generating' ? (
                         <GenerationProgress />
                    ) : (
                        <ConceptDisplay
                            concept={worldbuilderState.generatedConcept}
                            onLoadEncounter={handleLoadEncounter}
                            status={worldbuilderState.generationStatus}
                            error={worldbuilderState.generationError}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorldbuilderView;