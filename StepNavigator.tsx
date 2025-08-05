
import React from 'react';

interface StepNavigatorProps {
    onPrev: () => void;
    onNext: () => void;
}

const ArrowButton: React.FC<{ direction: 'left' | 'right', onClick: () => void }> = ({ direction, onClick }) => (
    <button
        onClick={onClick}
        className="absolute top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center transition-transform transform hover:scale-110 shadow-lg z-10"
        style={direction === 'left' ? { left: '-20px' } : { right: '-20px' }}
    >
        {direction === 'left' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        )}
    </button>
);

const StepNavigator: React.FC<StepNavigatorProps> = ({ onPrev, onNext }) => {
    return (
        <>
            <ArrowButton direction="left" onClick={onPrev} />
            <ArrowButton direction="right" onClick={onNext} />
        </>
    );
};

export default StepNavigator;
