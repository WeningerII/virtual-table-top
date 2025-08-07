
import React, { useState, useEffect } from 'react';
import { useToast } from './state/ToastContext';
import { useAppSelector, useAppDispatch } from './state/hooks';
import { setActiveCharacterId } from './state/rosterSlice';
import { setMode } from './state/appSlice';
import { startOrResumeGeneration, clearGenesisState } from './genesisSlice';
import { Character, PartialCharacter } from './types';
import GenesisSummaryView from './GenesisSummaryView';

const GenesisView: React.FC = () => {
    const { dataStatus } = useAppSelector(state => state.app);
    const genesisState = useAppSelector(state => state.genesis);
    const dispatch = useAppDispatch();
    const [prompt, setPrompt] = useState('');
    const { addToast } = useToast();

    const allDataLoaded = dataStatus === 'succeeded';

    useEffect(() => {
        if (genesisState.prompt) {
            setPrompt(genesisState.prompt);
        }
    }, []);

    const handleGenerate = () => {
        if (!prompt.trim()) {
            addToast("Please enter a character concept.", "error");
            return;
        }
        dispatch(startOrResumeGeneration(prompt));
    };
    
    const handleRetry = () => {
        if (!genesisState.prompt) {
             addToast("Cannot retry without an initial prompt.", "error");
             return;
        }
        dispatch(startOrResumeGeneration(genesisState.prompt));
    };

    const handleAccept = (characterToAccept: Character | PartialCharacter) => {
        if (!characterToAccept.id) {
            addToast("Cannot accept a character without an ID.", "error");
            return;
        }
        dispatch(setActiveCharacterId(characterToAccept.id));
        dispatch(setMode('builder'));
        dispatch(clearGenesisState());
    };

    const handleRegenerate = () => {
        dispatch(clearGenesisState());
    };

    if (!allDataLoaded) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-800 bg-opacity-70 rounded-lg shadow-2xl p-6 md:p-8 text-white">
                 <svg className="animate-spin h-10 w-10 text-purple-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">Loading Forge Data...</p>
                <p className="text-sm text-gray-400">This may take a moment.</p>
            </div>
        );
    }
    
    if (genesisState.isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
                <svg className="animate-spin h-12 w-12 text-purple-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h2 className="text-3xl font-bold font-teko tracking-wider text-purple-300">FORGING CHARACTER...</h2>
                <p className="text-gray-400 mt-2">{genesisState.progressMessage}</p>
            </div>
        );
    }

    if (genesisState.error) {
        return (
            <div className="max-w-4xl mx-auto bg-red-900/30 border border-red-500 rounded-lg p-6 text-white text-center">
                <h2 className="text-3xl font-bold font-teko tracking-wider text-red-300">GENERATION FAILED</h2>
                <p className="text-red-200 mt-2">The AI encountered an issue at step: <span className="font-bold">{genesisState.currentStep}</span></p>
                <p className="text-sm bg-red-900/50 p-2 my-4 rounded-md font-mono">{genesisState.error}</p>
                
                {genesisState.character && <p className="mb-4">Partial progress has been saved.</p>}
                
                <div className="flex justify-center gap-4">
                    <button onClick={handleRetry} className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-black rounded-lg font-bold">Retry Last Step</button>
                    {genesisState.character && (
                        <button onClick={() => handleAccept(genesisState.character!)} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold">Accept & Edit Manually</button>
                    )}
                     <button onClick={handleRegenerate} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-bold">Start Over</button>
                </div>
            </div>
        );
    }

    if (genesisState.character && !genesisState.isLoading) {
        return <GenesisSummaryView character={genesisState.character as Character} onAccept={() => handleAccept(genesisState.character!)} onRegenerate={handleRegenerate} />;
    }

    return (
        <div className="max-w-4xl mx-auto bg-gray-800 bg-opacity-70 rounded-lg shadow-2xl p-6 md:p-8 relative animate-fade-in-up">
            <div className="text-center">
                <h2 className="text-4xl font-bold font-teko tracking-wider text-purple-300">GENESIS FORGE</h2>
                <p className="text-gray-400 mt-2">Describe the character you want to create. Provide a name, a backstory, a concept, or the name of an existing character from fiction. The AI will construct a complete, playable character sheet based on your input.</p>
            </div>

            <div className="mt-8">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'Batman', 'Aang from Avatar', 'A dwarven cleric who has lost her faith but now finds power in her community', 'Bingbong Purplefart, a gnome who thinks he's a dragon'"
                    className="w-full h-40 bg-gray-900 border-2 border-gray-600 rounded-md p-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                />
            </div>

            <div className="mt-6 text-center">
                <button
                    onClick={handleGenerate}
                    className="px-12 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xl tracking-wider transition-colors disabled:bg-gray-600 disabled:cursor-wait flex items-center justify-center mx-auto"
                >
                    FORGE CHARACTER
                </button>
            </div>
        </div>
    );
};

export default GenesisView;
