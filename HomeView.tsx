
import React, { useState, useEffect, useMemo } from 'react';
import { Character } from '../../types';
import { dataService, ClassIndexEntry } from '../../services/dataService';
import { useAppDispatch } from '../../state/hooks';
import { setMode } from '../../state/appSlice';

interface HomeViewProps {
    roster: Character[];
    onCreate: () => void;
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
}

const CharacterCard: React.FC<{ character: Character, onLoad: () => void, onDelete: () => void, classIndexMap: Map<string, string> }> = ({ character, onLoad, onDelete, classIndexMap }) => {
    const classDisplay = character.classes.map(c => `${classIndexMap.get(c.id) || c.id} ${c.level}`).join(' / ') || 'Adventurer';
    const avatarUrl = character.characterPortraitUrl || character.heritage.resolvedHeritage?.iconUrl || 'https://picsum.photos/seed/avatar/128/128';

    return (
        <div className="bg-gray-900/50 rounded-lg shadow-lg overflow-hidden flex flex-col border border-gray-700 hover:border-blue-500 transition-colors duration-300">
            <div className="p-4 flex-grow">
                <div className="flex items-center gap-4">
                    <img src={avatarUrl} alt={character.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-600" />
                    <div>
                        <h3 className="text-xl font-bold font-teko tracking-wide">{character.name || 'Unnamed Character'}</h3>
                        <p className="text-sm text-gray-400">Level {character.level} {classDisplay}</p>
                    </div>
                </div>
            </div>
            <div className="p-2 bg-gray-900/70 grid grid-cols-2 gap-2">
                <button onClick={onDelete} className="w-full px-3 py-2 bg-red-800 hover:bg-red-700 rounded-md text-xs font-semibold transition-colors">DELETE</button>
                <button onClick={onLoad} className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-semibold transition-colors">LOAD</button>
            </div>
        </div>
    );
};

const ToolButton: React.FC<{ title: string, description: string, icon: React.ReactNode, onClick: () => void, disabled?: boolean, badge?: string }> = ({ title, description, icon, onClick, disabled = false, badge }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="relative text-left w-full p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center gap-4"
    >
        {badge && <span className="absolute top-2 right-2 text-xs font-bold bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full">{badge}</span>}
        <div className="w-12 h-12 flex-shrink-0 text-purple-400 group-hover:text-purple-300 transition-colors duration-300">{icon}</div>
        <div>
            <h4 className="font-bold font-teko text-2xl tracking-wider text-white">{title}</h4>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
    </button>
);

const HomeView: React.FC<HomeViewProps> = ({ roster, onCreate, onLoad, onDelete }) => {
    const [classIndex, setClassIndex] = useState<ClassIndexEntry[]>([]);
    const dispatch = useAppDispatch();
    
    useEffect(() => {
        dataService.getClassIndex().then(setClassIndex);
    }, []);

    const classIndexMap = useMemo(() => new Map(classIndex.map(c => [c.id, c.name])), [classIndex]);

    return (
        <div className="max-w-7xl mx-auto animate-fade-in-up">
            <div className="text-center mb-10">
                <h1 className="text-5xl font-bold font-teko tracking-wider text-white">VTT CATHEDRAL</h1>
                <p className="text-gray-400 mt-1">Your portal to epic adventures.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Player Hub */}
                <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-3xl font-bold font-teko tracking-wider text-blue-300 border-b-2 border-blue-800 pb-2 mb-4">PLAYER HUB</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-h-[200px]">
                        {roster.map(character => (
                            <CharacterCard 
                                key={character.id} 
                                character={character}
                                onLoad={() => onLoad(character.id)}
                                onDelete={() => onDelete(character.id)}
                                classIndexMap={classIndexMap}
                            />
                        ))}
                    </div>
                     {roster.length === 0 && (
                        <p className="text-center text-gray-500 italic my-8">You have no characters yet. Create one below to begin!</p>
                    )}
                    <div className="mt-6 space-y-4">
                        <button 
                            onClick={onCreate}
                            className="w-full p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-3 font-bold text-lg transition-transform hover:scale-105"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            CREATE NEW CHARACTER
                        </button>
                         <button 
                            onClick={() => dispatch(setMode('genesis'))}
                            className="w-full p-4 bg-purple-900/50 border-2 border-purple-700 text-purple-300 rounded-lg flex items-center justify-center gap-3 font-bold text-lg hover:bg-purple-800/50 hover:border-purple-500 transition-all duration-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            GENERATE WITH GENESIS AI
                        </button>
                    </div>
                </div>

                {/* DM Toolkit */}
                 <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                     <h2 className="text-3xl font-bold font-teko tracking-wider text-purple-300 border-b-2 border-purple-800 pb-2 mb-4">DUNGEON MASTER'S TOOLKIT</h2>
                     <div className="space-y-4">
                        <ToolButton 
                            title="BESTIARY"
                            description="Browse, search, and view monster stat blocks."
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>}
                            onClick={() => dispatch(setMode('bestiary'))}
                        />
                         <ToolButton 
                            title="CRUCIBLE"
                            description="AI-driven combat simulator for testing encounters."
                             icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048l5.962-5.962a.75.75 0 011.06 0l2.293 2.293a.75.75 0 010 1.06l-5.962 5.962A8.25 8.25 0 0115.362 5.214z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H12a.75.75 0 01-.75-.75v-.008z" /></svg>}
                            onClick={() => dispatch(setMode('crucible'))}
                        />
                         <ToolButton 
                            title="WORLDBUILDER"
                            description="AI-assisted map and encounter generation."
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 13.5a3.375 3.375 0 00-3.375-3.375L13.5 9.75l-1.125.375a3.375 3.375 0 00-2.456 2.456L9 13.5l.375 1.125a3.375 3.375 0 002.456 2.456L13.5 18l1.125-.375a3.375 3.375 0 002.456-2.456L18 13.5z" /></svg>}
                            onClick={() => dispatch(setMode('worldbuilder'))}
                        />
                     </div>
                </div>
            </div>
        </div>
    );
};

export default HomeView;
