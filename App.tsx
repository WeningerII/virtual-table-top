

import React, { useEffect } from 'react';
import Header from './components/Header';
import ToastContainer from './components/shared/ToastContainer';
import { useAppSelector, useAppDispatch } from './state/hooks';
import { changeAppMode, initializeApp } from './state/appSlice';
import AppRouter from './components/routing/AppRouter';

const App: React.FC = () => {
    const dispatch = useAppDispatch();
    const mode = useAppSelector(state => state.app.mode);
    const activeCharacterId = useAppSelector(state => state.roster.activeCharacterId);
    const dataStatus = useAppSelector(state => state.app.dataStatus);

    useEffect(() => {
        if (dataStatus === 'idle') {
            dispatch(initializeApp());
        }
    }, [dispatch, dataStatus]);
    
    if (dataStatus !== 'succeeded') {
       return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8 text-center">
                <svg className="animate-spin h-10 w-10 text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">Loading Game Data ({dataStatus})...</p>
                <p className="text-sm text-gray-400">This may take a moment.</p>
            </div>
       );
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
            <Header 
                mode={mode} 
                setMode={(newMode) => dispatch(changeAppMode(newMode))} 
                hasActiveCharacter={!!activeCharacterId}
            />
            <main className={`flex-grow min-h-0 ${mode !== 'play' ? 'container mx-auto p-4 md:p-6' : ''}`}>
                <AppRouter />
            </main>
            <ToastContainer />
        </div>
    );
};

export default App;