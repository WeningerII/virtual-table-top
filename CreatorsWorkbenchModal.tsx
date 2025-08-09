import React, { useState, useMemo, useEffect } from 'react';
import { Character, ClassFeature, Item, CharacterItemInstance, Rune, Weapon, Tool, DndClass, Spell } from '../../types';
import { useToast } from '../../state/ToastContext';
import { dataService } from '../../services/dataService';
import { copperToCurrency, currencyToCopper } from '../../utils/currency';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../state/selectors';
import { logEvent } from '../../state/logSlice';
import { inventoryActions } from '../../engine/slices/inventorySlice';
import Modal from '../shared/Modal';

interface CreatorsWorkbenchModalProps {
    isOpen: boolean;
    onClose: () => void;
    context: { feature: ClassFeature };
}

// ... (UI components like ArtisanBlessingUI remain the same internally)
const ArtisanBlessingUI: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [selectedItems, setSelectedItems] = useState<string[]>([]); // instanceIds
    const [createdItemName, setCreatedItemName] = useState('');
    const [inventoryDetails, setInventoryDetails] = useState<Map<string, Item>>(new Map());

    useEffect(() => {
        const fetchDetails = async () => {
            if (!character) return;
            const itemIds = character.inventory.map(i => i.itemId);
            const items = await dataService.getItemsByIds(itemIds);
            setInventoryDetails(new Map(items.map(i => [i.id, i])));
        };
        fetchDetails();
    }, [character]);

    const metalItemInstances = useMemo(() => {
        if (!character) return [];
        const metalKeywords = ['chain', 'plate', 'splint', 'ring mail', 'shield', 'mace', 'warhammer', 'sword', 'axe', 'dagger'];
        return character.inventory.filter(inst => {
            const itemData = inventoryDetails.get(inst.itemId);
            return itemData && metalKeywords.some(kw => itemData.name.toLowerCase().includes(kw));
        });
    }, [character, inventoryDetails]);

    const totalValue = useMemo(() => {
        return selectedItems.reduce((total, instanceId) => {
            const instance = character?.inventory.find(i => i.instanceId === instanceId);
            const itemData = instance ? inventoryDetails.get(instance.itemId) : null;
            return total + (itemData?.costInCopper || 0);
        }, 0);
    }, [selectedItems, character, inventoryDetails]);
    
    const handleToggleItem = (instanceId: string) => {
        setSelectedItems(prev => prev.includes(instanceId) ? prev.filter(id => id !== instanceId) : [...prev, instanceId]);
    };

    const handleCreate = () => {
        if (!character || selectedItems.length === 0 || !createdItemName) return;
        const sacrificedValueGp = totalValue / 100;
        if (sacrificedValueGp > 100) {
            addToast("Value of sacrificed items cannot exceed 100 gp.", "error");
            return;
        }
        selectedItems.forEach(instanceId => {
            dispatch(inventoryActions.removeItemInstance({ instanceId, quantity: 1 }));
        });
        dispatch(
            inventoryActions.createItemInstance({
                itemId: `custom-${createdItemName.toLowerCase().replace(/\s/g, '-')}`,
                quantity: 1,
                source: "Artisan's Blessing",
                customProperties: { name: createdItemName, costInCopper: totalValue }
            })
        );
        const message = `Used Artisan's Blessing to create ${createdItemName}.`;
        addToast(`Created ${createdItemName}!`);
        dispatch(logEvent({ type: 'system', message }));
        onClose();
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-300">Choose metal items to sacrifice. The total value cannot exceed 100 gp.</p>
            <div className="bg-gray-900/50 p-2 rounded-md max-h-48 overflow-y-auto space-y-2">
                {metalItemInstances.map(instance => {
                    const itemData = inventoryDetails.get(instance.itemId);
                    if (!itemData) return null;
                    return (
                        <label key={instance.instanceId} className={`flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer ${selectedItems.includes(instance.instanceId) ? 'bg-blue-600' : 'bg-gray-700'}`}>
                             <input type="checkbox" checked={selectedItems.includes(instance.instanceId)} onChange={() => handleToggleItem(instance.instanceId)} className="form-checkbox h-4 w-4 text-blue-500 bg-gray-800 border-gray-600 rounded" />
                             <span>{itemData.name} ({copperToCurrency(itemData.costInCopper).gp} gp)</span>
                        </label>
                    )
                })}
            </div>
            <div className="p-2 bg-gray-900 rounded-md text-center">
                <p className="text-sm text-gray-400">Total Sacrificed Value</p>
                <p className="font-bold text-lg text-yellow-300">{copperToCurrency(totalValue).gp} gp</p>
            </div>
             <div>
                <label htmlFor="created-item-name" className="block text-sm font-medium text-gray-400 mb-1">Name of Created Item</label>
                <input
                    id="created-item-name"
                    type="text"
                    value={createdItemName}
                    onChange={(e) => setCreatedItemName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2"
                />
             </div>
            <div className="flex justify-end pt-4 border-t border-gray-700">
                <button 
                    onClick={handleCreate}
                    disabled={selectedItems.length === 0 || !createdItemName || totalValue / 100 > 100}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500"
                >
                    Create Item
                </button>
            </div>
        </div>
    );
};

const MagicalTinkeringUI: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [selectedItem, setSelectedItem] = useState<CharacterItemInstance | null>(null);
    const [tinkerEffect, setTinkerEffect] = useState<string>('');

    if (!character) return null;

    const tinyItems = character.inventory.filter(i => i.quantity > 0);

    const handleTinker = () => {
        if (!selectedItem || !tinkerEffect) return;
        dispatch(inventoryActions.updateItemInstance({ instanceId: selectedItem.instanceId, customProperties: { ...selectedItem.customProperties, magicalTinkering: tinkerEffect } }));
        const itemName = selectedItem.customProperties?.name || selectedItem.itemId;
        const message = `Used Magical Tinkering on ${itemName}.`;
        addToast(`${itemName} is now tinkered!`);
        dispatch(logEvent({ type: 'system', message }));
        onClose();
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-300">Choose a tiny, nonmagical object and imbue it with a magical property.</p>
            <select onChange={(e) => setSelectedItem(character.inventory.find(i => i.instanceId === e.target.value) || null)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2">
                <option>-- Select an Item --</option>
                {tinyItems.map(i => <option key={i.instanceId} value={i.instanceId}>{i.customProperties?.name || i.itemId}</option>)}
            </select>
            <select onChange={(e) => setTinkerEffect(e.target.value)} disabled={!selectedItem} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 disabled:opacity-50">
                <option>-- Select an Effect --</option>
                <option value="Sheds bright light in a 5-foot radius">Light</option>
                <option value="Emits a recorded sound">Sound</option>
                <option value="Emits a chosen odor or a static visual effect">Odor/Image</option>
            </select>
            <div className="flex justify-end pt-4 border-t border-gray-700">
                <button onClick={handleTinker} disabled={!selectedItem || !tinkerEffect} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500">Apply Tinkering</button>
            </div>
        </div>
    );
};

