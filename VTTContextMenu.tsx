import React from 'react';
import { useAppSelector } from 'state/hooks';
import { useVttInteractions } from '../../hooks/useVttInteractions';

interface VTTContextMenuProps {
    context: NonNullable<ReturnType<typeof useVttInteractions>['contextMenu']>;
    vttInteractions: ReturnType<typeof useVttInteractions>;
}

const ContextMenuButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string }> = ({ onClick, children, className = '' }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${className || 'text-gray-200 hover:bg-gray-700'}`}
    >
        {children}
    </button>
);

const VTTContextMenu: React.FC<VTTContextMenuProps> = ({ context, vttInteractions }) => {
    const isDmMode = useAppSelector(state => state.app.isDmMode);
    const { x, y, tokenType, npcInstanceId, tokenId } = context;
    const { setContextMenu, setSelectedNpcInstanceId, onToggleVisibility, onRemoveNpc, setViewport } = vttInteractions;

    const handleViewSheet = () => {
        if (npcInstanceId) {
            setSelectedNpcInstanceId(npcInstanceId);
        }
        setContextMenu(null);
    };
    
    const handleRemove = () => {
        if(npcInstanceId) onRemoveNpc(npcInstanceId);
        setContextMenu(null);
    }
    
    const handleToggleVis = () => {
        if(npcInstanceId) onToggleVisibility(npcInstanceId);
        setContextMenu(null);
    }

    return (
        <div
            className="absolute z-40 bg-gray-900 border border-purple-500 rounded-lg shadow-2xl p-2 flex flex-col space-y-1 animate-fade-in-up"
            style={{ left: `${x + 15}px`, top: `${y + 15}px` }}
        >
            {isDmMode && tokenType === 'npc' && npcInstanceId && (
                <>
                    <ContextMenuButton onClick={handleViewSheet}>View NPC Sheet</ContextMenuButton>
                    <ContextMenuButton onClick={handleToggleVis}>Toggle Visibility</ContextMenuButton>
                    <ContextMenuButton onClick={handleRemove} className="text-red-400 hover:bg-red-800/50 hover:text-red-300">Remove from Map</ContextMenuButton>
                </>
            )}

            {tokenType === 'player' && (
                 <ContextMenuButton onClick={() => { /* Logic to open player sheet if needed */ }}>View Player Sheet</ContextMenuButton>
            )}

            {/* A separator can be added if there are more sections */}
            {/* <div className="border-t border-gray-700 my-1"></div> */}

            <ContextMenuButton onClick={() => setContextMenu(null)}>Close Menu</ContextMenuButton>
        </div>
    );
};

export default VTTContextMenu;