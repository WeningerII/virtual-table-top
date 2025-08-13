import React, { useState } from 'react';
import { Companion, ActionItem, Movement, Character } from './types';
import { useAppDispatch } from '.././state/hooks';
import { playStateActions } from './engine/slices/playStateSlice';
import { usePlayerActions } from '../../hooks/usePlayerActions';

interface HordeSheetProps {
    group: Companion[];
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

const MinionTracker: React.FC<{ minion: Companion }> = ({ minion }) => {
    const dispatch = useAppDispatch();
    
    const handleHpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHp = Math.max(0, Math.min(minion.maxHp, parseInt(e.target.value, 10) || 0));
        dispatch(playStateActions.updateCompanionHp({ instanceId: minion.instanceId, newHp }));
    };

    const handleRemove = () => {
        dispatch(playStateActions.removeCompanion(minion.instanceId));
    }

    return (
        <div className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-md">
            <span className="text-sm font-semibold flex-grow">{minion.name}</span>
            <input 
                type="number"
                value={minion.currentHp}
                onChange={handleHpChange}
                className="w-16 bg-gray-900 border border-gray-600 rounded-md p-1 text-center"
            />
            <span className="text-xs text-gray-400">/ {minion.maxHp}</span>
            <button onClick={handleRemove} className="text-red-500 hover:text-red-400 p-1 rounded-full bg-red-900/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 5.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    )
};

const HordeSheet: React.FC<HordeSheetProps> = ({ group, isRolling }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { handleCompanionRoll } = usePlayerActions();
    
    if (group.length === 0) return null;
    
    const blueprint = group[0];
    const activeCount = group.filter(c => c.currentHp > 0).length;

    return (
        <div className="bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-900/50 flex justify-between items-start">
                <div>
                    <h3 className="font-bold font-teko text-2xl tracking-wider text-white">{blueprint.name.toUpperCase()} ({activeCount}/{group.length})</h3>
                    <p className="text-sm text-gray-400 -mt-1">{blueprint.creatureType}</p>
                </div>
                 <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-900/50 px-3 py-1.5 rounded-md font-semibold">
                    {isExpanded ? 'Hide Details' : 'Show Details'}
                </button>
            </div>

            <div className="p-4 grid grid-cols-3 gap-4 text-center border-b border-t border-gray-700">
                <div className="bg-gray-700/50 p-2 rounded-md">
                    <div className="font-bold text-2xl font-teko tracking-wider">{blueprint.ac ?? '-'}</div>
                    <div className="text-xs text-gray-400 uppercase">Armor Class</div>
                </div>
                <div className="bg-gray-700/50 p-2 rounded-md">
                    <div className="font-bold text-lg font-teko tracking-wider">{formatMovement(blueprint.speed)}</div>
                    <div className="text-xs text-gray-400 uppercase">Speed</div>
                </div>
                <div className="bg-gray-700/50 p-2 rounded-md">
                    <div className="font-bold text-2xl font-teko tracking-wider">{blueprint.maxHp}</div>
                    <div className="text-xs text-gray-400 uppercase">Hit Points</div>
                </div>
            </div>
            
            {isExpanded && (
                 <div className="p-4 space-y-3">
                     <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400">Actions</h4>
                    {blueprint.actions.map(action => (
                        <div key={action.name} className="flex justify-between items-center gap-4 p-3 bg-gray-900/30 rounded-md border-l-4 border-gray-600">
                            <div className="flex-grow">
                                <p className="font-semibold text-gray-200">{action.name}</p>
                                {action.description && <p className="text-xs text-gray-400">{action.description}</p>}
                            </div>
                             <div className="text-right flex-shrink-0">
                                {action.attackRoll ? (
                                    <button
                                        onClick={() => handleCompanionRoll(blueprint, action, null)}
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
                     {blueprint.reactions && blueprint.reactions.length > 0 && (
                         <>
                            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mt-4">Reactions</h4>
                            {blueprint.reactions.map(reaction => (
                                 <div key={reaction.name} className="flex justify-between items-start gap-4 p-3 bg-gray-900/30 rounded-md border-l-4 border-gray-600">
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-200">{reaction.name}</p>
                                        {reaction.description && <p className="text-xs text-gray-400">{reaction.description}</p>}
                                    </div>
                                </div>
                            ))}
                         </>
                    )}

                    <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mt-4 pt-3 border-t border-gray-700">Minion Tracker</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                        {group.map(minion => (
                            <MinionTracker key={minion.instanceId} minion={minion} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HordeSheet;