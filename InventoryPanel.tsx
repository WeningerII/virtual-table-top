import React, { useState, useMemo, useEffect } from 'react';
import { Character, Item, ItemRarity, CharacterItemInstance, ArtificerInfusion } from './types';
import CurrencyManager from '../shared/CurrencyManager';
import { dataService } from './services/data.service';
import { useToast } from './state/ToastContext';
import { inventoryActions } from './engine/slices/inventorySlice';
import { useAppDispatch } from '.././state/hooks';

interface InventoryPanelProps {
    character: Character;
}

const RARITY_COLORS: { [key in ItemRarity]: string } = {
    common: 'border-gray-400 text-gray-300',
    uncommon: 'border-green-500 text-green-400',
    rare: 'border-blue-500 text-blue-400',
    'very rare': 'border-purple-500 text-purple-400',
    legendary: 'border-yellow-500 text-yellow-400',
    artifact: 'border-red-600 text-red-500',
};


const InventoryPanel: React.FC<InventoryPanelProps> = ({ character }) => {
    const dispatch = useAppDispatch();
    const [isOpen, setIsOpen] = useState(true);
    const [itemDetails, setItemDetails] = useState<Map<string, Item>>(new Map());
    const [allInfusions, setAllInfusions] = useState<ArtificerInfusion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchPanelData = async () => {
            setIsLoading(true);
            const newItemDetails = new Map(itemDetails);
            const itemPromises: Promise<void>[] = [];

            const infusionPromise = dataService.getAllInfusions().then(setAllInfusions);

            for (const charItem of character.inventory) {
                if (!newItemDetails.has(charItem.itemId) && !charItem.itemId.startsWith('custom-') && !charItem.itemId.startsWith('conjured-')) {
                    itemPromises.push(
                        dataService.getItemById(charItem.itemId).then(itemData => {
                            if (itemData) {
                                newItemDetails.set(itemData.id, itemData);
                            }
                        })
                    );
                }
            }
            await Promise.all([infusionPromise, ...itemPromises]);
            setItemDetails(newItemDetails);
            setIsLoading(false);
        };

        if (isOpen) {
            fetchPanelData();
        }
    }, [character.inventory, isOpen, itemDetails]);


    const totalWeight = useMemo(() => {
        return character.inventory.reduce((sum, item) => {
            const itemData = itemDetails.get(item.itemId);
            return sum + (itemData?.weight || 0) * item.quantity;
        }, 0).toFixed(2);
    }, [character.inventory, itemDetails]);

    const strScore = (character.abilityScores.STRENGTH.base || 0) + (character.abilityScores.STRENGTH.bonus || 0);

    const handleUseItem = (instanceId: string) => {
        const itemData = itemDetails.get(character.inventory.find(i => i.instanceId === instanceId)!.itemId);
        if (!itemData || !itemData.tags.includes('consumable')) return;
        
        addToast(`Used ${itemData.name}!`);
        dispatch(inventoryActions.useItem({ instanceId }));
    };

    const handleAttune = (itemInstanceId: string) => {
        if (character.attunedItemIds.length >= (character.maxAttunementSlots || 3)) {
            addToast("Attunement limit reached!", "error");
            return;
        }
        dispatch(inventoryActions.attuneItem(itemInstanceId));
    };

    const handleEndAttunement = (itemInstanceId: string) => {
        dispatch(inventoryActions.endAttunement(itemInstanceId));
    };
    
    const handleUpdateMoney = (newMoney: any) => {
        dispatch(inventoryActions.updateMoney(newMoney));
    }

    const attunementSlotsUsed = character.attunedItemIds.length;
    const maxAttunementSlots = character.maxAttunementSlots || 3;

    return (
        <div className="bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 text-left flex justify-between items-center bg-gray-900/50 hover:bg-gray-700/50 transition-colors"
                aria-expanded={isOpen}
                aria-controls="inventory-panel"
            >
                <h3 className="font-bold font-teko text-2xl tracking-wider text-white">INVENTORY</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform text-gray-400 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div id="inventory-panel" className="p-4 space-y-4">
                    <CurrencyManager currency={character.money} onUpdate={handleUpdateMoney} />
                    <div className="bg-gray-900/50 p-2 rounded-lg text-center">
                        <h4 className="font-bold text-gray-400 uppercase text-xs">Weight Carried</h4>
                        <p><span className="font-bold text-lg">{totalWeight}</span> / {strScore * 15} lb. <span className={`text-sm font-bold ${character.encumbranceStatus !== 'none' ? 'text-red-400' : 'text-green-400'}`}>({character.encumbranceStatus.replace('_', ' ')})</span></p>
                    </div>
                    <div className="bg-gray-900/50 p-2 rounded-lg text-center">
                        <h4 className="font-bold text-gray-400 uppercase text-xs">Attunement Slots</h4>
                        <p><span className="font-bold text-lg">{attunementSlotsUsed}</span> / {maxAttunementSlots}</p>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {isLoading ? (
                             <p className="text-center text-gray-500 italic py-4">Loading inventory details...</p>
                        ) : character.inventory.length === 0 ? (
                            <p className="text-center text-gray-500 italic py-4">Inventory is empty.</p>
                        ) : (
                            character.inventory.map((charItem: CharacterItemInstance) => {
                                const itemData = itemDetails.get(charItem.itemId);
                                const displayName = charItem.customProperties?.name || itemData?.name;
                                
                                if (!displayName) return null;

                                const isAttuned = character.attunedItemIds.includes(charItem.instanceId);
                                const infusionData = allInfusions.find(inf => inf.id === charItem.infusionId);
                                const requiresAttunement = itemData?.requiresAttunement || infusionData?.attunement;
                                const rarityClasses = itemData?.rarity ? RARITY_COLORS[itemData.rarity] : 'border-gray-600 text-gray-300';
                                
                                return (
                                    <div key={charItem.instanceId} className={`bg-gray-900/30 p-3 rounded-md border-l-4 ${rarityClasses}`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold">{displayName} {charItem.quantity > 1 ? `(x${charItem.quantity})` : ''}</p>
                                                <div className="flex items-center flex-wrap gap-2 text-xs capitalize">
                                                    {itemData?.rarity && <p className={rarityClasses}>{itemData.rarity}</p>}
                                                    {charItem.isTemporary && <p className="text-cyan-400">(Temporary)</p>}
                                                    {charItem.inscribedRune && <p className="text-yellow-400">(Rune: {charItem.inscribedRune})</p>}
                                                    {charItem.pactWeaponForm && <p className="text-purple-400">(Pact Weapon)</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {itemData?.tags.includes('consumable') && (
                                                    <button onClick={() => handleUseItem(charItem.instanceId)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-semibold">Use</button>
                                                )}
                                                {requiresAttunement && (
                                                    isAttuned ?
                                                        <button onClick={() => handleEndAttunement(charItem.instanceId)} className="px-3 py-1 bg-purple-800 hover:bg-purple-700 rounded-md text-xs font-semibold">End Attunement</button> :
                                                        <button onClick={() => handleAttune(charItem.instanceId)} disabled={attunementSlotsUsed >= maxAttunementSlots} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded-md text-xs font-semibold disabled:bg-gray-600">Attune</button>
                                                )}
                                            </div>
                                        </div>
                                        {itemData?.description && <p className="text-xs text-gray-400 mt-1 italic">{itemData.description}</p>}
                                        {charItem.customProperties?.magicalTinkering && <p className="text-xs text-cyan-300 mt-1">Tinkering: {charItem.customProperties.magicalTinkering}</p>}
                                        {charItem.storedSpell && <p className="text-xs text-yellow-300 mt-1">Stored Spell: {charItem.storedSpell.spellId} ({charItem.charges?.current}/{charItem.charges?.max} charges)</p>}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPanel;