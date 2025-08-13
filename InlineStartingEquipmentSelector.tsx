
import React, { useState, useMemo, useEffect } from 'react';
import { DndClass, StartingEquipmentOption, Currency, Item, EquipmentPack, Character } from './types';
import { rollGold } from '../../utils/dice';
import { copperToCurrency, currencyToCopper } from '../../utils/currency';
import { dataService } from './services/data.service';
import { useToast } from './state/ToastContext';
import { useAppSelector, useAppDispatch } from '.././state/hooks';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';
import { inventoryActions } from './engine/slices/inventorySlice';

interface InlineStartingEquipmentSelectorProps {
    startingClass: DndClass;
}

const resolveOptionToItems = (option: StartingEquipmentOption, allItems: Item[], allPacks: EquipmentPack[]): {itemId: string, quantity: number}[] => {
    if ('itemId' in option) {
        return [{ itemId: option.itemId, quantity: option.quantity }];
    }
    if ('packId' in option) {
        const pack = allPacks.find(p => p.id === option.packId);
        return pack ? pack.contents : [];
    }
    return [];
};

const ChoiceRenderer: React.FC<{
    choice: StartingEquipmentOption[][];
    choiceIndex: number;
    selection: string;
    onSelect: (value: string) => void;
    allItems: Item[];
    allPacks: EquipmentPack[];
}> = ({ choice, choiceIndex, selection, onSelect, allItems, allPacks }) => {
    return (
        <div className="bg-gray-700/50 p-3 rounded-md border-l-4 border-gray-600">
            <h4 className="font-semibold text-sm mb-2 text-gray-300">Choice {choiceIndex + 1}</h4>
            <div className="space-y-2">
                {choice.map((optionGroup, optionIndex) => {
                    const value = `${choiceIndex}-${optionIndex}`;
                    const label = optionGroup.map(opt => {
                        if ('itemId' in opt) {
                            const item = allItems.find(i => i.id === opt.itemId);
                            if (item) {
                                return `${item.name}${opt.quantity > 1 ? ` (x${opt.quantity})` : ''}`;
                            }
                        }
                        if ('packId' in opt) {
                            const pack = allPacks.find(p => p.id === opt.packId);
                            if (pack) return pack.name;
                        }
                        return 'Unknown';
                    }).join(' & ');
                    
                    return (
                        <label key={value} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-600/50 cursor-pointer">
                            <input
                                type="radio"
                                name={`choice-${choiceIndex}`}
                                value={value}
                                checked={selection === value}
                                onChange={() => onSelect(value)}
                                className="form-radio text-blue-500 bg-gray-800 border-gray-600 focus:ring-blue-500"
                            />
                            <span>{label}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};


const InlineStartingEquipmentSelector: React.FC<InlineStartingEquipmentSelectorProps> = ({ startingClass }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const [mode, setMode] = useState<'package' | 'gold'>('package');
    const [selections, setSelections] = useState<Record<string, string>>({});
    const [allItems, setAllItems] = useState<Item[]>([]);
    const [allPacks, setAllPacks] = useState<EquipmentPack[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const [itemsData, packsData] = await Promise.all([
                dataService.getAllItems(),
                dataService.getEquipmentPacks()
            ]);
            setAllItems(itemsData);
            setAllPacks(packsData);
            setIsLoading(false);
        };
        loadData();
    }, []);
    
    if (!character) {
        return null;
    }

    const choiceOptions = useMemo(() => {
        return (startingClass.startingEquipment || []).filter(opt => 'choice' in opt) as { choice: StartingEquipmentOption[][] }[];
    }, [startingClass]);

    const handleSelect = (choiceIndex: number, value: string) => {
        setSelections(prev => ({ ...prev, [choiceIndex]: value }));
    };

    const handleConfirm = () => {
        if (!character) return;
        let items: { itemId: string; quantity: number }[] = [];
        let money: Currency = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
        
        if (mode === 'package') {
            const fixedItems = (startingClass.startingEquipment || []).filter(opt => !('choice' in opt) && !('goldRoll' in opt) && !('gold' in opt));
            fixedItems.forEach(opt => {
                items.push(...resolveOptionToItems(opt, allItems, allPacks));
            });

            Object.entries(selections).forEach(([choiceIndex, optionValue]) => {
                const choice = choiceOptions[parseInt(choiceIndex, 10)];
                const optionIndex = parseInt(optionValue.split('-')[1], 10);
                const selectedGroup = choice.choice[optionIndex];
                selectedGroup.forEach(opt => {
                    items.push(...resolveOptionToItems(opt, allItems, allPacks));
                });
            });

            const goldOption = (startingClass.startingEquipment || []).find(opt => 'gold' in opt) as { gold: number } | undefined;
            if(goldOption) {
                money.gp = goldOption.gold;
            }

        } else if (mode === 'gold' && startingClass.startingGoldRoll) {
            const goldAmount = rollGold(startingClass.startingGoldRoll);
            money.gp = goldAmount;
        }

        const backgroundGold = character.background?.startingGold || 0;
        const currentMoneyInCopper = currencyToCopper(money);
        const totalCopper = currentMoneyInCopper + (backgroundGold * 100);
        money = copperToCurrency(totalCopper);

        dispatch(inventoryActions.grantEquipment({ items, money }));
        addToast("Starting equipment and gold granted!");
    };
    
    const canConfirm = isLoading || mode === 'gold' || choiceOptions.length === Object.keys(selections).length;


    return (
        <div className="my-4 p-4 bg-blue-900/30 border border-blue-600 rounded-lg animate-fade-in-up">
            <h4 className="font-bold text-lg text-blue-300">Choose Starting Equipment for {startingClass.name}</h4>
             <div className="flex justify-center bg-gray-900 rounded-md p-1 my-4">
                <button onClick={() => setMode('package')} className={`w-1/2 p-2 rounded-md font-semibold text-sm ${mode === 'package' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>Class Package</button>
                <button onClick={() => setMode('gold')} className={`w-1/2 p-2 rounded-md font-semibold text-sm ${mode === 'gold' ? 'bg-yellow-600 text-white' : 'text-gray-300'}`}>Roll for Gold</button>
            </div>

            {isLoading ? (
                <p className="text-center text-gray-400">Loading equipment data...</p>
            ) : mode === 'package' ? (
                <div className="space-y-4">
                    {choiceOptions.map((opt, index) => (
                        <ChoiceRenderer
                            key={index}
                            choice={opt.choice}
                            choiceIndex={index}
                            selection={selections[index]}
                            onSelect={(value) => handleSelect(index, value)}
                            allItems={allItems}
                            allPacks={allPacks}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center p-8 bg-gray-700/50 rounded-lg">
                    <p className="text-lg">Take your chances and purchase your own gear.</p>
                    <p className="font-bold text-2xl text-yellow-400 my-2">{startingClass.startingGoldRoll}</p>
                </div>
            )}
            {character.background && (
                <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                    <p className="text-yellow-300 text-center">Your <span className="font-bold">{character.background.name}</span> background also grants you <span className="font-bold">{character.background.startingGold} gp</span>.</p>
                </div>
            )}
            <div className="text-right mt-4">
                <button
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Confirm & Grant Equipment
                </button>
            </div>
        </div>
    );
};

export default InlineStartingEquipmentSelector;
