import React, { useState, useRef, useEffect } from 'react';
import { Conversation, DialogueTurn } from './types';

interface DialogueModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: Conversation | null;
    onSendMessage: (message: string) => void;
    isNpcTyping: boolean;
}

const DialogueModal: React.FC<DialogueModalProps> = ({ isOpen, onClose, conversation, onSendMessage, isNpcTyping }) => {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation?.history, isNpcTyping]);
    
    if (!isOpen || !conversation) return null;

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message.trim());
            setMessage('');
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isNpcTyping) {
            handleSend();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-modal-bg-fade-in" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col animate-modal-content-scale-in" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold font-teko tracking-wide">Conversation with {conversation.npcName}</h2>
                </div>
                <div className="p-4 flex-grow overflow-y-auto space-y-4">
                    {conversation.history.map((turn, index) => (
                        <div key={index} className={`flex items-start gap-3 ${turn.speaker === 'player' ? 'justify-end' : ''}`}>
                            {turn.speaker === 'npc' && (
                                <div className="w-8 h-8 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                                    {conversation.npcName.charAt(0)}
                                </div>
                            )}
                             <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${turn.speaker === 'player' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                <p className="text-sm">{turn.text}</p>
                            </div>
                        </div>
                    ))}
                    {isNpcTyping && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                                {conversation.npcName.charAt(0)}
                            </div>
                            <div className="p-3 rounded-lg bg-gray-700 text-gray-400 italic text-sm">
                                {conversation.npcName} is thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-gray-700 flex gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Say something..."
                        className="flex-grow bg-gray-900 border border-gray-600 rounded-md p-2"
                        disabled={isNpcTyping}
                        aria-label="Your message"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isNpcTyping || !message.trim()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold disabled:bg-gray-500"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DialogueModal;