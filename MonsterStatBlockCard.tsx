import React from 'react';
import { Monster } from './types';

interface MonsterStatBlockCardProps {
    monster: Monster;
    onSelect: () => void;
    isSelectedForPlacement: boolean;
}

const Stat: React.FC<{ label: string, value: any }> = ({ label, value }) => (
    <div className="text-center bg-gray-800/50 p-2 rounded-md">
        <p className="font-bold text-lg text-white">{value}</p>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
    </div>
);

const MonsterStatBlockCard: React.FC<MonsterStatBlockCardProps> = ({ monster, onSelect, isSelectedForPlacement }) => {
    
    const getSpeed = () => {
        const parts = [];
        if (monster.speed.walk) parts.push(`${monster.speed.walk}ft.`);
        if (monster.speed.fly) parts.push(`fly ${monster.speed.fly}ft.`);
        if (monster.speed.swim) parts.push(`swim ${monster.speed.swim}ft.`);
        return parts.join(', ') || '0ft.';
    }

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg animate-fade-in-up mt-4 border border-gray-700">
            <h3 className="text-xl font-bold font-teko tracking-wider text-white">{monster.name.toUpperCase()}</h3>
            <p className="text-xs italic text-gray-400 -mt-1">{monster.size} {monster.type}, {monster.alignment}</p>
            
            <div className="grid grid-cols-3 gap-2 my-3">
                <Stat label="AC" value={monster.ac.value} />
                <Stat label="HP" value={monster.hp.average} />
                <Stat label="Speed" value={getSpeed()} />
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2 text-sm">
                <h4 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">Actions</h4>
                {monster.actions?.map((action, index) => (
                    <div key={index} className="text-gray-400 bg-gray-800/50 p-2 rounded-md">
                        <p className="text-gray-200 font-semibold">{action.name}.</p>
                        <p className="text-xs">{action.description.substring(0, 100)}{action.description.length > 100 ? '...' : ''}</p>
                    </div>
                ))}
                 {(!monster.actions || monster.actions.length === 0) && <p className="text-xs italic text-gray-500">No special actions listed.</p>}
            </div>
            
            <button
                onClick={onSelect}
                className={`w-full mt-4 py-2 rounded-md font-semibold text-sm transition-colors ${
                    isSelectedForPlacement 
                        ? 'bg-yellow-600 hover:bg-yellow-500 text-black' 
                        : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
            >
                {isSelectedForPlacement ? 'Placing... (Click Map)' : 'Place on Map'}
            </button>
        </div>
    );
};

export default MonsterStatBlockCard;
