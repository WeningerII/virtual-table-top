import React from 'react';
import ClassIconFactory from '../../icons/ClassIconFactory';
import { useAppSelector } from 'state/hooks';

interface ClassGridProps {
    onSelect: (classId: string) => void;
}

const ClassGrid: React.FC<ClassGridProps> = ({ onSelect }) => {
    const staticDataCache = useAppSelector(state => state.app.staticDataCache);

    if (!staticDataCache) {
        return <div className="text-center p-8">Loading classes...</div>;
    }
    
    const classIndex = staticDataCache.allClasses.map(c => ({ id: c.id, name: c.name, source: c.source, iconId: c.iconId || '' }));

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {classIndex.map(dndClass => (
                <button
                    key={dndClass.id}
                    onClick={() => onSelect(dndClass.id)}
                    className="p-4 bg-gray-800 rounded-lg text-center transition-all duration-200 border-2 border-gray-700 hover:bg-gray-700 hover:border-blue-500 flex flex-col items-center justify-center aspect-square"
                >
                    <div className="w-16 h-16 mb-2 text-blue-400"><ClassIconFactory iconId={dndClass.iconId} /></div>
                    <h3 className="font-bold font-teko text-2xl tracking-wider">{dndClass.name.toUpperCase()}</h3>
                    <p className="text-xs text-gray-400">{dndClass.source}</p>
                </button>
            ))}
        </div>
    );
};

export default ClassGrid;
