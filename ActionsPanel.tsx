import React, { useState } from 'react';
import { ActionCategory, ActionItem, Character } from './types';
import { usePlayerActions } from '../../hooks/usePlayerActions';
import { useAppSelector } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';

const ExpandableCard: React.FC<{ 
    category: ActionCategory, 
    startsOpen?: boolean, 
    isBarbarian: boolean,
    isReckless: boolean,
    onRecklessToggle: (isReckless: boolean) => void,
    targetTokenId: string | null,
    character: Character,
}> = ({ category, startsOpen = false, isBarbarian, isReckless, onRecklessToggle, targetTokenId, character }) => {
    const [isOpen, setIsOpen] = useState(startsOpen);
    const { handleAttack, handleSneakAttack } = usePlayerActions();
    const isAttackCategory = category.title === "Attacks";

    const isRogue = character.classes.some(c => c.id === 'rogue');
    const canSneakAttack = isRogue && !character.usedSneakAttackThisTurn;


    return (
        <div className="bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 text-left flex justify-between items-center bg-gray-900/50 hover:bg-gray-700/50 transition-colors"
                aria-expanded={isOpen}
                aria-controls={`category-${category.title.replace(/\s+/g, '-')}`}
            >
                <div>
                    <h3 className="font-bold font-teko text-2xl tracking-wider text-white">{category.title.toUpperCase()}</h3>
                    {category.subtitle && <p className="text-sm text-gray-400 -mt-1">{category.subtitle}</p>}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform text-gray-400 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div id={`category-${category.title.replace(/\s+/g, '-')}`} className="p-4">
                    {category.description && <p className="text-sm text-gray-300 mb-4 italic">{category.description}</p>}
                    <div className="space-y-3">
                        {category.items.map((item: any) => {
                             const isStrMelee = isBarbarian && item.damageParts?.some((p: any) => p.type !== 'rage'); // A simple proxy for STR-based melee
                             const isEligibleForSneak = item.attackType === 'ranged' || item.properties?.includes('finesse');

                            return (
                                <div key={item.name} className="flex justify-between items-center gap-4 p-3 bg-gray-900/30 rounded-md border-l-4 border-gray-600">
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-200">{item.name}</p>
                                        {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                                    </div>
                                    <div className="text-right flex-shrink-0 flex items-center gap-2">
                                        <div>
                                            {item.attackBonus !== undefined && <p className="text-sm font-semibold text-cyan-300">Hit: {item.attackBonus >= 0 ? `+${item.attackBonus}` : item.attackBonus}</p>}
                                            {item.damageParts && item.damageParts.length > 0 && <p className="text-sm font-semibold text-yellow-400">Dmg: {item.damageParts.map((p: any) => `${p.dice}${p.bonus > 0 ? `+${p.bonus}` : p.bonus < 0 ? p.bonus : ''} ${p.type}`).join(' + ')}</p>}
                                            {item.cost && <p className="text-sm font-mono text-cyan-300">{item.cost}</p>}
                                            {item.modifier && <p className="text-xs text-yellow-400">{item.modifier}</p>}
                                        </div>
                                        {isAttackCategory && (
                                             <div className="flex items-center gap-2">
                                                {isStrMelee && (
                                                    <label className="flex items-center text-xs text-red-300 cursor-pointer">
                                                        <input type="checkbox" checked={isReckless} onChange={(e) => onRecklessToggle(e.target.checked)} className="form-checkbox h-4 w-4 text-red-500 bg-gray-700 border-gray-500 rounded focus:ring-red-500" />
                                                        <span className="ml-1 font-semibold">Reckless?</span>
                                                    </label>
                                                )}
                                                <button 
                                                    onClick={() => handleAttack(character.id, item, isReckless && isStrMelee, targetTokenId)} 
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-bold disabled:bg-gray-500 disabled:cursor-not-allowed"
                                                    disabled={!targetTokenId}
                                                    title={!targetTokenId ? "Select a target on the map" : `Attack with ${item.name}`}
                                                >
                                                    Attack
                                                </button>
                                                {isEligibleForSneak && canSneakAttack && (
                                                     <button 
                                                        onClick={() => handleSneakAttack(character.id, item, isReckless && isStrMelee, targetTokenId)} 
                                                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black rounded-md text-sm font-bold disabled:bg-gray-500 disabled:cursor-not-allowed"
                                                        disabled={!targetTokenId}
                                                        title={!targetTokenId ? "Select a target on the map" : `Sneak Attack with ${item.name}`}
                                                    >
                                                        Sneak
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

interface ActionsPanelProps {
    targetTokenId: string | null;
}

const ActionsPanel: React.FC<ActionsPanelProps> = ({ targetTokenId }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);
    const [isReckless, setIsReckless] = useState(false);
    
    if (!character) return null;

    const { actionCategories = [] } = staticDataCache?.actionsAndConditions || {};
    const isBarbarian = character.classes.some(c => c.id === 'barbarian');
    
    const attackActionsCategory: ActionCategory | null =
        character.attackActions && character.attackActions.length > 0
        ? {
            title: "Attacks",
            subtitle: "From equipped weapons",
            items: character.attackActions
          }
        : null;

    const specialActionsCategory: ActionCategory | null = 
        character.specialActions && character.specialActions.length > 0
        ? {
            title: "Special Actions",
            subtitle: "From class features",
            description: "These are special actions granted by your class, subclass, or other features.",
            items: character.specialActions
          }
        : null;

    const allCategories = [
        attackActionsCategory,
        specialActionsCategory,
        ...actionCategories
    ].filter((c): c is ActionCategory => c !== null);
    
    return (
        <div className="space-y-4">
            {allCategories.map((category, index) => (
                <ExpandableCard 
                    key={category.title} 
                    category={category} 
                    startsOpen={index < 2} 
                    isBarbarian={isBarbarian}
                    isReckless={isReckless}
                    onRecklessToggle={setIsReckless}
                    targetTokenId={targetTokenId}
                    character={character}
                />
            ))}
        </div>
    );
};

export default ActionsPanel;