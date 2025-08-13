
import React from 'react';
import { Character } from './types';
import { vitalsActions } from './engine/slices/vitalsSlice';
import { rollD20 } from '../../utils/dice';
import { useAppDispatch } from '.././state/hooks';

interface DeathSavesTrackerProps {
    character: Character;
}

const SaveCircle: React.FC<{ filled: boolean }> = ({ filled }) => (
    <div className={`w-5 h-5 rounded-full border-2 ${filled ? 'bg-white border-white' : 'border-gray-400'}`}></div>
);

const DeathSavesTracker: React.FC<DeathSavesTrackerProps> = ({ character }) => {
    const dispatch = useAppDispatch();
    const { successes, failures } = character.deathSaves || { successes: 0, failures: 0 };

    const isStable = character.activeEffects.some(e => e.source === 'Stable');
    const isDead = character.activeEffects.some(e => e.source === 'Dead');
    
    if(isDead) {
        return (
             <div className="bg-red-900/50 border-t-2 border-b-2 border-red-700 py-3 text-center">
                <h4 className="font-bold text-lg uppercase tracking-wider text-red-300">Deceased</h4>
             </div>
        )
    }
    
    if(isStable) {
        return (
             <div className="bg-green-900/50 border-t-2 border-b-2 border-green-700 py-3 text-center">
                <h4 className="font-bold text-lg uppercase tracking-wider text-green-300">Stable</h4>
             </div>
        )
    }

    return (
        <div className="bg-red-900/50 border-t-2 border-b-2 border-red-700 py-3 px-4">
            <h4 className="font-bold text-center uppercase tracking-wider text-red-300 mb-3">Death Saving Throws</h4>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">Successes</span>
                    <div className="flex gap-1.5">
                        {[...Array(3)].map((_, i) => <SaveCircle key={i} filled={i < successes} />)}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                     <span className="text-sm font-semibold">Failures</span>
                    <div className="flex gap-1.5">
                        {[...Array(3)].map((_, i) => <SaveCircle key={i} filled={i < failures} />)}
                    </div>
                </div>
            </div>
             <button
                onClick={() => dispatch(vitalsActions.makeDeathSave({ roll: rollD20() }))}
                className="w-full mt-4 py-2 bg-red-700 hover:bg-red-600 rounded-md font-bold text-sm"
            >
                Make Death Save
            </button>
        </div>
    );
};

export default DeathSavesTracker;
