import React from 'react';
import { SkillCheckItem } from './types';
import { usePlayerActions } from '../../hooks/usePlayerActions';
import { useAppSelector } from '.././state/hooks';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';

interface SkillsPanelProps {}

const SkillsPanel: React.FC<SkillsPanelProps> = () => {
    const { handleRoll } = usePlayerActions();
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    
    const skills = character?.skillCheckItems || [];

    if (skills.length === 0) return null;

    return (
        <div className="bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-900/50">
                <h3 className="font-bold font-teko text-2xl tracking-wider text-white">SKILLS</h3>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                {skills.map(skill => (
                    <button 
                        key={skill.id} 
                        onClick={() => handleRoll(skill.name, skill.modifier)}
                        className="w-full p-2 bg-gray-900/30 rounded-md border-l-4 border-gray-600 hover:border-blue-500 hover:bg-gray-700/50 transition-colors flex justify-between items-center text-left"
                    >
                        <div className="flex items-center gap-2">
                            {skill.isProficient ? (
                                <div title="Proficient" className="w-4 h-4 rounded-full border-2 border-green-400 bg-green-900/50 flex-shrink-0"></div>
                            ) : (
                                <div title="Not Proficient" className="w-4 h-4 rounded-full border-2 border-gray-600 flex-shrink-0"></div>
                            )}
                            <div>
                                <span className="font-semibold">{skill.name}</span>
                                <span className="text-xs text-gray-400 ml-2">({skill.ability.slice(0, 3)})</span>
                            </div>
                        </div>
                        <div className="font-bold text-lg">
                            {skill.modifier >= 0 ? `+${skill.modifier}` : skill.modifier}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SkillsPanel;