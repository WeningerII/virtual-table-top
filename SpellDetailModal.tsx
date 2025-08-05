import React from 'react';
import { Spell } from '../../types';

interface SpellDetailModalProps {
    isOpen: boolean;
    spell: Spell;
    onClose: () => void;
}

const SpellDetailModal: React.FC<SpellDetailModalProps> = ({ isOpen, spell, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] p-4" onClick={onClose}>
            <div className="bg-[#fdf1dc] text-black rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border-4 border-gray-600" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b-2 border-[#822000]">
                    <h2 className="text-3xl font-bold font-teko tracking-wider text-[#822000]">{spell.name.toUpperCase()}</h2>
                    <p className="text-sm italic -mt-1 text-gray-600">
                        {spell.level === 0 ? `${spell.school} cantrip` : `${spell.level}-level ${spell.school}`}
                        {spell.ritual && ' (ritual)'}
                    </p>
                </div>
                <div className="p-4 flex-grow overflow-y-auto space-y-3 text-gray-800">
                    <p><strong>Casting Time:</strong> {spell.castingTime}</p>
                    <p><strong>Range:</strong> {spell.range}</p>
                    <p><strong>Components:</strong> {spell.components}</p>
                    <p><strong>Duration:</strong> {spell.duration}</p>
                    
                    <div className="border-t border-gray-300 my-3"></div>

                    <p className="whitespace-pre-wrap">{spell.description}</p>
                    
                    {spell.higherLevel && (
                        <p><strong>At Higher Levels:</strong> {spell.higherLevel}</p>
                    )}
                </div>
                 <div className="p-2 border-t border-gray-300 text-right bg-gray-200">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md font-semibold">Close</button>
                </div>
            </div>
        </div>
    );
};

export default SpellDetailModal;