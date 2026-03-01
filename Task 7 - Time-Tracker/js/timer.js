// js/timer.js

let timerInterval = null;
let activeStartTime = null; // cache in memory for better performance

// reusable formatting function
function formatDuration(totalSeconds) {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function updateTimerDisplay() {
    if (!activeStartTime) return;

    // calculate elapsed time from memory instead of LocalStorage
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - activeStartTime) / 1000);
    
    document.getElementById('timer-display').textContent = formatDuration(elapsedSeconds);
}

function startTimer(projectId, taskName) {
    activeStartTime = Date.now(); // store in memory
    
    const newTimer = {
        projectId: projectId,
        taskName: taskName,
        startTime: activeStartTime // store in LocalStorage
    };
    
    Storage.setActiveTimer(newTimer);
    
    // UI updates
    updateTimerDisplay(); 
    timerInterval = setInterval(updateTimerDisplay, 1000);
    
    document.getElementById('btn-start-timer').classList.add('hidden');
    document.getElementById('btn-stop-timer').classList.remove('hidden');
    document.getElementById('active-timer-indicator').classList.remove('hidden');
}

function stopTimer() {
    const activeTimer = Storage.getActiveTimer();
    if (!activeTimer) return;

    clearInterval(timerInterval);
    
    const endTime = Date.now();
    const durationSeconds = Math.floor((endTime - activeTimer.startTime) / 1000);

    // create log entry object
    const newLog = {
        id: Date.now().toString(), 
        projectId: activeTimer.projectId,
        taskName: activeTimer.taskName,
        startTime: activeTimer.startTime,
        endTime: endTime,
        durationSeconds: durationSeconds,
        notes: "" 
    };

    // save to logs array
    const logs = Storage.getLogs();
    logs.push(newLog);
    Storage.saveLogs(logs);

    Storage.clearActiveTimer();
    activeStartTime = null; // clear memory cache
    
    // reset UI
    document.getElementById('timer-display').textContent = "00:00:00";
    document.getElementById('btn-start-timer').classList.remove('hidden');
    document.getElementById('btn-stop-timer').classList.add('hidden');
    document.getElementById('active-timer-indicator').classList.add('hidden');
}