const RightToolUI: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [allTools, setAllTools] = useState<Tool[]>([]);
    const [selectedToolId, setSelectedToolId] = useState('');

    useEffect(() => {
        dataService.getAllTools().then(tools => setAllTools(tools.filter(t => t.category === "Artisan's Tools")));
    }, []);

    const handleCreate = () => {
        if (!selectedToolId) return;
        const toolData = allTools.find(t => t.id === selectedToolId);
        if (!toolData) return;
        dispatch(inventoryActions.createItemInstance({ itemId: toolData.id, quantity: 1, source: 'The Right Tool for the Job', isTemporary: true }));
        const message = `Used The Right Tool for the Job to create ${toolData.name}.`;
        addToast(`Conjured ${toolData.name}!`);
        dispatch(logEvent({ type: 'system', message }));
        onClose();
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-300">Magically create one set of artisan's tools. They disappear after 1 hour or when you use this feature again.</p>
            <select value={selectedToolId} onChange={e => setSelectedToolId(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2">
                <option>-- Select Artisan's Tools --</option>
                {allTools.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <div className="flex justify-end pt-4 border-t border-gray-700">
                <button onClick={handleCreate} disabled={!selectedToolId} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500">Create Tools</button>
            </div>
        </div>
    );
};

const SpellStoringItemUI: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [selectedItem, setSelectedItem] = useState<CharacterItemInstance | null>(null);
    const [selectedSpellId, setSelectedSpellId] = useState('');

    if (!character || !character.spellcastingInfo) return null;
    
    const eligibleItems = character.inventory.filter(i => {
        return i.itemId.includes('weapon') || i.itemId.includes('focus');
    });

    const eligibleSpells = character.spellcastingInfo.availableSpells.filter(s =>
        (s.level === 1 || s.level === 2) && s.castingTime.includes('1 Action')
    );
    
    const handleStoreSpell = () => {
        if (!selectedItem || !selectedSpellId) return;
        const spell = eligibleSpells.find(s => s.id === selectedSpellId);
        if (!spell || !character.spellcastingInfo) return;
        
        const intMod = Math.floor((character.abilityScores.INTELLIGENCE.base + character.abilityScores.INTELLIGENCE.bonus - 10) / 2);
        const charges = Math.max(1, intMod * 2);

        dispatch(inventoryActions.updateItemInstance({
                instanceId: selectedItem.instanceId,
                storedSpell: { spellId: spell.id, level: spell.level, dc: character.spellcastingInfo.spellSaveDCs['artificer'] },
                charges: { current: charges, max: charges }
            })
        );
        const message = `Stored ${spell.name} in the item!`;
        addToast(message);
        dispatch(logEvent({ type: 'system', message }));
        onClose();
    };
    
    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-300">Store a 1st or 2nd-level Artificer spell with a casting time of 1 action into an item.</p>
             <select onChange={(e) => setSelectedItem(character.inventory.find(i => i.instanceId === e.target.value) || null)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2">
                <option>-- Select an Item to Store Spell In --</option>
                {eligibleItems.map(i => <option key={i.instanceId} value={i.instanceId}>{i.customProperties?.name || i.itemId}</option>)}
            </select>
             <select value={selectedSpellId} onChange={e => setSelectedSpellId(e.target.value)} disabled={!selectedItem} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 disabled:opacity-50">
                <option>-- Select a Spell to Store --</option>
                {eligibleSpells.map(s => <option key={s.id} value={s.id}>{s.name} (Lvl {s.level})</option>)}
            </select>
            <div className="flex justify-end pt-4 border-t border-gray-700">
                <button onClick={handleStoreSpell} disabled={!selectedItem || !selectedSpellId} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500">Store Spell</button>
            </div>
        </div>
    );
};

const MinorConjurationUI: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [objectName, setObjectName] = useState('');

    const handleConjure = () => {
        if (!objectName.trim()) return;
        dispatch(inventoryActions.createItemInstance({
                itemId: `conjured-${objectName.toLowerCase().replace(/\s/g, '-')}`,
                quantity: 1,
                source: "Minor Conjuration",
                isTemporary: true,
                customProperties: { name: objectName }
            })
        );
        const message = `Used Minor Conjuration to create ${objectName}.`;
        addToast(`Conjured ${objectName}!`);
        dispatch(logEvent({ type: 'spell', message }));
        onClose();
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-300">Conjure a nonmagical object you have seen (max 3 ft, 10 lbs). It glows dimly and disappears after 1 hour or if it takes damage.</p>
            <div>
                <label htmlFor="object-name" className="block text-sm font-medium text-gray-400 mb-1">Object to Conjure</label>
                <input
                    id="object-name"
                    type="text"
                    value={objectName}
                    onChange={(e) => setObjectName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2"
                    placeholder="Describe the object you want to conjure (e.g., 'a silver key with intricate runes', 'a length of silk rope', 'a wooden chest with iron bindings')"
                />
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-700">
                <button onClick={handleConjure} disabled={!objectName.trim()} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500">Conjure</button>
            </div>
        </div>
    );
};

const PerformanceOfCreationUI: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [itemName, setItemName] = useState('');
    
    if (!character) return null;
    
    const bardLevel = character.classes.find(c => c.id === 'bard')?.level || 1;
    let maxValueGp = 20;
    if (bardLevel >= 14) maxValueGp = 500;
    else if (bardLevel >= 10) maxValueGp = 200;
    else if (bardLevel >= 6) maxValueGp = 100;

    const handleCreate = () => {
        if (!itemName.trim()) return;
        dispatch(inventoryActions.createItemInstance({
                itemId: `created-${itemName.toLowerCase().replace(/\s/g, '-')}`,
                quantity: 1,
                source: "Performance of Creation",
                isTemporary: true,
                customProperties: { name: itemName, costInCopper: maxValueGp * 100 }
            })
        );
        const message = `Used Performance of Creation to create ${itemName}.`;
        addToast(`Created ${itemName}!`);
        dispatch(logEvent({ type: 'system', message }));
        onClose();
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-300">Create a nonmagical item in an unoccupied space. The item's value can be up to {maxValueGp} gp.</p>
            <div>
                <label htmlFor="item-name" className="block text-sm font-medium text-gray-400 mb-1">Item to Create</label>
                <input
                    id="item-name"
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2"
                    placeholder="Describe the item you want to create (e.g., 'a sturdy hemp rope 50 feet long', 'a leather satchel with brass buckles', 'a wooden ladder with iron rungs')"
                />
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-700">
                <button onClick={handleCreate} disabled={!itemName.trim()} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500">Create</button>
            </div>
        </div>
    );
};

