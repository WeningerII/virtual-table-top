import React, { useState } from 'react';
import { useAppSelector } from '.././state/hooks';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';
import ClassGrid from './class/ClassGrid';
import ClassDetail from './class/ClassDetail';
import { useCharacterActions } from '../../hooks/useCharacterActions';

const ClassStep: React.FC = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const { updateClasses } = useCharacterActions();
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

    if (!character) return null;

    const handleSelectClass = (classId: string) => {
        const isNewClass = !character.classes.some(c => c.id === classId);
        // Add level 1 automatically only if it's the very first class being added
        if (isNewClass && character.classes.length === 0) {
            updateClasses([...character.classes, { id: classId, level: 1 }]);
        }
        setSelectedClassId(classId);
    };

    if (selectedClassId) {
        return (
            <ClassDetail 
                classId={selectedClassId}
                onBack={() => setSelectedClassId(null)}
            />
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold font-teko tracking-wide mb-4">CHOOSE YOUR PATH: CLASS</h2>
            <p className="text-gray-400 mb-6">Your class is the primary definition of what your character can do on their adventures. It’s more than a profession; it’s your character’s calling.</p>
            <ClassGrid onSelect={handleSelectClass} />
        </div>
    );
};

export default ClassStep;