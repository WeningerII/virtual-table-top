import React from 'react';
import { Character } from '../../../types';
import CompanionSheet from '../CompanionSheet';
import HordeSheet from '../HordeSheet';
import ElixirsPanel from '../ElixirsPanel';
import { groupCompanions } from '../../../utils/companions';
import { useAppSelector, useAppDispatch } from '../../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../../state/selectors';
import { usePlayerActions } from '../../../hooks/usePlayerActions';
import { uiActions } from '../../../state/uiSlice';
import Accordion from '../../shared/Accordion';

const CompanionsPanel: React.FC = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character;
    const dispatch = useAppDispatch();
    const { isRollingCompanionAction } = usePlayerActions();

    if (!character) {
        return null;
    }

    const companionGroups = groupCompanions(character.activeCompanions || []);
    const hasCompanions = companionGroups.single.length > 0 || companionGroups.hordes.length > 0;
    const hasElixirs = character.experimentalElixirs && character.experimentalElixirs.length > 0;

    if (!hasCompanions && !hasElixirs) {
        return null; // Don't render the panel at all if there's nothing to show
    }

    return (
        <Accordion title="Companions & Creations">
            <div className="space-y-4">
                <button
                    onClick={() => dispatch(uiActions.openSummoningModal(undefined))}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 rounded-md font-semibold text-sm transition-colors"
                >
                    Summon Creature Library
                </button>

                {hasCompanions ? (
                    <>
                        {companionGroups.single.map(companion => <CompanionSheet key={companion.instanceId} companion={companion} isRolling={isRollingCompanionAction} />)}
                        {companionGroups.hordes.map((horde, index) => <HordeSheet key={`${horde[0].id}-${index}`} group={horde} isRolling={isRollingCompanionAction} />)}
                    </>
                ) : (
                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                        <p className="text-gray-400 text-sm">You have no active companions or summons.</p>
                    </div>
                )}
                
                {hasElixirs && <ElixirsPanel />}
            </div>
        </Accordion>
    );
};

export default CompanionsPanel;