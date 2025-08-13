
import React, { useState, useMemo, useEffect } from 'react';
import { FightingStyle, PendingChoice, Character } from './types';
import { dataService } from 'services./data.service';
import { useToast } from 'state/ToastContext';
import { useAppSelector, useAppDispatch } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';
import { proficienciesActions } from './proficienciesSlice';

interface InlineFightingStyleSelectorProps {
    choice: Extract<PendingChoice, { type: 'fighting_style' }>;
}

const InlineFightingStyleSelector: React.FC<InlineFightingStyleSelectorProps> = ({ choice }) => {
    const [selected, setSelected] = useState<string>('');
    const [fightingStyles, setFightingStyles] = useState<FightingStyle[]>([]);
    const { addToast } = useToast();
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();

    useEffect(() => {
        dataService.getAllFightingStyles().then(setFightingStyles);
    }, []);

    if (!character) {
        return null;
    }

    const options = useMemo(() => {
        return choice.options.map(id => fightingStyles.find(style => style.id === id)).filter((style): style is FightingStyle => !!style);
    }, [choice, fightingStyles]);

    const handleConfirm = () => {
        if (!selected) return;

        dispatch(proficienciesActions.setFightingStyleChoice({
                source: choice.id,
                id: selected,
            })
        );
        const styleName = fightingStyles.find(s => s.id === selected)?.name || 'Style';
        addToast(`${styleName} fighting style chosen!`);
    };

    return (
        <div className="my-4 p-4 bg-blue-900/30 border border-blue-600 rounded-lg animate-fade-in-up">
            <h4 className="font-bold text-lg text-blue-300">Pending Choice: Fighting Style</h4>
            <p className="text-sm text-gray-300 mb-3">Source: {choice.source}</p>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2 bg-gray-900/50 p-2 rounded-md">
                {options.map(opt => (
                    <div key={opt.id} className={`p-3 rounded-md transition-colors border-2 ${selected === opt.id ? 'bg-blue-900/50 border-blue-500' : 'bg-gray-700/50 border-gray-700'}`}>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="radio"
                                name="fighting-style"
                                checked={selected === opt.id}
                                onChange={() => setSelected(opt.id)}
                                className="form-radio h-5 w-5 text-blue-500 bg-gray-800 border-gray-600 focus:ring-blue-500"
                            />
                            <div>
                                <p className="font-semibold">{opt.name}</p>
                                <p className="text-xs text-gray-300">{opt.description}</p>
                            </div>
                        </label>
                    </div>
                ))}
            </div>
            <div className="text-right mt-3">
                <button
                    onClick={handleConfirm}
                    disabled={!selected}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Confirm Selection
                </button>
            </div>
        </div>
    );
};

export default InlineFightingStyleSelector;
