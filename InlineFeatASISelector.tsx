
import React, { useState, useMemo, useEffect } from 'react';
import { Character, Feat, Prerequisite, Ability, SelectedFeat, PendingChoice } from '../../types';
import { dataService } from '../../services/dataService';
import { ABILITIES } from '../../constants';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../state/selectors';
import { useToast } from '../../state/ToastContext';
import { proficienciesActions } from '../../engine/slices/proficienciesSlice';

const checkPrerequisites = (character: Character, prerequisites: Prerequisite[]): { met: boolean; reasons: string[] } => {
    if (prerequisites.length === 0) return { met: true, reasons: [] };
    const reasons: string[] = [];
    let met = true;
    
    prerequisites.forEach(prereq => {
        if (prereq.type === 'ability') {
            const score = (character.abilityScores[prereq.ability]?.base || 0) + (character.abilityScores[prereq.ability]?.bonus || 0);
            if (score < prereq.value) {
                met = false;
                reasons.push(`Requires ${prereq.ability.charAt(0) + prereq.ability.slice(1).toLowerCase()} ${prereq.value}`);
            }
        }
        if (prereq.type === 'level') {
            if (character.level < prereq.value) {
                met = false;
                reasons.push(`Requires character level ${prereq.value}`);
            }
        }
        if (prereq.type === 'spellcasting') {
            if (!character.spellcastingInfo) {
                met = false;
                reasons.push(`Requires the ability to cast at least one spell`);
            }
        }
        if (prereq.type === 'proficiency' && prereq.proficiencyType === 'armor') {
            const hasProf = character.proficiencies?.armor.some(p => p.id.includes(prereq.proficiencyId));
             if (!hasProf) {
                met = false;
                reasons.push(`Requires proficiency with ${prereq.proficiencyId} armor`);
            }
        }
    });

    return { met, reasons };
};

const AsiPicker: React.FC<{ onConfirm: (bonuses: { ability: Ability; value: number }[]) => void; onCancel: () => void; }> = ({ onConfirm, onCancel }) => {
    const [mode, setMode] = useState<'plusTwo' | 'plusOne'>('plusTwo');
    const [selection1, setSelection1] = useState<Ability | ''>('');
    const [selection2, setSelection2] = useState<Ability | ''>('');

    const canConfirm = useMemo(() => {
        if (mode === 'plusTwo' && selection1) return true;
        if (mode === 'plusOne' && selection1 && selection2 && selection1 !== selection2) return true;
        return false;
    }, [mode, selection1, selection2]);

    const handleConfirm = () => {
        if (!canConfirm) return;
        let bonuses: { ability: Ability; value: number }[] = [];
        if (mode === 'plusTwo' && selection1) {
            bonuses.push({ ability: selection1, value: 2 });
        } else if (mode === 'plusOne' && selection1 && selection2) {
            bonuses.push({ ability: selection1, value: 1 });
            bonuses.push({ ability: selection2, value: 1 });
        }
        onConfirm(bonuses);
    };
    
    const handleModeChange = (newMode: 'plusTwo' | 'plusOne') => {
        setMode(newMode);
        setSelection1('');
        setSelection2('');
    };

    const abilityOptions1 = ABILITIES.map(a => <option key={a.id} value={a.id}>{a.name}</option>);
    const abilityOptions2 = ABILITIES.filter(a => a.id !== selection1).map(a => <option key={a.id} value={a.id}>{a.name}</option>);

    const selectClass = "w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";

    return (
        <div className="p-4 bg-gray-800/50 rounded-lg mt-4">
            <h3 className="text-xl font-bold mb-2">Improve Ability Scores</h3>
            <div className="flex items-center justify-center gap-4 bg-gray-900/50 p-2 rounded-md mb-4">
                 <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-700">
                    <input type="radio" name="asi-mode" checked={mode === 'plusTwo'} onChange={() => handleModeChange('plusTwo')} className="form-radio text-blue-500 bg-gray-800 border-gray-600 focus:ring-blue-500"/>
                    <span>+2 to one</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-700">
                    <input type="radio" name="asi-mode" checked={mode === 'plusOne'} onChange={() => handleModeChange('plusOne')} className="form-radio text-blue-500 bg-gray-800 border-gray-600 focus:ring-blue-500"/>
                    <span>+1 to two</span>
                </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mode === 'plusTwo' && <select value={selection1} onChange={e => setSelection1(e.target.value as Ability)} className={`${selectClass} sm:col-span-2`}><option value="">-- Choose --</option>{abilityOptions1}</select>}
                {mode === 'plusOne' && <>
                    <select value={selection1} onChange={e => setSelection1(e.target.value as Ability)} className={selectClass}><option value="">-- Choose --</option>{abilityOptions1}</select>
                    <select value={selection2} onChange={e => setSelection2(e.target.value as Ability)} disabled={!selection1} className={`${selectClass} disabled:opacity-50`}><option value="">-- Choose --</option>{abilityOptions2}</select>
                </>}
            </div>
            <div className="mt-6 flex justify-between items-center">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Back</button>
                <button onClick={handleConfirm} disabled={!canConfirm} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed">Confirm</button>
            </div>
        </div>
    );
};

