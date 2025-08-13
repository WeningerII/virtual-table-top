import React, { useRef, useEffect, useMemo } from 'react';
import { LogEntry, LogEntryType } from './types';
import { useAppSelector, useAppDispatch } from 'state/hooks';
import { clearLog, setLogFilter } from 'state/logSlice';

const LOG_TYPE_CONFIG: { [key in LogEntryType | 'all']: { icon: string; color: string; label: string } } = {
    'all': { icon: '📜', color: 'text-gray-300', label: 'All' },
    'roll': { icon: '🎲', color: 'text-cyan-300', label: 'Rolls' },
    'attack': { icon: '⚔️', color: 'text-red-300', label: 'Attacks' },
    'damage': { icon: '💥', color: 'text-orange-400', label: 'Damage' },
    'heal': { icon: '💖', color: 'text-green-300', label: 'Healing' },
    'spell': { icon: '✨', color: 'text-purple-300', label: 'Spells' },
    'dialogue': { icon: '💬', color: 'text-teal-300', label: 'Dialogue' },
    'narrative': { icon: '🤖', color: 'text-yellow-300', label: 'Narrative' },
    'system': { icon: '⚙️', color: 'text-gray-400', label: 'System' },
};
const FILTER_ORDER: (LogEntryType | 'all')[] = ['all', 'roll', 'attack', 'damage', 'heal', 'spell', 'system', 'narrative', 'dialogue'];


const LogPanel: React.FC = () => {
    const { log, filter } = useAppSelector(state => state.log);
    const dispatch = useAppDispatch();
    const logEndRef = useRef<HTMLDivElement>(null);

    const filteredLog = useMemo(() => {
        if (filter === 'all') return log;
        return log.filter(entry => entry.type === filter);
    }, [log, filter]);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [filteredLog]);

    return (
        <div className="bg-gray-900/50 p-2 rounded-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-2 px-1 flex-shrink-0">
                 <div className="flex items-center gap-1">
                    {FILTER_ORDER.map(type => (
                        <button 
                            key={type}
                            title={`Filter: ${LOG_TYPE_CONFIG[type].label}`}
                            onClick={() => dispatch(setLogFilter(type))}
                            className={`p-1 rounded-md transition-colors ${filter === type ? 'bg-blue-600' : 'bg-gray-700/50 hover:bg-gray-600'}`}
                        >
                            {LOG_TYPE_CONFIG[type].icon}
                        </button>
                    ))}
                 </div>
                <button onClick={() => dispatch(clearLog())} className="text-xs text-red-400 hover:text-red-300 transition-colors">Clear Log</button>
            </div>
            <div className="flex-grow overflow-y-auto text-sm space-y-1 pr-2">
                {filteredLog.length === 0 && <p className="text-center text-gray-500 italic py-4">No events match filter.</p>}
                {filteredLog.map(entry => {
                    const { icon, color } = LOG_TYPE_CONFIG[entry.type];
                    return (
                        <div key={entry.id} className="flex items-start gap-2">
                            <span className="w-5 text-center pt-0.5" title={entry.type}>{icon}</span>
                            <div className={`flex-grow ${color} leading-snug`}>
                                <span className="text-gray-500 mr-2 font-mono text-xs">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                <span>{entry.message}</span>
                            </div>
                        </div>
                    );
                })}
                <div ref={logEndRef} />
            </div>
        </div>
    );
};

export default LogPanel;