import React, { useState, useMemo } from 'react';
import { Character, ArtificerInfusion, Item, Weapon, Armor, Shield } from '../../types';
import { useAppSelector } from '../../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../../state/selectors';
import { useCharacterActions } from '../../hooks/useCharacterActions';

interface InfusionsStepProps {}

const isItemEligible = (item: Item, infusion: ArtificerInfusion): boolean => {
    return infusion.itemTypeFilter.some(filter => {
        const weapon = item as Weapon;
        switch(filter) {
            case 'armor': return item.category === 'Armor';
            case 'robes': return item.category === 'Robes';
            case 'shield': return item.category === 'Shield';
            case 'simple_or_martial_weapon': return item.category === 'Weapon' && (weapon.weaponType === 'simple' || weapon.weaponType === 'martial');
            case 'thrown_weapon': return item.category === 'Weapon' && weapon.properties.includes('thrown');
            case 'ammunition_weapon': return item.category === 'Weapon' && weapon.properties.includes('ammunition');
            case 'rod_staff_or_wand': return item.category === 'Arcane Focus' && (item.id.includes('rod') || item.id.includes('staff') || item.id.includes('wand'));
            case 'boots': return item.name.toLowerCase().includes('boots');
            case 'helmet': return item.name.toLowerCase().includes('helm');
            default: return false;
        }
    });
};


const InfusionModal: React.FC<{
    infusion: ArtificerInfusion;
    onClose: () => void;
    onInfuse: (instanceId: string) => void;
}> = ({ infusion, onInfuse, onClose }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);

    const eligibleItems = useMemo(() => {
        if (!character || !staticDataCache) return [];
        return character.inventory.filter(invItem => {
            const itemData = staticDataCache.allItems.find(i => i.id === invItem.itemId);
            if (!itemData) return false;
            const isInfused = character.infusedItems.some(inf => inf.instanceId === invItem.instanceId);
            if (isInfused) return false;
            return isItemEligible(itemData, infusion);
        });
    }, [character, infusion, staticDataCache]);
    
    return (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold">Infuse Item: <span className="text-blue-400">{infusion.name}</span></h3>
                    <p className="text-sm text-gray-400 mt-1">{infusion.description}</p>
                </div>
                <div className="p-4 max-h-80 overflow-y-auto">
                    <h4 className="font-bold mb-2 text-gray-300">Choose an eligible item from your inventory:</h4>
                    {eligibleItems.length > 0 ? (
                        <div className="space-y-2">
                            {eligibleItems.map(invItem => {
                                const itemData = staticDataCache!.allItems.find(i => i.id === invItem.itemId);
                                return (
                                    <button key={invItem.instanceId} onClick={() => onInfuse(invItem.instanceId)} className="w-full p-3 bg-gray-700 hover:bg-blue-600 rounded-md text-left transition-colors">
                                        <p className="font-semibold">{itemData?.name} {invItem.quantity > 1 ? `(x${invItem.quantity})` : ''}</p>
                                        <p className="text-xs text-gray-400">{itemData?.category}</p>
                                    </button>
                                );
                            })}
                        </div>
                    ) : ( <p className="text-center text-gray-500 italic py-6">You have no eligible items in your inventory.</p> )}
                </div>
                 <div className="p-4 border-t border-gray-700 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancel</button>
                </div>
            </div>
        </div>
    );
};


