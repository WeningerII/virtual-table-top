import React from 'react';
import { Character, Feat, PendingChoice, Ability, SelectedFeat } from './types';
import { ABILITIES, SKILLS } from '../../constants';
import InlineProficiencySelector from '../shared/InlineProficiencySelector';
import InlineMagicInitiateSelector from '../shared/InlineMagicInitiateSelector';
import InlineFeatASISelector from '../shared/InlineFeatASISelector';
import { useAppSelector } from '.././state/hooks';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';
import { useCharacterActions } from '../../hooks/useCharacterActions';

interface FeatsStepProps {}

const FeatsStep: React.FC<FeatsStepProps> = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);
    const { updateFeats } = useCharacterActions();

    if (!character || !staticDataCache) return null;

    const { allFeats } = staticDataCache;

    const handleRemoveChoice = (source: string) => {
        const newFeats = character.feats.filter(f => f.source !== source);
        updateFeats(newFeats);
    };

    const unassignedChoices = character.pendingChoices.filter(c => !character.feats.some(f => f.source === c.id) || (c.type === 'magic_initiate' && !character.feats.find(f => f.source === c.id)?.choices?.classId));
    
    const asiChoices = unassignedChoices.filter((c): c is Extract<PendingChoice, { type: 'asi_or_feat' }> => c.type === 'asi_or_feat');
    const magicInitiateChoice = unassignedChoices.find((c): c is Extract<PendingChoice, { type: 'magic_initiate' }> => c.type === 'magic_initiate');
    
    const getAbilityName = (abilityId: Ability) => ABILITIES.find(a => a.id === abilityId)?.name || abilityId;
    const getSkillName = (skillId: string) => SKILLS.find(s => s.id === skillId)?.name || skillId;

    const renderChoices = (feat: Feat, choices: SelectedFeat['choices']) => {
        if (!choices || Object.keys(choices).length === 0) return null;
        return (
            <div className="text-xs text-gray-400 mt-2 pl-4 border-l-2 border-gray-600">
                {Object.entries(choices).map(([key, value]) => {
                    if (['bonuses', 'classId', 'spellIds'].includes(key)) return null;
                    const option = feat.choiceOptions?.find(o => o.id === key);
                    const label = option ? option.label : key;
                    let displayValue = '';
                    if (Array.isArray(value)) {
                         displayValue = value.map(v => getSkillName(v)).join(', ');
                    } else if (typeof value === 'string') {
                         displayValue = getAbilityName(value as Ability);
                    }
                    return <p key={key}><strong>{label}:</strong> {displayValue}</p>
                })}
            </div>
        );
    }
    
    const proficiencyChoice = character.pendingChoices.find(c => c.type === 'proficiency' && character.feats.some(f => c.source.includes(f.featId))) as Extract<PendingChoice, {type: 'proficiency'}> | undefined;

    return (
        <div>
            <h2 className="text-2xl font-bold font-teko tracking-wide mb-4">FEATS & ABILITY SCORE IMPROVEMENTS</h2>
            
            {proficiencyChoice && <InlineProficiencySelector choice={proficiencyChoice} />}

            {asiChoices.map(choice => (
                <InlineFeatASISelector key={choice.id} choice={choice} />
            ))}
            
            {magicInitiateChoice && <InlineMagicInitiateSelector choice={magicInitiateChoice} />}

            <div className="bg-gray-900/50 p-4 rounded-lg mt-4">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold">Your Choices</h3>
                    {character.feats.length > 0 ? (
                        character.feats.map((selectedFeat, index) => {
                             let featInfo;
                             let description = '';
                             if (selectedFeat.featId === 'ability-score-improvement') {
                                const bonuses = selectedFeat.choices?.bonuses || [];
                                const bonusText = bonuses.map((b: {ability: Ability, value: number}) => `+${b.value} ${getAbilityName(b.ability)}`).join(', ');
                                featInfo = { name: 'Ability Score Improvement', id: 'ability-score-improvement' };
                                description = `You increased your ability scores: ${bonusText}.`;
                             } else {
                                featInfo = allFeats.find(f => f.id === selectedFeat.featId);
                                if (featInfo) description = featInfo.description;
                             }

                            if (!featInfo) return null;
                            
                            const pendingChoiceSource = character.pendingChoices.find(c => c.id === selectedFeat.source)?.source || selectedFeat.source;

                            return (
                                <div key={`${selectedFeat.featId}-${index}`} className="bg-gray-800 p-4 rounded-lg flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-xl">{featInfo.name}</h4>
                                        <p className="text-xs text-gray-400 mb-2">Source: {pendingChoiceSource}</p>
                                        <p className="text-sm text-gray-300">{description}</p>
                                        {featInfo.id !== 'ability-score-improvement' && renderChoices(featInfo as Feat, selectedFeat.choices)}
                                    </div>
                                    <div className="flex flex-col space-y-2 ml-4 flex-shrink-0">
                                        <button 
                                            onClick={() => handleRemoveChoice(selectedFeat.source)}
                                            className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded-md text-xs font-semibold"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-400 italic py-4">No feats or ASIs selected from class level-ups.</p>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <p className="text-sm text-gray-400">
                    A feat represents a talent or an area of expertise that gives a character special capabilities. It embodies training, experience, and abilities beyond what a class provides. At certain levels, your class gives you the Ability Score Improvement feature. Using the optional feats rule, you can forgo taking that feature to take a feat of your choice instead.
                </p>
            </div>
        </div>
    );
};

export default FeatsStep;
