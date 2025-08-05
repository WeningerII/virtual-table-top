import React from 'react';
import { soundManager } from '../../../services/soundManager';

interface ActionIconButtonProps {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    isActive?: boolean;
    tooltip: string;
    costText?: string;
}

const ActionIconButton: React.FC<ActionIconButtonProps> = ({ label, icon, onClick, disabled = false, isActive = false, tooltip, costText }) => {
    const baseClasses = "relative group flex flex-col items-center justify-center w-20 h-20 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-4";
    const activeClasses = isActive ? "bg-yellow-500 border-yellow-300 text-black shadow-lg scale-105" : "bg-gray-700 border-gray-600 text-gray-300 hover:border-blue-400 hover:text-white";
    const disabledClasses = "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed opacity-60";

    const handleClick = () => {
        if (!disabled) {
            soundManager.playSound('ui-click');
            onClick();
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={`${baseClasses} ${disabled ? disabledClasses : activeClasses}`}
            aria-label={label}
        >
            <div className="w-8 h-8 mb-1">{icon}</div>
            <span className="text-xs font-bold uppercase tracking-wider">{label}</span>

            {costText && (
                <span className="absolute -top-2 -right-2 bg-gray-900 text-cyan-300 text-xs font-mono px-1.5 py-0.5 rounded-full border border-gray-600">
                    {costText}
                </span>
            )}

            <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {tooltip}
            </div>
        </button>
    );
};

export default ActionIconButton;