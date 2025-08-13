import React, { useState, useEffect } from 'react';
import { dataService } from './services/data.service';
import { EffectInstance, Character } from './types';
import { playStateActions } from './engine/slices/playStateSlice';
import { useAppDispatch } from '.././state/hooks';
import { entitySlice } from '../../state/entitySlice';
import Modal from '../shared/Modal';

interface AddConditionModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetId?: string; // Optional: for targeting NPCs
}

const AddConditionModal: React.FC<AddConditionModalProps> = ({ isOpen, onClose, targetId }) => {
    const dispatch = useAppDispatch();
    const [searchTerm, setSearchTerm] = useState('');
    const [allConditions, setAllConditions] = useState<Omit<EffectInstance, 'id'>[]>([]);
    const [duration, setDuration] = useState<number>(1);

    useEffect(() => {
        if (isOpen) {
            dataService.getAllConditions().then(setAllConditions);
        }
    }, [isOpen]);

    const handleAddCondition = (condition: Omit<EffectInstance, 'id'>) => {
        const newCondition: EffectInstance = {
            ...condition,
            id: crypto.randomUUID(),
            durationInRounds: duration > 0 ? duration : undefined,
        };

        if (targetId) {
            dispatch(entitySlice.actions.addNpcCondition({ instanceId: targetId, effect: newCondition }));
        } else {
            dispatch(playStateActions.addActiveEffect(newCondition));
        }
        
        onClose();
    };

    const filteredConditions = allConditions.filter(c => 
        c.source.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add a Condition" maxWidth="max-w-lg">
            <input
                type="text"
                placeholder="Search conditions by name or effect (e.g., 'poisoned', 'frightened', 'advantage')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 mb-3 focus:ring-2 focus:ring-blue-500"
            />
                <div className="mb-3">
                <label htmlFor="condition-duration" className="block text-sm font-medium text-gray-400">Duration in Rounds (0 for indefinite)</label>
                <input
                    id="condition-duration"
                    type="number"
                    min="0"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 mt-1"
                />
            </div>
            <div className="overflow-y-auto flex-grow space-y-2 max-h-80">
                {filteredConditions.map((condition, index) => (
                    <button
                        key={index}
                        onClick={() => handleAddCondition(condition)}
                        className="w-full p-3 bg-gray-700 hover:bg-blue-600 rounded-md text-left transition-colors"
                    >
                        <p className="font-semibold">{condition.source}</p>
                        <p className="text-xs text-gray-400 mt-1">{condition.effect.description}</p>
                    </button>
                ))}
            </div>
        </Modal>
    );
};

export default AddConditionModal;