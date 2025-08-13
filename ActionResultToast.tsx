import React, { useEffect } from 'react';
import { ActionRollResult } from './types';

interface ActionResultToastProps {
    result: ActionRollResult & { attackerName: string, actionName: string };
    onClose: () => void;
}

const ActionResultToast: React.FC<ActionResultToastProps> = ({ result, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 8000);
        return () => clearTimeout(timer);
    }, [result, onClose]);

    const { hit, attackRoll, attackTotal, damageTotal, damageRoll, narrative, attackerName, actionName } = result;

    const isCrit = attackRoll === 20;
    const isCritFail = attackRoll === 1;

    let outcome: 'CRITICAL' | 'HIT' | 'MISS' | 'FAIL' = 'MISS';
    if(isCrit) outcome = 'CRITICAL';
    else if (isCritFail) outcome = 'FAIL';
    else if (hit) outcome = 'HIT';

    const outcomeConfig = {
        'CRITICAL': { text: 'CRITICAL HIT!', color: 'text-yellow-300', borderColor: 'border-yellow-400' },
        'HIT': { text: 'HIT!', color: 'text-green-400', borderColor: 'border-green-400' },
        'MISS': { text: 'MISS', color: 'text-gray-400', borderColor: 'border-gray-500' },
        'FAIL': { text: 'CRITICAL FAIL', color: 'text-red-400', borderColor: 'border-red-500' }
    };

    const config = outcomeConfig[outcome];


    return (
        <div 
            className={`fixed bottom-5 right-5 w-full max-w-sm bg-gray-800 text-white rounded-lg shadow-2xl border-l-4 ${config.borderColor} animate-fade-in-up`}
            role="alert"
            aria-live="assertive"
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-bold">{attackerName} used {actionName}!</p>
                        <div className={`text-center font-bold text-xl my-2 ${config.color}`}>
                            {config.text}
                        </div>
                        <p className="mt-2 text-sm text-gray-300 italic">"{narrative}"</p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                            <div>
                                <div className={`text-3xl font-bold font-teko ${isCrit ? 'text-yellow-400' : isCritFail ? 'text-red-500' : ''}`}>{attackTotal}</div>
                                <div className="text-xs text-gray-400">Attack ({attackRoll})</div>
                            </div>
                             <div>
                                <div className="text-3xl font-bold font-teko text-yellow-300">{damageTotal}</div>
                                <div className="text-xs text-gray-400">Damage ({damageRoll})</div>
                            </div>
                        </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button onClick={onClose} className="inline-flex text-gray-400 hover:text-white">
                            <span className="sr-only">Close</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-5.293 5.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActionResultToast;