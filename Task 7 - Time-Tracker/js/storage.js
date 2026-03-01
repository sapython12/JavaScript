// js/storage.js

// private helper to read from LocalStorage
function readData(key, defaultValue) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
}

// private helper to write to LocalStorage
function writeData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// public API

const Storage = {
    // projects [cite: 37]
    getProjects: () => readData('tt_projects', []),
    saveProjects: (projects) => writeData('tt_projects', projects),

    // time Logs [cite: 37]
    getLogs: () => readData('tt_logs', []),
    saveLogs: (logs) => writeData('tt_logs', logs),

    // active timer [cite: 37]
    getActiveTimer: () => readData('tt_active_timer', null),
    setActiveTimer: (timerData) => writeData('tt_active_timer', timerData),
    clearActiveTimer: () => localStorage.removeItem('tt_active_timer')
};