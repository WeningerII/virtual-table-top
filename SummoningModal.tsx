import React, { useState, useMemo, useEffect } from 'react';
import { Character, Movement, CompanionBlueprint, Spell } from '../../types';
import { dataService } from '../../services/dataService';
import Modal from '../shared/Modal';

interface SummoningModalProps {
    isOpen: boolean;
    onClose: () => void;
    character: Character;
    onSummon: (blueprint: CompanionBlueprint, quantity: number) => void;
    castingSpell?: Spell | null;
}

const formatMovement = (speed: Movement): string => {
    const parts: string[] = [];
    if (speed.walk) parts.push(`${speed.walk}ft`);
    if (speed.fly) parts.push(`fly ${speed.fly}ft`);
    if (speed.swim) parts.push(`swim ${speed.swim}ft`);
    if (speed.climb) parts.push(`climb ${speed.climb}ft`);
    if (speed.burrow) parts.push(`burrow ${speed.burrow}ft`);
    if (speed.hover) parts.push('(hover)');
    return parts.join(', ');
};

const SummoningModal: React.FC<SummoningModalProps> = ({ isOpen, onClose, character, onSummon, castingSpell }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [allCompanions, setAllCompanions] = useState<CompanionBlueprint[]>([]);

    useEffect(() => {
        if (isOpen) {
            dataService.getAllCompanions().then(data => {
                setAllCompanions(Object.values(data));
            });
        }
    }, [isOpen]);

    const filteredCompanions = useMemo(() => {
        return allCompanions.filter(c => {
            if(castingSpell) {
                return c.id === castingSpell.summonsCompanionId;
            }
            return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   c.creatureType.toLowerCase().includes(searchTerm.toLowerCase());
        }).sort((a,b) => a.name.localeCompare(b.name));
    }, [searchTerm, allCompanions, castingSpell]);

    const handleQuantityChange = (id: string, value: number) => {
        setQuantities(prev => ({ ...prev, [id]: Math.max(1, value) }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={castingSpell ? `Summoning with ${castingSpell.name}` : 'Summoning Library'} maxWidth="max-w-2xl">
            {!castingSpell && (
                <input
                    type="text"
                    placeholder="Search creatures..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 mb-4 focus:ring-2 focus:ring-blue-500"
                />
            )}
            <div className="space-y-3">
                {filteredCompanions.map(blueprint => (
                    <div key={blueprint.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="font-bold text-lg text-blue-300">{blueprint.name}</h3>
                            <p className="text-sm text-gray-400">{blueprint.creatureType}</p>
                            <div className="text-xs text-gray-400 mt-2 flex gap-4">
                                <span>AC: {blueprint.ac ?? blueprint.acFormula}</span>
                                <span>HP: {blueprint.hp ?? blueprint.hpFormula}</span>
                                <span>Speed: {formatMovement(blueprint.speed)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {blueprint.canBeHorde && (
                                <input
                                    type="number"
                                    min="1"
                                    value={quantities[blueprint.id] || 1}
                                    onChange={(e) => handleQuantityChange(blueprint.id, parseInt(e.target.value, 10))}
                                    className="w-16 bg-gray-900 border border-gray-600 rounded-md p-2 text-center"
                                    aria-label={`Quantity for ${blueprint.name}`}
                                />
                            )}
                            <button
                                onClick={() => onSummon(blueprint, quantities[blueprint.id] || 1)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold text-sm transition-transform transform hover:scale-105"
                            >
                                Summon
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </Modal>
    );
};

export default SummoningModal;