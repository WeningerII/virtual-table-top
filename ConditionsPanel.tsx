import React, { useState, useEffect } from 'react';
import { ActionItem, ActionCategory } from '../../types';
import { dataService } from '../../services/dataService';

const ConditionsPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [conditionsCategory, setConditionsCategory] = useState<ActionCategory | null>(null);

    useEffect(() => {
        dataService.getActionsAndConditions().then(data => {
            setConditionsCategory(data.conditionsCategory);
        });
    }, []);

    if (!conditionsCategory) {
        return null; // or a loading indicator
    }

    return (
         <div className="bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 text-left flex justify-between items-center bg-gray-900/50 hover:bg-gray-700/50 transition-colors"
                aria-expanded={isOpen}
                aria-controls={`category-${conditionsCategory.title.replace(/\s+/g, '-')}`}
            >
                <h3 className="font-bold font-teko text-2xl tracking-wider text-white">{conditionsCategory.title.toUpperCase()}</h3>
                 <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform text-gray-400 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div id={`category-${conditionsCategory.title.replace(/\s+/g, '-')}`} className="p-4 max-h-96 overflow-y-auto">
                    {conditionsCategory.description && <p className="text-sm text-gray-300 mb-4 italic">{conditionsCategory.description}</p>}
                    <div className="space-y-2">
                        {conditionsCategory.items.map((item: ActionItem) => (
                           <div key={item.name}>
                                <p className="font-semibold text-gray-200">{item.name}</p>
                                {item.description && <p className="text-xs text-gray-400 pl-2 border-l-2 border-gray-600">{item.description}</p>}
                           </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConditionsPanel;