interface InlineFeatASISelectorProps {
    choice: Extract<PendingChoice, { type: 'asi_or_feat' }>;
}

type FeatOption = Feat & { prereqs: { met: boolean; reasons: string[] } };
type AsiOption = {
    id: 'asi';
    name: string;
    description: string;
    prereqs: { met: boolean; reasons:string[] };
    prerequisites: [];
};
type ModalOption = FeatOption | AsiOption;

const InlineFeatASISelector: React.FC<InlineFeatASISelectorProps> = ({ choice }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState<'list' | 'asi'>('list');
    const [allFeats, setAllFeats] = useState<Feat[]>([]);

    useEffect(() => {
        dataService.getAllFeats().then(setAllFeats);
    }, []);

    const options = useMemo((): ModalOption[] => {
        if (!character) return [];
        const feats: FeatOption[] = allFeats
            .filter(feat => feat.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(feat => ({
                ...feat,
                prereqs: checkPrerequisites(character, feat.prerequisites)
            }))
            .sort((a, b) => {
                if (a.prereqs.met && !b.prereqs.met) return -1;
                if (!a.prereqs.met && b.prereqs.met) return 1;
                return a.name.localeCompare(b.name);
            });
        
        const asiOption: AsiOption = { id: 'asi', name: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two ability scores by 1.', prereqs: { met: true, reasons: [] }, prerequisites: [] };
        if (!searchTerm || 'ability score improvement'.includes(searchTerm.toLowerCase())) {
            return [asiOption, ...feats];
        }
        
        return feats;
    }, [searchTerm, character, allFeats]);
    
    const handleSelectFeat = (feat: Feat) => {
        if (!character) return;
        const newFeat: SelectedFeat = { featId: feat.id, source: choice.id, choices: {} };
        const otherFeats = character.feats.filter(f => f.source !== choice.id) || [];
        dispatch(proficienciesActions.updateFeats([...otherFeats, newFeat]));
        addToast(`Feat selected: ${feat.name}`);
    };

    const handleSelectAsi = (bonuses: { ability: Ability; value: number }[]) => {
        if (!character) return;
        const asiSelection: SelectedFeat = { 
            featId: 'ability-score-improvement', 
            source: choice.id, 
            choices: { bonuses }
        };
        const otherFeats = character.feats.filter(f => f.source !== choice.id) || [];
        dispatch(proficienciesActions.updateFeats([...otherFeats, asiSelection]));
        addToast(`Ability Scores Improved!`);
    };

    if (!character) return null;

     return (
        <div className="my-4 p-4 bg-blue-900/30 border border-blue-600 rounded-lg animate-fade-in-up">
            <h4 className="font-bold text-lg text-blue-300">Pending Choice: {choice.source}</h4>
            <p className="text-sm text-gray-300 mb-3">You have an Ability Score Improvement or Feat selection available.</p>
            
            {view === 'list' && (
                <>
                    <input type="text" placeholder="Search for a feat or ASI..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 my-3 focus:ring-2 focus:ring-blue-500" />
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2 bg-gray-900/50 p-2 rounded-md">
                        {options.map(option => (
                            <div key={option.id} role="button" tabIndex={option.prereqs.met ? 0 : -1} aria-disabled={!option.prereqs.met}
                                className={`p-4 rounded-lg border-2 ${option.prereqs.met ? 'border-gray-700 bg-gray-800 hover:border-blue-500 cursor-pointer' : 'border-gray-700 bg-gray-900 opacity-60'}`}
                                onClick={option.prereqs.met ? () => { if (option.id === 'asi') { setView('asi'); } else { handleSelectFeat(option as Feat); } } : undefined}
                            >
                                <h3 className="font-bold text-lg">{option.name}</h3>
                                <p className="text-sm text-gray-300 mt-1">{option.description}</p>
                                {!option.prereqs.met && <div className="mt-2 text-xs text-red-400">Prerequisites not met: {option.prereqs.reasons.join(', ')}</div>}
                            </div>
                        ))}
                    </div>
                </>
            )}
            {view === 'asi' && <AsiPicker onConfirm={handleSelectAsi} onCancel={() => setView('list')} />}
        </div>
    );
};

export default InlineFeatASISelector;
