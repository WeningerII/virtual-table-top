import { LogEntryType } from "./primitives";

export { AppMode } from './primitives';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: LogEntryType;
  message: string;
}
