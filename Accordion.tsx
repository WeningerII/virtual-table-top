
import React, { useState } from 'react';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    startsOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, startsOpen = false }) => {
    const [isOpen, setIsOpen] = useState(startsOpen);

    return (
        <div className="bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 text-left flex justify-between items-center bg-gray-900/50 hover:bg-gray-700/50 transition-colors"
                aria-expanded={isOpen}
                aria-controls={`accordion-content-${title.replace(/\s+/g, '-')}`}
            >
                <h3 className="font-bold font-teko text-2xl tracking-wider text-white">{title.toUpperCase()}</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform text-gray-400 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div id={`accordion-content-${title.replace(/\s+/g, '-')}`} className="p-4">
                    {children}
                </div>
            )}
        </div>
    );
};

export default Accordion;
