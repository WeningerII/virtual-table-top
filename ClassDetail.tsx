import React, { useMemo, useEffect, useRef } from 'react';
import { Character, DndClass, SelectedClass, PendingChoice, Invocation, Prerequisite, ClassFeature } from './types';
import { useToast } from './state/ToastContext';
import ChoiceSelector from '../../shared/ChoiceSelector';
import InlineFightingStyleSelector from '../../shared/InlineFightingStyleSelector';
import InlineProficiencySelector from '../../shared/InlineProficiencySelector';
import InlineFeatASISelector from '../../shared/InlineFeatASISelector';
import { useAppSelector } from '../.././state/hooks';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';
import { useCharacterActions } from '../../../hooks/useCharacterActions';

const checkInvocationPrerequisites = (character: Character, option: { prerequisites: Prerequisite[] }): boolean => {
    const prerequisites = option.prerequisites || [];
    if (prerequisites.length === 0) return true;
    
    const warlockLevel = character.classes.find(c => c.id === 'warlock')?.level || 0;

    return prerequisites.every(prereq => {
        if (prereq.type === 'level') {
            return warlockLevel >= prereq.value;
        }
        if (prereq.type === 'pact_boon') {
            const warlockClass = character.classes.find(c => c.id === 'warlock');
            return warlockClass?.pactBoon === prereq.value;
        }
        if (prereq.type === 'spell') {
            return character.knownSpells.includes(prereq.id);
        }
        return true;
    });
};

const GainedFeaturesSummary: React.FC<{ features: ClassFeature[] }> = ({ features }) => {
    if (features.length === 0) return null;
    return (
        <div className="my-4 p-4 bg-green-900/30 border border-green-600 rounded-lg animate-fade-in-up">
            <h4 className="font-bold text-lg text-green-300">Features Gained at This Level</h4>
            <ul className="list-disc list-inside mt-2 text-sm text-gray-300">
                {features.map(f => <li key={`${f.name}-${f.level}`}>{f.name}</li>)}
            </ul>
        </div>
    );
};


