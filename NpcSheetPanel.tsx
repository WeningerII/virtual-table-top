import React, { useState, useEffect } from 'react';
import { MapNpcInstance, Monster, ActionItem, EffectInstance } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../../state/ToastContext';
import { usePlayerActions } from '../../hooks/usePlayerActions';
import { commanderService } from '../../services/ai/commander.service';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { entitySlice } from '../../state/entitySlice';
import AddConditionModal from './AddConditionModal';

interface NpcSheetPanelProps {
    instance: MapNpcInstance;
    onRemove: (instanceId: string) => void;
}

const Stat: React.FC<{ label: string; value: any }> = ({ label, value }) => (
    <div className="text-center bg-gray-800/50 p-2 rounded-md">
        <p className="font-bold text-lg text-white">{value}</p>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
    </div>
);

const NpcSheetPanel: React.FC<NpcSheetPanelProps> = ({ instance, onRemove }) => {
    const { addToast } = useToast();
    const entityState = useAppSelector(state => state.entity);
    const isDmMode = useAppSelector(state => state.app.isDmMode);
    const dispatch = useAppDispatch();
    const [monsterData, setMonsterData] = useState<Monster | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // DM Edit State
    const [isEditingHp, setIsEditingHp] = useState(false);
    const [hpInputValue, setHpInputValue] = useState(instance.currentHp.toString());
    const [isAddConditionModalOpen, setAddConditionModalOpen] = useState(false);
    
    // Strategy State
    const [isEditingStrategy, setIsEditingStrategy] = useState(false);
    const [newStrategy, setNewStrategy] = useState('');
    const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);


    useEffect(() => {
        setIsLoading(true);
        dataService.getMonsterById(instance.monsterId).then(data => {
            setMonsterData(data);
            setIsLoading(false);
        }).catch(() => {
            addToast(`Failed to load data for ${instance.monsterId}`, 'error');
            setIsLoading(false);
        });
    }, [instance.monsterId, addToast]);

    useEffect(() => {
        setHpInputValue(instance.currentHp.toString());
    }, [instance.currentHp]);

    if (isLoading) return <div className="p-4 text-center">Loading monster sheet...</div>;
    if (!monsterData) return <div className="p-4 text-center text-red-400">Error: Could not load monster data.</div>;
    
    const handleHpSubmit = () => {
        const newHp = parseInt(hpInputValue, 10);
        if (!isNaN(newHp)) {
            dispatch(entitySlice.actions.setNpcHp({ instanceId: instance.instanceId, newHp }));
        }
        setIsEditingHp(false);
    };

    const handleHpInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleHpSubmit();
        } else if (e.key === 'Escape') {
            setHpInputValue(instance.currentHp.toString());
            setIsEditingHp(false);
        }
    };
    
    const handleStrategyChange = async () => {
        setIsGeneratingStrategy(true);
        const battlefieldSummary = `The current situation involves ${entityState.activeMap?.tokens.length} creatures. A ${monsterData.name} leader needs a new strategy.`;
        const newStrat = await commanderService.generateNewStrategyForLeader(battlefieldSummary, newStrategy);
        if(newStrat && instance.squadId) {
            dispatch(entitySlice.actions.setSquadStrategies({ [instance.instanceId]: newStrat }));
            addToast("Strategy updated for the squad!");
        } else {
            addToast("Failed to update strategy.", "error");
        }
        setIsEditingStrategy(false);
        setIsGeneratingStrategy(false);
        setNewStrategy('');
    };

    const handleRemoveCondition = (effectId: string) => {
        dispatch(entitySlice.actions.removeNpcCondition({ instanceId: instance.instanceId, effectId }));
    };

    const hpPercentage = (instance.maxHp > 0) ? (instance.currentHp / instance.maxHp) * 100 : 0;
    const hpBarColor = hpPercentage > 50 ? 'bg-green-600' : hpPercentage > 25 ? 'bg-yellow-600' : 'bg-red-600';

    return (
        <>
            {isDmMode && <AddConditionModal isOpen={isAddConditionModalOpen} onClose={() => setAddConditionModalOpen(false)} targetId={instance.instanceId} />}
            <div className="bg-gray-800/70 rounded-lg border border-gray-700 flex flex-col h-full overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-purple-700 bg-gray-900/50">
                    <h3 className="font-bold font-teko text-2xl tracking-wider text-purple-300">{monsterData.name.toUpperCase()}</h3>
                    <p className="text-xs italic text-gray-400 -mt-1">{monsterData.size} {monsterData.type}</p>
                </div>
                <div className="p-4 flex-grow overflow-y-auto space-y-4">
                    {instance.isLeader && isDmMode && (
                        <div className="bg-purple-900/30 p-3 rounded-lg border border-purple-700">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-purple-300">AI Strategy</h4>
                                <button onClick={() => setIsEditingStrategy(!isEditingStrategy)} className="text-xs text-purple-200 hover:text-white bg-purple-800/50 px-2 py-1 rounded-md">{isEditingStrategy ? 'Cancel' : 'Change'}</button>
                            </div>
                            {isEditingStrategy ? (
                                <div className="mt-2 space-y-2">
                                    <textarea value={newStrategy} onChange={e => setNewStrategy(e.target.value)} placeholder="New objective, e.g., 'Focus fire on the cleric'" className="w-full bg-gray-900 text-sm p-2 rounded-md h-16" />
                                    <button onClick={handleStrategyChange} disabled={isGeneratingStrategy} className="w-full py-1 bg-purple-600 rounded-md text-sm font-semibold">{isGeneratingStrategy ? 'Generating...' : 'Update Strategy'}</button>
                                </div>
                            ) : instance.strategy ? (
                                <>
                                    <p className="font-semibold text-lg text-purple-200 mt-1">{instance.strategy.objective}</p>
                                    <p className="text-xs text-gray-400 italic">Rationale: {instance.strategy.rationale}</p>
                                </>
                            ) : <p className="text-xs text-gray-400 italic mt-1">No strategy assigned.</p>}
                        </div>
                    )}
                    <div className="bg-gray-900/50 p-3 rounded-lg space-y-3">
                        <div>
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-bold text-gray-400 uppercase text-xs">Hit Points</span>
                                {isDmMode && isEditingHp ? (
                                    <input
                                        type="number"
                                        value={hpInputValue}
                                        onChange={(e) => setHpInputValue(e.target.value)}
                                        onBlur={handleHpSubmit}
                                        onKeyDown={handleHpInputKeyDown}
                                        className="w-20 bg-gray-700 text-white text-2xl font-bold text-right rounded"
                                        autoFocus
                                    />
                                ) : (
                                    <button onClick={() => isDmMode && setIsEditingHp(true)} className="font-bold text-2xl" title={isDmMode ? "Click to edit" : ""}>{instance.currentHp} / {instance.maxHp}</button>
                                )}
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-4"><div className={`${hpBarColor} h-4 rounded-full`} style={{ width: `${hpPercentage}%` }}></div></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2"><Stat label="AC" value={monsterData.ac.value} /><Stat label="Speed" value={Object.entries(monsterData.speed).map(([type, val]) => `${type.charAt(0)}:${val}`).join(' ')} /><Stat label="CR" value={monsterData.challengeRating} /></div>
                    
                    {isDmMode && (
                        <div className="bg-gray-900/50 p-3 rounded-lg">
                             <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-2">Conditions</h4>
                             <div className="space-y-2 max-h-24 overflow-y-auto pr-2">
                                {instance.conditions && instance.conditions.length > 0 ? (
                                    instance.conditions.map((effect: EffectInstance) => (
                                        <div key={effect.id} className="flex justify-between items-center bg-gray-800 p-2 rounded-md">
                                            <span className="text-sm">{effect.source}</span>
                                            <button onClick={() => handleRemoveCondition(effect.id)} className="text-red-400 hover:text-red-300">&times;</button>
                                        </div>
                                    ))
                                ) : <p className="text-xs italic text-gray-500 text-center">No conditions active.</p>}
                             </div>
                             <button onClick={() => setAddConditionModalOpen(true)} className="w-full mt-2 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold text-sm">Add Condition</button>
                        </div>
                    )}

                    <div className="space-y-2 text-sm">
                        <h4 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">Actions & Traits</h4>
                        {monsterData.actions?.map((action, index) => (<div key={index} className="text-gray-400 bg-gray-800/50 p-2 rounded-md"><p className="text-gray-200 font-semibold">{action.name}.</p><p className="text-xs">{action.description}</p></div>))}
                        {(!monsterData.actions || monsterData.actions.length === 0) && <p className="text-xs italic text-gray-500">No special actions listed.</p>}
                    </div>

                    <button onClick={() => onRemove(instance.instanceId)} className="w-full mt-4 py-2 bg-red-900 hover:bg-red-800 rounded-md font-semibold text-sm">Remove from Map</button>
                </div>
            </div>
        </>
    );
};

export default NpcSheetPanel;