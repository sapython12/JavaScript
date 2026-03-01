// js/app.js

// global modal state
let confirmCallback = null;

function showConfirmModal(message, callback) {
    document.getElementById('modal-message').textContent = message;
    document.getElementById('delete-modal').classList.remove('hidden');
    confirmCallback = callback;
}

document.addEventListener('DOMContentLoaded', () => {
    
    // custom modal listeners
    document.getElementById('btn-cancel-delete').addEventListener('click', () => {
        document.getElementById('delete-modal').classList.add('hidden');
        confirmCallback = null;
    });

    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        document.getElementById('delete-modal').classList.add('hidden');
        if (confirmCallback) confirmCallback();
    });

    // navigation logic
    const navButtons = {
        'nav-timer': 'view-timer',
        'nav-projects': 'view-projects',
        'nav-logs': 'view-logs'
    };

    Object.keys(navButtons).forEach(btnId => {
        document.getElementById(btnId).addEventListener('click', (e) => {
            document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.sidebar nav button').forEach(el => el.classList.remove('active'));
            
            document.getElementById(navButtons[btnId]).classList.remove('hidden');
            e.target.closest('button').classList.add('active'); // Fixed for icons inside buttons

            if(btnId === 'nav-projects') renderProjects();
            if(btnId === 'nav-logs') {
                renderLogs();
                renderDailySummary();
            }
        });
    });

    // check for active timer on load
    const activeTimer = Storage.getActiveTimer();
    if (activeTimer) {
        activeStartTime = activeTimer.startTime; 
        timerInterval = setInterval(updateTimerDisplay, 1000);
        updateTimerDisplay(); 
        
        document.getElementById('btn-start-timer').classList.add('hidden');
        document.getElementById('btn-stop-timer').classList.remove('hidden');
        document.getElementById('active-timer-indicator').classList.remove('hidden');
    }

    // event listeners
    document.getElementById('btn-start-timer').addEventListener('click', () => {
        const projectId = document.getElementById('timer-project-select').value;
        const taskName = document.getElementById('timer-task-name').value.trim();
        const errorEl = document.getElementById('timer-error');
        
        if (!taskName) {
            errorEl.textContent = "Please enter a task name before starting the timer.";
            errorEl.style.display = 'block';
            return;
        }
        
        errorEl.style.display = 'none';
        startTimer(projectId, taskName);
    });

    document.getElementById('btn-stop-timer').addEventListener('click', stopTimer);

    document.getElementById('btn-add-project').addEventListener('click', () => {
        const name = document.getElementById('new-project-name').value.trim();
        const color = document.getElementById('new-project-color').value;
        const errorEl = document.getElementById('project-error');
        
        if (!name) {
            errorEl.textContent = "Project name cannot be empty.";
            errorEl.style.display = 'block';
            return;
        }
        
        errorEl.style.display = 'none';
        addProject(name, color);
        document.getElementById('new-project-name').value = ''; 
    });

    document.getElementById('btn-export-csv').addEventListener('click', exportToCSV);

    renderProjects();
});