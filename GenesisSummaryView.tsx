import React from 'react';
import { Character, Ability, PartialCharacter } from '../../types';
import { ABILITIES } from '../../constants';

interface GenesisSummaryViewProps {
    character: Character | PartialCharacter;
    onAccept: () => void;
    onRegenerate: () => void;
}

const StatBox: React.FC<{ label: string, value: string | number, large?: boolean }> = ({ label, value, large = false }) => (
    <div className="bg-gray-700/50 border border-gray-600 rounded-md p-2 text-center">
        <div className={`font-bold ${large ? 'text-3xl' : 'text-xl'}`}>{value}</div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
);

const AbilityScoreDisplay: React.FC<{ ability: {id: Ability, name: string}, score?: number }> = ({ ability, score = 10 }) => (
     <div className="bg-gray-800 rounded-lg p-3 text-center w-full">
        <div className="text-sm text-gray-400 font-bold">{ability.name.substring(0, 3)}</div>
        <div className="text-3xl font-bold">{score}</div>
    </div>
);

const BackstoryItem: React.FC<{ title: string, text?: string }> = ({ title, text }) => (
    <div>
        <h4 className="font-bold text-purple-300">{title}</h4>
        <p className="text-sm text-gray-300 italic">"{text || 'Not yet generated...'}"</p>
    </div>
);


const GenesisSummaryView: React.FC<GenesisSummaryViewProps> = ({ character, onAccept, onRegenerate }) => {
    const classDisplay = character.classes?.map(c => `${c.name || c.id} ${c.level}`).join(' / ') || 'Adventurer';
    const avatarUrl = character.characterPortraitUrl || character.heritage?.resolvedHeritage?.iconUrl || 'https://picsum.photos/seed/avatar/128/128';

    return (
        <div className="max-w-4xl mx-auto bg-gray-800 bg-opacity-70 rounded-lg shadow-2xl p-6 md:p-8 relative animate-fade-in-up">
            <div className="text-center mb-6">
                <h2 className="text-4xl font-bold font-teko tracking-wider text-purple-300">CHARACTER FORGED</h2>
                <p className="text-gray-400">The AI has generated the following character based on your concept. Review the details below.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                     <div className="flex flex-col items-center">
                        <img src={avatarUrl} alt={character.name} className="w-32 h-32 rounded-full object-cover border-4 border-gray-600 shadow-lg"/>
                        <h3 className="text-3xl font-bold font-teko tracking-wide mt-3">{character.name}</h3>
                        <p className="text-gray-400 -mt-1">{character.heritage?.resolvedHeritage?.name} {classDisplay}</p>
                    </div>
                     <div className="grid grid-cols-3 gap-2">
                        <StatBox label="Level" value={character.level || '?'} />
                        <StatBox label="HP" value={character.hp || '?'} />
                        <StatBox label="AC" value={character.ac || '?'} />
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        {ABILITIES.map(ability => {
                            const scoreData = character.abilityScores?.[ability.id];
                            const totalScore = (scoreData?.base || 0) + (scoreData?.bonus || 0);
                            return <AbilityScoreDisplay key={ability.id} ability={ability} score={totalScore || undefined} />;
                        })}
                    </div>
                </div>
                <div className="md:col-span-2 bg-gray-900/50 p-6 rounded-lg space-y-4">
                    <h3 className="text-2xl font-bold font-teko tracking-wider text-purple-200 border-b-2 border-purple-800 pb-2 mb-4">Backstory & Traits</h3>
                    <BackstoryItem title="Personality" text={character.backstoryDetails?.personality} />
                    <BackstoryItem title="Ideal" text={character.backstoryDetails?.ideals} />
                    <BackstoryItem title="Bond" text={character.backstoryDetails?.bonds} />
                    <BackstoryItem title="Flaw" text={character.backstoryDetails?.flaws} />
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={onRegenerate} className="px-8 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-bold tracking-wider transition-colors">
                    Discard & Regenerate
                </button>
                <button onClick={onAccept} className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-xl tracking-wider transition-colors">
                    Accept & Edit in Builder
                </button>
            </div>
        </div>
    );
};

export default GenesisSummaryView;