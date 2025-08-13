
import React, { useState, useMemo, useEffect } from 'react';
import { PendingChoice, Tool, Character, Language } from './types';
import { SKILLS } from '../../constants';
import { dataService } from './services/data.service';
import { useToast } from './state/ToastContext';
import { useAppSelector, useAppDispatch } from '.././state/hooks';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';
import { proficienciesActions } from './engine/slices/proficienciesSlice';

interface InlineProficiencySelectorProps {
    choice: Extract<PendingChoice, { type: 'proficiency' }>;
}

const InlineProficiencySelector: React.FC<InlineProficiencySelectorProps> = ({ choice }) => {
    const [selected, setSelected] = useState<string[]>([]);
    const [tools, setTools] = useState<Tool[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (choice.proficiencyType === 'tool') {
            setIsLoading(true);
            dataService.getAllTools().then(data => {
                setTools(data);
                setIsLoading(false);
            });
        } else if (choice.proficiencyType === 'language') {
            setIsLoading(true);
            dataService.getAllLanguages().then(data => {
                setLanguages(data);
                setIsLoading(false);
            });
        }
    }, [choice.proficiencyType]);
    
    if (!character) {
        return null;
    }

    const options = useMemo(() => {
        if (choice.proficiencyType === 'skill') {
            return SKILLS
                .filter(s => choice.options === 'any' || choice.options.includes(s.id))
                .map(s => ({ id: s.id, name: s.name }));
        }
        if (choice.proficiencyType === 'tool') {
            return tools
                .filter(t => choice.options === 'any' || choice.options.includes(t.id))
                .map(t => ({ id: t.id, name: t.name }));
        }
        if (choice.proficiencyType === 'language') {
            return languages
                .filter(l => choice.options === 'any' || choice.options.includes(l.id))
                .map(l => ({ id: l.id, name: l.name }));
        }
        return [];
    }, [choice, tools, languages]);

    const handleSelect = (optionId: string) => {
        setSelected(prev => {
            if (prev.includes(optionId)) {
                return prev.filter(id => id !== optionId);
            }
            if (prev.length < choice.count) {
                return [...prev, optionId];
            }
            if (choice.count === 1) {
                return [optionId];
            }
            return prev;
        });
    };

    const handleConfirm = () => {
        dispatch(proficienciesActions.setProficiencyChoices({
                source: choice.source,
                id: choice.id,
                choices: selected,
                proficiencyType: choice.proficiencyType,
            })
        );
        addToast(`Proficiencies chosen for ${choice.source}!`);
    };

    return (
        <div className="my-4 p-4 bg-blue-900/30 border border-blue-600 rounded-lg animate-fade-in-up">
            <h4 className="font-bold text-lg text-blue-300">Pending Choice: {choice.source}</h4>
            <p className="text-sm text-gray-300 mb-3">Choose {choice.count} {choice.proficiencyType}(s) from the list below:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 bg-gray-900/50 p-2 rounded-md">
                {isLoading ? <p className="text-center italic text-gray-400">Loading options...</p> : 
                    options.map(opt => (
                        <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-md transition-colors cursor-pointer ${selected.includes(opt.id) ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            <input
                                type="checkbox"
                                checked={selected.includes(opt.id)}
                                onChange={() => handleSelect(opt.id)}
                                className="form-checkbox h-5 w-5 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <span>{opt.name}</span>
                        </label>
                    ))
                }
            </div>
            <div className="text-right mt-3">
                <button
                    onClick={handleConfirm}
                    disabled={selected.length !== choice.count}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Confirm Selection ({selected.length}/{choice.count})
                </button>
            </div>
        </div>
    );
};

export default InlineProficiencySelector;
