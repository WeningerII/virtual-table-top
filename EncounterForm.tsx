
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import { setContext, setTheme, setPartyLevel, setPartySize, setDifficulty } from '../../../state/worldbuilderSlice';

interface EncounterFormProps {
    themes: string[];
    isGenerating: boolean;
    onGenerate: () => void;
}

const EncounterForm: React.FC<EncounterFormProps> = ({
    themes, isGenerating, onGenerate
}) => {
    const dispatch = useAppDispatch();
    const { context, theme, partyLevel, partySize, difficulty } = useAppSelector(state => state.worldbuilder);
    
    return (
        <div className="space-y-4">
            <textarea
                value={context}
                onChange={(e) => dispatch(setContext(e.target.value))}
                placeholder="Describe the encounter setting and situation. Examples: 'A band of goblins ambushes the party from the trees as they travel along the forest road', 'The party must negotiate with a suspicious merchant who claims to have information about the missing artifact', 'A chase sequence through the crowded streets of Waterdeep as the party pursues a pickpocket'"
                className="w-full h-40 bg-gray-900 border-2 border-gray-600 rounded-md p-4 focus:ring-2 focus:ring-purple-500"
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="text-xs text-gray-400">Theme</label>
                    <select value={theme} onChange={e => dispatch(setTheme(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-sm mt-1">
                        {themes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-400">Party Lvl</label>
                    <input type="number" value={partyLevel} onChange={e => dispatch(setPartyLevel(parseInt(e.target.value, 10)))} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-sm mt-1" />
                </div>
                <div>
                    <label className="text-xs text-gray-400">Party Size</label>
                    <input type="number" value={partySize} onChange={e => dispatch(setPartySize(parseInt(e.target.value, 10)))} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-sm mt-1" />
                </div>
                <div>
                    <label className="text-xs text-gray-400">Difficulty</label>
                    <select value={difficulty} onChange={e => dispatch(setDifficulty(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-sm mt-1">
                        <option>Easy</option><option>Medium</option><option>Hard</option><option>Deadly</option>
                    </select>
                </div>
            </div>
             <button
                onClick={onGenerate}
                disabled={isGenerating || !context.trim()}
                className="w-full mt-4 px-12 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xl tracking-wider transition-colors disabled:bg-gray-600"
            >
                {isGenerating ? 'Generating...' : 'GENERATE ENCOUNTER'}
            </button>
        </div>
    );
};

export default EncounterForm;