const ClassDetail: React.FC<{ 
    classId: string, 
    onBack: () => void,
}> = ({ classId, onBack }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);
    const { updateClasses, setArtificerChoice, setInvocations, setMetamagic, updateKnownSpells, setManeuvers, setRunes, setTotem } = useCharacterActions();
    const { addToast } = useToast();

    const classData = useMemo(() => staticDataCache?.allClasses.find(c => c.id === classId), [classId, staticDataCache]);

    if (!character || !staticDataCache || !classData) {
        return <div className="text-center p-8">Loading class details...</div>;
    }

    const { allManeuvers, allInvocations, allMetamagic, allSpells, allRunes } = staticDataCache;

    const selectedClass = character.classes.find(c => c.id === classId) || { id: classId, level: 0 };
    const currentLevel = selectedClass.level || (character.classes.length > 0 ? 0 : 1);
    const prevLevel = useRef(currentLevel);

    const allFeatures = useMemo(() => {
        return [
            ...classData.features,
            ...(classData.subclasses.find(sc => sc.id === selectedClass.subclassId)?.features || [])
        ];
    }, [classData, selectedClass.subclassId]);

     useEffect(() => {
        if (currentLevel > prevLevel.current && prevLevel.current > 0) {
            const gainedFeatures = allFeatures.filter(f => f.level === currentLevel);
            if (gainedFeatures.length > 0) {
                addToast(`Gained: ${gainedFeatures.map(f => f.name).join(', ')}`);
            }
        }
        prevLevel.current = currentLevel;
    }, [currentLevel, allFeatures, addToast]);

    const handleLevelChange = (amount: number) => {
        const newLevel = Math.max(0, currentLevel + amount);
        const otherClassesLevel = character.classes.filter(c => c.id !== classId).reduce((sum, c) => sum + c.level, 0);

        if (newLevel + otherClassesLevel > 20) {
            addToast("Total character level cannot exceed 20.", "error");
            return;
        }

        let newClasses: SelectedClass[];
        if (newLevel === 0) {
            newClasses = character.classes.filter(c => c.id !== classId);
        } else {
            const existingClass = character.classes.find(c => c.id === classId);
            if (existingClass) {
                newClasses = character.classes.map(c => c.id === classId ? { ...c, level: newLevel } : c);
            } else {
                newClasses = [...character.classes, { id: classId, level: newLevel }];
            }
        }
        updateClasses(newClasses);
    };
    
    const handleSubclassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const subclassId = e.target.value;
        const subclassName = classData?.subclasses.find(s => s.id === subclassId)?.name;
        if (subclassName) {
            addToast(`${subclassName} subclass selected!`);
        }
        const newClasses = character.classes.map(c => c.id === classId ? { ...c, subclassId: subclassId || undefined } : c);
        updateClasses(newClasses);
    };
    
    const handleArtificerChoiceWrapper = (key: 'armorModel' | 'artilleristCannonChoice', value: any) => {
        setArtificerChoice({ key, value });
        const friendlyName = `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
        addToast(`${friendlyName} selected!`);
    }

    const handlePactBoonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const pactBoon = e.target.value as any;
        addToast(`Pact of the ${pactBoon.charAt(0).toUpperCase() + pactBoon.slice(1)} chosen!`);
        const newClasses = character.classes.map(c => c.id === classId ? { ...c, pactBoon: pactBoon || undefined } : c);
        updateClasses(newClasses);
    }
    
    const handleGenericConfirm = (key: 'selectedInvocations' | 'selectedMetamagic' | 'knownSpells') => (choices: string[]) => {
        if (key === 'selectedInvocations') {
            const newSet = [...new Set([...(character.selectedInvocations || []), ...choices])];
            setInvocations(newSet);
        } else if (key === 'selectedMetamagic') {
            const newSet = [...new Set([...(character.selectedMetamagic || []), ...choices])];
            setMetamagic(newSet);
        } else if (key === 'knownSpells') {
            const newSet = [...new Set([...(character.knownSpells || []), ...choices])];
            updateKnownSpells(newSet);
        }
        addToast(`${choices.length} option(s) learned!`);
    };

    const handleManeuverConfirm = (choices: string[]) => {
        const newSet = [...new Set([...(character.fighter?.selectedManeuvers || []), ...choices])];
        setManeuvers(newSet);
        addToast(`${choices.length} maneuver(s) learned!`);
    };

    const handleRuneConfirm = (choices: string[]) => {
        const newSet = [...new Set([...(character.fighter?.selectedRunes || []), ...choices])];
        setRunes(newSet);
        addToast(`${choices.length} rune(s) learned!`);
    };

    const handleTotemChoice = (choices: string[], level: number) => {
        const totem = choices[0];
        setTotem({ level, totem });
        addToast(`Totem of the ${totem.charAt(0).toUpperCase() + totem.slice(1)} chosen!`);
    }
    
    const subclassFeatureKeywords = ["Specialist", "College", "Domain", "Circle", "Archetype", "Tradition", "Oath", "Origin", "Patron", "Path"];
    const subclassChoiceFeature = classData.features.find(f => subclassFeatureKeywords.some(kw => f.name.includes(kw)));
    const subclassLevel = subclassChoiceFeature ? subclassChoiceFeature.level : 99;
    
    const relevantChoices = character.pendingChoices.filter(c => c.source.toLowerCase().includes(classData.name.toLowerCase()) || (classData.id === 'bard' && c.source.toLowerCase().includes('lore')));
    
    const maneuverChoices = relevantChoices.filter(c => c.type === 'maneuver') as Extract<PendingChoice, {type: 'maneuver'}>[];
    const invocationChoices = relevantChoices.filter(c => c.type === 'invocation') as Extract<PendingChoice, {type: 'invocation'}>[];
    const metamagicChoices = relevantChoices.filter(c => c.type === 'metamagic') as Extract<PendingChoice, {type: 'metamagic'}>[];
    const fightingStyleChoices = relevantChoices.filter(c => c.type === 'fighting_style') as Extract<PendingChoice, {type: 'fighting_style'}>[];
    const proficiencyChoices = relevantChoices.filter(c => c.type === 'proficiency' && c.source.includes('Starting Skills')) as Extract<PendingChoice, {type: 'proficiency'}>[];
    const asiFeatChoices = relevantChoices.filter(c => c.type === 'asi_or_feat') as Extract<PendingChoice, { type: 'asi_or_feat' }>[];
    const magicalSecretsChoices = relevantChoices.filter(c => c.type === 'spell') as Extract<PendingChoice, { type: 'spell' }>[];
    const totemChoices = relevantChoices.filter(c => c.type === 'totem_animal') as Extract<PendingChoice, {type: 'totem_animal'}>[];
    const runeChoices = relevantChoices.filter(c => c.type === 'rune') as Extract<PendingChoice, {type: 'rune'}>[];
    
    const gainedFeaturesAtCurrentLevel = allFeatures.filter(f => f.level === currentLevel && f.level > 0);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <button onClick={onBack} className="text-blue-400 hover:text-blue-300">&larr; Back to Classes</button>
                <h2 className="text-3xl font-bold font-teko tracking-wider">{classData.name.toUpperCase()}</h2>
            </div>
            
            <div className="bg-gray-900/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                    <span className="font-bold">Level</span>
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleLevelChange(-1)} disabled={currentLevel <= 0} className="px-3 py-1 bg-gray-700 rounded-md disabled:opacity-50">-</button>
                        <span className="text-xl font-bold">{currentLevel}</span>
                        <button onClick={() => handleLevelChange(1)} disabled={character.level >= 20} className="px-3 py-1 bg-gray-700 rounded-md disabled:opacity-50">+</button>
                    </div>
                </div>
                 {currentLevel >= subclassLevel && (
                     <div className="mt-4">
                        <label htmlFor="subclass" className="block text-sm font-medium text-gray-400 mb-1">{subclassChoiceFeature?.name || 'Subclass'} (Level {subclassLevel})</label>
                        <select
                            id="subclass"
                            value={selectedClass.subclassId || ''}
                            onChange={handleSubclassChange}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2"
                        >
                            <option value="">-- Choose a Subclass --</option>
                            {classData.subclasses.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                        </select>
                    </div>
                 )}
                 {classId === 'warlock' && currentLevel >= 3 && (
                     <div className="mt-4">
                         <label htmlFor="pactboon" className="block text-sm font-medium text-gray-400 mb-1">Pact Boon (Level 3)</label>
                         <select
                            id="pactboon"
                            value={selectedClass.pactBoon || ''}
                            onChange={handlePactBoonChange}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2"
                         >
                            <option value="">-- Choose a Pact Boon --</option>
                            <option value="blade">Pact of the Blade</option>
                            <option value="chain">Pact of the Chain</option>
                            <option value="tome">Pact of the Tome</option>
                            <option value="talisman">Pact of the Talisman</option>
                         </select>
                     </div>
                 )}
                 {classId === 'artificer' && selectedClass.subclassId === 'armorer' && currentLevel >= 3 && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Armor Model</label>
                        <div className="flex items-center justify-center gap-2 bg-gray-900 p-1 rounded-md">
                            <button onClick={() => handleArtificerChoiceWrapper('armorModel', 'guardian')} className={`w-1/2 p-2 rounded-md font-semibold text-sm transition-colors ${selectedClass.armorModel === 'guardian' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}>Guardian</button>
                            <button onClick={() => handleArtificerChoiceWrapper('armorModel', 'infiltrator')} className={`w-1/2 p-2 rounded-md font-semibold text-sm transition-colors ${selectedClass.armorModel === 'infiltrator' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}>Infiltrator</button>
                        </div>
                    </div>
                 )}
                  {classId === 'artificer' && selectedClass.subclassId === 'artillerist' && currentLevel >= 3 && (
                    <div className="mt-4">
                         <label htmlFor="cannon-choice" className="block text-sm font-medium text-gray-400 mb-1">Eldritch Cannon</label>
                         <select
                            id="cannon-choice"
                            value={selectedClass.artilleristCannonChoice || ''}
                            onChange={(e) => handleArtificerChoiceWrapper('artilleristCannonChoice', e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2"
                         >
                            <option value="">-- Choose a Cannon --</option>
                            <option value="flamethrower">Flamethrower</option>
                            <option value="force-ballista">Force Ballista</option>
                            <option value="protector">Protector</option>
                         </select>
                     </div>
                 )}
            </div>

            <GainedFeaturesSummary features={gainedFeaturesAtCurrentLevel} />
            
            {asiFeatChoices.map(choice => (
                <InlineFeatASISelector key={choice.id} choice={choice} />
            ))}
            {proficiencyChoices.map(choice => <InlineProficiencySelector key={choice.id} choice={choice} />)}
            {fightingStyleChoices.map(choice => <InlineFightingStyleSelector key={choice.id} choice={choice} />)}
            
            {totemChoices.map(choice => <ChoiceSelector key={choice.id} title={choice.source} choice={choice} options={[{id: 'bear', name: 'Bear'}, {id: 'eagle', name: 'Eagle'}, {id: 'elk', name: 'Elk'}, {id: 'tiger', name: 'Tiger'}, {id: 'wolf', name: 'Wolf'}]} character={character} onConfirm={(choices) => handleTotemChoice(choices, choice.level!)} />)}
            {maneuverChoices.map(choice => <ChoiceSelector key={choice.id} title="Battle Master Maneuvers" choice={choice} options={allManeuvers} character={character} onConfirm={handleManeuverConfirm} />)}
            {runeChoices.map(choice => <ChoiceSelector key={choice.id} title="Rune Carver" choice={choice} options={allRunes} character={character} onConfirm={handleRuneConfirm} />)}
            {invocationChoices.map(choice => <ChoiceSelector key={choice.id} title="Eldritch Invocations" choice={choice} options={allInvocations} character={character} onConfirm={handleGenericConfirm('selectedInvocations')} checkPrerequisites={(char, opt) => checkInvocationPrerequisites(char, opt as Invocation)} />)}
            {metamagicChoices.map(choice => <ChoiceSelector key={choice.id} title="Metamagic Options" choice={choice} options={allMetamagic} character={character} onConfirm={handleGenericConfirm('selectedMetamagic')} />)}
            {magicalSecretsChoices.map(choice => <ChoiceSelector key={choice.id} title="Magical Secrets" choice={choice} options={allSpells} character={character} onConfirm={handleGenericConfirm('knownSpells')} />)}
        </div>
    );
};

export default ClassDetail;