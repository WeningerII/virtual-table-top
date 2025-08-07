
import React, { useState, useMemo, useEffect } from 'react';
import { Monster, MonsterType } from './types';
import MonsterStatBlock from './MonsterStatBlock';
import { dataService, MonsterIndexEntry } from './dataService';
import { useAppSelector, useAppDispatch } from './state/hooks';
import { setMode } from './state/appSlice';
import { useToast } from './state/ToastContext';
import MonsterTypeIconFactory from './MonsterTypeIconFactory';

const MONSTER_TYPES: MonsterType[] = ['Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid', 'Monstrosity', 'Ooze', 'Plant', 'Undead'];
const CHALLENGE_RATINGS = ["0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"];

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center h-full p-8">
        <svg className="animate-spin h-10 w-10 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const MonsterListItemSkeleton: React.FC = () => (
    <div className="w-full p-3 rounded-md bg-gray-900/50 flex justify-between items-center animate-pulse">
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-700 rounded-full flex-shrink-0"></div>
            <div className="w-32 h-4 bg-gray-700 rounded"></div>
        </div>
        <div className="w-12 h-3 bg-gray-700 rounded"></div>
    </div>
);


const BestiaryView: React.FC = () => {
    const dispatch = useAppDispatch();
    const isDmMode = useAppSelector(state => state.app.isDmMode);
    const { addToast } = useToast();
    const [monsterIndex, setMonsterIndex] = useState<MonsterIndexEntry[]>([]);
    const [isLoadingIndex, setIsLoadingIndex] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<MonsterType | 'All'>('All');
    const [selectedCR, setSelectedCR] = useState<string | 'All'>('All');
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
        return monsterIndex.filter(m => {
            const typeMatch = selectedType === 'All' || m.type === selectedType;
            const crMatch = selectedCR === 'All' || m.challengeRating === selectedCR;
            const searchMatch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
            return typeMatch && crMatch && searchMatch;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [monsterIndex, searchTerm, selectedType, selectedCR]);

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
    
    const handleSummon = (monsterId: string) => {
        // TODO: integrate summoning flow
        dispatch(setMode('play'));
        addToast("Monster queued (demo). Navigate to Play to place it.", "info");
    };

    return (
        <div className="max-w-7xl mx-auto bg-gray-800 bg-opacity-70 rounded-lg shadow-2xl p-6 md:p-8 relative grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 lg:col-span-3">
                <h2 className="text-3xl font-bold font-teko tracking-wider mb-4">BESTIARY</h2>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Search monsters..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2"
                    />
                    <select value={selectedType} onChange={e => setSelectedType(e.target.value as any)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2">
                        <option value="All">All Types</option>
                        {MONSTER_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <select value={selectedCR} onChange={e => setSelectedCR(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2">
                        <option value="All">All CRs</option>
                        {CHALLENGE_RATINGS.map(cr => <option key={cr} value={cr}>CR {cr}</option>)}
                    </select>
                </div>
                <div className="mt-4 bg-gray-900/50 rounded-lg h-[60vh] overflow-y-auto p-2 space-y-1">
                    {isLoadingIndex ? (
                        Array.from({ length: 15 }).map((_, i) => <MonsterListItemSkeleton key={i} />)
                    ) : filteredIndex.length > 0 ? (
                        filteredIndex.map(monster => (
                            <button
                                key={monster.id}
                                onClick={() => setSelectedMonsterId(monster.id)}
                                className={`w-full p-3 rounded-md flex justify-between items-center transition-colors ${selectedMonsterId === monster.id ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 text-gray-400 flex-shrink-0">
                                        <MonsterTypeIconFactory iconId={monster.iconId || `${monster.type}Icon`} />
                                    </div>
                                    <span className="font-semibold text-sm">{monster.name}</span>
                                </div>
                                <span className="text-xs text-gray-400">CR {monster.challengeRating}</span>
                            </button>
                        ))
                    ) : (
                         <div className="text-center p-8 text-gray-500">
                            <p>No monsters found.</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="md:col-span-8 lg:col-span-9 h-[calc(80vh)] overflow-y-auto">
                {isLoadingDetails ? (
                    <LoadingSpinner />
                ) : detailedMonster ? (
                    <MonsterStatBlock monster={detailedMonster} isDmMode={isDmMode} onSummon={handleSummon} />
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-gray-500 bg-gray-900/30 rounded-lg">
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-20 w-20 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mt-2 text-lg font-medium">Select a Monster</h3>
                            <p className="mt-1 text-sm">Choose a creature from the list to view its stat block.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BestiaryView;