import React, { useState, useMemo } from 'react';
import { Character, Species, PendingChoice } from './types';
import { generateCustomHeritage } from 'services../ai/character.service';
import InlineProficiencySelector from '../shared/InlineProficiencySelector';
import { useToast } from 'state/ToastContext';
import InlineFeatASISelector from '../shared/InlineFeatASISelector';
import { useAppSelector } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';
import { useCharacterActions } from '../../hooks/useCharacterActions';

interface SpeciesStepProps {}

const TraitDisplay: React.FC<{ trait: any }> = ({ trait }) => (
    <div className="bg-gray-800/50 p-3 rounded-md border-l-4 border-gray-600">
        <h5 className="font-semibold text-gray-200">{trait.name}</h5>
        <p className="text-sm text-gray-300 mt-1">{trait.description}</p>
    </div>
);

const SpeciesGrid: React.FC = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);
    const { setHeritage, updateFeats } = useCharacterActions();
    const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);

    if (!character || !staticDataCache) return null;
    
    const index = staticDataCache.allSpecies.map(s => ({ id: s.id, name: s.name, group: 'Unknown', source: s.source, iconUrl: s.iconUrl })); // Simplified index
    
    const speciesGroups = useMemo(() => {
        const groups: Record<string, typeof index> = {};
        staticDataCache.allSpecies.forEach(s => {
            const groupName = s.name.includes('Dwarf') ? 'Dwarf' : s.name.includes('Elf') ? 'Elf' : s.name.includes('Gnome') ? 'Gnome' : s.name.includes('Halfling') ? 'Halfling' : 'Exotic';
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push({ id: s.id, name: s.name, group: groupName, source: s.source, iconUrl: s.iconUrl });
        });
        return Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0]));
    }, [staticDataCache.allSpecies]);

    const handleSelectSpecies = (speciesId: string) => {
        const speciesData = staticDataCache.allSpecies.find(s => s.id === speciesId);
        if (speciesData) {
            setSelectedSpecies(speciesData);
            setHeritage({
                ancestries: [speciesData],
                resolvedHeritage: speciesData,
                isCustom: false,
            });

            // If not variant human, remove the feat if it exists
            if (speciesId !== 'human-variant') {
                const otherFeats = character.feats.filter(f => f.source !== 'feat-human-variant-variant-human-feat');
                if(otherFeats.length < character.feats.length) {
                    updateFeats(otherFeats);
                }
            }
        }
    };

    const proficiencyChoice = character.pendingChoices.find(c => c.type === 'proficiency' && selectedSpecies?.traits.some(t => c.source === t.name)) as Extract<PendingChoice, {type: 'proficiency'}> | undefined;
    const variantHumanFeatChoice = character.pendingChoices.find(c => c.type === 'asi_or_feat' && c.id === 'feat-human-variant-variant-human-feat') as Extract<PendingChoice, { type: 'asi_or_feat' }> | undefined;

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8">
            <div className="md:col-span-8 space-y-6">
                {speciesGroups.map(([groupName, speciesList]) => (
                    <div key={groupName}>
                        <h3 className="font-bold font-teko text-2xl tracking-wider border-b-2 border-gray-600 mb-3 pb-1">{groupName.toUpperCase()}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {speciesList.map(species => (
                                <button
                                    key={species.id}
                                    onClick={() => handleSelectSpecies(species.id)}
                                    className={`p-3 rounded-lg text-center transition-all duration-200 border-2 flex flex-col items-center justify-center aspect-square ${
                                        character.heritage.resolvedHeritage?.id === species.id && !character.heritage.isCustom
                                            ? 'bg-blue-900/50 border-blue-500 ring-2 ring-blue-500'
                                            : 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-blue-500'
                                    }`}
                                >
                                    <img src={species.iconUrl} alt={species.name} className="w-12 h-12 rounded-full mb-2 border-2 border-gray-600" />
                                    <h4 className="font-semibold text-sm">{species.name}</h4>
                                    <p className="text-xs text-gray-400">{species.source}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="md:col-span-4 mt-6 md:mt-0">
                <div className="bg-gray-900/50 p-4 rounded-lg sticky top-24 min-h-[500px] flex flex-col justify-between">
                    {!selectedSpecies ? (
                         <div className="text-center text-gray-400 p-8">Select a species to see its details.</div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <img src={selectedSpecies.iconUrl} alt={selectedSpecies.name} className="w-16 h-16 rounded-full border-2 border-gray-600" />
                                <h3 className="text-3xl font-bold font-teko tracking-wider">{selectedSpecies.name.toUpperCase()}</h3>
                            </div>
                            <p className="text-gray-300 italic mb-4 text-sm">{selectedSpecies.description}</p>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                {selectedSpecies.traits.map(trait => <TraitDisplay key={trait.id} trait={trait} />)}
                            </div>
                            {proficiencyChoice && <div className="mt-4"><InlineProficiencySelector choice={proficiencyChoice} /></div>}
                            {variantHumanFeatChoice && (
                                <InlineFeatASISelector choice={variantHumanFeatChoice} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CustomHeritageCreator: React.FC = () => {
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);
    const { setHeritage } = useCharacterActions();
    const [parentSpecies, setParentSpecies] = useState<Species[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedOptions, setGeneratedOptions] = useState<Partial<Species>[]>([]);
    const { addToast } = useToast();

    if (!staticDataCache) return null;
    const index = staticDataCache.allSpecies.map(s => ({ id: s.id, name: s.name, source: s.source, iconUrl: s.iconUrl }));

    const handleSelectParent = async (speciesId: string) => {
        if (parentSpecies.some(p => p.id === speciesId)) {
            setParentSpecies(prev => prev.filter(p => p.id !== speciesId));
        } else if (parentSpecies.length < 3) {
            const speciesData = staticDataCache.allSpecies.find(s => s.id === speciesId);
            if (speciesData) {
                setParentSpecies(prev => [...prev, speciesData]);
            }
        }
    };

    const handleGenerate = async () => {
        if (parentSpecies.length < 2) {
            addToast("Please select at least two parent species.", "error");
            return;
        }
        setIsLoading(true);
        setGeneratedOptions([]);
        const options = await generateCustomHeritage(parentSpecies);
        setGeneratedOptions(options);
        setIsLoading(false);
    };

    const handleConfirmSelection = (option: Partial<Species>) => {
        const finalHeritage: Species = {
            id: `custom-${option.name?.toLowerCase().replace(/\s/g, '-') || 'gen'}`,
            name: option.name || "Custom Heritage",
            source: "AI Generated",
            iconUrl: 'https://picsum.photos/seed/custom/64/64',
            traits: option.traits || [],
            description: option.description || "A unique heritage.",
            creatureType: "Humanoid",
        };
        setHeritage({
            ancestries: parentSpecies,
            resolvedHeritage: finalHeritage,
            isCustom: true,
        });
        addToast(`Custom heritage "${finalHeritage.name}" selected!`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold font-teko tracking-wide mb-2">1. SELECT PARENT SPECIES (2-3)</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-64 overflow-y-auto bg-gray-900/50 p-3 rounded-md">
                    {index.map(species => (
                        <button key={species.id} onClick={() => handleSelectParent(species.id)}
                            className={`p-2 rounded-lg text-center transition-colors border-2 ${parentSpecies.some(p => p.id === species.id) ? 'bg-purple-900/50 border-purple-500' : 'bg-gray-800 border-gray-700 hover:border-purple-500'}`}>
                            <img src={species.iconUrl} alt={species.name} className="w-10 h-10 rounded-full mx-auto mb-1 border-2 border-gray-600" />
                            <p className="text-xs font-semibold">{species.name}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-center">
                <button onClick={handleGenerate} disabled={isLoading || parentSpecies.length < 2}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold disabled:bg-gray-600 disabled:cursor-wait">
                    {isLoading ? 'Generating with AI...' : 'Generate Heritage Options'}
                </button>
            </div>

            {generatedOptions.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold font-teko tracking-wide mb-2">2. CHOOSE YOUR CUSTOM HERITAGE</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {generatedOptions.map((opt, index) => (
                            <div key={index} className="bg-gray-800 p-4 rounded-lg flex flex-col">
                                <h4 className="font-bold text-lg text-purple-300">{opt.name}</h4>
                                <p className="text-sm text-gray-300 flex-grow">{opt.description}</p>
                                <button onClick={() => handleConfirmSelection(opt)}
                                    className="mt-4 w-full px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold">
                                    Select
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const SpeciesStep: React.FC<SpeciesStepProps> = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    type View = 'grid' | 'custom';
    const [view, setView] = useState<View>('grid');

    if (!character) return null;

    const currentSelection = character.heritage.resolvedHeritage;
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-teko tracking-wide">CHOOSE YOUR SPECIES</h2>
                 {currentSelection && (
                     <div className={`text-sm font-semibold px-4 py-2 rounded-lg ${character.heritage.isCustom ? 'bg-purple-900/50 border border-purple-700 text-purple-300' : 'bg-green-900/50 border border-green-700 text-green-300'}`}>
                        Selected: {currentSelection.name}
                    </div>
                )}
            </div>

            <div className="flex justify-center bg-gray-900/50 rounded-md p-1 mb-6">
                <button onClick={() => setView('grid')} className={`w-1/2 p-2 rounded-md font-semibold text-sm transition-colors ${view === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}>Standard Species</button>
                <button onClick={() => setView('custom')} className={`w-1/2 p-2 rounded-md font-semibold text-sm transition-colors ${view === 'custom' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}>Custom Heritage</button>
            </div>
            
            {view === 'grid' && <SpeciesGrid />}
            {view === 'custom' && <CustomHeritageCreator />}
        </div>
    );
};

export default SpeciesStep;
