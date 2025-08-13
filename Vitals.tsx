import React, { useState } from 'react';
import { Character, HitDicePool } from './types';
import DeathSavesTracker from './DeathSavesTracker';
import { useAppSelector, useAppDispatch } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';
import { playStateActions } from './playStateSlice';
import { vitalsActions } from './vitalsSlice';
import { usePlayerActions } from '../../hooks/usePlayerActions';

interface VitalsProps {
    onShortRest: () => void;
    onLongRest: () => void;
}

const StatBox: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <div className="bg-gray-700/50 border border-gray-600 rounded-md p-3 text-center flex flex-col justify-center">
        <div className="font-bold text-3xl font-teko tracking-wider">{value}</div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
);

const ConcentrationIndicator: React.FC<{ character: Character }> = ({ character }) => {
    const dispatch = useAppDispatch();
    if (!character.activeConcentration) return null;

    const handleEndConcentration = () => {
        dispatch(playStateActions.setConcentration(undefined));
    }

    return (
        <div className="bg-purple-900/50 border border-purple-700 text-purple-200 rounded-lg p-3 text-center">
            <div className="text-xs uppercase font-bold tracking-wider">Concentrating</div>
            <div className="font-semibold text-lg">{character.activeConcentration.spellName}</div>
            <button onClick={handleEndConcentration} className="text-xs text-purple-300 hover:text-white transition-colors mt-1">End Concentration</button>
        </div>
    );
}

const formatHitDice = (hitDice: HitDicePool) => {
    const parts = Object.entries(hitDice).map(([die, { current, max }]) => {
        return `${current}/${max} ${die}`;
    });
    return parts.join(' + ') || 'N/A';
};

const Vitals: React.FC<VitalsProps> = ({ onShortRest, onLongRest }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();

    const [hpChange, setHpChange] = useState(1);
    const [tempHpInput, setTempHpInput] = useState('');
    
    if (!character) {
        return <div>Loading Vitals...</div>;
    }

    const avatarUrl = character.characterPortraitUrl || character.heritage.resolvedHeritage?.iconUrl || 'https://picsum.photos/seed/avatar/128/128';
    
    const getClassLevels = () => {
        if (!character.classes || character.classes.length === 0) return 'Level 1 Adventurer';
        return character.classes.map(c => `${c.name || c.id} ${c.level}`).join(' / ');
    };

    const initiativeBonus = character.initiative >= 0 ? `+${character.initiative}` : character.initiative;

    const handleDamage = () => {
        dispatch(vitalsActions.resolveDamage({ amount: hpChange }));
    };

    const handleHeal = () => {
        const newHp = Math.min(character.hp, character.currentHp + hpChange);
        dispatch(vitalsActions.updateCurrentHp(newHp));
    };

    const handleAddTempHp = () => {
        const amount = parseInt(tempHpInput, 10);
        if (!isNaN(amount) && amount > 0) {
            dispatch(vitalsActions.updateTempHp(amount));
            setTempHpInput('');
        }
    };
    
    const hpPercentage = (character.hp > 0) ? (character.currentHp / character.hp) * 100 : 0;
    const hpBarColor = hpPercentage > 50 ? 'bg-green-600' : hpPercentage > 25 ? 'bg-yellow-600' : 'bg-red-600';
    const hasArcaneWard = character.arcaneWard && character.arcaneWard.max > 0;
    const wardPercentage = hasArcaneWard ? (character.arcaneWard.current / character.arcaneWard.max) * 100 : 0;


    return (
        <div className="bg-gray-800/70 rounded-lg shadow-lg p-4 border border-gray-700 space-y-4">
            <div className="flex items-center gap-4">
                <img src={avatarUrl} alt="Character Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-gray-600"/>
                <div className="flex-grow">
                    <h2 className="text-3xl font-bold font-teko tracking-wider">{character.name}</h2>
                    <p className="text-gray-400">{getClassLevels()}</p>
                    <p className="text-sm text-gray-400">{character.heritage.resolvedHeritage?.name} | {character.background?.name}</p>
                </div>
            </div>

            <ConcentrationIndicator character={character} />
            
            {character.currentHp <= 0 && <DeathSavesTracker character={character} />}

            <div className="bg-gray-900/50 p-3 rounded-lg space-y-3">
                <div>
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-gray-400 uppercase text-xs">Hit Points</span>
                        <span className="font-bold text-2xl">{character.currentHp} / {character.hp}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 relative overflow-hidden">
                        <div className={`${hpBarColor} h-4 rounded-full transition-all duration-500`} style={{ width: `${hpPercentage}%` }}></div>
                         {character.tempHp > 0 && (
                            <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full opacity-70" style={{ width: `${(character.tempHp / character.hp) * 100}%` }} title={`Temporary HP: ${character.tempHp}`}></div>
                        )}
                    </div>
                </div>

                {hasArcaneWard && (
                    <div>
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-bold text-purple-300 uppercase text-xs">Arcane Ward</span>
                            <span className="font-bold text-xl text-purple-300">{character.arcaneWard.current} / {character.arcaneWard.max}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 relative overflow-hidden">
                            <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${wardPercentage}%` }}></div>
                        </div>
                    </div>
                )}

                 <div className="flex items-center justify-center gap-2">
                    <button onClick={handleDamage} className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-md font-bold text-lg w-full">Damage</button>
                    <input 
                        type="number" 
                        value={hpChange} 
                        onChange={(e) => setHpChange(Math.max(1, parseInt(e.target.value, 10)) || 1)}
                        className="w-20 bg-gray-900 border border-gray-600 rounded-md p-2 text-center text-lg"
                        aria-label="HP Change Amount"
                    />
                    <button onClick={handleHeal} className="px-4 py-2 bg-green-800 hover:bg-green-700 rounded-md font-bold text-lg w-full">Heal</button>
                </div>
                
                <div className="border-t border-gray-700 pt-3">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-400 uppercase text-xs">Temporary HP</span>
                        <span className="font-bold text-2xl text-blue-300">{character.tempHp}</span>
                    </div>
                     <div className="flex items-center justify-center gap-2">
                        <input 
                            type="number" 
                            placeholder="Add Temp HP..."
                            value={tempHpInput} 
                            onChange={(e) => setTempHpInput(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-center"
                            aria-label="Add Temporary HP"
                        />
                        <button onClick={handleAddTempHp} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold text-sm">Add</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
                <StatBox label="Armor Class" value={character.ac} />
                <StatBox label="Initiative" value={initiativeBonus} />
                <StatBox label="Speed" value={`${character.speed}ft`} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-700/50 border border-gray-600 rounded-md p-3">
                     <div className="font-bold text-2xl">{formatHitDice(character.hitDice)}</div>
                     <div className="text-xs text-gray-400 uppercase tracking-wider">Hit Dice</div>
                </div>
                <div className={`bg-gray-700/50 border rounded-md p-3 ${character.exhaustionLevel > 0 ? 'border-yellow-600' : 'border-gray-600'}`}>
                     <div className={`font-bold text-2xl ${character.exhaustionLevel > 0 ? 'text-yellow-400' : ''}`}>{character.exhaustionLevel}</div>
                     <div className="text-xs text-gray-400 uppercase tracking-wider">Exhaustion</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-700">
                <button onClick={onShortRest} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold text-sm">Short Rest</button>
                <button onClick={onLongRest} className="w-full py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold text-sm">Long Rest</button>
            </div>
        </div>
    );
};

export default Vitals;