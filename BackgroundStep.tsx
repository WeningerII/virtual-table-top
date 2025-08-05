import React, { useState } from 'react';
import { Character, Background, PhysicalCharacteristics, Trait, PendingChoice } from '../../types';
import { generateBackstory } from '../../services/ai/character.service';
import { dataService, BackgroundIndexEntry } from '../../services/dataService';
import InlineProficiencySelector from '../shared/InlineProficiencySelector';
import { useAppSelector } from '../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../state/selectors';
import { useCharacterActions } from '../../hooks/useCharacterActions';

interface BackgroundStepProps {}

const ExpandableSection: React.FC<{ title: string, children: React.ReactNode, startsOpen?: boolean }> = ({ title, children, startsOpen = false }) => {
    const [isOpen, setIsOpen] = useState(startsOpen);
    return (
        <div className="border border-gray-600 rounded-md">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-3 text-left flex justify-between items-center bg-gray-700 hover:bg-gray-600 rounded-t-md"
            >
                <span className="font-bold">{title}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 bg-gray-700 bg-opacity-50 rounded-b-md">
                    {children}
                </div>
            )}
        </div>
    );
};

const TraitDisplay: React.FC<{ trait: Trait }> = ({ trait }) => (
    <div className="bg-gray-800/50 p-3 rounded-md border-l-4 border-gray-600">
        <h5 className="font-semibold text-gray-200">{trait.name}</h5>
        <p className="text-sm text-gray-300 mt-1">{trait.description}</p>
    </div>
);


const BackstoryInput: React.FC<{ label: string, value: string, onChange: (value: string) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400">{label}</label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 mt-1 h-24"
        />
    </div>
);

const DetailInput: React.FC<{ label: string, value: string, onChange: (value: string) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400">{label}</label>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 mt-1"
        />
    </div>
);


const BackgroundStep: React.FC<BackgroundStepProps> = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);
    const { setBackground, updateBackstory, updatePhysical } = useCharacterActions();
    const [isGenerating, setIsGenerating] = useState(false);

    if (!character || !staticDataCache) return null;
    
    const { allBackgrounds = [] } = staticDataCache;
    const backgroundIndex = allBackgrounds.map(b => ({ id: b.id, name: b.name, source: b.source }));

    const handleSelectBackground = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const backgroundId = e.target.value;
        if (!backgroundId) {
            setBackground(null);
            return;
        }
        const background = allBackgrounds.find(b => b.id === backgroundId);
        setBackground(background || null);
    };

    const handleGenerateBackstory = async () => {
        setIsGenerating(true);
        const details = await generateBackstory(character);
        updateBackstory(details);
        setIsGenerating(false);
    }

    const handlePhysicalCharChange = (field: keyof PhysicalCharacteristics, value: string) => {
        updatePhysical({ [field]: value });
    };

    const handleBackstoryDetailChange = (field: keyof typeof character.backstoryDetails, value: string) => {
        updateBackstory({ [field]: value });
    };

    const proficiencyChoice = character.pendingChoices.find(c => c.type === 'proficiency' && character.background && c.source.includes(character.background.name)) as Extract<PendingChoice, {type: 'proficiency'}> | undefined;
    
    return (
        <div>
            <h2 className="text-2xl font-bold font-teko tracking-wide mb-4">CHOOSE ORIGIN: BACKGROUND</h2>
            
            <div className="mb-6">
                <select
                    value={character.background?.id || ''}
                    onChange={handleSelectBackground}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-3"
                >
                    <option value="">-- Choose a Background --</option>
                    {backgroundIndex.map(bg => (
                        <option key={bg.id} value={bg.id}>{bg.name}</option>
                    ))}
                </select>
            </div>
            
             {character.background && (
                <div className="mt-6 p-4 bg-gray-900/50 rounded-lg space-y-4 animate-fade-in-up">
                    <div>
                        <h3 className="text-xl font-bold font-teko tracking-wider text-yellow-300">{character.background.feature.name}</h3>
                        <p className="text-sm text-gray-300 italic">{character.background.feature.description}</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400">Traits & Proficiencies</h4>
                        {character.background.traits.map(trait => <TraitDisplay key={trait.id} trait={trait} />)}
                    </div>
                     {proficiencyChoice && <InlineProficiencySelector choice={proficiencyChoice} />}
                    <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-700">Starting Gold: {character.background.startingGold} gp</p>
                </div>
            )}

            <div className="space-y-4 mt-6">
                <ExpandableSection title="Character Details">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <DetailInput label="Alignment" value={character.physicalCharacteristics.alignment} onChange={v => handlePhysicalCharChange('alignment', v)} />
                        <DetailInput label="Faith" value={character.physicalCharacteristics.faith} onChange={v => handlePhysicalCharChange('faith', v)} />
                     </div>
                </ExpandableSection>
                <ExpandableSection title="Physical Characteristics">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DetailInput label="Gender" value={character.physicalCharacteristics.gender} onChange={v => handlePhysicalCharChange('gender', v)} />
                        <DetailInput label="Age" value={character.physicalCharacteristics.age} onChange={v => handlePhysicalCharChange('age', v)} />
                        <DetailInput label="Height" value={character.physicalCharacteristics.height} onChange={v => handlePhysicalCharChange('height', v)} />
                        <DetailInput label="Weight" value={character.physicalCharacteristics.weight} onChange={v => handlePhysicalCharChange('weight', v)} />
                        <DetailInput label="Eyes" value={character.physicalCharacteristics.eyes} onChange={v => handlePhysicalCharChange('eyes', v)} />
                        <DetailInput label="Skin" value={character.physicalCharacteristics.skin} onChange={v => handlePhysicalCharChange('skin', v)} />
                        <DetailInput label="Hair" value={character.physicalCharacteristics.hair} onChange={v => handlePhysicalCharChange('hair', v)} />
                    </div>
                </ExpandableSection>
                <ExpandableSection title="Personal Characteristics" startsOpen={true}>
                   <div className="flex justify-end mb-4">
                        <button 
                            onClick={handleGenerateBackstory}
                            disabled={isGenerating || !character.background || character.classes.length === 0}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
                            title={!character.background || character.classes.length === 0 ? "Select a class and background first" : "Generate with AI"}
                        >
                            {isGenerating ? 'Generating with AI...' : 'Generate with AI'}
                        </button>
                   </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <BackstoryInput label="Personality Traits" value={character.backstoryDetails.personality} onChange={value => handleBackstoryDetailChange('personality', value)}/>
                        <BackstoryInput label="Ideals" value={character.backstoryDetails.ideals} onChange={value => handleBackstoryDetailChange('ideals', value)}/>
                        <BackstoryInput label="Bonds" value={character.backstoryDetails.bonds} onChange={value => handleBackstoryDetailChange('bonds', value)}/>
                        <BackstoryInput label="Flaws" value={character.backstoryDetails.flaws} onChange={value => handleBackstoryDetailChange('flaws', value)}/>
                    </div>
                </ExpandableSection>
                <ExpandableSection title="Notes">
                    <div className="space-y-4">
                         <BackstoryInput label="Backstory" value={character.backstoryDetails.backstory} onChange={value => handleBackstoryDetailChange('backstory', value)}/>
                         <BackstoryInput label="Other Notes" value={character.backstoryDetails.notes} onChange={value => handleBackstoryDetailChange('notes', value)}/>
                    </div>
                </ExpandableSection>
            </div>
        </div>
    );
};

export default BackgroundStep;
