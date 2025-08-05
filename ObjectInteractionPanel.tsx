import React from 'react';
import { VTTObject, ObjectBlueprint } from '../../types';
import { useAppSelector } from '../../state/hooks';

interface ObjectInteractionPanelProps {
    object: VTTObject;
    onAttackObject: (objectId: string) => void;
}

const ObjectInteractionPanel: React.FC<ObjectInteractionPanelProps> = ({ object, onAttackObject }) => {
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);
    const blueprint = staticDataCache?.objectBlueprints.find(bp => bp.id === object.blueprintId);

    if (!blueprint) {
        return <div className="p-4">Loading object data...</div>;
    }

    const hpPercentage = (blueprint.integrity && object.integrity !== undefined) 
        ? (object.integrity / blueprint.integrity) * 100 
        : 100;

    return (
        <div className="bg-gray-800/70 rounded-lg border border-gray-700 flex flex-col flex-grow overflow-hidden p-4 space-y-4 animate-fade-in-up">
            <div className="text-center">
                <h3 className="font-bold font-teko text-3xl tracking-wider text-yellow-300">{blueprint.name}</h3>
            </div>
            
            {blueprint.integrity !== undefined && object.integrity !== undefined && (
                <div className="bg-gray-900/50 p-3 rounded-lg">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-gray-400 uppercase text-xs">Integrity</span>
                        <span className="font-bold text-2xl">{object.integrity} / {blueprint.integrity}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                        <div className="bg-yellow-600 h-4 rounded-full" style={{ width: `${hpPercentage}%` }}></div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-700/50 border border-gray-600 rounded-md p-3">
                    <div className="font-bold text-2xl">{blueprint.ac || '-'}</div>
                    <div className="text-xs text-gray-400 uppercase">Armor Class</div>
                </div>
                 <div className="bg-gray-700/50 border border-gray-600 rounded-md p-3">
                    <div className="font-bold text-xl capitalize">Object</div>
                    <div className="text-xs text-gray-400 uppercase">Type</div>
                </div>
            </div>

            <div className="flex-grow flex items-end">
                <button 
                    onClick={() => onAttackObject(object.id)}
                    className="w-full py-3 bg-red-700 hover:bg-red-600 rounded-md font-bold text-lg"
                >
                    Attack {blueprint.name}
                </button>
            </div>
        </div>
    );
};

export default ObjectInteractionPanel;
