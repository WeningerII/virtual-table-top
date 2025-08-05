import React, { useState } from 'react';
import { Character } from '../types';
import StepHeader from './StepHeader';
import CharacterProfile from './CharacterProfile';
import StepNavigator from './StepNavigator';
import ClassStep from './steps/ClassStep';
import BackgroundStep from './steps/BackgroundStep';
import SpeciesStep from './steps/SpeciesStep';
import AbilitiesStep from './steps/AbilitiesStep';
import FeatsStep from './steps/FeatsStep';
import SummaryStep from './steps/SummaryStep';
import EquipmentStep from './steps/EquipmentStep';
import SpellsStep from './steps/SpellsStep';
import InfusionsStep from './steps/InfusionsStep';
import { useAppSelector, useAppDispatch } from '../state/hooks';
import { selectCalculatedActiveCharacterSheet } from '../state/selectors';
import { setCurrentStep } from '../state/builderSlice';

export const STEPS = ['CLASS', 'BACKGROUND', 'SPECIES', 'ABILITIES', 'EQUIPMENT', 'INFUSIONS', 'FEATS', 'SPELLS', 'SUMMARY'];

const BuilderView: React.FC = () => {
    const character = useAppSelector(selectCalculatedActiveCharacterSheet);
    const step = useAppSelector(state => state.builder.currentStep);
    const dispatch = useAppDispatch();

    const setStep = (s: number) => {
        dispatch(setCurrentStep(s));
    };

    const handleNext = () => setStep(Math.min(step + 1, STEPS.length - 1));
    const handlePrev = () => setStep(Math.max(step - 1, 0));

    if (!character) {
        // This can happen briefly during character switching
        return <div className="text-center p-8">Loading character sheet...</div>;
    }

    const renderStep = () => {
        switch (STEPS[step]) {
            case 'CLASS':
                return <ClassStep />;
            case 'BACKGROUND':
                return <BackgroundStep />;
            case 'SPECIES':
                return <SpeciesStep />;
            case 'ABILITIES':
                return <AbilitiesStep />;
            case 'EQUIPMENT':
                return <EquipmentStep />;
            case 'INFUSIONS':
                return <InfusionsStep />;
            case 'FEATS':
                return <FeatsStep />;
            case 'SPELLS':
                return <SpellsStep />;
            case 'SUMMARY':
                return <SummaryStep />;
            default:
                return <ClassStep />;
        }
    };

    return (
        <div className="max-w-6xl mx-auto bg-gray-800 bg-opacity-70 rounded-lg shadow-2xl p-6 md:p-8 relative">
            <StepHeader currentStep={step} setStep={setStep} steps={STEPS} />
            <div className="mt-8">
                <StepNavigator onPrev={handlePrev} onNext={handleNext} />
                <CharacterProfile character={character} />
                <hr className="my-6 border-gray-600" />
                {renderStep()}
            </div>
        </div>
    );
};

export default BuilderView;