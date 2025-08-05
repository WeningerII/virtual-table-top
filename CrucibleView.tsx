
import React, { useState, useEffect } from 'react';
import { CombatState, VFXRequest } from '../../types';
import LogPanel from '../play/LogPanel';
import InitiativeTracker from '../play/InitiativeTracker';
import { useVttController } from '../../hooks/useVttController';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { initializeApp } from '../../state/appSlice';
import VTTCanvas from '../play/VTTCanvas';
import { useVttInteractions } from '../../hooks/useVttInteractions';
import { startCrucibleCombat, pauseCrucible, resumeCrucible, resetCrucible } from '../../state/combatFlowSlice';


const CrucibleControls: React.FC<{
    simState: CombatState['phase'];
    onSimAction: (action: 'start' | 'pause' | 'resume' | 'reset') => void;
}> = ({ simState, onSimAction }) => {
    return (
        <div className="p-2 bg-gray-900/80 rounded-t-lg flex gap-2 border-b border-red-500">
            {simState === 'INITIATIVE_ROLLING' && <button onClick={() => onSimAction('start')} className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md font-bold">START</button>}
            {(simState === 'AI_PROCESSING') && <button onClick={() => onSimAction('pause')} className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-md font-bold">PAUSE</button>}
            {simState === 'AWAITING_PLAYER_ACTION' && <button onClick={() => onSimAction('resume')} className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md font-bold">RESUME</button>}
            {(simState === 'AI_PROCESSING' || simState === 'AWAITING_PLAYER_ACTION' || simState === 'COMBAT_ENDED') && <button onClick={() => onSimAction('reset')} className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 rounded-md font-bold">RESET</button>}
        </div>
    );
};


const CrucibleView: React.FC = () => {
    const {
        mapState,
        simState,
        winner,
        handleCrucibleGenerate,
        mapImageUrl,
    } = useVttController({ isCrucible: true });
    
    const [prompt, setPrompt] = useState('A brutal, gladiatorial free-for-all between 4-6 aggressive melee combatants like Orcs, Minotaurs, and Gnolls.');
    const { dataStatus } = useAppSelector(state => state.app);
    const dispatch = useAppDispatch();
    const vttInteractions = useVttInteractions();

    useEffect(() => {
        if (dataStatus === 'idle' || dataStatus === 'failed') {
            dispatch(initializeApp());
        }
    }, [dataStatus, dispatch]);

    const handleGenerateClick = () => {
        if (dataStatus === 'succeeded') {
            handleCrucibleGenerate(prompt);
        }
    };
    
    const handleSimAction = (action: 'start' | 'pause' | 'resume' | 'reset') => {
        switch (action) {
            case 'start': dispatch(startCrucibleCombat()); break;
            case 'pause': dispatch(pauseCrucible()); break;
            case 'resume': dispatch(resumeCrucible()); break;
            case 'reset': dispatch(resetCrucible()); break;
        }
    };
    
    const renderContent = () => {
        if (dataStatus !== 'succeeded') {
            return (
                 <div className="flex flex-col items-center justify-center h-full text-white">
                    <svg className="animate-spin h-10 w-10 text-red-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p>Loading Game Data...</p>
                </div>
            );
        }

        if (simState === 'IDLE') {
            return (
                <div className="flex flex-col items-center justify-center text-white p-8 text-center h-full">
                    <div className="w-24 h-24 mb-6 text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 5.5C20 4.67 19.33 4 18.5 4H18V3C18 2.45 17.55 2 17 2H13C12.45 2 12 2.45 12 3V4H5.5C4.67 4 4 4.67 4 5.5V11H2V13H4V18.5C4 19.33 4.67 20 5.5 20H18.5C19.33 20 20 19.33 20 18.5V13H22V11H20V5.5M16 11H8V9H16V11Z" /></svg>
                    </div>
                    <h2 className="text-4xl font-bold font-teko tracking-wider text-red-300">THE CRUCIBLE</h2>
                    <p className="text-gray-400 max-w-lg mx-auto mt-2">Describe a battle scenario. The AI will generate a map, select appropriate combatants, and simulate the fight to the death.</p>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full max-w-lg h-24 bg-gray-900 border-2 border-gray-600 rounded-md p-3 mt-6 focus:ring-2 focus:ring-red-500" />
                    <button onClick={handleGenerateClick} disabled={!prompt.trim()} className="mt-6 px-10 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-lg tracking-wider rounded-md transition-colors disabled:bg-gray-600">
                        FORGE BATTLE
                    </button>
                </div>
            );
        }

        if (simState === 'ENCOUNTER_LOADING' || !mapState) {
            return (
                <div className="flex flex-col items-center justify-center text-white p-8 text-center h-full">
                    <div className="w-24 h-24 mb-6 text-red-500 animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M20 5.5C20 4.67 19.33 4 18.5 4H18V3C18 2.45 17.55 2 17 2H13C12.45 2 12 2.45 12 3V4H5.5C4.67 4 4 4.67 4 5.5V11H2V13H4V18.5C4 19.33 4.67 20 5.5 20H18.5C19.33 20 20 19.33 20 18.5V13H22V11H20V5.5M16 11H8V9H16V11Z" /></svg>
                    </div>
                    <h2 className="text-3xl font-bold font-teko tracking-wider text-red-400">GENERATING SCENARIO...</h2>
                    <div className="w-full max-w-md mt-8 bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-red-500 h-2.5 w-1/2 rounded-full animate-slide-in"></div>
                    </div>
                </div>
            );
        }

        return (
             <VTTCanvas
                mapState={mapState}
                mapImageUrl={mapImageUrl}
                isDmMode={true}
                interactions={vttInteractions}
            />
        );
    };

    return (
        <div className="relative">
             <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-10rem)] max-w-full">
                <div className="flex-grow h-full bg-gray-900 rounded-lg shadow-inner relative overflow-hidden flex items-center justify-center">
                    {renderContent()}
                </div>
                 <div className="w-full lg:w-96 lg:max-w-sm flex-shrink-0 h-full flex flex-col">
                    <div className="bg-gray-800/70 rounded-lg border border-gray-700 flex flex-col flex-grow overflow-hidden">
                        <CrucibleControls simState={simState} onSimAction={handleSimAction} />
                        {mapState && <InitiativeTracker />}
                        <div className="flex-grow p-2 overflow-y-auto min-h-0">
                            <LogPanel />
                        </div>
                    </div>
                 </div>
            </div>

             {winner && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="text-center p-8 bg-gray-800 rounded-lg border-2 border-yellow-400">
                        <h2 className="text-4xl font-teko tracking-widest text-yellow-400">WINNER</h2>
                        <p className="text-2xl font-bold">{winner}</p>
                    </div>
                </div>
             )}
        </div>
    );
};

export default CrucibleView;
