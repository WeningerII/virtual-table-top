

import React, { useMemo, useState, useEffect } from 'react';
import { Character, Maneuver, ClassFeature } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../../state/ToastContext';
import { useAppDispatch } from '../../state/hooks';
import { playStateActions } from '../../engine/slices/playStateSlice';
import { usePlayerActions } from '../../hooks/usePlayerActions';

interface FeaturesPanelProps {
    character: Character;
}

const CREATOR_FEATURE_IDS = [
    'forge-channel-divinity-artisans-blessing-2',
    'artificer-magical-tinkering-1',
    'artificer-right-tool-3',
    'artificer-spell-storing-item-11',
    'conjuration-minor-conjuration-2',
    'scribes-master-scrivener-10',
    'creation-performance-of-creation-3',
    'rune-knight-rune-carver-3',
    'warlock-pact-of-the-blade-3',
    'gunslinger-gunsmith-3',
];

const FeaturesPanel: React.FC<FeaturesPanelProps> = ({ character }) => {
    const { calculatedFeatureUses, fighter } = character;
    const { addToast } = useToast();
    const dispatch = useAppDispatch();
    const { handleUseCreatorFeature } = usePlayerActions();
    const selectedManeuvers = fighter?.selectedManeuvers || [];
    const [maneuversMap, setManeuversMap] = useState<Map<string, Maneuver>>(new Map());

    useEffect(() => {
        if (selectedManeuvers.length > 0) {
            dataService.getAllManeuvers().then(maneuvers => {
                setManeuversMap(new Map(maneuvers.map(m => [m.id, m])));
            });
        }
    }, [selectedManeuvers]);

    const battleMasterManeuvers = useMemo(() => {
        if (selectedManeuvers.length === 0 || maneuversMap.size === 0) return [];
        return selectedManeuvers.map(id => maneuversMap.get(id)).filter((m): m is Maneuver => !!m);
    }, [selectedManeuvers, maneuversMap]);

    const hasFeatureUses = calculatedFeatureUses && Object.keys(calculatedFeatureUses).length > 0;
    const hasManeuvers = battleMasterManeuvers.length > 0;

    if (!hasFeatureUses && !hasManeuvers) {
        return null;
    }
    
    const findFeatureData = (featureId: string): ClassFeature | undefined => {
        return character.allFeatures?.find(f => f.id === featureId);
    }

    const handleUseFeature = (featureId: string) => {
        const featureData = findFeatureData(featureId);
        if (!featureData) return;
        
        if (CREATOR_FEATURE_IDS.includes(featureId)) {
            handleUseCreatorFeature(featureData);
            return;
        }

        let resourceId = featureId;
        if (featureData.name.includes('Channel Divinity')) {
            resourceId = 'channel-divinity';
        }

        const featureState = calculatedFeatureUses?.[resourceId];
        if (featureState && featureState.current > 0) {
            dispatch(playStateActions.useFeature({ featureId: resourceId }));
            addToast(`Used ${featureData.name}!`);
        } else {
            addToast(`No uses of ${featureData.name} remaining.`, "error");
        }
    };
    
    const handleDivineIntervention = () => {
        const roll = Math.floor(Math.random() * 100) + 1;
        if (roll <= character.level) {
            addToast(`Divine Intervention SUCCEEDS! (Rolled ${roll})`, "success");
        } else {
            addToast(`Divine Intervention fails. (Rolled ${roll}, needed ${character.level} or lower)`, "error");
        }
        dispatch(playStateActions.useFeature({ featureId: 'divine-intervention' }));
    };

    const isCleric = character.classes.some(c => c.id === 'cleric');
    const divineInterventionUses = calculatedFeatureUses?.['divine-intervention']?.current || 0;
    
    const featuresToDisplay = Object.entries(calculatedFeatureUses || {})
        .map(([id, uses]) => ({ id, ...uses, featureData: findFeatureData(id) }))
        .filter(item => item.featureData && (item.id !== 'channel-divinity' && item.id !== 'divine-intervention'));
        
    const clericCDFeatures = character.allFeatures?.filter(f => f.name.includes("Channel Divinity")) || [];

    return (
        <div className="bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-900/50">
                <h3 className="font-bold font-teko text-2xl tracking-wider text-white">FEATURES</h3>
            </div>
            <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                {isCleric && clericCDFeatures.map(feature => {
                    if (!feature.id) return null;
                    const cdUses = calculatedFeatureUses?.['channel-divinity'];
                    return (
                         <div key={feature.id} className="bg-gray-900/30 p-3 rounded-md border-l-4 border-cyan-500 flex justify-between items-center gap-3">
                            <div className="flex-grow">
                                <p className="font-semibold">{feature.name}</p>
                                <p className="text-xs text-gray-400">
                                    Uses: <span className="font-bold text-lg text-white">{cdUses?.current || 0}</span> / {cdUses?.max || 0}
                                </p>
                            </div>
                            <button
                                onClick={() => handleUseFeature(feature.id!)}
                                disabled={(cdUses?.current || 0) <= 0}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                Use
                            </button>
                        </div>
                    );
                })}
                
                {featuresToDisplay.map(item => {
                    const { id, current, max, featureData } = item;
                    if (!featureData) return null;
                    const isCreatorFeature = CREATOR_FEATURE_IDS.includes(id);

                    return (
                        <div key={id} className="bg-gray-900/30 p-3 rounded-md border-l-4 border-gray-600 flex justify-between items-center gap-3">
                            <div className="flex-grow">
                                <p className="font-semibold">{featureData.name}</p>
                                <p className="text-xs text-gray-400">
                                    Uses: <span className="font-bold text-lg text-white">{current}</span> / {max === 999 ? '∞' : max}
                                </p>
                            </div>
                            <button
                                onClick={() => handleUseFeature(id)}
                                disabled={!isCreatorFeature && current <= 0}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                Use
                            </button>
                        </div>
                    )
                })}

                {hasManeuvers && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-2">Maneuvers</h4>
                        <div className="space-y-2">
                            {battleMasterManeuvers.map(maneuver => (
                                <div key={maneuver.id} className="bg-gray-900/30 p-2 rounded-md">
                                    <p className="font-semibold text-sm">{maneuver.name}</p>
                                    <p className="text-xs text-gray-400">{maneuver.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                 {isCleric && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                         <button
                            onClick={handleDivineIntervention}
                            disabled={divineInterventionUses <= 0}
                            className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-md text-sm font-semibold disabled:bg-gray-500"
                        >
                            Divine Intervention (Need {character.level} or lower)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeaturesPanel;