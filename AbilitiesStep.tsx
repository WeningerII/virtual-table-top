import React, { useState, useCallback } from 'react';
import { Character, Ability, AbilityScores } from './types';
import { ABILITIES, STANDARD_ARRAY } from '../../constants';
import { useAppSelector } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';
import { useCharacterActions } from '../../hooks/useCharacterActions';

interface AbilitiesStepProps {}

const AbilityScoreCard: React.FC<{
    ability: { id: Ability, name: string },
    score: number,
    modifier: number,
    base: number,
    bonus: number,
    onBaseChange: (abilityId: Ability, value: number) => void
}> = ({ ability, score, modifier, base, bonus, onBaseChange }) => (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="bg-gray-900 p-2 text-center">
            <h3 className="font-bold text-sm tracking-widest">{ability.name.toUpperCase()}</h3>
        </div>
        <div className="text-center py-2">
            <p className="text-4xl font-bold">{score}</p>
            <p className="bg-blue-900/50 w-12 mx-auto rounded-full text-lg">{modifier >= 0 ? `+${modifier}` : modifier}</p>
        </div>
        <div className="bg-gray-700/50 p-2 space-y-1 text-sm">
            <div className="flex justify-between"><span>Base Score</span> <input type="number" value={base} onChange={e => onBaseChange(ability.id, parseInt(e.target.value, 10))} className="w-12 bg-gray-800 text-right rounded" /></div>
            <div className="flex justify-between"><span>Bonus</span> <span>{bonus >= 0 ? `+${bonus}` : bonus}</span></div>
        </div>
    </div>
);

const AbilitiesStep: React.FC<AbilitiesStepProps> = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const { updateAbilityScores } = useCharacterActions();
    type GenerationMethod = 'manual' | 'standardArray' | 'roll';
    const [generationMethod, setGenerationMethod] = useState<GenerationMethod>('manual');
    
    if (!character) return null;

    const handleBaseScoreChange = useCallback((abilityId: Ability, value: number) => {
        const newScores = { ...character.abilityScores };
        newScores[abilityId] = { ...newScores[abilityId], base: isNaN(value) ? 0 : value };
        updateAbilityScores(newScores);
    }, [character.abilityScores, updateAbilityScores]);

    const generateScores = (method: GenerationMethod) => {
        let newBaseScores: { [key in Ability]?: number } = {};

        if (method === 'standardArray') {
            const shuffledArray = [...STANDARD_ARRAY].sort(() => 0.5 - Math.random());
            ABILITIES.forEach((ability, index) => {
                newBaseScores[ability.id] = shuffledArray[index];
            });
        } else if (method === 'roll') {
            ABILITIES.forEach(ability => {
                const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
                rolls.sort((a, b) => a - b);
                rolls.shift();
                newBaseScores[ability.id] = rolls.reduce((sum, val) => sum + val, 0);
            });
        }

        const newScores = { ...character.abilityScores };
        for (const key in newBaseScores) {
            const abilityId = key as Ability;
            newScores[abilityId] = { ...newScores[abilityId], base: newBaseScores[abilityId]! };
        }
        updateAbilityScores(newScores);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold font-teko tracking-wide mb-4">ABILITY SCORES</h2>
            <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
                <select
                    value={generationMethod}
                    onChange={(e) => setGenerationMethod(e.target.value as GenerationMethod)}
                    className="w-full sm:w-64 bg-gray-900 border border-gray-600 rounded-md p-2"
                >
                    <option value="manual">Manual Entry</option>
                    <option value="standardArray">Standard Array</option>
                    <option value="roll">Roll for Stats (4d6 drop lowest)</option>
                </select>
                <button
                    onClick={() => generateScores(generationMethod)}
                    disabled={generationMethod === 'manual'}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Generate Scores
                </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {ABILITIES.map(ability => {
                    const scoreData = character.abilityScores[ability.id] || { base: 10, bonus: 0 };
                    const totalScore = scoreData.base + scoreData.bonus;
                    const modifier = Math.floor((totalScore - 10) / 2);
                    return (
                        <AbilityScoreCard
                            key={ability.id}
                            ability={ability}
                            score={totalScore}
                            modifier={modifier}
                            base={scoreData.base}
                            bonus={scoreData.bonus}
                            onBaseChange={handleBaseScoreChange}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default AbilitiesStep;
