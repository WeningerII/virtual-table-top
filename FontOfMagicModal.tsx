import React, { useMemo } from 'react';
import { useToast } from 'state/ToastContext';
import { useAppSelector, useAppDispatch } from 'state/hooks';
import { selectCalculatedActiveCharacterSheet } from 'state/selectors';
import { logEvent } from 'state/logSlice';
import { Character } from './types';
import { playStateActions } from './playStateSlice';
import Modal from '../shared/Modal';

interface FontOfMagicModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FONT_OF_MAGIC_COSTS = [0, 2, 3, 5, 6, 7]; // Index is spell level

const FontOfMagicModal: React.FC<FontOfMagicModalProps> = ({ isOpen, onClose }) => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet) as Character | null;
    const dispatch = useAppDispatch();
    const { addToast } = useToast();

    const sorceryPoints = useMemo(() => character?.resources.find(r => r.id === 'sorcery-points') || { current: 0, max: 0 }, [character?.resources]);

    if (!character || !character.spellcastingInfo) return null;

    const { spellcastingInfo, expendedSpellSlots } = character;

    const handleConvertToSp = (level: number) => {
        const expended = expendedSpellSlots[level] || 0;
        const max = spellcastingInfo.spellSlots[level - 1] || 0;
        if (expended >= max) {
            addToast(`No level ${level} slots to convert.`, 'error');
            return;
        }
        dispatch(playStateActions.convertSpellSlotToSp({ level }));
        const message = `Converted a level ${level} slot into ${level} sorcery points.`;
        addToast(message);
        dispatch(logEvent({ type: 'system', message }));
    };

    const handleCreateSlot = (level: number) => {
        const cost = FONT_OF_MAGIC_COSTS[level];
        if (sorceryPoints.current < cost) {
            addToast(`Not enough sorcery points.`, 'error');
            return;
        }
        const expended = expendedSpellSlots[level] || 0;
        if (expended <= 0) {
            addToast(`No expended level ${level} slots to recover.`, 'error');
            return;
        }
        dispatch(playStateActions.convertSpToSpellSlot({ level }));
        const message = `Created a level ${level} spell slot for ${cost} sorcery points.`;
        addToast(message);
        dispatch(logEvent({ type: 'system', message }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Font of Magic" maxWidth="max-w-lg">
            <div className="text-center text-sm text-gray-400 mb-4">Current Sorcery Points: {sorceryPoints.current} / {sorceryPoints.max}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 p-3 rounded-lg">
                    <h3 className="font-bold text-center mb-2 text-blue-300">Convert Spell Slots to Points</h3>
                    <div className="space-y-2">
                        {spellcastingInfo.spellSlots.map((max, index) => {
                            const level = index + 1;
                            if (max === 0) return null;
                            const expended = expendedSpellSlots[level] || 0;
                            const remaining = max - expended;
                            return (
                                <button
                                    key={level}
                                    onClick={() => handleConvertToSp(level)}
                                    disabled={remaining <= 0}
                                    className="w-full p-2 bg-blue-800 hover:bg-blue-700 rounded-md text-sm flex justify-between items-center disabled:bg-gray-700 disabled:opacity-50"
                                >
                                    <span>Level {level} ({remaining}/{max})</span>
                                    <span className="font-bold">+ {level} SP</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded-lg">
                        <h3 className="font-bold text-center mb-2 text-green-300">Create Spell Slots from Points</h3>
                        <div className="space-y-2">
                        {FONT_OF_MAGIC_COSTS.map((cost, level) => {
                            if (level === 0 || level > 5) return null;
                            const max = spellcastingInfo.spellSlots[level - 1] || 0;
                            if (max === 0) return null;
                            const expended = expendedSpellSlots[level] || 0;
                            return (
                                    <button
                                    key={level}
                                    onClick={() => handleCreateSlot(level)}
                                    disabled={sorceryPoints.current < cost || expended === 0}
                                    className="w-full p-2 bg-green-800 hover:bg-green-700 rounded-md text-sm flex justify-between items-center disabled:bg-gray-700 disabled:opacity-50"
                                >
                                    <span>Create Level {level} (Exp: {expended})</span>
                                    <span className="font-bold">{cost} SP</span>
                                </button>
                            );
                        })}
                        </div>
                </div>
            </div>
        </Modal>
    );
};

export default FontOfMagicModal;