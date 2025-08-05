import React, { useState, useMemo, useCallback } from 'react';
import { Character, Spell, InnateSpell, VTTTool, SpellTargetingState, SummonChoiceEffect, SummonCreatureEffect, CastSpellEvent, VFXRequest } from '../../types';
import SpellDetailModal from '../shared/SpellDetailModal';
import CastSpellModal from './CastSpellModal';
import { useToast } from '../../state/ToastContext';
import { playStateActions } from '../../engine/slices/playStateSlice';
import { usePlayerActions } from '../../hooks/usePlayerActions';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../state/selectors';
import { uiActions } from '../../state/uiSlice';
import { postGameEvent } from '../../state/eventSlice';
import { soundManager } from '../../services/soundManager';

interface SpellSlotTrackerProps {
    character: Character;
}

const SpellSlotTracker: React.FC<SpellSlotTrackerProps> = ({ character }) => {
    const dispatch = useAppDispatch();
    const { spellcastingInfo, expendedSpellSlots, expendedPactSlots } = character;
    if (!spellcastingInfo) return null;

    const hasPactSlots = spellcastingInfo.pactSlots.count > 0;
    
    const handleExpendSlot = (level: number) => {
        dispatch(playStateActions.expendSpellSlot({ level, quantity: 1 }));
    };

    const handleRecoverSlot = (level: number) => {
        dispatch(playStateActions.expendSpellSlot({ level, quantity: -1 }));
    };

    const handleExpendPactSlot = () => {
        dispatch(playStateActions.expendPactSlot());
    }

    return (
        <div className="bg-gray-900/50 p-3 rounded-lg space-y-3">
            <div>
                <h4 className="font-bold text-sm text-center uppercase tracking-wider text-gray-400 mb-2">Spell Slots</h4>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
                    {spellcastingInfo.spellSlots.map((max, index) => {
                        if (max === 0) return null;
                        const level = index + 1;
                        const expended = expendedSpellSlots[level] || 0;
                        const remaining = max - expended;
                        return (
                            <button 
                                key={level} 
                                className="bg-gray-800 p-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                                onClick={() => handleExpendSlot(level)}
                                onContextMenu={(e) => { e.preventDefault(); handleRecoverSlot(level); }}
                                disabled={remaining <= 0}
                                title={`Left-click to expend, Right-click to recover`}
                            >
                                <div className="font-bold text-lg">{remaining}/{max}</div>
                                <div className="text-xs text-gray-400">LVL {level}</div>
                            </button>
                        );
                    })}
                </div>
            </div>
            {hasPactSlots && (
                <div className="border-t border-purple-700/50 pt-3">
                    <h4 className="font-bold text-sm text-center uppercase tracking-wider text-purple-300 mb-2">Pact Magic</h4>
                    <button 
                        className="bg-gray-800 p-2 rounded-md border-2 border-purple-600 col-span-full w-full hover:bg-gray-700 disabled:opacity-50"
                        onClick={handleExpendPactSlot}
                        disabled={(spellcastingInfo.pactSlots.count - expendedPactSlots) <= 0}
                    >
                        <div className="font-bold text-lg">{spellcastingInfo.pactSlots.count - expendedPactSlots}/{spellcastingInfo.pactSlots.count}</div>
                        <div className="text-xs text-gray-400">LVL {spellcastingInfo.pactSlots.level} SLOTS</div>
                    </button>
                </div>
            )}
        </div>
    );
};

interface SpellsPanelProps {
    setSpellTargetingState: React.Dispatch<React.SetStateAction<SpellTargetingState | null>>;
    setActiveTool: (tool: VTTTool) => void;
    setLastVFX: (vfx: VFXRequest | null) => void;
}

