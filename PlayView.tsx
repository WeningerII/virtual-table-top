import React from 'react';
import VTTCanvas from './VTTCanvas';
import SidebarContainer from './sidebar/SidebarContainer';
import TacticalHUD from './hud/TacticalHUD';
import SceneDisplay from './SceneDisplay';
import ModalContainer from './ModalContainer';
import RollResultToast from '../shared/RollResultToast';
import ActionResultToast from './ActionResultToast';
import { useVttController } from '../../hooks/useVttController';
import { useVttInteractions } from '../../hooks/useVttInteractions';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { setLastRollResult, setActionResult } from '../../state/uiSlice';
import { selectCombatUIData } from '../../engine/combatSelectors';
import VTTContextMenu from './VTTContextMenu';

export const PlayView: React.FC = () => {
    const dispatch = useAppDispatch();
    const { character, isDmMode, staticDataCache } = useVttController();
    const { mapState, mapNpcInstances, currentSceneImageUrl, mapImageUrl } = useAppSelector(selectCombatUIData);
    const lastRollResult = useAppSelector(state => state.ui.lastRollResult);
    const actionResult = useAppSelector(state => state.ui.actionResult);
    
    const vttInteractions = useVttInteractions();

    if (!character || !mapState || !vttInteractions.character || !staticDataCache) {
        return <div className="text-center p-8">Loading... Please ensure a character is loaded and an encounter is active.</div>;
    }
    
    return (
        <div className="relative h-full overflow-hidden bg-gray-900">
            <div className="flex h-full w-full">
                {/* Main VTT Canvas */}
                <div className="flex-grow relative flex items-center justify-center bg-gray-800">
                    <VTTCanvas
                        mapState={mapState}
                        mapImageUrl={mapImageUrl}
                        isDmMode={isDmMode}
                        interactions={vttInteractions}
                    />
                </div>

                {/* Right Sidebar */}
                <div className="w-96 flex-shrink-0 bg-gray-800/50 border-l-2 border-gray-700/50 flex flex-col">
                    <SidebarContainer 
                        selectedObjectId={null} 
                        handleAttackObject={vttInteractions.handleAttackObject} 
                    />
                </div>
            </div>
            
            {/* Tactical HUD at the bottom */}
            <TacticalHUD targetTokenId={vttInteractions.targetTokenId} />

            {/* Context Menu */}
            {vttInteractions.contextMenu && <VTTContextMenu context={vttInteractions.contextMenu} vttInteractions={vttInteractions} />}

            {/* Modals and Toasts */}
            {currentSceneImageUrl && <SceneDisplay imageUrl={currentSceneImageUrl} />}
            <ModalContainer mapNpcInstances={mapNpcInstances} targetTokenId={vttInteractions.targetTokenId} />
            {lastRollResult && <RollResultToast result={lastRollResult} onClose={() => dispatch(setLastRollResult(null))} />}
            {actionResult && <ActionResultToast result={actionResult} onClose={() => dispatch(setActionResult(null))} />}
        </div>
    );
};