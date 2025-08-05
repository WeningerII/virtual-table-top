import React, { useState, useEffect, useMemo } from 'react';
import { Character, Ability, Feat, Trait, ResolvedProficiency } from '../../types';
import { ABILITIES, SKILLS } from '../../constants';
import { usePrevious } from '../../hooks/usePrevious';
import { useAppSelector } from '../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../state/selectors';

interface SummaryStepProps {}

const StatBox: React.FC<{ label: string, value: string | number, large?: boolean, highlight?: boolean }> = ({ label, value, large = false, highlight = false }) => (
    <div className={`bg-gray-700/50 border border-gray-600 rounded-md p-2 text-center transition-all duration-300 ${highlight ? 'animate-highlight' : ''}`}>
        <div className={`font-bold ${large ? 'text-3xl' : 'text-xl'}`}>{value}</div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
);

const AbilityScoreDisplay: React.FC<{ ability: {id: Ability, name: string}, score: number, modifier: number, isProficient: boolean, highlight?: boolean }> = ({ ability, score, modifier, isProficient, highlight = false }) => (
    <div className={`bg-gray-800 border-2 border-gray-600 rounded-lg p-3 text-center w-full flex items-center gap-3 transition-all duration-300 ${highlight ? 'animate-highlight' : ''}`}>
        {isProficient ? 
            <div title="Proficient in Saving Throw" className="w-4 h-4 rounded-full border-2 border-green-400 bg-green-900/50 flex-shrink-0"></div> :
            <div title="Not Proficient in Saving Throw" className="w-4 h-4 rounded-full border-2 border-gray-600 flex-shrink-0"></div>
        }
        <div className="flex-grow text-left">
            <div className="text-xs text-gray-400 font-bold">{ability.name.toUpperCase()}</div>
            <div className="text-lg font-bold">{modifier >= 0 ? `+${modifier}` : modifier}</div>
        </div>
        <div className="text-4xl font-bold">{score}</div>
    </div>
);

const ProficiencyCard: React.FC<{ title: string, proficiencies: ResolvedProficiency[] }> = ({ title, proficiencies }) => {
    if (!proficiencies || proficiencies.length === 0) return null;
    return (
        <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="text-xl font-bold font-teko tracking-wide mb-3">{title}</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-2 text-sm">
                {proficiencies.map(p => (
                    <div key={p.id} className="flex justify-between items-baseline">
                        <span className="flex-1">{p.name}</span>
                        <span className="text-gray-400 text-xs italic text-right ml-2">{p.source}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const SummaryStep: React.FC<SummaryStepProps> = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);

    const [highlightedStats, setHighlightedStats] = useState<Set<string>>(new Set());
    const prevCharacter = usePrevious(character);

    if (!character || !staticDataCache) return null;

    const triggerHighlight = (key: string) => {
        setHighlightedStats(prev => new Set(prev).add(key));
        setTimeout(() => {
            setHighlightedStats(prev => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }, 1500);
    };

    useEffect(() => {
        if (!prevCharacter || !character) return;
        
        if (character.hp !== prevCharacter.hp) triggerHighlight('hp');
        if (character.ac !== prevCharacter.ac) triggerHighlight('ac');
        if (character.initiative !== prevCharacter.initiative) triggerHighlight('initiative');
        if (character.speed !== prevCharacter.speed) triggerHighlight('speed');

        ABILITIES.forEach(ability => {
            const prevScore = (prevCharacter.abilityScores[ability.id]?.base || 0) + (prevCharacter.abilityScores[ability.id]?.bonus || 0);
            const currentScore = (character.abilityScores[ability.id]?.base || 0) + (character.abilityScores[ability.id]?.bonus || 0);
            if (prevScore !== currentScore) {
                triggerHighlight(ability.id);
            }
        });
    }, [character, prevCharacter]);
    
    const proficiencyBonus = Math.ceil(character.level / 4) + 1;

    return (
        <div>
            <h2 className="text-2xl font-bold font-teko tracking-wide mb-6 text-center">CHARACTER SUMMARY</h2>
    
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatBox label="Level" value={character.level} />
                <StatBox label="Hit Points" value={character.hp} highlight={highlightedStats.has('hp')} />
                <StatBox label="Armor Class" value={character.ac} highlight={highlightedStats.has('ac')} />
                <StatBox label="Initiative" value={character.initiative >= 0 ? `+${character.initiative}` : character.initiative} highlight={highlightedStats.has('initiative')} />
                <StatBox label="Speed" value={`${character.speed} ft`} highlight={highlightedStats.has('speed')} />
                <StatBox label="Prof. Bonus" value={`+${proficiencyBonus}`} />
                <StatBox label="Pass. Perception" value={character.passivePerception} />
                <StatBox label="Pass. Investigation" value={character.passiveInvestigation} />
            </div>
            
            <div className="mb-6">
                <h3 className="text-xl font-bold font-teko tracking-wide mb-3">Ability Scores & Saves</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ABILITIES.map(ability => {
                        const scoreData = character.abilityScores[ability.id] || { base: 10, bonus: 0 };
                        const totalScore = scoreData.base + scoreData.bonus;
                        const modifier = Math.floor((totalScore - 10) / 2);
                        const isProficient = character.proficiencies?.saving_throws.some(p => p.id === ability.id) || false;
                        
                        return (
                            <AbilityScoreDisplay
                                key={ability.id}
                                ability={ability}
                                score={totalScore}
                                modifier={modifier}
                                isProficient={isProficient}
                                highlight={highlightedStats.has(ability.id)}
                            />
                        );
                    })}
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <ProficiencyCard title="Skill Proficiencies" proficiencies={character.proficiencies?.skills || []} />
                <ProficiencyCard title="Tool Proficiencies" proficiencies={character.proficiencies?.tools || []} />
                <ProficiencyCard title="Weapon & Armor Proficiencies" proficiencies={[...(character.proficiencies?.weapons || []), ...(character.proficiencies?.armor || [])]} />
                <ProficiencyCard title="Languages" proficiencies={character.proficiencies?.languages || []} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="text-xl font-bold font-teko tracking-wide mb-3">Traits</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {character.allTraits?.map(trait => (
                            <div key={trait.id} className="p-2 bg-gray-800 rounded-md">
                                <p className="font-semibold">{trait.name}</p>
                                <p className="text-sm text-gray-400">{trait.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="text-xl font-bold font-teko tracking-wide mb-3">Feats</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {character.feats.map(feat => {
                             if (feat.featId === 'ability-score-improvement') {
                                const bonuses = feat.choices?.bonuses || [];
                                const bonusText = bonuses.map((b: {ability: Ability, value: number}) => `+${b.value} ${b.ability.toLowerCase()}`).join(', ');
                                return (
                                    <div key={feat.source} className="p-2 bg-gray-800 rounded-md">
                                        <p className="font-semibold">Ability Score Improvement</p>
                                        <p className="text-sm text-gray-400">Increased scores: {bonusText}.</p>
                                    </div>
                                );
                             }
                            const featData = staticDataCache.allFeats.find(f => f.id === feat.featId);
                            if (!featData) return null;
                            return (
                                <div key={feat.source} className="p-2 bg-gray-800 rounded-md">
                                    <p className="font-semibold">{featData.name}</p>
                                    <p className="text-sm text-gray-400">{featData.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryStep;