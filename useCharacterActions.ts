import { useMemo } from 'react';
import { useAppDispatch } from './hooks';
import { metaActions } from './metaSlice';
import { abilitiesActions } from './abilitiesSlice';
import { proficienciesActions } from './proficienciesSlice';
import { inventoryActions } from './inventorySlice';
import { spellsActions } from './spellsSlice';
import { Action } from 'engine/characterActions';

// A hook that returns a memoized object of dispatchable actions.
// This is the primary way components should interact with the character state.
export const useCharacterActions = () => {
    const dispatch = useAppDispatch();

    const actions = useMemo(() => {
        const createActionDispatcher = <T,>(actionCreator: (payload: T) => Action) => 
            (payload: T) => dispatch(actionCreator(payload));

        return {
            // Meta Actions
            updateMetaPartial: createActionDispatcher(metaActions.updatePartial),
            updateClasses: createActionDispatcher(metaActions.updateClasses),
            setHeritage: createActionDispatcher(metaActions.setHeritage),
            setBackground: createActionDispatcher(metaActions.setBackground),
            updateBackstory: createActionDispatcher(metaActions.updateBackstoryDetails),
            updatePhysical: createActionDispatcher(metaActions.updatePhysicalCharacteristics),
            setArtificerChoice: createActionDispatcher(metaActions.setArtificerSubclassChoice),

            // Abilities Actions
            updateAbilityScores: createActionDispatcher(abilitiesActions.updateAbilityScores),
            
            // Proficiencies Actions
            updateFeats: createActionDispatcher(proficienciesActions.updateFeats),
            setProficiencyChoice: createActionDispatcher(proficienciesActions.setProficiencyChoices),
            setFightingStyle: createActionDispatcher(proficienciesActions.setFightingStyleChoice),
            setInvocations: createActionDispatcher(proficienciesActions.setInvocations),
            setMetamagic: createActionDispatcher(proficienciesActions.setMetamagic),
            setManeuvers: createActionDispatcher(proficienciesActions.setFighterManeuvers),
            setRunes: createActionDispatcher(proficienciesActions.setFighterRunes),
            setTotem: createActionDispatcher(proficienciesActions.setBarbarianTotemChoice),

            // Inventory Actions
            updateMoney: createActionDispatcher(inventoryActions.updateMoney),
            updateInventory: createActionDispatcher(inventoryActions.updateInventory),
            grantEquipment: createActionDispatcher(inventoryActions.grantEquipment),
            equipItem: createActionDispatcher(inventoryActions.equipItem),
            unequipItem: createActionDispatcher(inventoryActions.unequipItem),
            setArcaneArmor: createActionDispatcher(inventoryActions.setArcaneArmor),
            attuneItem: createActionDispatcher(inventoryActions.attuneItem),

            // Spells Actions
            updateKnownSpells: createActionDispatcher(spellsActions.updateKnownSpells),
            setMysticArcanum: createActionDispatcher(spellsActions.setMysticArcanum),
            scribeSpell: createActionDispatcher(spellsActions.scribeSpell),
            prepareSpell: createActionDispatcher(spellsActions.prepareSpell),
            unprepareSpell: createActionDispatcher(spellsActions.unprepareSpell),
            updateKnownInfusions: createActionDispatcher(spellsActions.updateKnownInfusions),
        };
    }, [dispatch]);

    return actions;
};
