import React, { useState } from 'react';

interface SidebarSectionProps {
    title: string;
    children: React.ReactNode;
    startsOpen?: boolean;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children, startsOpen = false }) => {
    const [isOpen, setIsOpen] = useState(startsOpen);

    return (
        <div className="bg-gray-900/50 rounded-lg border border-gray-700/50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-3 text-left flex justify-between items-center bg-gray-900/70 hover:bg-gray-700/50 transition-colors"
                aria-expanded={isOpen}
            >
                <h3 className="font-bold font-teko text-xl tracking-wider text-gray-200">{title.toUpperCase()}</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform text-gray-400 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-2 md:p-3">
                    {children}
                </div>
            )}
        </div>
    );
};

export default SidebarSection;