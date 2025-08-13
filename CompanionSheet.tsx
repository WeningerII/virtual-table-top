import React, { useState } from 'react';
import { Companion, ActionItem, Movement, Character } from './types';
import { useAppDispatch, useAppSelector } from '.././state/hooks';
import { playStateActions } from './engine/slices/playStateSlice';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';
import { usePlayerActions } from '../../hooks/usePlayerActions';

interface CompanionSheetProps {
    companion: Companion;
    isRolling: boolean;
}

const formatMovement = (speed: Movement): string => {
    const parts: string[] = [];
    if (speed.walk) parts.push(`${speed.walk}ft`);
    if (speed.fly) parts.push(`fly ${speed.fly}ft`);
    if (speed.swim) parts.push(`swim ${speed.swim}ft`);
    if (speed.climb) parts.push(`climb ${speed.climb}ft`);
    if (speed.burrow) parts.push(`burrow ${speed.burrow}ft`);
    if (speed.hover) parts.push('(hover)');
    return parts.join(', ');
};

const CompanionSheet: React.FC<CompanionSheetProps> = ({ companion, isRolling }) => {
    const dispatch = useAppDispatch();
    const { handleCompanionRoll } = usePlayerActions();
    const [hpChange, setHpChange] = useState(1);

    const handleHpChange = (amount: number) => {
        const newHp = Math.max(0, Math.min(companion.maxHp, companion.currentHp + amount));
        dispatch(playStateActions.updateCompanionHp({ instanceId: companion.instanceId, newHp }));
    };

    const handleRemove = () => {
        dispatch(playStateActions.removeCompanion(companion.instanceId));
    }

    const isPermanent = ['steel-defender', 'eldritch-cannon-flamethrower', 'eldritch-cannon-force-ballista', 'eldritch-cannon-protector'].includes(companion.id);
    
    return (
        <div className="bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-900/50 flex justify-between items-start">
                <div>
                    <h3 className="font-bold font-teko text-2xl tracking-wider text-white">{companion.name.toUpperCase()}</h3>
                    <p className="text-sm text-gray-400 -mt-1">{companion.creatureType}</p>
                </div>
                {!isPermanent && (
                    <button onClick={handleRemove} className="text-xs text-red-400 hover:text-red-300 transition-colors bg-red-900/50 px-2 py-1 rounded-md">Remove</button>
                )}
            </div>

            <div className="p-4 grid grid-cols-3 gap-4 text-center border-b border-t border-gray-700">
                <div className="bg-gray-700/50 p-2 rounded-md">
                    <div className="font-bold text-2xl font-teko tracking-wider">{companion.ac ?? '-'}</div>
                    <div className="text-xs text-gray-400 uppercase">Armor Class</div>
                </div>
                <div className="bg-gray-700/50 p-2 rounded-md">
                    <div className="font-bold text-lg font-teko tracking-wider">{formatMovement(companion.speed)}</div>
                    <div className="text-xs text-gray-400 uppercase">Speed</div>
                </div>
                <div className="bg-gray-700/50 p-2 rounded-md">
                    <div className="font-bold text-2xl font-teko tracking-wider">{companion.currentHp} / {companion.maxHp}</div>
                    <div className="text-xs text-gray-400 uppercase">Hit Points</div>
                </div>
            </div>
            
             <div className="p-4 flex items-center justify-center gap-2">
                <button onClick={() => handleHpChange(-hpChange)} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-md font-bold">-</button>
                <input 
                    type="number" 
                    value={hpChange} 
                    onChange={(e) => setHpChange(Math.max(1, parseInt(e.target.value, 10)) || 1)}
                    className="w-16 bg-gray-900 border border-gray-600 rounded-md p-2 text-center"
                />
                <button onClick={() => handleHpChange(hpChange)} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md font-bold">+</button>
             </div>


            <div className="p-4 space-y-3">
                 <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400">Actions</h4>
                {companion.actions.map(action => (
                    <div key={action.name} className="flex justify-between items-center gap-4 p-3 bg-gray-900/30 rounded-md border-l-4 border-gray-600">
                        <div className="flex-grow">
                            <p className="font-semibold text-gray-200">{action.name}</p>
                            {action.description && <p className="text-xs text-gray-400">{action.description}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                            {action.attackRoll ? (
                                <button
                                    onClick={() => handleCompanionRoll(companion, action, null)}
                                    disabled={isRolling}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-wait"
                                >
                                    Use
                                </button>
                            ) : (
                                action.modifier && <div className="text-sm font-mono text-cyan-300">{action.modifier}</div>
                            )}
                        </div>
                    </div>
                ))}
                 {companion.reactions && companion.reactions.length > 0 && (
                     <>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mt-4">Reactions</h4>
                        {companion.reactions.map(reaction => (
                             <div key={reaction.name} className="flex justify-between items-start gap-4 p-3 bg-gray-900/30 rounded-md border-l-4 border-gray-600">
                                <div className="flex-grow">
                                    <p className="font-semibold text-gray-200">{reaction.name}</p>
                                    {reaction.description && <p className="text-xs text-gray-400">{reaction.description}</p>}
                                </div>
                            </div>
                        ))}
                     </>
                )}
            </div>
        </div>
    );
};

export default CompanionSheet;