import React from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { entitySlice } from '../../state/entitySlice';

interface SceneDisplayProps {
    imageUrl: string;
}

const SceneDisplay: React.FC<SceneDisplayProps> = ({ imageUrl }) => {
    const isDmMode = useAppSelector(state => state.app.isDmMode);
    const dispatch = useAppDispatch();

    const handleHide = () => {
        dispatch(entitySlice.actions.setSceneImage(null));
    };

    return (
        <div className="absolute inset-0 bg-black bg-opacity-80 z-30 flex items-center justify-center p-4 animate-fade-in-up">
            <div className="relative w-full h-full">
                <img
                    src={imageUrl}
                    alt="Generated Scene"
                    className="object-contain w-full h-full"
                />
                {isDmMode && (
                    <button
                        onClick={handleHide}
                        className="absolute top-4 right-4 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
                    >
                        Hide Scene
                    </button>
                )}
            </div>
        </div>
    );
};

export default SceneDisplay;