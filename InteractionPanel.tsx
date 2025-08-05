
import React from 'react';
import { useAppSelector } from '../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../state/selectors';
import { Character, ActionItem } from '../../types';
import { usePlayerActions } from '../../hooks/usePlayerActions';

interface InteractionPanelProps {
    targetTokenId: string | null;
}

const InteractionPanel: React.FC<InteractionPanelProps> = ({ targetTokenId }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const { 
        handleDodge,
        handleHelp,
        handleHide,
        handleSearch,
    } = usePlayerActions();
    
    if (!character) return null;

    return (
        <div className="space-y-4">
            <div>
                 <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-2">General Actions</h4>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    <button onClick={handleDodge} className="w-full text-center p-3 rounded-md font-semibold transition-colors bg-gray-700 hover:bg-gray-600">
                        Dodge
                    </button>
                    <button 
                        onClick={() => handleHelp(targetTokenId)} 
                        disabled={!targetTokenId}
                        className="w-full text-center p-3 rounded-md font-semibold transition-colors bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                        title={!targetTokenId ? "Select a target to help" : "Help an ally with an attack"}
                    >
                        Help
                    </button>
                    <button onClick={handleHide} className="w-full text-center p-3 rounded-md font-semibold transition-colors bg-gray-700 hover:bg-gray-600">
                        Hide
                    </button>
                     <button onClick={handleSearch} className="w-full text-center p-3 rounded-md font-semibold transition-colors bg-gray-700 hover:bg-gray-600">
                        Search
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default InteractionPanel;
