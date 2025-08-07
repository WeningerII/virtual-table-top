
import { useCallback, useState } from 'react';
import { useAppDispatch } from './state/hooks';
import { generationStart, generationStageUpdate, generationSuccess, generationFailed } from './worldbuilderSlice';

export function useEncounterGeneration() {
  const dispatch = useAppDispatch();
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async () => {
    setIsGenerating(true);
    dispatch(generationStart());
    try {
      // Simulate staged generation
      const stages = [
        'Analyzing prompt and selecting biome...',
        'Choosing appropriate encounter difficulty and foes...',
        'Composing encounter description and objectives...'
      ];
      for (const stage of stages) {
        dispatch(generationStageUpdate({ stage, concept: null as any }));
        await new Promise((r) => setTimeout(r, 400));
      }
      const concept = {
        title: 'Ambush at the Whispering Pines',
        summary: 'A band of gnolls lays an ambush along a forest path as mist rolls in.',
        monsters: [{ id: 'gnoll', count: 4 }],
        terrain: 'Forest path with light underbrush and low visibility',
        objectives: ['Survive the ambush', 'Protect the caravan'],
      } as any;
      dispatch(generationSuccess(concept));
    } catch (e) {
      dispatch(generationFailed('Generation failed'));
    } finally {
      setIsGenerating(false);
    }
  }, [dispatch]);

  return { generate, isGenerating } as const;
}