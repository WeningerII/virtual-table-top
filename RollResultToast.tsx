import React, { useEffect } from 'react';

interface RollResultToastProps {
    result: {
        title: string;
        roll: number;
        modifier: number;
        total: number;
        isCrit: boolean;
        isCritFail: boolean;
        damage?: { result: string, type: string };
        brutalCritDice?: number;
        targetName?: string;
        outcome?: 'HIT' | 'MISS' | 'CRITICAL' | 'FAIL';
    };
    onClose: () => void;
}

const RollResultToast: React.FC<RollResultToastProps> = ({ result, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 8000); // Increased duration for readability
        return () => clearTimeout(timer);
    }, [result, onClose]);

    const borderColor = result.isCrit ? 'border-yellow-400' : result.isCritFail ? 'border-red-500' : 'border-blue-500';
    const outcomeConfig = {
        'CRITICAL': { text: 'CRITICAL HIT!', color: 'text-yellow-300' },
        'HIT': { text: 'HIT!', color: 'text-green-400' },
        'MISS': { text: 'MISS', color: 'text-gray-400' },
        'FAIL': { text: 'CRITICAL FAIL', color: 'text-red-400' }
    };

    return (
        <div 
            className={`fixed bottom-5 right-5 w-full max-w-sm bg-gray-800 text-white rounded-lg shadow-2xl border-l-4 ${borderColor} animate-fade-in-up z-[100]`}
            role="alert"
            aria-live="assertive"
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-bold">{result.title}{result.targetName && ` on ${result.targetName}`}</p>
                        {result.outcome && (
                            <div className={`text-center font-bold text-xl my-2 ${outcomeConfig[result.outcome]?.color}`}>
                                {outcomeConfig[result.outcome]?.text}
                            </div>
                        )}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                            <div>
                                <div className={`text-4xl font-bold font-teko ${result.isCrit ? 'text-yellow-400' : result.isCritFail ? 'text-red-500' : ''}`}>{result.total}</div>
                                <div className="text-xs text-gray-400">Attack Roll</div>
                                <div className="text-xs text-gray-500">({result.roll} {result.modifier >= 0 ? `+ ${result.modifier}` : `- ${Math.abs(result.modifier)}`})</div>
                            </div>
                             <div>
                                {result.damage ? (
                                    <>
                                        <div className="text-4xl font-bold font-teko text-yellow-300">{result.damage.result}</div>
                                        <div className="text-xs text-gray-400">Damage</div>
                                        <div className="text-xs text-gray-500 truncate" title={result.damage.type}>{result.damage.type}</div>
                                    </>
                                ) : (
                                    result.isCrit ? <div className="text-yellow-400 font-bold mt-4">CRITICAL!</div> : 
                                    result.isCritFail ? <div className="text-red-500 font-bold mt-4">CRITICAL FAIL!</div> : null
                                )}
                            </div>
                        </div>
                        {result.brutalCritDice && (
                            <div className="mt-2 text-center text-yellow-400 text-xs font-bold bg-yellow-900/50 p-1 rounded-md">
                                Brutal Critical! (+{result.brutalCritDice} damage)
                            </div>
                        )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button onClick={onClose} className="inline-flex text-gray-400 hover:text-white">
                            <span className="sr-only">Close</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-5.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RollResultToast;