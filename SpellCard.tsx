import React from 'react';
import { Spell } from './types';

interface SpellCardProps { 
    spell: Spell, 
    isPrepared?: boolean, 
    isKnown?: boolean,
    canPrepare?: boolean,
    onTogglePrepare?: (spellId: string) => void,
    isAlwaysPrepared?: boolean,
    isInSpellbook?: boolean,
}

const SpellCard: React.FC<SpellCardProps> = ({ spell, isPrepared, isKnown, canPrepare, onTogglePrepare, isAlwaysPrepared, isInSpellbook }) => {
    let cardClass = 'bg-gray-800 border-gray-600';
    if(isAlwaysPrepared) cardClass = 'bg-yellow-900/30 border-yellow-600';
    else if (isKnown) cardClass = 'bg-purple-900/30 border-purple-600';
    else if (isInSpellbook) cardClass = 'bg-cyan-900/30 border-cyan-600';

    return (
        <div className={`p-4 rounded-lg border-l-4 ${cardClass}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-lg text-white">{spell.name}</h4>
                    <p className="text-xs text-gray-400">{spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} {spell.school}</p>
                </div>
                {canPrepare && spell.level > 0 && !isAlwaysPrepared && onTogglePrepare && (
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                            type="checkbox"
                            checked={isPrepared}
                            onChange={() => onTogglePrepare(spell.id)}
                            className="form-checkbox h-5 w-5 text-blue-500 bg-gray-700 border-gray-500 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300">Prepared</span>
                    </label>
                )}
                 {isAlwaysPrepared && (
                    <span className="text-xs font-bold text-yellow-300 bg-yellow-900/50 px-2 py-1 rounded-full">ALWAYS PREPARED</span>
                )}
            </div>
            <p className="text-sm text-gray-300 mt-2">{spell.description}</p>
            {spell.higherLevel && <p className="text-xs text-gray-400 mt-2 italic"><strong>At Higher Levels:</strong> {spell.higherLevel}</p>}
        </div>
    );
};

export default SpellCard;