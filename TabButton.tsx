import React from 'react';

interface TabButtonProps {
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title: string;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children, title }) => (
    <button
        onClick={onClick}
        title={title}
        className={`flex-1 flex flex-col items-center justify-center p-2 rounded-t-lg transition-colors duration-200 border-b-2 ${
            isActive
                ? 'bg-gray-800 border-blue-500 text-white'
                : 'bg-gray-900/50 border-transparent text-gray-400 hover:bg-gray-700/50 hover:text-white'
        }`}
    >
        {children}
    </button>
);

export default TabButton;
