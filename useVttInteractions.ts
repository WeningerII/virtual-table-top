import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../state/hooks';
import { Token, Viewport, Character, VTTTool, SpellTargetingState, MapNpcInstance } from '../types';
import { clearMonsterSummon } from '../state/appSlice';
import { entitySlice, addMonsterToMap } from '../state/entitySlice';
import { selectCalculatedActiveCharacterSheet } from '../state/selectors';
import { usePlayerActions } from './usePlayerActions';
import { dataService } from '../services/dataService';
import { useDialogueManager } from './useDialogueManager';

export const useVttInteractions = () => {
    const dispatch = useAppDispatch();
    const { handleMove, handleAttackObject } = usePlayerActions();

    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const { activeMap: mapState } = useAppSelector(s => s.entity);
    const isDmMode = useAppSelector(gState => gState.app.isDmMode);
    const monsterToPlaceId = useAppSelector(gState => gState.app.monsterToSummon);
    
    const [viewport, setViewport] = useState<Viewport>({ panOffset: { x: 0, y: 0 }, zoom: 1 });
    const [selectedNpcInstanceId, setSelectedNpcInstanceId] = useState<string | null>(null);
    const [targetTokenId, setTargetTokenId] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<VTTTool>('select');
    const [spellTargetingState, setSpellTargetingState] = useState<SpellTargetingState | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tokenId: string, tokenType: 'player' | 'npc' | 'object', npcInstanceId?: string} | null>(null);
    
    const { handleStartConversation } = useDialogueManager();
    
    const mapRef = useRef<HTMLDivElement | null>(null);
    const isPanning = useRef(false);
    const [draggedTokenId, setDraggedTokenId] = useState<string | null>(null);
    const dragStartCoords = useRef({ x: 0, y: 0 });
    const dragStartTokenPos = useRef({ x: 0, y: 0 });

    const setMapRef = useCallback((ref: React.RefObject<HTMLDivElement>) => {
        mapRef.current = ref.current;
    }, []);

    const getGridCoordsFromMouseEvent = (e: React.MouseEvent): { gridX: number, gridY: number } | null => {
        if (!mapRef.current || !mapState) return null;
        const rect = mapRef.current.getBoundingClientRect();
        
        // Adjust for viewport pan and zoom
        const viewX = (e.clientX - rect.left);
        const viewY = (e.clientY - rect.top);

        const mapX = (viewX / viewport.zoom) - (viewport.panOffset.x);
        const mapY = (viewY / viewport.zoom) - (viewport.panOffset.y);
        
        const gridX = Math.floor(mapX / (rect.width / mapState.grid.width));
        const gridY = Math.floor(mapY / (rect.height / mapState.grid.height));

        return { gridX, gridY };
    };

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!mapRef.current) return;
        
        // Middle mouse or Ctrl+Click for panning
        if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey || activeTool === 'pan'))) {
            isPanning.current = true;
            dragStartCoords.current = { x: e.clientX, y: e.clientY };
            e.preventDefault();
            return;
        }

        const target = e.target as HTMLElement;
        const tokenElement = target.closest('.token');
        
        if (e.button === 0 && activeTool === 'select' && tokenElement) { // Left Click Drag
            const tokenId = tokenElement.getAttribute('data-token-id');
            if (tokenId) {
                const tokenData = mapState?.tokens.find(t => t.id === tokenId);
                if (tokenData && (isDmMode || tokenData.characterId === character?.id)) {
                    setDraggedTokenId(tokenId);
                    dragStartCoords.current = { x: e.clientX, y: e.clientY };
                    dragStartTokenPos.current = { x: tokenData.x, y: tokenData.y };
                }
            }
        }
    }, [mapState, activeTool, character?.id, isDmMode]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isPanning.current) {
            const dx = e.clientX - dragStartCoords.current.x;
            const dy = e.clientY - dragStartCoords.current.y;
            setViewport(v => ({ ...v, panOffset: { x: v.panOffset.x + dx, y: v.panOffset.y + dy } }));
            dragStartCoords.current = { x: e.clientX, y: e.clientY };
        } else if (draggedTokenId && mapRef.current && mapState) {
             const coords = getGridCoordsFromMouseEvent(e);
             if (coords) {
                const { gridX, gridY } = coords;
                 if (gridX !== dragStartTokenPos.current.x || gridY !== dragStartTokenPos.current.y) {
                    dispatch(entitySlice.actions.updateTokenPosition({ tokenId: draggedTokenId, x: gridX, y: gridY }));
                }
            }
        }
    }, [draggedTokenId, mapState, dispatch, getGridCoordsFromMouseEvent]);

    const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        isPanning.current = false;
        
        if (draggedTokenId) {
            const token = mapState?.tokens.find(t => t.id === draggedTokenId);
            if (token && (token.x !== dragStartTokenPos.current.x || token.y !== dragStartTokenPos.current.y)) {
                handleMove([{ x: token.x, y: token.y }]);
            }
            setDraggedTokenId(null);
        } else if (e.button === 0) { // Left Click Action
             const coords = getGridCoordsFromMouseEvent(e);
             if (coords && monsterToPlaceId) {
                dataService.getMonsterById(monsterToPlaceId).then(monsterData => {
                    if (monsterData) dispatch(addMonsterToMap({ monster: monsterData, position: {x: coords.gridX, y: coords.gridY} }));
                });
                dispatch(clearMonsterSummon());
             } else {
                 const tokenElement = (e.target as HTMLElement).closest('.token');
                 const tokenId = tokenElement?.getAttribute('data-token-id');
                 const token = mapState?.tokens.find(t => t.id === tokenId);
                 setSelectedNpcInstanceId(token?.npcInstanceId || null);
             }
        } else if (e.button === 2) { // Right Click Action
            const tokenElement = (e.target as HTMLElement).closest('.token');
            const tokenId = tokenElement?.getAttribute('data-token-id');
            if (tokenId) {
                const tokenData = mapState?.tokens.find(t => t.id === tokenId);
                if (tokenData) {
                     if (isDmMode) {
                        setContextMenu({ x: e.clientX, y: e.clientY, tokenId, tokenType: tokenData.npcInstanceId ? 'npc' : 'player', npcInstanceId: tokenData.npcInstanceId });
                     } else if (tokenData.npcInstanceId) {
                         setTargetTokenId(tokenId);
                     } else if (tokenData.characterId !== character?.id) {
                        // Logic for targeting other players can go here.
                     }
                }
            } else {
                setTargetTokenId(null);
                 setContextMenu(null);
            }
        }
    }, [draggedTokenId, mapState, handleMove, getGridCoordsFromMouseEvent, monsterToPlaceId, dispatch, isDmMode, character]);

    const onToggleVisibility = useCallback((npcInstanceId: string) => {
        dispatch(entitySlice.actions.toggleNpcVisibility(npcInstanceId));
    }, [dispatch]);
    
    const onRemoveNpc = useCallback((npcInstanceId: string) => {
        if(window.confirm("Are you sure you want to remove this creature?")) {
            dispatch(entitySlice.actions.removeNpcFromMap({instanceId: npcInstanceId}));
        }
    }, [dispatch]);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (mapRef.current?.contains(e.target as Node)) {
                e.preventDefault();
                const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
                setViewport(v => ({ ...v, zoom: Math.max(0.2, Math.min(5, v.zoom * zoomFactor)) }));
            }
        };
        const currentMapRef = mapRef.current;
        currentMapRef?.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            currentMapRef?.removeEventListener('wheel', handleWheel);
        };
    }, []);

    return {
        viewport,
        setViewport,
        selectedNpcInstanceId,
        setSelectedNpcInstanceId,
        targetTokenId,
        setTargetTokenId,
        isPanning: isPanning.current,
        draggedTokenId,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        setMapRef,
        character,
        handleStartConversation,
        handleAttackObject,
        activeTool, 
        setActiveTool,
        spellTargetingState,
        setSpellTargetingState,
        contextMenu,
        setContextMenu,
        onToggleVisibility,
        onRemoveNpc,
    };
};