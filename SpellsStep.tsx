import React from 'react';
import { useAppSelector } from '../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../state/selectors';
import KnownSpellsManager from './spells/KnownSpellsManager';
import PreparedSpellsManager from './spells/PreparedSpellsManager';
import WizardSpellbookManager from './spells/WizardSpellbookManager';

const SpellsStep: React.FC = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);
    const { spellcastingInfo } = character || {};
    
    if (!character || !staticDataCache || !spellcastingInfo || Object.keys(spellcastingInfo.spellcastingAbilities).length === 0) {
        return (
            <div>
                <h2 className="text-2xl font-bold font-teko tracking-wide mb-4">SPELLS</h2>
                <div className="text-center bg-gray-900/50 p-8 rounded-lg">
                    <p className="text-gray-400">This character does not have any spellcasting abilities from their selected classes.</p>
                </div>
            </div>
        );
    }
    
    const wizardClassData = staticDataCache.allClasses.find(c => character.classes.some(cc => cc.id === 'wizard' && cc.id === c.id));
    const preparedCasterClasses = staticDataCache.allClasses.filter(c => character.classes.some(cc => cc.id === c.id) && c.spellcasting?.preparationType === 'prepared' && c.id !== 'wizard');
    const knownCasterClasses = staticDataCache.allClasses.filter(c => character.classes.some(cc => cc.id === c.id) && c.spellcasting?.preparationType === 'known');

    return (
        <div>
            <h2 className="text-2xl font-bold font-teko tracking-wide mb-4">SPELLS</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-900/50 p-4 rounded-lg">
                {Object.entries(spellcastingInfo.spellcastingAbilities).map(([classId, ability]) => {
                    const className = character.classes.find(c => c.id === classId)?.name || classId;
                    const dc = spellcastingInfo.spellSaveDCs[classId];
                    const attack = spellcastingInfo.spellAttackBonuses[classId];

                    return (
                        <div key={classId} className="col-span-1 grid grid-cols-2 gap-4">
                             <div className="text-center bg-gray-800 p-3 rounded-md">
                                <div className="font-bold text-3xl">{dc}</div>
                                <div className="text-xs text-gray-400 uppercase">{className} Spell Save DC</div>
                            </div>
                            <div className="text-center bg-gray-800 p-3 rounded-md">
                                <div className="font-bold text-3xl">+{attack}</div>
                                <div className="text-xs text-gray-400 uppercase">{className} Spell Attack</div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {wizardClassData && <WizardSpellbookManager classData={wizardClassData} />}
            
            {knownCasterClasses.map(cd => (
                 <KnownSpellsManager key={cd.id} classData={cd} />
            ))}

            {preparedCasterClasses.length > 0 && (
                <PreparedSpellsManager classData={preparedCasterClasses} />
            )}
        </div>
    );
};

export default SpellsStep;