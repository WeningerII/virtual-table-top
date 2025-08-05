import React, { useRef, useEffect, useState } from 'react';
import { VTTMap, Token, MapNpcInstance } from '../../types';
import { useVttInteractions } from '../../hooks/useVttInteractions';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { attackAfterAiMove } from '../../state/aiSlice';
import { usePrevious } from '../../hooks/usePrevious';
import { animationActions } from '../../state/animationSlice';

type DamageNumber = {
    id: string;
    amount: number;
    isCrit: boolean;
    x: number;
    y: number;
};

interface MapViewProps {
    mapState: VTTMap;
    mapImageUrl: string | null;
    isDmMode: boolean;
    interactions: ReturnType<typeof useVttInteractions>;
}

const MapView: React.FC<MapViewProps> = ({ mapState, mapImageUrl, isDmMode, interactions }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const { lastDamageInfo, animationState } = useAppSelector(state => state.animations);
    const { pendingAiAction } = useAppSelector(state => state.ai);
    const dispatch = useAppDispatch();
    const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);

    const { viewport, selectedNpcInstanceId, targetTokenId, draggedTokenId } = interactions;
    const prevAnimationState = usePrevious(animationState);

    useEffect(() => {
        interactions.setMapRef(mapRef);
    }, [interactions]);
    
    useEffect(() => {
        // If the previous animation state existed and the current one is null, the animation finished.
        if (prevAnimationState && !animationState && pendingAiAction) {
            dispatch(attackAfterAiMove());
        }
    }, [animationState, prevAnimationState, pendingAiAction, dispatch]);

    useEffect(() => {
        if (lastDamageInfo) {
            const targetToken = mapState.tokens.find(t => t.id === lastDamageInfo.targetId);
            if (targetToken) {
                const newDamageNumber: DamageNumber = {
                    id: crypto.randomUUID(),
                    amount: lastDamageInfo.amount,
                    isCrit: lastDamageInfo.isCrit,
                    x: (targetToken.x + 0.5) / mapState.grid.width * 100,
                    y: (targetToken.y + 0.5) / mapState.grid.height * 100,
                };
                setDamageNumbers(prev => [...prev, newDamageNumber]);
                setTimeout(() => {
                    setDamageNumbers(prev => prev.filter(dn => dn.id !== newDamageNumber.id));
                }, 1500);
            }
            dispatch(animationActions.setLastDamageInfo(null));
        }
    }, [lastDamageInfo, dispatch, mapState]);

    const activeTokenId = mapState.activeInitiativeIndex !== null ? mapState.initiativeOrder[mapState.activeInitiativeIndex]?.id : null;
    const aiTargetToken = pendingAiAction ? mapState.tokens.find(t => t.id === pendingAiAction.targetId) : null;

    return (
        <div 
            ref={mapRef} 
            className="relative bg-gray-900 overflow-hidden touch-none" 
            style={{ 
                width: 'min(95vh, 95vw)', 
                height: 'min(95vh, 95vw)',
                cursor: interactions.isPanning ? 'grabbing' : draggedTokenId ? 'grabbing' : 'grab'
            }}
            onMouseDown={interactions.handleMouseDown}
            onMouseMove={interactions.handleMouseMove}
            onMouseUp={interactions.handleMouseUp}
            onMouseLeave={interactions.handleMouseUp} // End drag if mouse leaves
            onContextMenu={(e) => e.preventDefault()}
        >
            <div 
                className="absolute top-0 left-0"
                style={{
                    width: mapRef.current?.getBoundingClientRect().width || '100%',
                    height: mapRef.current?.getBoundingClientRect().height || '100%',
                    transform: `translate(${viewport.panOffset.x}px, ${viewport.panOffset.y}px) scale(${viewport.zoom})`,
                    transformOrigin: 'top left',
                }}
            >
                {mapImageUrl && <img src={mapImageUrl} alt="Battle Map" className="absolute top-0 left-0 w-full h-full object-cover" draggable="false" />}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{
                    backgroundSize: `${100 / mapState.grid.width}% ${100 / mapState.grid.height}%`,
                    backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                                      linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`
                }}></div>

                {/* Tokens */}
                {mapState.tokens.map(token => {
                    const sizePercent = (1 / mapState.grid.width) * 100 * token.size;
                    const isSelected = selectedNpcInstanceId === token.npcInstanceId;
                    const isTargeted = targetTokenId === token.id;
                    const isActive = activeTokenId === token.id;

                    let ringClasses = 'ring-2 ring-black/50';
                    if (isActive) ringClasses = 'ring-4 ring-yellow-400 z-20';
                    else if (isTargeted) ringClasses = 'ring-4 ring-red-500 z-10';
                    else if (isSelected) ringClasses = 'ring-4 ring-blue-500 z-10';

                    return (
                        <div
                            key={token.id}
                            data-token-id={token.id}
                            className={`token absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-bold text-white transition-all duration-200 shadow-xl ${ringClasses} ${draggedTokenId === token.id ? 'cursor-grabbing' : 'cursor-pointer'}`}
                            style={{
                                left: `${(token.x + 0.5) / mapState.grid.width * 100}%`,
                                top: `${(token.y + 0.5) / mapState.grid.height * 100}%`,
                                width: `${sizePercent}%`,
                                height: `${sizePercent}%`,
                                backgroundColor: token.color,
                                fontSize: `${sizePercent * 0.3}px`
                            }}
                        >
                             {token.imageUrl ? (
                                <img src={token.imageUrl} alt={token.name} className="w-full h-full object-cover rounded-full" draggable="false" />
                            ) : (
                                <span className="select-none">{token.name.charAt(0)}</span>
                            )}
                        </div>
                    );
                })}
                 {/* AI Targeting Reticle */}
                {aiTargetToken && (
                    <div
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                        style={{
                            left: `${(aiTargetToken.x + 0.5) / mapState.grid.width * 100}%`,
                            top: `${(aiTargetToken.y + 0.5) / mapState.grid.height * 100}%`,
                            width: `${(1 / mapState.grid.width) * 100 * aiTargetToken.size * 1.5}%`,
                            height: `${(1 / mapState.grid.height) * 100 * aiTargetToken.size * 1.5}%`,
                        }}
                    >
                        <svg viewBox="0 0 100 100" className="animate-pulse">
                            <path d="M 50,10 L 50,30 M 50,70 L 50,90 M 10,50 L 30,50 M 70,50 L 90,50" stroke="#FF0000" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                    </div>
                )}
                {/* Damage Numbers */}
                {damageNumbers.map(dn => (
                    <div
                        key={dn.id}
                        className={`damage-popup ${dn.isCrit ? 'damage-popup-crit' : 'damage-popup-normal'}`}
                        style={{ left: `${dn.x}%`, top: `${dn.y}%` }}
                    >
                        {dn.amount}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MapView;