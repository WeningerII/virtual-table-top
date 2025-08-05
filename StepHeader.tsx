import React from 'react';

interface StepHeaderProps {
    currentStep: number;
    setStep: (step: number) => void;
    steps: string[];
}

const StepHeader: React.FC<StepHeaderProps> = ({ currentStep, setStep, steps }) => {
    return (
        <nav className="hidden md:flex items-center space-x-1 justify-center">
            {steps.map((step, index) => (
                <button
                    key={step}
                    onClick={() => setStep(index)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        currentStep === index
                            ? 'text-white border-b-2 border-blue-500'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                >
                   {`${index + 1}. `}{step}
                </button>
            ))}
        </nav>
    );
};

export default StepHeader;