const MasterScrivenerUI: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [allSpells, setAllSpells] = useState<Map<string, Spell>>(new Map());
    const [selectedSpellId, setSelectedSpellId] = useState('');

    useEffect(() => {
        const fetchAllSpells = async () => {
             const spells = await dataService.getAllSpells();
             setAllSpells(new Map(spells.map(s => [s.id, s])));
        }
        fetchAllSpells();
    }, []);

    if (!character || !character.spellbook) return null;
    
    const eligibleSpells = character.spellbook.map(id => allSpells.get(id)).filter((s): s is Spell => !!s && (s.level === 1 || s.level === 2));

    const handleCreateScroll = () => {
        if (!selectedSpellId) return;
        const spell = allSpells.get(selectedSpellId);
        if (!spell) return;

        const scrollName = `Scroll of ${spell.name}`;
        dispatch(inventoryActions.createItemInstance({
                itemId: `scroll-${spell.id}`,
                quantity: 1,
                source: "Master Scrivener",
                isTemporary: true, 
                customProperties: { name: scrollName, spellId: spell.id }
            })
        );
        const message = `Used Master Scrivener to create a ${scrollName}.`;
        addToast(`Created ${scrollName}!`);
        dispatch(logEvent({ type: 'system', message }));
        onClose();
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-300">Choose a 1st or 2nd-level spell from your spellbook to create a magic scroll. This takes 1 minute.</p>
            <select value={selectedSpellId} onChange={e => setSelectedSpellId(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2">
                <option value="">-- Select a Spell --</option>
                {eligibleSpells.map(s => <option key={s.id} value={s.id}>{s.name} (Lvl {s.level})</option>)}
            </select>
            <div className="flex justify-end pt-4 border-t border-gray-700">
                <button onClick={handleCreateScroll} disabled={!selectedSpellId} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500">Create Scroll</button>
            </div>
        </div>
    );
};

const PactOfTheBladeUI: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [mode, setMode] = useState<'conjure' | 'bond'>('conjure');
    const [selectedWeaponId, setSelectedWeaponId] = useState('');
    const [itemIndex, setItemIndex] = useState<Item[]>([]);
    const [inventoryDetails, setInventoryDetails] = useState<Map<string, Item>>(new Map());

    useEffect(() => {
        const fetchWeapons = async () => {
            const allItems = await dataService.getAllItems();
            setItemIndex(allItems.filter(i => i.category === 'Weapon'));
            const invItems = await dataService.getItemsByIds(character?.inventory.map(i => i.itemId) || []);
            setInventoryDetails(new Map(invItems.map(i => [i.id, i])));
        };
        fetchWeapons();
    }, [character]);

    if (!character) return null;

    const eligibleWeaponsToBond = character.inventory.filter(i => {
        const itemData = inventoryDetails.get(i.itemId);
        return itemData && itemData.category === 'Weapon' && !i.pactWeaponForm;
    });
    
    const meleeWeapons = itemIndex.filter(i => {
        const weapon = i as Weapon;
        return weapon.weaponType && !weapon.properties.includes('range') && !weapon.properties.includes('ammunition');
    });

    const handleConfirm = () => {
        if (!selectedWeaponId) return;

        if (mode === 'conjure') {
            const weaponData = meleeWeapons.find(w => w.id === selectedWeaponId);
            if (weaponData) {
                dispatch(inventoryActions.forgePactWeapon({ itemId: `pact-weapon-${weaponData.id}`, name: weaponData.name }));
                const message = `Conjured a ${weaponData.name} as your pact weapon!`;
                addToast(message);
                dispatch(logEvent({ type: 'system', message }));
            }
        } else {
            const itemInstance = eligibleWeaponsToBond.find(i => i.instanceId === selectedWeaponId);
            if (itemInstance) {
                dispatch(inventoryActions.forgePactWeapon({ itemId: itemInstance.itemId, instanceId: selectedWeaponId }));
                const itemName = inventoryDetails.get(itemInstance.itemId)?.name || 'weapon';
                const message = `Bonded with your ${itemName} as a pact weapon!`;
                addToast(message);
                dispatch(logEvent({ type: 'system', message }));
            }
        }
        onClose();
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-center bg-gray-900 rounded-md p-1">
                <button onClick={() => setMode('conjure')} className={`w-1/2 p-2 rounded-md font-semibold text-sm ${mode === 'conjure' ? 'bg-blue-600' : 'text-gray-300'}`}>Conjure Weapon</button>
                <button onClick={() => setMode('bond')} className={`w-1/2 p-2 rounded-md font-semibold text-sm ${mode === 'bond' ? 'bg-blue-600' : 'text-gray-300'}`}>Bond to Weapon</button>
            </div>
            {mode === 'conjure' ? (
                <select value={selectedWeaponId} onChange={e => setSelectedWeaponId(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2">
                    <option>-- Select a Melee Weapon --</option>
                    {meleeWeapons.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
            ) : (
                 <select value={selectedWeaponId} onChange={e => setSelectedWeaponId(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2">
                    <option>-- Select an Inventory Weapon --</option>
                    {eligibleWeaponsToBond.map(i => <option key={i.instanceId} value={i.instanceId}>{inventoryDetails.get(i.itemId)?.name || 'Unknown'}</option>)}
                </select>
            )}
            <div className="flex justify-end pt-4 border-t border-gray-700">
                <button onClick={handleConfirm} disabled={!selectedWeaponId} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500">Confirm</button>
            </div>
        </div>
    );
};

const CreatorsWorkbenchModal: React.FC<CreatorsWorkbenchModalProps> = ({ isOpen, onClose, context }) => {
    
    const renderContent = () => {
        switch (context.feature.id) {
            case 'forge-channel-divinity-artisans-blessing-2': return <ArtisanBlessingUI onClose={onClose} />;
            case 'artificer-magical-tinkering-1': return <MagicalTinkeringUI onClose={onClose} />;
            case 'artificer-right-tool-3': return <RightToolUI onClose={onClose} />;
            case 'artificer-spell-storing-item-11': return <SpellStoringItemUI onClose={onClose} />;
            case 'conjuration-minor-conjuration-2': return <MinorConjurationUI onClose={onClose} />;
            case 'scribes-master-scrivener-10': return <MasterScrivenerUI onClose={onClose} />;
            case 'creation-performance-of-creation-3': return <PerformanceOfCreationUI onClose={onClose} />;
            case 'warlock-pact-of-the-blade-3': return <PactOfTheBladeUI onClose={onClose} />;
            default:
                return <p className="text-gray-400">This creator feature's UI has not been implemented yet.</p>;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={context.feature.name} maxWidth="max-w-lg">
            {renderContent()}
        </Modal>
    );
};

export default CreatorsWorkbenchModal;