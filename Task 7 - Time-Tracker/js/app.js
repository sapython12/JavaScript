// main entry point
import { getData, saveData } from './storage.js';
import { getProjects, addProject, getProjectById } from './projects.js';
import { getLogs, deleteLog, addLog, formatDuration } from './logs.js';
import { startTimer, stopTimer, resumeTimer, getActiveTimer, setCallbacks, resetIdle } from './timer.js';
import { exportToCSV } from './export.js';

document.addEventListener('DOMContentLoaded', () => {

    // helper to simulate network delay for button loaders
    const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, 800));

    // 1. theme setup
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    let currentTheme = getData('theme');
    
    const applyTheme = (theme) => {
        body.setAttribute('data-theme', theme);
        saveData('theme', theme);
        themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        if (window.chartsRendered) renderCharts(); 
    };
    
    applyTheme(currentTheme);
    themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(currentTheme);
    });

    // 2. view toggling
    const views = {
        trackerBtn: document.getElementById('view-tracker-btn'),
        dashboardBtn: document.getElementById('view-dashboard-btn'),
        trackerView: document.getElementById('tracker-view'),
        dashboardView: document.getElementById('dashboard-view'),
        filters: document.getElementById('tracker-filters')
    };

    views.trackerBtn.addEventListener('click', () => {
        views.trackerView.style.display = 'block';
        views.filters.style.display = 'flex';
        views.dashboardView.style.display = 'none';
        views.trackerBtn.classList.add('active');
        views.dashboardBtn.classList.remove('active');
    });

    views.dashboardBtn.addEventListener('click', () => {
        views.trackerView.style.display = 'none';
        views.filters.style.display = 'none';
        views.dashboardView.style.display = 'block';
        views.dashboardBtn.classList.add('active');
        views.trackerBtn.classList.remove('active');
        renderCharts();
    });

    // 3. form validation helper
    const validateForm = (form) => {
        let valid = true;
        form.querySelectorAll('input[required], select[required]').forEach(input => {
            if (!input.value.trim()) {
                input.parentElement.classList.add('has-error');
                valid = false;
            } else {
                input.parentElement.classList.remove('has-error');
            }
        });
        return valid;
    };

    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('input', function() { this.parentElement.classList.remove('has-error'); });
    });

    // 4. projects logic
    const projectForm = document.getElementById('add-project-form');
    const projectSelects = [
        document.getElementById('task-project-select'), 
        document.getElementById('manual-proj'), 
        document.getElementById('filter-project')
    ];

    const updateProjectSelects = () => {
        const projects = getProjects();
        projectSelects.forEach(select => {
            const isFilter = select.id === 'filter-project';
            select.innerHTML = isFilter ? '<option value="All">All Projects</option>' : '<option value="" disabled selected>Select Project...</option>';
            projects.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.name;
                select.appendChild(opt);
            });
        });
    };

    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm(projectForm)) return;
        
        const submitBtn = projectForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        await simulateNetworkDelay();
        
        addProject(document.getElementById('proj-name').value, document.getElementById('proj-color').value);
        updateProjectSelects();
        projectForm.reset();
        swal("Success", "Project added successfully", "success");
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });

    // 5. timer ui sync
    const timerUI = {
        display: document.getElementById('timer-display'),
        details: document.getElementById('timer-details'),
        widget: document.getElementById('timer-widget'),
        stopBtn: document.getElementById('stop-timer-btn'),
        startForm: document.getElementById('start-task-form')
    };

    const updateTimerUI = () => {
        const active = getActiveTimer();
        if (active) {
            const proj = getProjectById(active.projectId);
            timerUI.details.innerHTML = `<strong>${proj ? proj.name : 'Unknown'}</strong><br>${active.taskName}`;
            timerUI.widget.classList.add('active');
            timerUI.stopBtn.style.display = 'block';
            timerUI.startForm.querySelector('button').disabled = true;
        } else {
            timerUI.display.textContent = '00:00:00';
            timerUI.details.textContent = 'No active task';
            timerUI.widget.classList.remove('active');
            timerUI.stopBtn.style.display = 'none';
            timerUI.startForm.querySelector('button').disabled = false;
        }
    };

    setCallbacks(
        (formattedTime) => timerUI.display.textContent = formattedTime,
        () => { updateTimerUI(); renderLogsUI(); }
    );

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keypress', resetIdle);

    timerUI.startForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm(timerUI.startForm)) return;
        
        const submitBtn = timerUI.startForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting...';

        await simulateNetworkDelay();
        
        startTimer(
            document.getElementById('task-project-select').value,
            document.getElementById('task-name').value
        );
        updateTimerUI();
        timerUI.startForm.reset();
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });

    timerUI.stopBtn.addEventListener('click', stopTimer);

    // 6. logs ui
    const logsList = document.getElementById('logs-list');
    const searchFilter = document.getElementById('filter-search');
    const projFilter = document.getElementById('filter-project');

    const renderLogsUI = () => {
        logsList.innerHTML = '';
        const search = searchFilter.value.toLowerCase();
        const pFilter = projFilter.value;
        const logs = getLogs();

        const filtered = logs.sort((a,b) => b.startTime - a.startTime).filter(log => {
            const proj = getProjectById(log.projectId);
            const matchesSearch = log.taskName.toLowerCase().includes(search) || (proj && proj.name.toLowerCase().includes(search));
            const matchesProj = pFilter === 'All' || log.projectId === pFilter;
            return matchesSearch && matchesProj;
        });

        if (filtered.length === 0) {
            logsList.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 20px;">No time logs found.</p>';
            return;
        }

        filtered.forEach(log => {
            const proj = getProjectById(log.projectId);
            const card = document.createElement('div');
            card.className = 'log-card';
            card.innerHTML = `
                <div class="log-info">
                    <h4><span class="proj-dot" style="background-color: ${proj ? proj.color : '#ccc'};"></span> ${proj ? proj.name : 'Deleted'}</h4>
                    <p>${log.taskName} <br> <small>${new Date(log.startTime).toLocaleDateString()} ${new Date(log.startTime).toLocaleTimeString()}</small></p>
                </div>
                <div style="display: flex; align-items: center;">
                    <div class="log-time">${formatDuration(log.durationSeconds)}</div>
                    <div class="log-actions">
                        <button class="action-btn delete-log" data-id="${log.id}" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            logsList.appendChild(card);
        });

        // safely bind delete events
        document.querySelectorAll('.delete-log').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const logId = e.currentTarget.dataset.id;
                
                swal({ title: "Delete Log?", icon: "warning", buttons: true, dangerMode: true })
                .then((willDelete) => {
                    if (willDelete) {
                        deleteLog(logId);
                        renderLogsUI();
                    }
                });
            });
        });
    };

    searchFilter.addEventListener('input', renderLogsUI);
    projFilter.addEventListener('change', renderLogsUI);

    // 7. manual modal
    const manualModal = document.getElementById('manual-modal');
    document.getElementById('manual-time-btn').addEventListener('click', () => manualModal.style.display = 'flex');

    document.getElementById('manual-log-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const start = new Date(document.getElementById('manual-start').value).getTime();
        const end = new Date(document.getElementById('manual-end').value).getTime();

        if (end <= start) return swal("Error", "End time must be after start time.", "error");

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        await simulateNetworkDelay();

        addLog(
            document.getElementById('manual-proj').value,
            document.getElementById('manual-task').value,
            start,
            end,
            document.getElementById('manual-notes').value
        );
        
        renderLogsUI();
        manualModal.style.display = 'none';
        form.reset();
        swal("Saved", "Manual time logged.", "success");
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });

    // 8. charts logic
    let weeklyChart, projectChart;
    window.chartsRendered = false;

    const renderCharts = () => {
        window.chartsRendered = true;
        const textColor = getComputedStyle(body).getPropertyValue('--text-main').trim();
        const logs = getLogs();

        // project pie chart
        const projData = {};
        logs.forEach(log => {
            const proj = getProjectById(log.projectId);
            const name = proj ? proj.name : 'Unknown';
            projData[name] = (projData[name] || 0) + log.durationSeconds;
        });

        const pieLabels = Object.keys(projData);
        const pieValues = Object.values(projData).map(v => (v / 3600).toFixed(2));
        const pieColors = pieLabels.map(label => {
            const p = getProjects().find(pr => pr.name === label);
            return p ? p.color : '#ccc';
        });

        if (projectChart) projectChart.destroy();
        const projCtx = document.getElementById('projectChart');
        if (projCtx) {
            projectChart = new Chart(projCtx.getContext('2d'), {
                type: 'doughnut',
                data: { labels: pieLabels, datasets: [{ data: pieValues, backgroundColor: pieColors }] },
                options: { plugins: { legend: { labels: { color: textColor } } } }
            });
        }

        // weekly bar chart
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekData = new Array(7).fill(0);
        
        logs.forEach(log => {
            const logDate = new Date(log.startTime);
            if (Math.ceil(Math.abs(Date.now() - logDate.getTime()) / (1000 * 60 * 60 * 24)) <= 7) {
                weekData[logDate.getDay()] += log.durationSeconds;
            }
        });

        if (weeklyChart) weeklyChart.destroy();
        const weeklyCtx = document.getElementById('weeklyChart');
        if (weeklyCtx) {
            weeklyChart = new Chart(weeklyCtx.getContext('2d'), {
                type: 'bar',
                data: { labels: days, datasets: [{ label: 'Hours', data: weekData.map(v => (v / 3600).toFixed(2)), backgroundColor: '#4285f4' }] },
                options: { scales: { y: { ticks: { color: textColor } }, x: { ticks: { color: textColor } } }, plugins: { legend: { labels: { color: textColor } } } }
            });
        }
    };

    // 9. export / import
    const exportModal = document.getElementById('export-modal');
    const importModal = document.getElementById('import-modal');

    document.getElementById('export-btn').addEventListener('click', () => exportModal.style.display = 'flex');
    document.getElementById('confirm-export-btn').addEventListener('click', () => { exportToCSV(); exportModal.style.display = 'none'; });
    
    document.getElementById('import-btn').addEventListener('click', () => importModal.style.display = 'flex');

    // dummy import parsing for bonus requirement
    document.getElementById('import-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = document.getElementById('import-file').files[0];
        if (!file) return;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';

        await simulateNetworkDelay();

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n').slice(1); 
            let count = 0;
            
            lines.forEach(line => {
                if(!line.trim()) return;
                const cols = line.split('","').map(c => c.replace(/"/g, ''));
                if(cols.length >= 4) {
                    addLog('imported', cols[2], Date.now(), Date.now(), 'Imported');
                    count++;
                }
            });
            
            renderLogsUI();
            importModal.style.display = 'none';
            e.target.reset();
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            swal("Imported", `Imported ${count} logs.`, "success");
        };
        reader.readAsText(file);
    });
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'));
    });

    // init app
    updateProjectSelects();
    if (getActiveTimer()) resumeTimer();
    updateTimerUI();
    renderLogsUI();
});
