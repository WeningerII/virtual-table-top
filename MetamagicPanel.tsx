import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';
import { Character, Metamagic } from './types';
import { dataService } from 'services./data.service';

const MetamagicPanel: React.FC = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const [allMetamagic, setAllMetamagic] = useState<Metamagic[]>([]);

    useEffect(() => {
        dataService.getAllMetamagic().then(setAllMetamagic);
    }, []);

    const knownMetamagic = useMemo(() => {
        if (!character || !character.selectedMetamagic) return [];
        return allMetamagic.filter(m => character.selectedMetamagic.includes(m.id));
    }, [character, allMetamagic]);

    if (!character || knownMetamagic.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            {knownMetamagic.map(meta => (
                <div key={meta.id} className="bg-gray-900/30 p-3 rounded-md border-l-4 border-pink-500">
                    <p className="font-semibold text-pink-300">{meta.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{meta.description}</p>
                </div>
            ))}
        </div>
    );
};

export default MetamagicPanel;