export const SpellsPanel: React.FC<SpellsPanelProps> = ({ setSpellTargetingState, setActiveTool, setLastVFX }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character;
    const mapState = useAppSelector(state => state.entity.activeMap);
    const { handleArcaneRecovery, handleFontOfMagic } = usePlayerActions();
    const dispatch = useAppDispatch();
    const [isOpen, setIsOpen] = useState(true);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [isCastModalOpen, setIsCastModalOpen] = useState(false);
    const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
    const { addToast } = useToast();
    const { spellcastingInfo } = character;

    const preparedSpells = useMemo(() => {
        if (!spellcastingInfo) return [];
        const preparedIds = new Set([...character.preparedSpells, ...spellcastingInfo.alwaysPreparedSpells.map(s => s.id)]);
        return spellcastingInfo.availableSpells.filter(spell => preparedIds.has(spell.id));
    }, [spellcastingInfo, character.preparedSpells]);
    
    const mysticArcanumSpells = useMemo((): InnateSpell[] => {
        if (!spellcastingInfo) return [];
        return spellcastingInfo.innateSpells.filter(s => s.source.startsWith("Mystic Arcanum"));
    }, [spellcastingInfo]);

    const canRitualCast = useMemo(() => {
        return character.classes.some(c => ['cleric', 'druid', 'wizard', 'artificer', 'bard'].includes(c.id));
    }, [character.classes]);

    const handleRitualCast = (spell: Spell) => {
        if (spell.requiresConcentration && character.activeConcentration) {
             if (!window.confirm(`This will end your concentration on ${character.activeConcentration.spellName}. Are you sure?`)) {
                return;
            }
        }
        if(spell.requiresConcentration) {
            dispatch(playStateActions.setConcentration({ spellId: spell.id, spellName: spell.name }));
        }
        addToast(`Casting ${spell.name} as a ritual.`);
    };

    const handleOpenDetailModal = (spell: Spell) => {
        setSelectedSpell(spell);
        setDetailModalOpen(true);
    };
    
     const handleInitiateFullCast = (spell: Spell) => {
        if (!character || !mapState) return;

        if (spell.template) {
            setSpellTargetingState({ spell, template: spell.template });
            setActiveTool('castSpell');
            return;
        }

        const summonChoiceEffect = spell.effects?.find((e): e is SummonChoiceEffect => e.type === 'summon_choice');
        const summonCreatureEffect = spell.effects?.find((e): e is SummonCreatureEffect => e.type === 'summon_creature');
        if (summonChoiceEffect) {
            dispatch(playStateActions.setSummonChoicePrompt({ spell, effect: summonChoiceEffect }));
            return;
        }
        if (spell.summonsCompanionId || summonCreatureEffect) {
            dispatch(uiActions.openSummoningModal({ spell }));
            return;
        }
        
        if (spell.higherLevel && spell.level > 0) {
            setSelectedSpell(spell);
            setIsCastModalOpen(true);
            return;
        }

        const event: CastSpellEvent = {
            type: 'CAST_SPELL',
            sourceId: character.id,
            spellId: spell.id,
            upcastLevel: spell.level,
            targets: { tokenIds: [character.id] } 
        };
        dispatch(postGameEvent(event));
        soundManager.playSound('cast-spell', 'sfx');
        addToast(`Casting ${spell.name}!`);
    };

    const handleCastInnate = (innateSpell: InnateSpell) => {
        dispatch(playStateActions.castInnateSpell({ spell: innateSpell.spell, uses: innateSpell.uses }));
        addToast(`Used ${innateSpell.spell.name}!`);
    }
    
    const isWizard = character.classes.some(c => c.id === 'wizard' && c.level >= 1);
    const isSorcerer = character.classes.some(c => c.id === 'sorcerer' && c.level >= 2);


    if (!spellcastingInfo) return null;

    return (
        <>
            {selectedSpell && (
                <SpellDetailModal 
                    isOpen={isDetailModalOpen}
                    spell={selectedSpell}
                    onClose={() => setDetailModalOpen(false)}
                />
            )}
            {selectedSpell && (
                <CastSpellModal
                    isOpen={isCastModalOpen}
                    spell={selectedSpell}
                    character={character}
                    onClose={() => setIsCastModalOpen(false)}
                />
            )}

            <div className="bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full p-4 text-left flex justify-between items-center bg-gray-900/50 hover:bg-gray-700/50 transition-colors"
                >
                    <h3 className="font-bold font-teko text-2xl tracking-wider text-white">SPELLS</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform text-gray-400 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isOpen && (
                    <div className="p-4 space-y-4">
                        <SpellSlotTracker character={character} />

                        {isWizard && (
                            <button onClick={handleArcaneRecovery} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold text-sm">Arcane Recovery</button>
                        )}
                        {isSorcerer && (
                            <button onClick={handleFontOfMagic} className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-md font-semibold text-sm">Font of Magic</button>
                        )}
                        
                        {preparedSpells.length > 0 && (
                            <div>
                                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mt-4 pt-3 border-t border-gray-700">Prepared Spells</h4>
                                <div className="space-y-2 mt-2">
                                    {preparedSpells.map(spell => (
                                        <div key={spell.id} className="flex items-center gap-2">
                                            <button onClick={() => handleOpenDetailModal(spell)} className="flex-grow text-left p-2 bg-gray-900/50 rounded-md hover:bg-gray-700/50">
                                                <p className="font-semibold">{spell.name}</p>
                                                <p className="text-xs text-gray-400">{spell.level > 0 ? `Level ${spell.level}` : 'Cantrip'}</p>
                                            </button>
                                            <button onClick={() => handleInitiateFullCast(spell)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-bold">Cast</button>
                                            {spell.ritual && canRitualCast && (
                                                 <button onClick={() => handleRitualCast(spell)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md text-sm font-bold">Ritual</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {mysticArcanumSpells.length > 0 && (
                             <div>
                                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mt-4 pt-3 border-t border-purple-700 text-purple-300">Mystic Arcanum</h4>
                                <div className="space-y-2 mt-2">
                                    {mysticArcanumSpells.map(innate => (
                                        <div key={innate.spell.id} className="bg-gray-900/30 p-2 rounded-md flex justify-between items-center gap-2">
                                            <div>
                                                <p className="font-semibold">{innate.spell.name}</p>
                                                <p className="text-xs text-gray-400">({innate.uses})</p>
                                            </div>
                                            <button onClick={() => handleCastInnate(innate)} disabled={(character.innateSpellUses[innate.spell.id]?.expended || 0) >= 1} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded-md text-xs font-semibold disabled:bg-gray-500">
                                                Use
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};
