// js/export.js

function exportToCSV() {
    const logs = Storage.getLogs();
    const projects = Storage.getProjects();
    
    if (logs.length === 0) {
        const errorEl = document.getElementById('export-error');
        errorEl.textContent = "No logs to export!";
        errorEl.style.display = 'block';
        setTimeout(() => { errorEl.style.display = 'none'; }, 3000);
        return;
    }

    // build the CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Project,Task,Duration,Notes\n";

    // loop through logs and add rows
    logs.forEach(log => {
        const date = new Date(log.startTime).toLocaleDateString();
        const project = projects.find(p => p.id === log.projectId);
        const projectName = project ? `"${project.name}"` : '"Deleted Project"'; 
        const taskName = `"${log.taskName}"`; // quotes handle commas in user input
        const duration = formatDuration(log.durationSeconds);
        const notes = `"${log.notes}"`;

        csvContent += `${date},${projectName},${taskName},${duration},${notes}\n`;
    });

    // trigger Download (Browser-native file API)
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "time_tracker_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}