import React from 'react';
import { VTTTool, Viewport } from '../../types';

interface ToolButtonProps {
    title: string;
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

const ToolButton: React.FC<ToolButtonProps> = ({ title, children, isActive, onClick }) => (
    <button
        title={title}
        onClick={onClick}
        className={`w-10 h-10 flex items-center justify-center text-gray-300 rounded-md transition-colors ${
            isActive ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-blue-600 hover:text-white'
        }`}
        aria-pressed={isActive}
    >
        {children}
    </button>
);

interface VTTToolbarProps {
    activeTool: VTTTool;
    setActiveTool: (tool: VTTTool) => void;
    viewport: Viewport;
    setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
}

const VTTToolbar: React.FC<VTTToolbarProps> = ({ activeTool, setActiveTool, viewport, setViewport }) => {
    
    const handleZoom = (factor: number) => {
        setViewport(prev => ({
            ...prev,
            zoom: Math.max(0.2, Math.min(3, prev.zoom * factor))
        }));
    };

    return (
        <div className="absolute top-4 left-4 z-20 p-1 bg-gray-800 bg-opacity-80 rounded-lg shadow-lg flex flex-col space-y-1">
            <ToolButton title="Select/Move (V)" isActive={activeTool === 'select'} onClick={() => setActiveTool('select')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            </ToolButton>
            <ToolButton title="Pan (H)" isActive={activeTool === 'pan'} onClick={() => setActiveTool('pan')}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 17.657L13.414 21.9a2 2 0 01-2.828 0L6.343 17.657m11.314-11.314L13.414 2.1a2 2 0 00-2.828 0L6.343 6.343m11.314 0l-5.657 5.657a2 2 0 01-2.828 0L6.343 6.343" />
                </svg>
            </ToolButton>
             <ToolButton title="Measure Distance (R)" isActive={activeTool === 'measure'} onClick={() => setActiveTool('measure')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M15.5 2a.5.5 0 01.5.5v15a.5.5 0 01-1 0V3H5a1 1 0 010-2h10.5zM3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm1 1h10v10H4V4z" clipRule="evenodd" />
                </svg>
            </ToolButton>
            <ToolButton title="Delete (D)" isActive={activeTool === 'delete'} onClick={() => setActiveTool('delete')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            </ToolButton>
            
            <div className="border-t border-gray-600 my-1 mx-2"></div>
            
            <ToolButton title="Zoom In (+)" isActive={false} onClick={() => handleZoom(1.25)}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
            </ToolButton>
            <ToolButton title="Zoom Out (-)" isActive={false} onClick={() => handleZoom(0.8)}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
            </ToolButton>
        </div>
    );
};

export default VTTToolbar;