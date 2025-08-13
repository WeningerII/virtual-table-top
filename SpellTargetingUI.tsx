import React from 'react';
import { Spell } from './types';

interface SpellTargetingUIProps {
    spell: Spell;
    onCancel: () => void;
}

const SpellTargetingUI: React.FC<SpellTargetingUIProps> = ({ spell, onCancel }) => {
    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-gray-800 bg-opacity-90 rounded-lg shadow-2xl p-4 flex items-center gap-4 border border-blue-500">
            <div>
                <p className="text-sm text-gray-400">Targeting:</p>
                <h3 className="font-bold text-lg text-white">{spell.name}</h3>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={onCancel}
                    className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-md font-semibold text-sm transition-colors"
                >
                    Cancel (Esc)
                </button>
            </div>
        </div>
    );
};

export default SpellTargetingUI;
