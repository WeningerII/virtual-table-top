import React, { useState } from 'react';
import { Currency } from '../../types';
import { currencyToCopper, copperToCurrency } from '../../utils/currency';

interface CurrencyManagerProps {
    currency: Currency;
    onUpdate: (newCurrency: Currency) => void;
}

const initialFormState: Currency = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };

const CurrencyManager: React.FC<CurrencyManagerProps> = ({ currency, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState<'add' | 'spend'>('add');
    const [formState, setFormState] = useState<Currency>(initialFormState);

    const handleOpenModal = () => {
        setFormState(initialFormState);
        setMode('add');
        setIsModalOpen(true);
    };

    const handleInputChange = (coin: keyof Currency, value: string) => {
        const numValue = parseInt(value, 10);
        setFormState(prev => ({
            ...prev,
            [coin]: isNaN(numValue) ? 0 : Math.max(0, numValue)
        }));
    };

    const handleSubmit = () => {
        const currentTotalCopper = currencyToCopper(currency);
        const adjustmentCopper = currencyToCopper(formState);

        let newTotalCopper;
        if (mode === 'add') {
            newTotalCopper = currentTotalCopper + adjustmentCopper;
        } else {
            newTotalCopper = currentTotalCopper - adjustmentCopper;
            if (newTotalCopper < 0) {
                alert("Not enough money!");
                return;
            }
        }
        
        onUpdate(copperToCurrency(newTotalCopper));
        setIsModalOpen(false);
    };

    return (
        <div className="bg-gray-800 p-3 rounded-lg text-center">
            <h4 className="font-bold text-gray-400 uppercase text-sm mb-2">Wallet</h4>
            <div className="flex justify-center space-x-2 md:space-x-4 mb-3">
                {(Object.keys(currency) as Array<keyof Currency>).map(coin => (
                    <div key={coin}>
                        <div className={`font-bold text-lg ${
                            coin === 'pp' ? 'text-blue-300' : 
                            coin === 'gp' ? 'text-yellow-400' :
                            coin === 'ep' ? 'text-gray-200' :
                            coin === 'sp' ? 'text-gray-400' : 'text-orange-400'
                        }`}>{currency[coin]}</div>
                        <div className="text-xs text-gray-500 uppercase">{coin}</div>
                    </div>
                ))}
            </div>
            <button onClick={handleOpenModal} className="w-full text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold transition-colors">Manage</button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-700">
                            <h3 className="text-lg font-bold">Manage Funds</h3>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-center bg-gray-900 rounded-md p-1 mb-4">
                                <button onClick={() => setMode('add')} className={`w-1/2 p-2 rounded-md font-semibold text-sm ${mode === 'add' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>Add</button>
                                <button onClick={() => setMode('spend')} className={`w-1/2 p-2 rounded-md font-semibold text-sm ${mode === 'spend' ? 'bg-red-600 text-white' : 'text-gray-300'}`}>Spend</button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {(Object.keys(formState) as Array<keyof Currency>).map(coin => (
                                     <div key={coin} className="text-left">
                                         <label htmlFor={coin} className="text-sm font-medium text-gray-400 uppercase">{coin}</label>
                                         <input
                                             id={coin}
                                             type="number"
                                             min="0"
                                             value={formState[coin]}
                                             onChange={e => handleInputChange(coin, e.target.value)}
                                             className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                                         />
                                     </div>
                                ))}
                                <div className="sm:col-span-3 col-span-2 flex items-end">
                                    <button onClick={handleSubmit} className={`w-full p-2 rounded-md font-bold ${mode === 'add' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}>
                                        {mode === 'add' ? 'Add Funds' : 'Spend Funds'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-2 border-t border-gray-700 text-right">
                            <button onClick={() => setIsModalOpen(false)} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-sm">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CurrencyManager;
