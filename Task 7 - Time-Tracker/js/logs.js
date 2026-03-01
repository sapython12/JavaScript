// js/logs.js

function renderLogs() {
    const logs = Storage.getLogs();
    const projects = Storage.getProjects();
    const container = document.getElementById('logs-list-container');
    
    if (logs.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">No time logged yet.</p>';
        return;
    }

    container.innerHTML = '';
    
    // sort logs so the newest are at the top
    const sortedLogs = [...logs].sort((a, b) => b.startTime - a.startTime);

    sortedLogs.forEach(log => {
        // find the associated project to get its name and color
        const project = projects.find(p => p.id === log.projectId);
        const projectName = project ? project.name : 'Deleted Project';
        const projectColor = project ? project.color : '#cccccc';
        const date = new Date(log.startTime).toLocaleDateString();

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div>
                <div class="card-title">${log.taskName}</div>
                <div class="card-subtitle">
                    <span class="color-tag" style="background-color: ${projectColor}; width: 12px; height: 12px;"></span>
                    ${projectName} &nbsp;|&nbsp; ${date} &nbsp;|&nbsp; <strong>${formatDuration(log.durationSeconds)}</strong>
                </div>
            </div>
            <button class="btn btn-danger btn-delete-log" data-id="${log.id}">Delete</button>
        `;
        container.appendChild(card);
    });

    // event delegation for deleting logs
    container.querySelectorAll('.btn-delete-log').forEach(button => {
        button.addEventListener('click', (e) => {
            deleteLog(e.target.dataset.id);
        });
    });
}

function renderDailySummary() {
    const logs = Storage.getLogs();
    const projects = Storage.getProjects();
    const container = document.getElementById('daily-summary-container');
    
    // get start of today in milliseconds to filter logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    // filter for logs that started today
    const todayLogs = logs.filter(log => {
        const logDate = new Date(log.startTime);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === todayStart;
    });

    if (todayLogs.length === 0) {
        container.innerHTML = '<h3>Today\'s Summary</h3><p style="color: var(--text-muted); font-size: 0.9rem;">No time tracked today.</p>';
        return;
    }

    // aggregate time per project
    const projectTotals = {};
    todayLogs.forEach(log => {
        if (!projectTotals[log.projectId]) {
            projectTotals[log.projectId] = 0;
        }
        projectTotals[log.projectId] += log.durationSeconds;
    });

    // build the summary UI
    let summaryHTML = '<h3>Today\'s Summary</h3><div style="margin-top: 10px; display: flex; gap: 15px; flex-wrap: wrap;">';
    
    for (const [projectId, totalSeconds] of Object.entries(projectTotals)) {
        const project = projects.find(p => p.id === projectId);
        const projectName = project ? project.name : 'Deleted Project';
        const projectColor = project ? project.color : '#ccc';
        
        summaryHTML += `
            <div style="background: var(--sidebar-bg); padding: 10px 15px; border-radius: 6px; border: 1px solid var(--border-color);">
                <span class="color-tag" style="background-color: ${projectColor}; width: 10px; height: 10px;"></span>
                <span style="font-size: 0.9rem; color: var(--text-muted);">${projectName}</span>
                <div style="font-size: 1.2rem; font-weight: 600; margin-top: 5px;">${formatDuration(totalSeconds)}</div>
            </div>
        `;
    }
    
    summaryHTML += '</div>';
    container.innerHTML = summaryHTML;
}

function deleteLog(id) {
    showConfirmModal("Are you sure you want to delete this log entry?", () => {
        let logs = Storage.getLogs();
        logs = logs.filter(log => log.id !== id);
        Storage.saveLogs(logs);
        
        // re-render both the logs list and the daily summary to reflect the deletion
        renderLogs();
        renderDailySummary();
    });
}