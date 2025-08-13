import React from 'react';
import { useAppSelector, useAppDispatch } from 'state/hooks';
import { InitiativeEntry, Monster, ActionItem } from './types';
import { logEvent } from 'state/logSlice';
import { entitySlice } from 'state/entitySlice';
import { useVttController } from '../../hooks/useVttController';
import { startCombat, endCombat } from 'state/combatFlowSlice';

interface InitiativeTrackerProps {}

const InitiativeTracker: React.FC<InitiativeTrackerProps> = () => {
    const appState = useAppSelector(state => state.app);
    const { activeMap, mapNpcInstances } = useAppSelector(state => state.entity);
    const combatFlowState = useAppSelector(state => state.combatFlow);
    const { isAiThinking } = useAppSelector(state => state.ai);
    const dispatch = useAppDispatch();
    const { handleStartCombat, handleAdvanceTurn } = useVttController();
    
    const { isDmMode, staticDataCache } = appState;
    const isCrucible = appState.mode === 'crucible';

    if (!activeMap) return null;

    const { initiativeOrder } = activeMap;
    const { phase: combatPhase, activeTokenId, round } = combatFlowState.currentState;
    const isCombatActive = combatPhase !== 'IDLE' && combatPhase !== 'COMBAT_ENDED' && combatPhase !== 'INITIATIVE_ROLLING';

    const handleAddAll = () => {
        dispatch(entitySlice.actions.resetInitiative()); // Clear first
        const initiativeEntries: InitiativeEntry[] = (activeMap.tokens || []).map(token => ({
            id: token.id, name: token.name, initiative: null,
            characterId: token.characterId, npcInstanceId: token.npcInstanceId, imageUrl: token.imageUrl,
        }));
        dispatch(entitySlice.actions.addTokensToInitiative(initiativeEntries));
    };

    const handleEndCombatWrapper = () => {
        if (window.confirm("Are you sure you want to end combat and clear the initiative order?")) {
            dispatch(endCombat({ ended: true, victor: 'manual_end' }));
            dispatch(entitySlice.actions.resetInitiative());
        }
    };
    
    const handleRemove = (tokenId: string) => {
         dispatch(entitySlice.actions.removeFromInitiative(tokenId));
    };

    const activeEntry = isCombatActive ? initiativeOrder.find(e => e.id === activeTokenId) : null;
    const isNpcTurn = activeEntry && !!activeEntry.npcInstanceId;
    
    const getMonsterData = (npcInstanceId?: string): Monster | null => {
        if (!npcInstanceId || !staticDataCache) return null;
        const instance = mapNpcInstances.find(i => i.instanceId === npcInstanceId);
        if (!instance) return null;
        return staticDataCache.allMonsters.find(m => m.id === instance.monsterId) || null;
    };

    return (
        <div className="bg-gray-800/70 rounded-lg p-3 border border-gray-700 space-y-3">
            {combatPhase === 'IDLE' && initiativeOrder.length === 0 && (
                <button onClick={handleAddAll} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold text-sm">
                    Add All Tokens to Combat
                </button>
            )}

            {(combatPhase === 'IDLE' && initiativeOrder.length > 0) || combatPhase === 'INITIATIVE_ROLLING' && (
                 <button onClick={handleStartCombat} className="w-full py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold text-sm">
                    Roll for Initiative!
                </button>
            )}

            {isCombatActive && !isCrucible && (
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleAdvanceTurn} disabled={isAiThinking} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed">Next Turn</button>
                    <button onClick={handleEndCombatWrapper} className="w-full py-2 bg-red-800 hover:bg-red-700 rounded-md font-semibold text-sm">End Combat</button>
                </div>
            )}
            
            {initiativeOrder.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {round && <div className="text-center text-xs font-bold text-gray-400 uppercase">Round {round}</div>}
                    {initiativeOrder.map((entry) => {
                        const isActive = activeTokenId === entry.id;
                        const isNpc = !!entry.npcInstanceId;
                        const isThinking = isActive && isNpc && isAiThinking;
                        const npcInstance = isNpc ? mapNpcInstances.find(i => i.instanceId === entry.npcInstanceId) : null;
                        const monsterData = getMonsterData(entry.npcInstanceId);
                        
                        return (
                            <div key={entry.id} className={`p-2 rounded-md transition-colors ${isActive ? 'bg-yellow-800/50 border-l-4 border-yellow-400' : 'bg-gray-900/50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                                        {isThinking ? (
                                            <svg className="animate-spin h-6 w-6 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                        ) : entry.imageUrl ? (
                                            <img src={entry.imageUrl} alt={entry.name} className="w-8 h-8 rounded-full object-cover"/>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">?</div>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <span className="font-semibold">{entry.name}</span>
                                        {isDmMode && npcInstance && (
                                            <div className="text-xs text-gray-400">HP: {npcInstance.currentHp}/{npcInstance.maxHp}</div>
                                        )}
                                    </div>
                                    <span className={`font-bold text-lg px-2 rounded-md ${isActive ? 'text-yellow-200' : 'text-gray-200'}`}>{entry.initiative}</span>
                                    {isDmMode && <button onClick={() => handleRemove(entry.id)} className="text-red-500 hover:text-red-300 transition-colors text-xs p-1" title="Remove from combat">&times;</button>}
                                </div>
                                {isDmMode && isActive && monsterData && (
                                    <div className="mt-2 pl-11 text-xs space-y-1 text-gray-400">
                                        {monsterData.actions?.slice(0, 2).map((act: ActionItem) => (
                                            <div key={act.name}><strong className="text-gray-300">{act.name}.</strong> {act.description?.split('.')[0]}.</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default InitiativeTracker;
