// time log crud and formatting
import { getData, saveData } from './storage.js';

export const getLogs = () => getData('logs');

export const addLog = (projectId, taskName, startTime, endTime, notes = '') => {
    const logs = getLogs();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);
    
    const newLog = {
        id: crypto.randomUUID(),
        projectId,
        taskName,
        startTime,
        endTime,
        durationSeconds,
        notes
    };
    
    logs.push(newLog);
    saveData('logs', logs);
    return newLog;
};

export const deleteLog = (id) => {
    let logs = getLogs();
    logs = logs.filter(l => l.id !== id);
    saveData('logs', logs);
};

export const formatDuration = (totalSeconds) => {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
};
