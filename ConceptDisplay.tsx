
import React from 'react';
import { EncounterConcept } from '../../../types';
import { useEncounterGeneration } from '../hooks/useEncounterGeneration';

interface ConceptDisplayProps {
    concept: EncounterConcept | null;
    onLoadEncounter: () => void;
    status: 'idle' | 'generating' | 'partial' | 'success' | 'error';
    error: string | null;
}

const ConceptDisplay: React.FC<ConceptDisplayProps> = ({ concept, onLoadEncounter, status, error }) => {
    const { generate } = useEncounterGeneration();

    if (status === 'generating' || status === 'idle' || status === 'error') {
        let message = 'Awaiting generation...';
        if (status === 'error') {
            message = error || 'An unknown error occurred.';
        }
        return <div className="flex-grow flex items-center justify-center text-gray-500 italic p-4 text-center">{message}</div>;
    }

    if (!concept) {
        return <div className="flex-grow flex items-center justify-center text-gray-500 italic">No concept available.</div>;
    }

    return (
        <div className="flex-grow flex flex-col justify-between space-y-3">
            <div className="text-sm space-y-2 text-gray-300 overflow-y-auto pr-2 -mr-2">
                <p><strong className="text-purple-300">Description:</strong> {concept.description}</p>
                <p><strong className="text-purple-300">Monsters:</strong> {concept.monsters.map(m => m.name).join(', ')}</p>
                <p><strong className="text-purple-300">Strategy:</strong> {concept.placementStrategy}</p>
            </div>
            
            {status === 'partial' && error && (
                <div className="my-2 p-3 bg-red-900/40 border border-red-600 rounded-md text-center">
                    <p className="text-red-300 font-semibold">{error}</p>
                    <p className="text-xs text-red-400">You can try to regenerate the images or load the encounter with a placeholder map.</p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {status === 'success' && (
                     <button onClick={onLoadEncounter} className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold">
                        Load in VTT & Play
                    </button>
                )}
                 {status === 'partial' && (
                    <>
                        <button onClick={() => onLoadEncounter()} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm">
                            Load Anyway
                        </button>
                         <button onClick={() => generate(true)} className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black rounded-lg font-bold text-sm">
                            Retry Images
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConceptDisplay;