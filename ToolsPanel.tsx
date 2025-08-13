import React, { useState, useMemo } from 'react';
import { Character, Ability, ToolCheckItem } from './types';
import { ABILITIES } from '../../constants';
import { useAppSelector } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';

interface ToolCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    tool: ToolCheckItem;
    onRoll: (title: string, modifier: number) => void;
}

const ToolCheckModal: React.FC<ToolCheckModalProps> = ({ isOpen, onClose, tool, onRoll }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const [selectedAbility, setSelectedAbility] = useState<Ability | ''>('');

    const modifiers = useMemo(() => {
        if (!character) return null;
        const mods: Record<Ability, number> = {} as any;
        for (const key in character.abilityScores) {
            const ability = key as Ability;
            const totalScore = (character.abilityScores[ability]?.base || 0) + (character.abilityScores[ability]?.bonus || 0);
            mods[ability] = Math.floor((totalScore - 10) / 2);
        }
        return mods;
    }, [character]);

    const profBonus = useMemo(() => {
        if (!character) return 0;
        return Math.ceil(character.level / 4) + 1;
    }, [character]);


    if (!isOpen || !character || !modifiers) return null;

    const handleRoll = () => {
        if (!selectedAbility) {
            alert("Please select an ability to use for the check.");
            return;
        }
        const abilityMod = modifiers[selectedAbility];
        const totalMod = abilityMod + (tool.isProficient ? profBonus : 0);
        const abilityName = ABILITIES.find(a => a.id === selectedAbility)?.name || 'Ability';
        onRoll(`${tool.name} (${abilityName}) Check`, totalMod);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700">
                    <h3 className="text-lg font-bold">Use Tool: <span className="text-blue-300">{tool.name}</span></h3>
                </div>
                <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-400">Select the ability score that best fits the task you're performing with this tool.</p>
                    <div>
                        <label htmlFor="ability-select" className="block text-sm font-medium text-gray-400 mb-1">Ability Score</label>
                        <select
                            id="ability-select"
                            value={selectedAbility}
                            onChange={(e) => setSelectedAbility(e.target.value as Ability)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2"
                            aria-label={`Select ability for ${tool.name}`}
                        >
                            <option value="">-- Choose an ability --</option>
                            {ABILITIES.map(ability => (
                                <option key={ability.id} value={ability.id}>{ability.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold mr-2">Cancel</button>
                    <button
                        onClick={handleRoll}
                        disabled={!selectedAbility}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        Roll Check
                    </button>
                </div>
            </div>
        </div>
    );
};


interface ToolsPanelProps {
    character: Character;
    onRoll: (title: string, modifier: number) => void;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({ character, onRoll }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<ToolCheckItem | null>(null);
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);

    const modifiers = useMemo(() => {
        if (!character) return null;
        const mods: Record<Ability, number> = {} as any;
        for (const key in character.abilityScores) {
            const ability = key as Ability;
            const totalScore = (character.abilityScores[ability]?.base || 0) + (character.abilityScores[ability]?.bonus || 0);
            mods[ability] = Math.floor((totalScore - 10) / 2);
        }
        return mods;
    }, [character]);

    const profBonus = useMemo(() => {
        if (!character) return 0;
        return Math.ceil(character.level / 4) + 1;
    }, [character]);

    const { toolCheckItems } = character;

    if (!toolCheckItems || toolCheckItems.length === 0) return null;

    const handleOpenModal = (tool: ToolCheckItem) => {
        setSelectedTool(tool);
        setModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setSelectedTool(null);
        setModalOpen(false);
    }
    
    const handleThievesToolsCheck = (actionName: string) => {
        if (!modifiers) return;
        const dexMod = modifiers.DEXTERITY;
        const isProficient = character.toolCheckItems.some(t => t.id === 'thieves-tools' && t.isProficient);
        const totalMod = dexMod + (isProficient ? profBonus : 0);
        onRoll(`${actionName} (Thieves' Tools)`, totalMod);
    };

    return (
        <>
            {selectedTool && <ToolCheckModal isOpen={isModalOpen} onClose={handleCloseModal} tool={selectedTool} onRoll={onRoll} />}
            <div className="bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full p-4 text-left flex justify-between items-center bg-gray-900/50 hover:bg-gray-700/50 transition-colors"
                    aria-expanded={isOpen}
                    aria-controls="tools-panel-content"
                >
                    <h3 className="font-bold font-teko text-2xl tracking-wider text-white">TOOLS</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform text-gray-400 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isOpen && (
                    <div id="tools-panel-content" className="p-4 space-y-2 max-h-80 overflow-y-auto">
                        {toolCheckItems.map(tool => (
                            <div
                                key={tool.id}
                                className="w-full p-2 bg-gray-900/30 rounded-md border-l-4 border-gray-600 flex justify-between items-center text-left"
                            >
                                <div className="flex items-center gap-2">
                                     <div title="Proficient" className="w-4 h-4 rounded-full border-2 border-green-400 bg-green-900/50 flex-shrink-0"></div>
                                     <span className="font-semibold">{tool.name}</span>
                                </div>
                                {tool.id === 'thieves-tools' ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleThievesToolsCheck('Pick Lock')} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-bold">
                                            Pick Lock
                                        </button>
                                        <button onClick={() => handleThievesToolsCheck('Disarm Trap')} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-bold">
                                            Disarm Trap
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => handleOpenModal(tool)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-bold">
                                        Use
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default ToolsPanel;