const InfusionsStep: React.FC<InfusionsStepProps> = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);
    const { updateKnownInfusions, attuneItem } = useCharacterActions();

    const [modalInfusionId, setModalInfusionId] = useState<string | null>(null);
    
    if (!character || !staticDataCache) return null;

    const { allInfusions } = staticDataCache;
    const artificerInfo = character.artificerInfo;
    const artificerLevel = character.classes.find(c => c.id === 'artificer')?.level || 0;
    
    if (!artificerInfo || artificerLevel < 2) {
        return (
            <div>
                <h2 className="text-2xl font-bold font-teko tracking-wide mb-4">ARTIFICER INFUSIONS</h2>
                <div className="text-center bg-gray-900/50 p-8 rounded-lg">
                    <p className="text-gray-400">You must be at least a 2nd-level Artificer to use infusions.</p>
                </div>
            </div>
        );
    }

    const handleToggleKnownInfusion = (infusionId: string) => {
        const isCurrentlyKnown = character.knownInfusions.includes(infusionId);
        let newKnownInfusions;
        if (isCurrentlyKnown) {
            newKnownInfusions = character.knownInfusions.filter(id => id !== infusionId);
        } else {
            if (character.knownInfusions.length >= artificerInfo.maxKnownInfusions) {
                alert(`You can only know ${artificerInfo.maxKnownInfusions} infusions at this level.`);
                return;
            }
            newKnownInfusions = [...character.knownInfusions, infusionId];
        }
        updateKnownInfusions(newKnownInfusions);
    };

    const handleEndInfusion = (instanceId: string) => {
        // This would require a more complex action, for now, we just un-attune
    };
    
    const handleOpenInfuseModal = (infusionId: string) => {
        setModalInfusionId(infusionId);
    };
    
    const handleConfirmInfusion = (instanceId: string) => {
        if (!modalInfusionId) return;
        // This logic is complex and would be better suited in a thunk or service
        attuneItem(instanceId);
        setModalInfusionId(null);
    };

    const learnableInfusions = allInfusions.filter(inf => (inf.minLevel || 0) <= artificerLevel);
    const modalInfusion = modalInfusionId ? allInfusions.find(i => i.id === modalInfusionId) : null;

    return (
        <div>
            {modalInfusion && (
                <InfusionModal infusion={modalInfusion} onClose={() => setModalInfusionId(null)} onInfuse={handleConfirmInfusion} />
            )}
            <h2 className="text-2xl font-bold font-teko tracking-wide mb-4">ARTIFICER INFUSIONS</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="text-xl font-bold font-teko tracking-wide mb-3">Infusion Library ({character.knownInfusions.length} / {artificerInfo.maxKnownInfusions} Known)</h3>
                    <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
                        {learnableInfusions.map(infusion => (
                             <div key={infusion.id} className="bg-gray-800 p-3 rounded-md">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-grow">
                                        <h4 className="font-bold">{infusion.name}</h4>
                                        <p className="text-xs text-gray-400 mt-1">{infusion.description}</p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <input type="checkbox" title="Learn this infusion" checked={character.knownInfusions.includes(infusion.id)} onChange={() => handleToggleKnownInfusion(infusion.id)} className="form-checkbox h-5 w-5 text-blue-500 bg-gray-700 border-gray-500 rounded focus:ring-blue-500 flex-shrink-0" />
                                         <label className="text-xs text-gray-400 mt-1">Learn</label>
                                    </div>
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="text-xl font-bold font-teko tracking-wide mb-3">Infused Items ({character.infusedItems.length} / {artificerInfo.maxInfusedItems} Max)</h3>
                    <div className="space-y-4">
                        <div>
                             <h4 className="text-sm font-bold uppercase text-gray-400 mb-2">Available to Infuse</h4>
                              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {character.knownInfusions.map(infusionId => {
                                    const infusion = allInfusions.find(i => i.id === infusionId);
                                    if (!infusion || character.infusedItems.some(i => i.infusionId === infusionId)) return null;
                                    return (
                                        <div key={infusionId} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                                            <p className="font-semibold">{infusion.name}</p>
                                            <button onClick={() => handleOpenInfuseModal(infusionId)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-sm">Infuse</button>
                                        </div>
                                    );
                                })}
                                {character.knownInfusions.length === 0 && <p className="text-gray-500 italic text-center">Learn infusions to begin.</p>}
                            </div>
                        </div>
                        <div>
                             <h4 className="text-sm font-bold uppercase text-gray-400 mb-2 mt-4">Currently Infused</h4>
                             <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {character.infusedItems.map(infused => {
                                    const infusionData = allInfusions.find(i => i.id === infused.infusionId);
                                    let itemName = infused.instanceId;
                                    if (infused.instanceId.startsWith('companion-')) {
                                        itemName = infusionData?.createsCompanionId?.replace(/-/g, ' ') || 'Companion';
                                        itemName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
                                    } else {
                                        const itemData = staticDataCache.allItems.find(i => i.id === (character.inventory.find(inv => inv.instanceId === infused.instanceId)?.itemId));
                                        itemName = itemData?.name || 'Unknown Item';
                                    }
                                    return (
                                        <div key={infused.instanceId} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                                            <div><p className="font-bold">{infusionData?.name}</p><p className="text-xs text-gray-400">on <span className="italic">{itemName}</span></p></div>
                                            <button onClick={() => handleEndInfusion(infused.instanceId)} className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded-md text-xs">End</button>
                                        </div>
                                    )
                                })}
                                {character.infusedItems.length === 0 && <p className="text-gray-500 italic text-center">No items are currently infused.</p>}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfusionsStep;