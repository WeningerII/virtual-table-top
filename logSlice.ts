import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LogEntry, LogEntryType } from './types';

interface LogState {
    log: LogEntry[];
    filter: LogEntryType | 'all';
}

const initialState: LogState = {
    log: [],
    filter: 'all',
};

const logSlice = createSlice({
    name: 'log',
    initialState,
    reducers: {
        logEvent(state, action: PayloadAction<{ type: LogEntryType, message: string }>) {
            const newEntry: LogEntry = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: action.payload.type,
                message: action.payload.message,
            };
            state.log.push(newEntry);
            if (state.log.length > 200) { // Increased buffer
                state.log.shift();
            }
        },
        clearLog(state) {
            state.log = [];
        },
        initializeLog(state, action: PayloadAction<LogEntry[]>) {
            state.log = action.payload;
        },
        setLogFilter(state, action: PayloadAction<LogEntryType | 'all'>) {
            state.filter = action.payload;
        }
    },
});

export const { logEvent, clearLog, initializeLog, setLogFilter } = logSlice.actions;
export default logSlice.reducer;