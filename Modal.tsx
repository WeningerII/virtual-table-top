import React, { useEffect } from 'react';
import { soundManager } from 'services../soundManager';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
    maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, maxWidth = 'max-w-3xl' }) => {
    useEffect(() => {
        if (isOpen) {
            soundManager.playSound('modal-open', 'ui');
            const handleEsc = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    onClose();
                }
            };
            window.addEventListener('keydown', handleEsc);
            return () => {
                window.removeEventListener('keydown', handleEsc);
                // We don't play close sound here because onClose might be triggered by other means
            };
        }
    }, [isOpen, onClose]);

    const handleClose = () => {
        soundManager.playSound('modal-close', 'ui');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-modal-bg-fade-in" onClick={handleClose}>
            <div className={`bg-gray-800 rounded-lg shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col animate-modal-content-scale-in border border-gray-700`} onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold font-teko tracking-wide">{title}</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>
                <div className="p-4 flex-grow overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;