
import { CharacterState, StaticGameDataCache, PendingChoice, ClassFeature } from './types';

export const calculatePendingChoices = (
    characterState: CharacterState,
    staticData: StaticGameDataCache
): PendingChoice[] => {
    const { meta, proficiencies } = characterState;
    const choices: PendingChoice[] = [];

    if (!meta || !proficiencies) return [];

    // Collect all features from all classes and subclasses up to current level
    const allFeaturesForLevel: ClassFeature[] = [];
    meta.classes.forEach(c => {
        const classData = staticData.allClasses.find(cd => cd.id === c.id);
        if (!classData) return;

        allFeaturesForLevel.push(...classData.features.filter(f => f.level <= c.level));
        if (c.subclassId) {
            const subclass = classData.subclasses.find(sc => sc.id === c.subclassId);
            if (subclass) {
                allFeaturesForLevel.push(...subclass.features.filter(f => f.level <= c.level));
            }
        }
    });

    allFeaturesForLevel.forEach(feature => {
        if (feature.name === 'Ability Score Improvement') {
            const classOfFeature = staticData.allClasses.find(cd => cd.features.some(f => f.name === feature.name && f.level === feature.level));
            const classIdForFeature = classOfFeature?.id || meta.classes[0]?.id || 'unknown';
            const id = `asi-${classIdForFeature}-${feature.level}`;
            
            if (!proficiencies.feats.some(f => f.source === id)) {
                choices.push({
                    type: 'asi_or_feat',
                    source: `${classOfFeature?.name} Level ${feature.level}`,
                    level: feature.level,
                    id,
                    status: 'pending'
                });
            }
        }

        feature.choiceOptions?.forEach(option => {
            let isComplete = false;
            const choiceId = option.id;

            switch (option.type) {
                case 'proficiency':
                case 'skill':
                case 'tool':
                case 'language':
                    isComplete = proficiencies.selectedProficiencies.some(p => p.id === choiceId);
                    if (!isComplete) {
                        choices.push({ type: 'proficiency', source: feature.name, id: choiceId, options: (option.from as string[]) || 'any', count: option.count, proficiencyType: option.type as any });
                    }
                    break;
                case 'fighting_style':
                     isComplete = proficiencies.selectedFightingStyles.some(fs => fs.source === choiceId);
                    if (!isComplete) {
                        choices.push({ type: 'fighting_style', source: feature.name, id: choiceId, options: (option.from as string[]) || [] });
                    }
                    break;
                // Add cases for other choice types as needed
            }
        });
    });

    // Handle Variant Human feat choice
    if (meta.heritage.resolvedHeritage?.id === 'human-variant' && !proficiencies.feats.some(f => f.source === 'feat-human-variant-variant-human-feat')) {
        choices.push({
            type: 'asi_or_feat',
            source: 'Variant Human Feat',
            level: 1,
            id: 'feat-human-variant-variant-human-feat',
            status: 'pending',
        });
    }
    
    return choices;
};