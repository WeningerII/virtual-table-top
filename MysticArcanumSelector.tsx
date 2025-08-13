import React from 'react';
import { Character, DndClass, Spell } from './types';
import { useAppSelector } from '../.././state/hooks';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';
import { useCharacterActions } from '../../../hooks/useCharacterActions';

interface MysticArcanumSelectorProps {
    level: number;
    warlockLevel: number;
}

const MysticArcanumSelector: React.FC<MysticArcanumSelectorProps> = ({ level, warlockLevel }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);
    const { setMysticArcanum } = useCharacterActions();
    
    if (!character || !staticDataCache) return null;
    
    const { allSpells, allClasses } = staticDataCache;
    const warlockClassData = allClasses.find(c => c.id === 'warlock');

    if (!warlockClassData) return null;

    const feature = warlockClassData.features.find(f => f.name.includes(`Mystic Arcanum (${level}th level)`));
    if (!feature || warlockLevel < feature.level) return null;

    const spellOptions = allSpells.filter(s => s.level === level && s.classIds?.includes('warlock'));
    const currentSelection = character.mysticArcanum?.[level] || '';

    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setMysticArcanum({ level, spellId: e.target.value || null });
    }

    return (
        <div className="bg-purple-900/30 border border-purple-700 p-4 rounded-lg">
            <h4 className="font-bold text-lg text-purple-300">{feature.name}</h4>
            <p className="text-xs text-gray-400 mb-2">{feature.description}</p>
            <select
                value={currentSelection}
                onChange={handleSelect}
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
            >
                <option value="">-- Choose a {level}th-level spell --</option>
                {spellOptions.map(spell => (
                    <option key={spell.id} value={spell.id}>{spell.name}</option>
                ))}
            </select>
        </div>
    );
};

export default MysticArcanumSelector;