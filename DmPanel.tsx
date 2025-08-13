
import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '.././state/hooks';
import { dataService, MonsterIndexEntry } from './services/data.service';
import { Monster, EncounterConcept } from './types';
import MonsterStatBlockCard from './MonsterStatBlockCard';
import { useVttController } from '../../hooks/useVttController';
import { queueMonsterSummon, clearMonsterSummon } from '../../state/appSlice';

interface DmPanelProps {
    onSelectMonsterToPlace: (monsterId: string | null) => void;
    monsterToPlaceId: string | null;
}

const DmPanel: React.FC<DmPanelProps> = ({ onSelectMonsterToPlace: _, monsterToPlaceId: __ }) => {
    const appState = useAppSelector(state => state.app);
    const appDispatch = useAppDispatch();
    const { handleDmGenerateEncounter } = useVttController();
    
    const [context, setContext] = useState('');
    const [encounterResult, setEncounterResult] = useState<EncounterConcept | null>(null);
    const [isGeneratingEncounter, setIsGeneratingEncounter] = useState(false);
    
    const [genTheme, setGenTheme] = useState('Forest');
    const [partyLevel, setPartyLevel] = useState(5);
    const [partySize, setPartySize] = useState(4);
    const [difficulty, setDifficulty] = useState('Medium');

    const monsterToPlaceId = useAppSelector(state => state.app.monsterToSummon);

    // Bestiary State
    const [monsterIndex, setMonsterIndex] = useState<MonsterIndexEntry[]>([]);
    const [isLoadingIndex, setIsLoadingIndex] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(null);
    const [detailedMonster, setDetailedMonster] = useState<Monster | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    useEffect(() => {
        dataService.getMonsterIndex().then(index => {
            setMonsterIndex(index);
            setIsLoadingIndex(false);
        });
    }, []);

    const filteredIndex = useMemo(() => {
        if (!searchTerm) return [];
        return monsterIndex.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [monsterIndex, searchTerm]);

    useEffect(() => {
        if (!selectedMonsterId) {
            setDetailedMonster(null);
            return;
        }
        setIsLoadingDetails(true);
        dataService.getMonsterById(selectedMonsterId).then(monster => {
            setDetailedMonster(monster);
            setIsLoadingDetails(false);
        });
    }, [selectedMonsterId]);

    const handleGenerate = async () => {
        setIsGeneratingEncounter(true);
        setEncounterResult(null);
        const result = await handleDmGenerateEncounter({
            context, theme: genTheme, partyLevel, partySize, difficulty
        });
        if (result) {
            setEncounterResult(result);
        }
        setIsGeneratingEncounter(false);
    };
    
    const themes = useMemo(() => {
        if (!appState.staticDataCache) return [];
        const allTags = appState.staticDataCache.objectBlueprints.flatMap(bp => bp.tags);
        const uniqueTags = [...new Set(allTags)]
            .filter(tag => tag !== 'common')
            .map((tag: string) => tag.charAt(0).toUpperCase() + tag.slice(1)); // Capitalize
        return uniqueTags.sort();
    }, [appState.staticDataCache]);
    
    const handleSelectMonsterToPlace = (monsterId: string | null) => {
        if (monsterId) {
            appDispatch(queueMonsterSummon(monsterId));
        } else {
            appDispatch(clearMonsterSummon());
        }
    };

    return (
        <div className="bg-gray-800/70 rounded-lg border border-gray-700 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-purple-700 bg-gray-900/50">
                <h3 className="font-bold font-teko text-2xl tracking-wider text-purple-300">DM TOOLKIT</h3>
            </div>
            <div className="p-2 flex-grow overflow-y-auto space-y-4">
                {monsterToPlaceId && (
                    <div className="p-3 bg-blue-900/50 rounded-lg text-center text-sm border border-blue-500">
                        <p className="font-semibold text-blue-200">Placing: {monsterIndex.find(m => m.id === monsterToPlaceId)?.name}</p>
                        <p className="text-xs text-gray-400">Click on the map to place. Press ESC to cancel.</p>
                        <button onClick={() => handleSelectMonsterToPlace(null)} className="mt-2 text-xs text-red-300 bg-red-900/50 px-2 py-1 rounded-md">Cancel Placement</button>
                    </div>
                )}
                
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="font-bold text-lg text-white mb-2">AI Encounter Generator</h4>
                    <div className="space-y-3">
                        <textarea
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="Describe the encounter... e.g., 'A goblin ambush on a forest road'"
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 h-20 text-sm"
                            aria-label="Encounter context"
                            disabled={isGeneratingEncounter}
                        />
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            <div>
                                <label className="text-xs text-gray-400">Theme</label>
                                <select value={genTheme} onChange={e => setGenTheme(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-1.5 text-sm mt-1">
                                    {themes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">Party Lvl</label>
                                <input type="number" value={partyLevel} onChange={e => setPartyLevel(parseInt(e.target.value,10))} className="w-full bg-gray-800 border border-gray-600 rounded-md p-1.5 text-sm mt-1" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">Party Size</label>
                                <input type="number" value={partySize} onChange={e => setPartySize(parseInt(e.target.value,10))} className="w-full bg-gray-800 border border-gray-600 rounded-md p-1.5 text-sm mt-1" />
                            </div>
                             <div>
                                <label className="text-xs text-gray-400">Difficulty</label>
                                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-1.5 text-sm mt-1">
                                    <option>Easy</option><option>Medium</option><option>Hard</option><option>Deadly</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isGeneratingEncounter || !context.trim()}
                        className="w-full mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-md font-semibold text-sm disabled:bg-gray-500 disabled:cursor-wait"
                    >
                        {isGeneratingEncounter ? 'Generating...' : 'Generate & Load Encounter'}
                    </button>
                    {isGeneratingEncounter && (
                        <div className="flex justify-center items-center p-4">
                            <svg className="animate-spin h-6 w-6 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="font-bold text-lg text-white mb-2">Bestiary Browser</h4>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search for a monster..."
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm"
                        />
                        {searchTerm && (
                            <div className="max-h-40 overflow-y-auto space-y-1 bg-gray-900/50 p-1 rounded-md">
                                {isLoadingIndex ? <p className="text-sm italic text-gray-400 text-center">Loading...</p> : filteredIndex.map(monster => (
                                    <button 
                                        key={monster.id}
                                        onClick={() => setSelectedMonsterId(monster.id)}
                                        className={`w-full text-left p-2 rounded-md text-sm transition-colors ${selectedMonsterId === monster.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-700/50'}`}
                                    >
                                        {monster.name}
                                    </button>
                                ))}
                            </div>
                        )}
                        {isLoadingDetails && <p className="text-sm italic text-gray-400 text-center">Loading details...</p>}
                        {detailedMonster && (
                            <MonsterStatBlockCard 
                                monster={detailedMonster} 
                                onSelect={() => handleSelectMonsterToPlace(detailedMonster.id)}
                                isSelectedForPlacement={monsterToPlaceId === detailedMonster.id}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DmPanel;
