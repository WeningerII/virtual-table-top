import React from 'react';
import { Character } from './types';
import Accordion from '../../shared/Accordion';
import Vitals from '../Vitals';
import FeaturesPanel from '../FeaturesPanel';
import ResourcePanel from '../ResourcePanel';
import { useAppSelector } from '../.././state/hooks';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';
import { usePlayerActions } from '../../../hooks/usePlayerActions';

const CharacterTab: React.FC = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character;
    const { 
        handleShortRest,
        handleLongRest,
    } = usePlayerActions();
    
    if (!character) {
        return null;
    }

    return (
        <div className="space-y-4">
            <Accordion title="Vitals" startsOpen><Vitals onShortRest={handleShortRest} onLongRest={handleLongRest} /></Accordion>
            <ResourcePanel />
            {character.allFeatures && <FeaturesPanel character={character} />}
        </div>
    );
};

export default CharacterTab;