import React, { useState } from 'react';
import { useAppSelector } from '../../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../../state/selectors';
import { usePlayerActions } from '../../../hooks/usePlayerActions';
import Vitals from '../Vitals';
import ResourcePanel from '../ResourcePanel';
import FeaturesPanel from '../FeaturesPanel';
import ActiveEffectsPanel from '../ActiveEffectsPanel';
import CompanionsPanel from '../tabs/CompanionsTab';
import SidebarSection from './SidebarSection';
import InitiativeTracker from '../InitiativeTracker';
import DmPanel from '../DmPanel';
import ObjectInteractionPanel from '../ObjectInteractionPanel';
import NpcSheetPanel from '../NpcSheetPanel';
import { useVttInteractions } from '../../../hooks/useVttInteractions';
import { useVttController } from '../../../hooks/useVttController';
import { entitySlice } from '../../../state/entitySlice';
import { useAppDispatch } from '../../../state/hooks';

interface SidebarContainerProps {
    selectedObjectId: string | null;
    handleAttackObject: (objectId: string) => void;
}

const SidebarContainer: React.FC<SidebarContainerProps> = ({ selectedObjectId, handleAttackObject }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const isDmMode = useAppSelector(state => state.app.isDmMode);
    const monsterToPlaceId = useAppSelector(state => state.app.monsterToSummon);
    const { handleShortRest, handleLongRest } = usePlayerActions();
    const { selectedNpcInstanceId } = useVttInteractions();
    const entityState = useAppSelector(state => state.entity);
    const dispatch = useAppDispatch();

    const selectedObject = entityState.activeMap?.objects.find(o => o.id === selectedObjectId);
    const selectedNpc = entityState.mapNpcInstances.find(npc => npc.instanceId === selectedNpcInstanceId);

    if (isDmMode) {
        return (
            <div className="h-full overflow-y-auto p-2 space-y-2">
                 <DmPanel onSelectMonsterToPlace={() => {}} monsterToPlaceId={monsterToPlaceId} />
                 {selectedObject && <ObjectInteractionPanel object={selectedObject} onAttackObject={handleAttackObject} />}
                 {selectedNpc && <NpcSheetPanel 
                    instance={selectedNpc} 
                    onRemove={(id) => dispatch(entitySlice.actions.removeNpcFromMap({instanceId: id}))}
                 />}
            </div>
        );
    }
    
    if (!character) return <div className="p-4 text-center">Loading Character...</div>;

    return (
        <div className="h-full overflow-y-auto p-2 space-y-2">
            <InitiativeTracker />

            {selectedObject ? (
                <ObjectInteractionPanel object={selectedObject} onAttackObject={handleAttackObject} />
            ) : selectedNpc ? (
                <NpcSheetPanel 
                    instance={selectedNpc} 
                    onRemove={(id) => dispatch(entitySlice.actions.removeNpcFromMap({instanceId: id}))}
                 />
            ) : (
                <>
                    <Vitals onShortRest={handleShortRest} onLongRest={handleLongRest} />
                    <ResourcePanel />
                    {character.allFeatures && character.allFeatures.length > 0 && (
                        <FeaturesPanel character={character} />
                    )}
                    <CompanionsPanel />
                    <ActiveEffectsPanel />
                </>
            )}
        </div>
    );
};

export default SidebarContainer;