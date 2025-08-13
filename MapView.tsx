import React from 'react';
import { VTTMap } from './types';

interface MapViewProps {
    mapImageUrl: string;
    mapState: VTTMap;
}

const MapView: React.FC<MapViewProps> = ({ mapImageUrl, mapState }) => {
    return (
        <div className="relative w-full h-full max-w-[calc(100vh-12rem)] max-h-[calc(100vh-12rem)] aspect-square mx-auto my-auto">
            <img src={mapImageUrl} alt="Battle Map" className="absolute top-0 left-0 w-full h-full object-cover rounded-md" />
            
            {/* Grid Overlay */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{
                backgroundSize: `${100 / mapState.grid.width}% ${100 / mapState.grid.height}%`,
                backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.2) 1px, transparent 1px),
                                    linear-gradient(to bottom, rgba(0,0,0,0.2) 1px, transparent 1px)`
            }}></div>

            {/* Tokens Overlay */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {mapState.tokens.map(token => {
                    const sizePercent = (token.size / mapState.grid.width) * 100;
                    // Center the token on its grid square
                    const leftPercent = ((token.x + 0.5) / mapState.grid.width) * 100;
                    const topPercent = ((token.y + 0.5) / mapState.grid.height) * 100;
                    
                    const isActive = mapState.activeInitiativeIndex !== null && mapState.initiativeOrder[mapState.activeInitiativeIndex]?.id === token.id;

                    return (
                        <div 
                            key={token.id}
                            title={token.name}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-bold text-white transition-all duration-300 shadow-xl ${isActive ? 'ring-4 ring-yellow-400 z-10' : 'ring-2 ring-black/50'}`}
                            style={{ 
                                left: `${leftPercent}%`, 
                                top: `${topPercent}%`,
                                width: `${sizePercent}%`, 
                                height: `${sizePercent}%`,
                                backgroundColor: token.color,
                                fontSize: `${sizePercent * 0.3}px`
                            }}
                        >
                            {token.imageUrl ? (
                                <img src={token.imageUrl} alt={token.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <span>{token.name.charAt(0)}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MapView;
