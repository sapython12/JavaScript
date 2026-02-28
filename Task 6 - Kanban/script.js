document.addEventListener('DOMContentLoaded', () => {
    
    // toggle theme logic
    const themeStyle = document.getElementById('theme-style');
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('kanban-theme') || 'light';
    applyTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = themeStyle.getAttribute('href') === 'light-style.css' ? 'light' : 'dark';
        applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    });

    function applyTheme(theme) {
        if (theme === 'dark') {
            themeStyle.setAttribute('href', 'dark-style.css');
            localStorage.setItem('kanban-theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>'; 
        } else {
            themeStyle.setAttribute('href', 'light-style.css');
            localStorage.setItem('kanban-theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>'; 
        }
    }

    // state management (localstorage)
    let tasks = JSON.parse(localStorage.getItem('kanban-data')) || [];
    let columnLimits = JSON.parse(localStorage.getItem('kanban-limits')) || {
        'todo-list': 0,
        'inprogress-list': 0,
        'completed-list': 0
    };

    function saveTasksToStorage() {
        localStorage.setItem('kanban-data', JSON.stringify(tasks));
    }

    function saveLimitsToStorage() {
        localStorage.setItem('kanban-limits', JSON.stringify(columnLimits));
    }

    // helper: simulate network delay
    function simulateNetworkRequest() {
        return new Promise(resolve => setTimeout(resolve, 800));
    }

    // helper: check column limit
    function isColumnFull(targetStatus) {
        const limit = parseInt(columnLimits[targetStatus], 10);
        if (!limit || limit <= 0) return false; 
        const currentCount = tasks.filter(t => !t.isArchived && t.status === targetStatus).length;
        return currentCount >= limit;
    }

    // format status string
    function formatStatusName(statusId) {
        if (statusId === 'todo-list') return 'To Do';
        if (statusId === 'inprogress-list') return 'In Progress';
        return 'Completed';
    }

    // helper: determine due date auto highlight
    function getDueDateStatusClass(dateStr) {
        if (!dateStr) return '';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const [y, m, d] = dateStr.split('-');
        const dueDate = new Date(y, m - 1, d);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) return 'status-overdue';
        if (dueDate.getTime() === today.getTime()) return 'status-today';
        return '';
    }

    // setup tagify
    const addTagify = new Tagify(document.getElementById('task-tags'));
    const editTagify = new Tagify(document.getElementById('edit-task-tags'));

    // setup dynamic subtasks
    function initSubtaskContainer(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        addSubtaskRow(container, '', true); // initialize first row with '+'

        container.addEventListener('click', (e) => {
            if(e.target.closest('.btn-add-sub')) {
                addSubtaskRow(container, '', false);
            } else if(e.target.closest('.btn-remove-sub')) {
                e.target.closest('.subtask-item').remove();
            }
        });
    }

    function addSubtaskRow(container, value = '', isFirst = false) {
        const row = document.createElement('div');
        row.className = 'subtask-item';
        
        const btnClass = isFirst ? 'btn-add-sub' : 'btn-remove-sub';
        const btnIcon = isFirst ? 'fa-plus' : 'fa-minus';
        
        row.innerHTML = `
            <input type="text" class="subtask-input" placeholder="Enter sub task..." value="${value}">
            <button type="button" class="btn-subtask-action ${btnClass}">
                <i class="fas ${btnIcon}"></i>
            </button>
        `;
        container.appendChild(row);
    }

    function getSubtasksFromContainer(containerId) {
        const inputs = document.getElementById(containerId).querySelectorAll('.subtask-input');
        return Array.from(inputs).map(input => input.value.trim()).filter(val => val !== '');
    }

    function populateSubtasksToContainer(containerId, subtasksArr = []) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        if (subtasksArr.length === 0) {
            addSubtaskRow(container, '', true);
        } else {
            subtasksArr.forEach((task, index) => {
                addSubtaskRow(container, task, index === 0);
            });
        }
    }

    // initialize base form subtasks
    initSubtaskContainer('add-subtasks-container');
    initSubtaskContainer('edit-subtasks-container');

    // dom manipulation and rendering
    const lists = {
        'todo-list': document.getElementById('todo-list'),
        'inprogress-list': document.getElementById('inprogress-list'),
        'completed-list': document.getElementById('completed-list')
    };

    function renderAllTasks() {
        Object.values(lists).forEach(list => list.innerHTML = '');
        tasks.filter(t => !t.isArchived).forEach(task => createTaskElement(task));
        updateAllCounts();
    }

    function createTaskElement(task) {
        let priorityClass = 'p-medium';
        if(task.priority === 'Low') priorityClass = 'p-low';
        if(task.priority === 'High') priorityClass = 'p-high';
        
        const isCompleted = task.status === 'completed-list';
        const displayPriority = isCompleted ? '✔ Done' : task.priority;
        const displayClass = isCompleted ? 'p-done' : priorityClass;
        
        // determine auto-highlight unless it's completed
        const highlightClass = isCompleted ? '' : getDueDateStatusClass(task.rawDate);

        const card = document.createElement('div');
        card.className = `task-card ${isCompleted ? 'completed-task' : ''} ${highlightClass}`;
        card.draggable = true;
        card.dataset.id = task.id; 
        card.dataset.priority = task.priority; 
        card.dataset.title = task.title.toLowerCase(); 
        
        const cardTagsHtml = (task.tags || []).length > 0 
            ? `<div class="card-tags">${task.tags.map(t => `<span class="tag-badge">${t}</span>`).join('')}</div>` 
            : '';

        card.innerHTML = `
            <div class="card-header">
                <div class="header-left">
                    <input type="checkbox" class="task-checkbox" value="${task.id}">
                    <h4>${task.title}</h4>
                </div>
                <div class="header-actions">
                    <button class="action-btn view-btn" title="View"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" title="Edit"><i class="fas fa-pen"></i></button>
                    <button class="action-btn delete-btn" title="Delete Task"><i class="fas fa-xmark"></i></button>
                </div>
            </div>
            ${cardTagsHtml}
            <p>${task.desc}</p>
            <div class="task-meta">
                <span class="due-date">Due: ${task.dateFormatted}</span>
                <span class="priority-badge ${displayClass}">${displayPriority}</span>
            </div>
        `;

        // action button event listeners
        const viewBtn = card.querySelector('.view-btn');
        viewBtn.addEventListener('click', (e) => { e.stopPropagation(); openViewModal(task); });

        const editBtn = card.querySelector('.edit-btn');
        editBtn.addEventListener('click', (e) => { e.stopPropagation(); openEditModal(task); });

        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation(); 
            swal({
                title: "Are you sure?",
                text: "Are you sure you want to delete this task?",
                icon: "warning",
                buttons: { cancel: true, confirm: { text: "Delete", value: true, visible: true, className: "", closeModal: false } },
                dangerMode: true,
            }).then(async (willDelete) => {
                if (willDelete) {
                    await simulateNetworkRequest(); 
                    tasks = tasks.filter(t => t.id !== task.id);
                    saveTasksToStorage();
                    renderAllTasks();
                    applyFilters(); 
                    swal.close();
                }
            });
        });

        addDragEvents(card);
        lists[task.status].appendChild(card);
    }

    // modals logic
    const viewModal = document.getElementById('view-modal');
    const editModal = document.getElementById('edit-modal');
    const archiveModal = document.getElementById('archive-modal');
    const settingsModal = document.getElementById('settings-modal');
    const exportModal = document.getElementById('export-modal');
    const importModal = document.getElementById('import-modal');
    const closeBtns = document.querySelectorAll('.close-modal');

    closeBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
    window.addEventListener('click', (e) => {
        if ([viewModal, editModal, archiveModal, settingsModal, exportModal, importModal].includes(e.target)) closeAllModals();
    });

    function closeAllModals() {
        [viewModal, editModal, archiveModal, settingsModal, exportModal, importModal].forEach(m => m.style.display = 'none');
        clearValidation(document.getElementById('edit-task-form'));
    }

    // view modal
    function openViewModal(task) {
        document.getElementById('view-title-display').textContent = task.title;
        document.getElementById('view-desc-display').textContent = task.desc;
        document.getElementById('view-date-display').textContent = `Due: ${task.dateFormatted}`;
        
        const priorityBadge = document.getElementById('view-priority-display');
        priorityBadge.textContent = task.priority;
        priorityBadge.className = 'priority-badge p-' + task.priority.toLowerCase();
        
        const tagsHtml = (task.tags || []).map(t => `<span class="tag-badge">${t}</span>`).join('');
        document.getElementById('view-tags-display').innerHTML = tagsHtml;

        const subtasksSec = document.querySelector('.view-subtasks-section');
        const subtasksList = document.getElementById('view-subtasks-list');
        if (task.subtasks && task.subtasks.length > 0) {
            subtasksList.innerHTML = task.subtasks.map(st => `<li><i class="fas fa-check-circle"></i> ${st}</li>`).join('');
            subtasksSec.style.display = 'block';
        } else {
            subtasksSec.style.display = 'none';
        }

        viewModal.style.display = 'flex';
    }

    // edit modal
    function openEditModal(task) {
        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-desc').value = task.desc;
        document.getElementById('edit-task-date').value = task.rawDate; 
        document.getElementById('edit-task-priority').value = task.priority;
        document.getElementById('edit-task-status').value = task.status; 
        
        editTagify.removeAllTags();
        editTagify.addTags(task.tags || []);
        
        populateSubtasksToContainer('edit-subtasks-container', task.subtasks || []);

        editModal.style.display = 'flex';
    }


    // form validation
    function validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[type="text"]:not(.subtask-input):not(.tagify__input), input[type="date"], textarea');
        
        inputs.forEach(input => {
            // tagify creates hidden inputs, ignore them for empty check
            if (input.classList.contains('tagify__input')) return;

            if (!input.value.trim() && input.hasAttribute('required') === false) {
                 if(input.parentElement.querySelector('.error-text')) {
                    if(!input.value.trim()){
                       input.parentElement.classList.add('has-error');
                       isValid = false;
                    }
                 }
            }
        });
        return isValid;
    }

    function clearValidation(form) {
        form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
    }

    document.querySelectorAll('input:not(.tagify__input), textarea').forEach(input => {
        input.addEventListener('input', function() {
            if(this.value.trim()) {
                this.parentElement.classList.remove('has-error');
            }
        });
    });

    // add task submission
    document.getElementById('add-task-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        // target standard required inputs manually to avoid complex selectors picking up tagify/subtasks
        const titleInput = document.getElementById('task-title');
        const descInput = document.getElementById('task-desc');
        const dateInput = document.getElementById('task-date');
        let isValid = true;
        [titleInput, descInput, dateInput].forEach(inp => {
            if(!inp.value.trim()) { inp.parentElement.classList.add('has-error'); isValid = false; }
        });

        if(!isValid) return; 

        if (isColumnFull('todo-list')) {
            swal("Limit Reached", "The 'To Do' column has reached its maximum limit.", "error");
            return;
        }

        const submitBtn = this.querySelector('.btn-add');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        await simulateNetworkRequest(); 

        const dateObj = new Date(dateInput.value);
        dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
        const formattedDate = dateInput.value ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Date';

        const tagValues = addTagify.value.map(t => t.value);
        const subtasks = getSubtasksFromContainer('add-subtasks-container');

        const newTask = {
            id: Date.now().toString(),
            title: titleInput.value,
            desc: descInput.value,
            rawDate: dateInput.value, 
            dateFormatted: formattedDate,
            priority: document.getElementById('task-priority').value,
            tags: tagValues,
            subtasks: subtasks,
            status: 'todo-list',
            isArchived: false
        };

        tasks.push(newTask);
        saveTasksToStorage();
        createTaskElement(newTask);
        updateAllCounts();
        
        this.reset();
        addTagify.removeAllTags();
        populateSubtasksToContainer('add-subtasks-container', []); // reset subtasks
        clearValidation(this);
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-priority').value = 'All';
        applyFilters(); 

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });

    // edit task submission
    document.getElementById('edit-task-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const titleInput = document.getElementById('edit-task-title');
        const descInput = document.getElementById('edit-task-desc');
        const dateInput = document.getElementById('edit-task-date');
        let isValid = true;
        [titleInput, descInput, dateInput].forEach(inp => {
            if(!inp.value.trim()) { inp.parentElement.classList.add('has-error'); isValid = false; }
        });

        if(!isValid) return; 

        const id = document.getElementById('edit-task-id').value;
        const newStatus = document.getElementById('edit-task-status').value;
        const currentTask = tasks.find(t => t.id === id);

        if (currentTask && currentTask.status !== newStatus && isColumnFull(newStatus)) {
            swal("Limit Reached", `The '${formatStatusName(newStatus)}' column has reached its maximum limit.`, "error");
            return;
        }

        const submitBtn = this.querySelector('.btn-add');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        await simulateNetworkRequest(); 

        const dateObj = new Date(dateInput.value);
        dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
        const formattedDate = dateInput.value ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Date';

        const tagValues = editTagify.value.map(t => t.value);
        const subtasks = getSubtasksFromContainer('edit-subtasks-container');

        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex > -1) {
            tasks[taskIndex].title = titleInput.value;
            tasks[taskIndex].desc = descInput.value;
            tasks[taskIndex].rawDate = dateInput.value;
            tasks[taskIndex].dateFormatted = formattedDate;
            tasks[taskIndex].priority = document.getElementById('edit-task-priority').value;
            tasks[taskIndex].tags = tagValues;
            tasks[taskIndex].subtasks = subtasks;
            tasks[taskIndex].status = newStatus;
            
            saveTasksToStorage();
            renderAllTasks();
            applyFilters();
            closeAllModals();
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });

    // import logic
    document.getElementById('import-btn').addEventListener('click', () => {
        importModal.style.display = 'flex';
    });

    document.getElementById('import-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function(e) {
            const contents = e.target.result;
            try {
                let importedTasks = [];
                
                if (file.name.endsWith('.json')) {
                    importedTasks = JSON.parse(contents);
                } else if (file.name.endsWith('.csv')) {
                    // robust custom csv parser
                    let lines = [];
                    let row = [];
                    let inQuotes = false;
                    let str = "";
                    for (let i = 0; i < contents.length; i++) {
                        let c = contents[i];
                        let nc = contents[i+1];
                        if (c === '"' && inQuotes && nc === '"') { str += '"'; i++; }
                        else if (c === '"') { inQuotes = !inQuotes; }
                        else if (c === ',' && !inQuotes) { row.push(str); str = ""; }
                        else if (c === '\n' && !inQuotes) { row.push(str); lines.push(row); row = []; str = ""; }
                        else if (c !== '\r') { str += c; }
                    }
                    if (str || row.length > 0) { row.push(str); lines.push(row); }

                    // map parsed csv lines to objects
                    if (lines.length > 1) {
                        for(let i=1; i<lines.length; i++) {
                            const l = lines[i];
                            if(l.length >= 7) {
                                // expected: ID,Title,Description,RawDate,FormattedDate,Priority,Status,Archived,Tags,Subtasks
                                importedTasks.push({
                                    id: l[0] || Date.now().toString() + i,
                                    title: l[1] || 'Imported Task',
                                    desc: l[2] || '',
                                    rawDate: l[3] || '',
                                    dateFormatted: l[4] || '',
                                    priority: l[5] || 'Medium',
                                    status: l[6] === 'To Do' ? 'todo-list' : l[6] === 'In Progress' ? 'inprogress-list' : 'completed-list',
                                    isArchived: l[7] === 'Yes',
                                    tags: l[8] ? JSON.parse(l[8]) : [],
                                    subtasks: l[9] ? JSON.parse(l[9]) : []
                                });
                            }
                        }
                    }
                }

                // merge imported tasks bypassing limits to avoid blocking mass imports
                importedTasks.forEach(it => {
                    const exists = tasks.findIndex(t => t.id === it.id);
                    if (exists > -1) { tasks[exists] = it; } 
                    else { tasks.push(it); }
                });

                saveTasksToStorage();
                renderAllTasks();
                closeAllModals();
                fileInput.value = '';
                swal("Imported", `Successfully imported ${importedTasks.length} tasks.`, "success");

            } catch (err) {
                console.error(err);
                swal("Import Failed", "Failed to parse the file. Please ensure it's a valid format.", "error");
            }
        };
        reader.readAsText(file);
    });

    // export logic
    document.getElementById('export-btn').addEventListener('click', () => {
        exportModal.style.display = 'flex';
    });

    document.getElementById('export-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const format = document.getElementById('export-format').value;
        
        if (tasks.length === 0) {
            swal("No Data", "There are no tasks to export.", "info");
            closeAllModals();
            return;
        }

        let fileContent, fileName, mimeType;

        if (format === 'json') {
            fileContent = JSON.stringify(tasks, null, 2);
            fileName = `Kanban_Tasks_${new Date().toISOString().slice(0,10)}.json`;
            mimeType = 'application/json';
        } else if (format === 'csv') {
            const headers = ['ID', 'Title', 'Description', 'RawDate', 'FormattedDate', 'Priority', 'Status', 'Archived', 'Tags', 'Subtasks'];
            
            const rows = tasks.map(t => {
                const tagsStr = t.tags && t.tags.length ? JSON.stringify(t.tags).replace(/"/g, '""') : '[]';
                const subStr = t.subtasks && t.subtasks.length ? JSON.stringify(t.subtasks).replace(/"/g, '""') : '[]';
                
                return [
                    t.id,
                    `"${t.title.replace(/"/g, '""')}"`,
                    `"${t.desc.replace(/"/g, '""')}"`,
                    t.rawDate,
                    t.dateFormatted,
                    t.priority,
                    formatStatusName(t.status),
                    t.isArchived ? 'Yes' : 'No',
                    `"${tagsStr}"`,
                    `"${subStr}"`
                ].join(',');
            });

            fileContent = [headers.join(','), ...rows].join('\n');
            fileName = `Kanban_Tasks_${new Date().toISOString().slice(0,10)}.csv`;
            mimeType = 'text/csv;charset=utf-8;';
        }

        const blob = new Blob([fileContent], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        closeAllModals();
    });

    // settings logic
    document.getElementById('settings-btn').addEventListener('click', () => {
        document.getElementById('limit-todo').value = columnLimits['todo-list'] || '';
        document.getElementById('limit-inprogress').value = columnLimits['inprogress-list'] || '';
        document.getElementById('limit-completed').value = columnLimits['completed-list'] || '';
        settingsModal.style.display = 'flex';
    });

    document.getElementById('settings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        columnLimits['todo-list'] = parseInt(document.getElementById('limit-todo').value) || 0;
        columnLimits['inprogress-list'] = parseInt(document.getElementById('limit-inprogress').value) || 0;
        columnLimits['completed-list'] = parseInt(document.getElementById('limit-completed').value) || 0;
        
        saveLimitsToStorage();
        closeAllModals();
        swal("Saved", "Board settings have been updated successfully.", "success");
        updateAllCounts(); 
    });

    // main board bulk actions
    document.getElementById('archive-selected-btn').addEventListener('click', () => {
        const checkedBoxes = document.querySelectorAll('.task-checkbox:checked');
        if (checkedBoxes.length === 0) {
            swal("No tasks selected", "Please select at least one task to archive.", "info");
            return;
        }

        swal({
            title: "Archive Tasks?",
            text: `You are about to archive ${checkedBoxes.length} task(s). They will be hidden from the board.`,
            icon: "info",
            buttons: { cancel: true, confirm: { text: "Archive", value: true, visible: true, className: "", closeModal: false } },
        }).then(async (willArchive) => {
            if (willArchive) {
                await simulateNetworkRequest(); 

                const idsToArchive = Array.from(checkedBoxes).map(cb => cb.value);
                tasks.forEach(t => { if (idsToArchive.includes(t.id)) t.isArchived = true; });
                
                saveTasksToStorage();
                renderAllTasks();
                applyFilters(); 
                swal.close();
                swal("Archived!", "Tasks have been moved to the archive.", "success");
            }
        });
    });

    document.getElementById('delete-selected-btn').addEventListener('click', () => {
        const checkedBoxes = document.querySelectorAll('.task-checkbox:checked');
        if (checkedBoxes.length === 0) {
            swal("No tasks selected", "Please select at least one task to delete.", "info");
            return;
        }

        swal({
            title: "Are you sure?",
            text: `You are about to delete ${checkedBoxes.length} selected task(s).`,
            icon: "warning",
            buttons: { cancel: true, confirm: { text: "Delete All", value: true, visible: true, className: "", closeModal: false } },
            dangerMode: true,
        }).then(async (willDelete) => {
            if (willDelete) {
                await simulateNetworkRequest(); 

                const idsToDelete = Array.from(checkedBoxes).map(cb => cb.value);
                tasks = tasks.filter(t => !idsToDelete.includes(t.id));
                
                saveTasksToStorage();
                renderAllTasks();
                applyFilters(); 
                swal.close();
            }
        });
    });

    // archive view and individual/bulk logic
    const archiveListContainer = document.getElementById('archive-list-container');

    document.getElementById('view-archive-btn').addEventListener('click', () => {
        renderArchiveList();
        archiveModal.style.display = 'flex';
    });

    function renderArchiveList() {
        archiveListContainer.innerHTML = '';
        const archivedTasks = tasks.filter(t => t.isArchived);
        
        if (archivedTasks.length === 0) {
            archiveListContainer.innerHTML = '<p style="text-align:center; color:#64748b; font-size:14px; margin-top: 20px;">No archived tasks found.</p>';
            return;
        }

        archivedTasks.forEach(task => {
            let statusDisplay = formatStatusName(task.status);

            const item = document.createElement('div');
            item.className = 'archived-item';
            item.innerHTML = `
                <div class="archived-item-info">
                    <input type="checkbox" class="archive-checkbox" value="${task.id}">
                    <div>
                        <h4>${task.title}</h4>
                        <p>Status: <strong>${statusDisplay}</strong> | Priority: <strong>${task.priority}</strong></p>
                    </div>
                </div>
                <div class="archived-item-actions">
                    <button class="archived-btn-restore" data-id="${task.id}" title="Restore Task"><i class="fas fa-rotate-left"></i> Restore</button>
                    <button class="archived-btn-delete" data-id="${task.id}" title="Delete Permanently"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
            archiveListContainer.appendChild(item);
        });

        archiveListContainer.querySelectorAll('.archived-btn-restore').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const task = tasks.find(t => t.id === id);
                
                if (task && isColumnFull(task.status)) {
                    swal("Limit Reached", `Cannot restore. The target column '${formatStatusName(task.status)}' is full.`, "error");
                    return;
                }
                
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                await simulateNetworkRequest();

                if(task) {
                    task.isArchived = false;
                    saveTasksToStorage();
                    renderArchiveList();
                    renderAllTasks();
                    applyFilters();
                }
            });
        });

        archiveListContainer.querySelectorAll('.archived-btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                swal({
                    title: "Delete Permanently?",
                    text: "This action cannot be undone.",
                    icon: "warning",
                    buttons: { cancel: true, confirm: { text: "Delete", value: true, visible: true, className: "", closeModal: false } },
                    dangerMode: true,
                }).then(async (willDelete) => {
                    if (willDelete) {
                        await simulateNetworkRequest();
                        tasks = tasks.filter(t => t.id !== id);
                        saveTasksToStorage();
                        renderArchiveList(); 
                        swal.close();
                    }
                });
            });
        });
    }

    document.getElementById('archive-restore-selected-btn').addEventListener('click', () => {
        const checkedBoxes = document.querySelectorAll('.archive-checkbox:checked');
        if (checkedBoxes.length === 0) {
            swal("No tasks selected", "Please select at least one task to restore.", "info");
            return;
        }

        const idsToRestore = Array.from(checkedBoxes).map(cb => cb.value);
        let columnsIncomingCount = { 'todo-list': 0, 'inprogress-list': 0, 'completed-list': 0 };
        
        idsToRestore.forEach(id => {
            const t = tasks.find(t => t.id === id);
            if(t) columnsIncomingCount[t.status]++;
        });

        let validationError = null;
        for (const [status, incomingAmount] of Object.entries(columnsIncomingCount)) {
            if (incomingAmount > 0) {
                const limit = parseInt(columnLimits[status], 10);
                if (limit > 0) {
                    const currentCount = tasks.filter(t => !t.isArchived && t.status === status).length;
                    if (currentCount + incomingAmount > limit) {
                        validationError = `Restoring these tasks exceeds the limit for '${formatStatusName(status)}'.`;
                        break;
                    }
                }
            }
        }

        if (validationError) {
            swal("Limit Reached", validationError, "error");
            return;
        }

        swal({
            title: "Restore Tasks?",
            text: `You are about to restore ${checkedBoxes.length} task(s) to the board.`,
            icon: "info",
            buttons: { cancel: true, confirm: { text: "Restore Selected", value: true, visible: true, className: "", closeModal: false } },
        }).then(async (willRestore) => {
            if (willRestore) {
                await simulateNetworkRequest(); 
                tasks.forEach(t => { if (idsToRestore.includes(t.id)) t.isArchived = false; });
                saveTasksToStorage();
                renderArchiveList();
                renderAllTasks();
                applyFilters(); 
                swal.close();
            }
        });
    });

    document.getElementById('archive-delete-selected-btn').addEventListener('click', () => {
        const checkedBoxes = document.querySelectorAll('.archive-checkbox:checked');
        if (checkedBoxes.length === 0) {
            swal("No tasks selected", "Please select at least one task to delete.", "info");
            return;
        }

        swal({
            title: "Delete Permanently?",
            text: `You are about to permanently delete ${checkedBoxes.length} selected task(s).`,
            icon: "warning",
            buttons: { cancel: true, confirm: { text: "Delete Selected", value: true, visible: true, className: "", closeModal: false } },
            dangerMode: true,
        }).then(async (willDelete) => {
            if (willDelete) {
                await simulateNetworkRequest(); 
                const idsToDelete = Array.from(checkedBoxes).map(cb => cb.value);
                tasks = tasks.filter(t => !idsToDelete.includes(t.id));
                saveTasksToStorage();
                renderArchiveList(); 
                swal.close();
            }
        });
    });


    // drag and drop logic
    let draggedItem = null;

    function addDragEvents(card) {
        card.addEventListener('dragstart', function(e) {
            if(e.target.closest('.action-btn') || e.target.type === 'checkbox') return; 
            draggedItem = card;
            setTimeout(() => card.classList.add('dragging'), 0);
        });

        card.addEventListener('dragend', function() {
            setTimeout(() => {
                if(draggedItem) draggedItem.classList.remove('dragging');
                draggedItem = null;
                updateAllCounts();
            }, 0);
        });
    }

    Object.values(lists).forEach(list => {
        list.addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('drag-over'); });
        list.addEventListener('dragleave', function() { this.classList.remove('drag-over'); });
        list.addEventListener('drop', function() {
            this.classList.remove('drag-over');
            if (draggedItem) {
                const taskId = draggedItem.dataset.id;
                const newStatus = this.id; 

                const taskIndex = tasks.findIndex(t => t.id === taskId);
                if (taskIndex > -1) {
                    const currentStatus = tasks[taskIndex].status;
                    
                    if (currentStatus !== newStatus && isColumnFull(newStatus)) {
                        swal("Limit Reached", `The '${formatStatusName(newStatus)}' column has reached its maximum limit.`, "error");
                        renderAllTasks(); 
                        return;
                    }

                    tasks[taskIndex].status = newStatus;
                    saveTasksToStorage();
                }

                renderAllTasks();
                applyFilters(); 
            }
        });
    });

    // filtering logic
    const searchInput = document.getElementById('filter-search');
    const priorityFilter = document.getElementById('filter-priority');

    function applyFilters() {
        const searchText = searchInput.value.toLowerCase();
        const priorityText = priorityFilter.value;
        
        const allCards = document.querySelectorAll('.task-card');

        allCards.forEach(card => {
            const matchesSearch = card.dataset.title.includes(searchText);
            const matchesPriority = priorityText === 'All' || card.dataset.priority === priorityText;

            if (matchesSearch && matchesPriority) {
                card.style.display = ''; 
            } else {
                card.style.display = 'none'; 
            }
        });
        updateAllCounts(); 
    }

    searchInput.addEventListener('input', applyFilters);
    priorityFilter.addEventListener('change', applyFilters);

    // counters logic
    function updateAllCounts() {
        document.querySelectorAll('.column').forEach(col => {
            const visibleCards = Array.from(col.querySelectorAll('.task-card')).filter(card => card.style.display !== 'none');
            const countSpan = col.querySelector('.task-count');
            const statusId = col.id.replace('col-', '') + '-list';
            const limit = parseInt(columnLimits[statusId], 10);
            
            if (limit && limit > 0) {
                countSpan.textContent = `${visibleCards.length}/${limit} Task${visibleCards.length !== 1 ? 's' : ''}`;
            } else {
                countSpan.textContent = `${visibleCards.length} Task${visibleCards.length !== 1 ? 's' : ''}`;
            }
        });
    }

    // initialize the board
    renderAllTasks();
});
