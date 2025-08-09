import React, { useState, useMemo, useEffect } from 'react';
import { Character, CharacterItemInstance, Item, EquipmentPack, Armor, DndClass } from '../../types';
import { currencyToCopper, copperToCurrency } from '../../utils/currency';
import CurrencyManager from '../shared/CurrencyManager';
import InlineStartingEquipmentSelector from './InlineStartingEquipmentSelector';
import { useAppSelector } from '../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../state/selectors';
import { useCharacterActions } from '../../hooks/useCharacterActions';

interface EquipmentStepProps {}

const EquipmentStep: React.FC<EquipmentStepProps> = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);
    const { updateMoney, updateInventory, equipItem, unequipItem, setArcaneArmor } = useCharacterActions();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState<string>('All');
    
    if (!character || !staticDataCache) return null;
    
    const { allItems, equipmentPacks, allClasses } = staticDataCache;
    const itemIndex = allItems.map(i => ({ id: i.id, name: i.name, tags: i.tags, costInCopper: i.costInCopper, sourceFile: '' }));
    const startingClass = allClasses.find(c => c.id === character.classes[0]?.id);

    const totalCopper = useMemo(() => currencyToCopper(character.money), [character.money]);

    const artificerClass = character.classes.find(c => c.id === 'artificer');
    const isArmorer = artificerClass && artificerClass.level >= 3 && artificerClass.subclassId === 'armorer';

    const handleBuyItem = (item: { id: string, costInCopper: number }, quantity: number = 1) => {
        if (totalCopper < item.costInCopper * quantity) {
            alert("Not enough money!");
            return;
        }

        const newMoney = copperToCurrency(totalCopper - item.costInCopper * quantity);
        const existingItem = character.inventory.find(i => i.itemId === item.id);
        let newInventory: CharacterItemInstance[];

        if (existingItem) {
            newInventory = character.inventory.map(i => 
                i.itemId === item.id ? { ...i, quantity: i.quantity + quantity } : i
            );
        } else {
            newInventory = [...character.inventory, { instanceId: crypto.randomUUID(), itemId: item.id, quantity }];
        }
        updateMoney(newMoney);
        updateInventory(newInventory);
    };
    
    const handleBuyPack = (pack: EquipmentPack) => {
        if (totalCopper < pack.costInCopper) {
            alert("Not enough money for this pack!");
            return;
        }
        const newMoney = copperToCurrency(totalCopper - pack.costInCopper);
        let tempInventory = [...character.inventory];

        pack.contents.forEach(packItem => {
            const existing = tempInventory.find(i => i.itemId === packItem.itemId);
            if(existing) {
                tempInventory = tempInventory.map(i => i.itemId === packItem.itemId ? {...i, quantity: i.quantity + packItem.quantity} : i);
            } else {
                tempInventory.push({itemId: packItem.itemId, quantity: packItem.quantity, instanceId: crypto.randomUUID()});
            }
        });

        updateMoney(newMoney);
        updateInventory(tempInventory);
    };

    const handleSellItem = (characterItem: CharacterItemInstance) => {
        const itemData = allItems.find(i => i.id === characterItem.itemId);
        if (!itemData) return;
        
        Object.entries(character.equippedItems).forEach(([slot, instanceId]) => {
            if (instanceId === characterItem.instanceId) {
                handleUnequipWrapper(slot as keyof typeof character.equippedItems);
            }
        });

        if (character.arcaneArmorItemId === characterItem.instanceId) handleSetArcaneArmorWrapper(undefined);

        const newMoney = copperToCurrency(totalCopper + Math.floor(itemData.costInCopper / 2)); // Sell for half price
        let newInventory: CharacterItemInstance[];
        if (characterItem.quantity > 1) {
             newInventory = character.inventory.map(i => 
                i.instanceId === characterItem.instanceId ? { ...i, quantity: i.quantity - 1 } : i
            );
        } else {
            newInventory = character.inventory.filter(i => i.instanceId !== characterItem.instanceId);
        }
        updateMoney(newMoney);
        updateInventory(newInventory);
    };

    const handleUnequipWrapper = (slot: keyof typeof character.equippedItems) => {
        if (slot === 'armor' && isArmorer) {
            handleSetArcaneArmorWrapper(undefined); // Arcane armor must be worn
        }
        unequipItem({ slot });
    };
    
    const handleSetArcaneArmorWrapper = (instanceId?: string, model?: 'guardian' | 'infiltrator') => {
        setArcaneArmor({ arcaneArmorItemId: instanceId, armorModel: model });
        if (instanceId) {
            equipItem({ instanceId: instanceId, slot: 'armor' });
        }
    }


    const totalWeight = useMemo(() => {
        return character.inventory.reduce((sum, item) => {
            const itemData = allItems.find(i => i.id === item.itemId);
            return sum + (itemData?.weight || 0) * item.quantity;
        }, 0).toFixed(2);
    }, [character.inventory, allItems]);

    const strScore = (character.abilityScores.STRENGTH.base || 0) + (character.abilityScores.STRENGTH.bonus || 0);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        itemIndex.forEach(item => { item.tags?.forEach(tag => tags.add(tag)); });
        if (equipmentPacks.length > 0) { tags.add('equipment pack'); }
        return ['All', ...Array.from(tags).sort()];
    }, [itemIndex, equipmentPacks]);

    const filteredItems = useMemo(() => {
        return itemIndex.filter(item => {
            const tagMatch = selectedTag === 'All' || item.tags?.includes(selectedTag);
            const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            return tagMatch && searchMatch;
        });
    }, [searchTerm, selectedTag, itemIndex]);
    
    const prettyCost = (cost: number) => {
        const c = copperToCurrency(cost);
        let parts = [];
        if (c.pp > 0) parts.push(`${c.pp} pp`);
        if (c.gp > 0) parts.push(`${c.gp} gp`);
        if (c.ep > 0) parts.push(`${c.ep} ep`);
        if (c.sp > 0) parts.push(`${c.sp} sp`);
        if (c.cp > 0) parts.push(`${c.cp} cp`);
        if (parts.length === 0) return '0 cp';
        return parts.join(' ');
    };

    const findItemByInstanceId = (instanceId?: string) => {
        if (!instanceId) return undefined;
        const inventoryItem = character.inventory.find(i => i.instanceId === instanceId);
        return inventoryItem ? allItems.find(i => i.id === inventoryItem.itemId) : undefined;
    };
    
    const EquippedItemRow: React.FC<{slot: keyof typeof character.equippedItems, item: Item | undefined}> = ({slot, item}) => (
        <div className="bg-gray-800 p-2 rounded-md flex items-center justify-between">
            <span className="text-sm font-semibold capitalize">{slot.replace('Hand', ' Hand')}:</span>
            {item ? <span className="text-sm">{item.name} <button onClick={() => handleUnequipWrapper(slot)} className="ml-2 text-red-400 text-xs">(unequip)</button></span> : <span className="text-sm text-gray-500">None</span>}
        </div>
    );

    const showPacks = selectedTag === 'All' || selectedTag === 'equipment pack';

    return (
        <div>
            <h2 className="text-2xl font-bold font-teko tracking-wide mb-4">EQUIPMENT & INVENTORY</h2>

            {!character.startingEquipmentGranted && startingClass && (
                <InlineStartingEquipmentSelector startingClass={startingClass} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                <div className="lg:col-span-7 bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="text-xl font-bold font-teko tracking-wide mb-3">Marketplace</h3>
                    <input type="text" placeholder="Search by name, type, or tag (e.g., 'sword', 'armor', 'magical')" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 mb-3"/>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {allTags.map(tag => (
                            <button key={tag} onClick={() => setSelectedTag(tag)} className={`capitalize px-3 py-1 text-xs font-semibold rounded-full transition-colors ${selectedTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{tag}</button>
                        ))}
                    </div>
                     <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {showPacks && equipmentPacks.map(pack => (
                            <div key={pack.id} className="bg-gray-800 p-3 rounded-md flex items-center justify-between">
                                <div><p className="font-bold">{pack.name}</p><p className="text-xs text-yellow-400">{prettyCost(pack.costInCopper)}</p></div>
                                <button onClick={() => handleBuyPack(pack)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-sm">Buy Pack</button>
                            </div>
                        ))}
                        {filteredItems.map(item => (
                            <div key={item.id} className="bg-gray-800 p-3 rounded-md flex items-center justify-between">
                                <div><p className="font-bold">{item.name}</p><p className="text-xs text-gray-400"><span className="text-yellow-400">{prettyCost(item.costInCopper)}</span></p></div>
                                <button onClick={() => handleBuyItem(item)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-sm">Buy</button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-5 bg-gray-900/50 p-4 rounded-lg">
                     <h3 className="text-xl font-bold font-teko tracking-wide mb-3">Character Inventory</h3>
                     <CurrencyManager currency={character.money} onUpdate={updateMoney} />
                     <div className="bg-gray-800 p-3 rounded-lg my-4 text-center">
                        <h4 className="font-bold text-gray-400 uppercase text-sm">Weight Carried</h4>
                        <p><span className="font-bold text-xl">{totalWeight}</span> / {strScore * 15} lb.</p>
                     </div>
                     <div className="space-y-3">
                        <div>
                            <h4 className="font-bold text-gray-400 uppercase text-sm mb-2">Equipped</h4>
                            <div className="space-y-2">
                                <EquippedItemRow slot="mainHand" item={findItemByInstanceId(character.equippedItems.mainHand)} />
                                <EquippedItemRow slot="offHand" item={findItemByInstanceId(character.equippedItems.offHand)} />
                                <EquippedItemRow slot="armor" item={findItemByInstanceId(character.equippedItems.armor)} />
                                <EquippedItemRow slot="shield" item={findItemByInstanceId(character.equippedItems.shield)} />
                                
                                {isArmorer && (
                                     <div className="bg-purple-900/30 border border-purple-700 p-3 rounded-md">
                                        <h5 className="text-sm font-bold text-purple-300 mb-2">Arcane Armor</h5>
                                        {findItemByInstanceId(character.arcaneArmorItemId) ? (
                                            <div>
                                                <p className="font-semibold text-sm mb-2">{findItemByInstanceId(character.arcaneArmorItemId)!.name}</p>
                                                <div className="flex items-center justify-center gap-1 bg-gray-900/50 p-1 rounded-md mb-2">
                                                    {(['guardian', 'infiltrator'] as const).map(model => ( <button key={model} onClick={() => handleSetArcaneArmorWrapper(character.arcaneArmorItemId, model)} className={`w-1/2 p-1 rounded-md font-semibold text-xs transition-colors ${artificerClass?.armorModel === model ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}>{model.charAt(0).toUpperCase() + model.slice(1)}</button>))}
                                                </div>
                                                <button onClick={() => handleSetArcaneArmorWrapper(undefined)} className="w-full text-xs text-red-400 hover:text-red-300 mt-1">Remove Arcane Armor</button>
                                            </div>
                                        ) : ( <p className="text-xs text-center text-gray-400">No Arcane Armor designated.</p> )}
                                     </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-400 uppercase text-sm mb-2 mt-4">Backpack</h4>
                             <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {character.inventory.length === 0 && <p className="text-center text-gray-500 italic">Inventory is empty.</p>}
                                {character.inventory.map(charItem => {
                                    const itemData = allItems.find(i => i.id === charItem.itemId);
                                    if (!itemData) return null;
                                    const isEquipped = Object.values(character.equippedItems).includes(charItem.instanceId);
                                    const isArcaneArmor = character.arcaneArmorItemId === charItem.instanceId;

                                    return (
                                        <div key={charItem.instanceId} className={`p-3 rounded-md flex items-center justify-between ${isArcaneArmor ? 'bg-purple-900/30 border-l-4 border-purple-600' : 'bg-gray-800'}`}>
                                            <div><p className="font-bold">{itemData.name} {charItem.quantity > 1 && `(x${charItem.quantity})`}</p><p className="text-xs text-gray-400">{(itemData.weight * charItem.quantity).toFixed(2)} lb.</p></div>
                                            <div className="flex items-center flex-wrap justify-end gap-2">
                                                {itemData.tags.includes('weapon') && !isEquipped && <button onClick={() => equipItem({ instanceId: charItem.instanceId, slot: 'mainHand' })} className="px-2 py-1 bg-green-700 hover:bg-green-600 rounded-md text-xs">Equip Main</button>}
                                                {itemData.tags.includes('weapon') && !isEquipped && <button onClick={() => equipItem({ instanceId: charItem.instanceId, slot: 'offHand' })} className="px-2 py-1 bg-green-700 hover:bg-green-600 rounded-md text-xs">Equip Off</button>}
                                                {itemData.tags.includes('armor') && !itemData.tags.includes('shield') && !isEquipped && <button onClick={() => equipItem({ instanceId: charItem.instanceId, slot: 'armor' })} className="px-2 py-1 bg-green-700 hover:bg-green-600 rounded-md text-xs">Equip</button>}
                                                {itemData.tags.includes('shield') && !isEquipped && <button onClick={() => equipItem({ instanceId: charItem.instanceId, slot: 'shield' })} className="px-2 py-1 bg-green-700 hover:bg-green-600 rounded-md text-xs">Equip</button>}
                                                {isArmorer && itemData.tags.includes('armor') && (itemData as Armor).armorType === 'heavy' && !isArcaneArmor && <button onClick={() => handleSetArcaneArmorWrapper(charItem.instanceId, 'guardian')} className="px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded-md text-xs">Make Arcane</button>}
                                                <button onClick={() => handleSellItem(charItem)} className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded-md text-xs">Sell</button>
                                            </div>
                                        </div>
                                    )
                                })}
                             </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default EquipmentStep;
