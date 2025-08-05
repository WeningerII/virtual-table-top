import React, { useState, useEffect, useMemo } from 'react';
import { VTTObject, VTTTool, TerrainCell, StaticGameDataCache, ObjectBlueprint } from '../../types';

interface BuildPanelProps {
    activeTool: VTTTool;
    selectedObject: VTTObject | null;
    onUpdateObject: (object: VTTObject) => void;
    onDeleteObject: (objectId: string) => void;
    onCreateObject: (blueprintId: string) => void;
    terrainPaintType: TerrainCell['type'];
    setTerrainPaintType: (type: TerrainCell['type']) => void;
    staticDataCache: StaticGameDataCache;
}

const BuildPanel: React.FC<BuildPanelProps> = ({ 
    activeTool, 
    selectedObject, 
    onUpdateObject, 
    onDeleteObject, 
    onCreateObject,
    terrainPaintType,
    setTerrainPaintType,
    staticDataCache
}) => {
    const [scale, setScale] = useState({ x: 1, y: 1, z: 100 });
    const [rotationZ, setRotationZ] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('All');

    useEffect(() => {
        if (selectedObject) {
            setScale({
                x: selectedObject.scale.x / 50,
                y: selectedObject.scale.y / 50,
                z: selectedObject.scale.z,
            });
            setRotationZ(selectedObject.rotation.z * (180 / Math.PI)); // Convert radians to degrees for UI
        } else {
            setScale({ x: 1, y: 1, z: 100 });
            setRotationZ(0);
        }
    }, [selectedObject]);

    const filteredBlueprints = useMemo(() => {
        return staticDataCache.objectBlueprints.filter(bp => {
            const tagMatch = selectedTag === 'All' || bp.tags.includes(selectedTag.toLowerCase());
            const searchMatch = bp.name.toLowerCase().includes(searchTerm.toLowerCase());
            return tagMatch && searchMatch;
        });
    }, [searchTerm, selectedTag, staticDataCache.objectBlueprints]);
    
    const allTags = useMemo(() => ['All', ...[...new Set(staticDataCache.objectBlueprints.flatMap(bp => bp.tags))].filter(t => t !== 'common').sort()], [staticDataCache.objectBlueprints]);

    const handleUpdate = (updates: Partial<VTTObject>) => {
        if (!selectedObject) return;
        onUpdateObject({ ...selectedObject, ...updates });
    };

    const handleScaleChange = (axis: 'x' | 'y' | 'z', value: string) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;
        
        const newScale = { ...scale, [axis]: numValue };
        setScale(newScale);

        handleUpdate({
            scale: {
                x: newScale.x * 50,
                y: newScale.y * 50,
                z: newScale.z,
            }
        });
    };

    const handleRotationChange = (value: string) => {
        const degrees = parseFloat(value);
        if (isNaN(degrees)) return;
        setRotationZ(degrees);
        handleUpdate({
            rotation: {
                ...selectedObject!.rotation,
                z: degrees * (Math.PI / 180) // Convert degrees to radians for three.js
            }
        });
    };
    
    return (
        <div className="bg-gray-800/70 rounded-lg shadow-lg p-4 border border-gray-700 space-y-4 flex flex-col h-full">
             <h3 className="font-bold font-teko text-2xl tracking-wider text-white">
                BUILD TOOLS
             </h3>
             
            <div className="space-y-4 flex-grow flex flex-col min-h-0">
                <div>
                    <h4 className="font-bold text-sm uppercase text-gray-400 mb-2">Object Library (DEPRECATED)</h4>
                    <p className="text-xs text-gray-400 mb-2">3D object placement is deprecated in favor of 2D map images.</p>
                    <input
                        type="text"
                        placeholder="Search objects..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm"
                        disabled
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                         {allTags.map(tag => (
                            <button key={tag} onClick={() => setSelectedTag(tag)} className={`capitalize px-2 py-1 text-xs font-semibold rounded-full transition-colors ${selectedTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`} disabled>{tag}</button>
                        ))}
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2 opacity-50">
                    {filteredBlueprints.map(bp => (
                        <button 
                            key={bp.id} 
                            onClick={() => onCreateObject(bp.id)} 
                            className="w-full p-3 bg-gray-900/50 rounded-md text-left flex items-center gap-3 border-l-4 border-gray-700"
                            title={`Create a ${bp.name}`}
                            disabled
                        >
                            <span className="text-2xl">{bp.icon || '❓'}</span>
                            <div>
                                <p className="font-semibold">{bp.name}</p>
                                <p className="text-xs text-gray-400 capitalize">{bp.tags.filter(t => t !== 'common').join(', ')}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

             {selectedObject && (
                 <div className="pt-4 border-t border-gray-700 space-y-3 opacity-50">
                     <h4 className="font-bold text-lg text-blue-300">Edit: {staticDataCache.objectBlueprints.find(bp => bp.id === selectedObject.blueprintId)?.name}</h4>
                     <div>
                         <label className="text-xs text-gray-400">Scale (Width/Depth in Grid Units, Height in ft)</label>
                         <div className="grid grid-cols-3 gap-2 mt-1">
                            <div className="text-center"><span className="text-xs text-gray-400">W</span><input type="number" value={scale.x} step="0.5" onChange={e => handleScaleChange('x', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-1 text-center" disabled/></div>
                            <div className="text-center"><span className="text-xs text-gray-400">D</span><input type="number" value={scale.y} step="0.5" onChange={e => handleScaleChange('y', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-1 text-center" disabled/></div>
                            <div className="text-center"><span className="text-xs text-gray-400">H</span><input type="number" value={scale.z} step="10" onChange={e => handleScaleChange('z', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-1 text-center" disabled/></div>
                         </div>
                     </div>
                     <div>
                         <label htmlFor="rotation-z" className="text-xs text-gray-400">Rotation</label>
                         <div className="flex items-center gap-2">
                             <input id="rotation-z" type="range" min="0" max="360" step="1" value={rotationZ} onChange={e => handleRotationChange(e.target.value)} className="w-full" disabled/>
                             <input type="number" value={Math.round(rotationZ)} onChange={e => handleRotationChange(e.target.value)} className="w-20 bg-gray-900 border border-gray-600 rounded-md p-1 text-center" disabled/>
                         </div>
                     </div>
                      <button onClick={() => onDeleteObject(selectedObject.id)} className="w-full p-2 bg-red-800 hover:bg-red-700 rounded-md font-semibold text-sm" disabled>Delete Object</button>
                 </div>
             )}
        </div>
    );
};

export default BuildPanel;