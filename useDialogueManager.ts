import React, { useState, useRef, useCallback } from 'react';
import { Chat } from "@google/genai";
import { Token, Conversation, DialogueTurn } from '../types';
import { useAppSelector, useAppDispatch } from '../state/hooks';
import { useToast } from '../state/ToastContext';
import { startConversation, continueConversation, summarizeConversation } from '../services/ai/dm.service';
import { dataService } from '../services/dataService';
import { GeminiError } from '../services/geminiService';
import { selectCalculatedActiveCharacterSheet } from '../state/selectors';
// Note: Simulation actions will need to be imported from the new slice if dispatching is required.

export const useDialogueManager = () => {
    const entityState = useAppSelector(state => state.entity);
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    
    const { activeMap: mapState, mapNpcInstances } = entityState;

    const [isDialogueOpen, setIsDialogueOpen] = useState(false);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const chatSessionRef = useRef<Chat | null>(null);
    const [isNpcTyping, setIsNpcTyping] = useState(false);

    const handleStartConversation = useCallback(async (token: Token) => {
        if (!token.npcInstanceId || !character || !mapState) return;
        const npcInstance = mapNpcInstances.find(i => i.instanceId === token.npcInstanceId);
        const monsterData = npcInstance ? await dataService.getMonsterById(npcInstance.monsterId) : null;
        if (!npcInstance || !monsterData) { addToast("Could not find creature data.", "error"); return; }
        setIsNpcTyping(true);
        setIsDialogueOpen(true);
        try {
            const result = await startConversation(character.name, monsterData.name, monsterData.description || `a ${monsterData.type}`, mapState.name || 'an unknown area', npcInstance.memory);
            if (result) {
                chatSessionRef.current = result.chat;
                setActiveConversation({ npcInstanceId: npcInstance.instanceId, npcName: monsterData.name, history: [{ speaker: 'npc', text: result.initialResponse }] });
            }
        } catch (error) {
            if (error instanceof GeminiError && error.isQuotaError) {
                addToast("AI dialogue features unavailable due to high usage.", "error");
            } else {
                addToast("An AI error occurred starting the conversation.", "error");
            }
            setIsDialogueOpen(false);
        } finally {
            setIsNpcTyping(false);
        }
    }, [character, mapState, mapNpcInstances, addToast]);
    
    const handleSendMessage = useCallback(async (message: string) => {
        if (!chatSessionRef.current || !activeConversation) return;
        const newHistory: DialogueTurn[] = [...activeConversation.history, { speaker: 'player', text: message }];
        setActiveConversation({ ...activeConversation, history: newHistory });
        setIsNpcTyping(true);
        try {
            const response = await continueConversation(chatSessionRef.current, message);
            if (response) {
                const updatedHistory: DialogueTurn[] = [...newHistory, { speaker: 'npc', text: response }];
                setActiveConversation({ ...activeConversation, history: updatedHistory });
            }
        } catch (error) {
             if (error instanceof GeminiError && error.isQuotaError) {
                addToast("AI dialogue features unavailable due to high usage.", "error");
            } else {
                addToast("An AI error occurred during the conversation.", "error");
            }
        } finally {
            setIsNpcTyping(false);
        }
    }, [activeConversation, addToast]);

    const handleCloseDialogue = useCallback(async () => {
        setIsDialogueOpen(false);
        if (activeConversation && activeConversation.history.length > 1) {
            try {
                const summary = await summarizeConversation(activeConversation.history);
                if (summary) {
                    // This will need to be an action from the new simulationSlice
                    // simDispatch({ type: 'UPDATE_NPC_MEMORY', payload: { instanceId: activeConversation.npcInstanceId, memoryEntry: summary } });
                    addToast(`${activeConversation.npcName} will remember this.`, 'info');
                }
            } catch (error) {
                console.error("Failed to summarize conversation", error);
            }
        }
        setActiveConversation(null);
        chatSessionRef.current = null;
    }, [activeConversation, addToast]);

    return {
        isDialogueOpen,
        activeConversation,
        isNpcTyping,
        handleStartConversation,
        handleSendMessage,
        handleCloseDialogue,
    };
};