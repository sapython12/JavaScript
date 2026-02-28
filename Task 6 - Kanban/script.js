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

    // helper: simulate network delay for loader requirement
    function simulateNetworkRequest() {
        return new Promise(resolve => setTimeout(resolve, 800));
    }

    // helper: check if a column has reached its max limit
    function isColumnFull(targetStatus) {
        const limit = parseInt(columnLimits[targetStatus], 10);
        if (!limit || limit <= 0) return false; // 0 or empty means no limit
        
        // count only active tasks in that specific column
        const currentCount = tasks.filter(t => !t.isArchived && t.status === targetStatus).length;
        return currentCount >= limit;
    }

    // format status for UI display in sweetalerts and exports
    function formatStatusName(statusId) {
        if (statusId === 'todo-list') return 'To Do';
        if (statusId === 'inprogress-list') return 'In Progress';
        return 'Completed';
    }

    // dom manipulation and rendering
    const lists = {
        'todo-list': document.getElementById('todo-list'),
        'inprogress-list': document.getElementById('inprogress-list'),
        'completed-list': document.getElementById('completed-list')
    };

    function renderAllTasks() {
        Object.values(lists).forEach(list => list.innerHTML = '');
        
        // exclude archived tasks from the dashboard
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

        const card = document.createElement('div');
        card.className = `task-card ${isCompleted ? 'completed-task' : ''}`;
        card.draggable = true;
        card.dataset.id = task.id; 
        card.dataset.priority = task.priority; 
        card.dataset.title = task.title.toLowerCase(); 
        
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
                buttons: {
                    cancel: true,
                    confirm: { text: "Delete", value: true, visible: true, className: "", closeModal: false }
                },
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
    const closeBtns = document.querySelectorAll('.close-modal');

    // close modals when clicking 'x' outside
    closeBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
    window.addEventListener('click', (e) => {
        if (e.target === viewModal || e.target === editModal || e.target === archiveModal || e.target === settingsModal || e.target === exportModal) closeAllModals();
    });

    function closeAllModals() {
        viewModal.style.display = 'none';
        editModal.style.display = 'none';
        archiveModal.style.display = 'none';
        settingsModal.style.display = 'none';
        exportModal.style.display = 'none';
        clearValidation(document.getElementById('edit-task-form'));
    }

    // populate and open view modal
    function openViewModal(task) {
        document.getElementById('view-title-display').textContent = task.title;
        document.getElementById('view-desc-display').textContent = task.desc;
        document.getElementById('view-date-display').textContent = `Due: ${task.dateFormatted}`;
        
        const priorityBadge = document.getElementById('view-priority-display');
        priorityBadge.textContent = task.priority;
        priorityBadge.className = 'priority-badge p-' + task.priority.toLowerCase();
        
        viewModal.style.display = 'flex';
    }

    // populate and open edit modal
    function openEditModal(task) {
        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-desc').value = task.desc;
        document.getElementById('edit-task-date').value = task.rawDate; 
        document.getElementById('edit-task-priority').value = task.priority;
        document.getElementById('edit-task-status').value = task.status; 
        
        editModal.style.display = 'flex';
    }


    // form validation logic
    function validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[type="text"], input[type="date"], textarea');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.parentElement.classList.add('has-error');
                isValid = false;
            } else {
                input.parentElement.classList.remove('has-error');
            }
        });
        return isValid;
    }

    function clearValidation(form) {
        form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
    }

    // clear error dynamically as user types
    document.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', function() {
            if(this.value.trim()) {
                this.parentElement.classList.remove('has-error');
            }
        });
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
            // prepare CSV headers
            const headers = ['ID', 'Title', 'Description', 'Due Date', 'Priority', 'Status', 'Archived'];
            
            // map tasks to rows, handle commas and quotes inside text
            const rows = tasks.map(t => {
                return [
                    t.id,
                    `"${t.title.replace(/"/g, '""')}"`,
                    `"${t.desc.replace(/"/g, '""')}"`,
                    t.dateFormatted,
                    t.priority,
                    formatStatusName(t.status),
                    t.isArchived ? 'Yes' : 'No'
                ].join(',');
            });

            fileContent = [headers.join(','), ...rows].join('\n');
            fileName = `Kanban_Tasks_${new Date().toISOString().slice(0,10)}.csv`;
            mimeType = 'text/csv;charset=utf-8;';
        }

        // trigger browser download
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
        updateAllCounts(); // refresh visual indicators
    });

    // add and edit form submission
    document.getElementById('add-task-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        if(!validateForm(this)) return; 

        // apply limit on add
        if (isColumnFull('todo-list')) {
            swal("Limit Reached", "The 'To Do' column has reached its maximum limit.", "error");
            return;
        }

        const submitBtn = this.querySelector('.btn-add');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        await simulateNetworkRequest(); 

        const title = document.getElementById('task-title').value;
        const desc = document.getElementById('task-desc').value;
        const dateStr = document.getElementById('task-date').value;
        const priority = document.getElementById('task-priority').value;

        const dateObj = new Date(dateStr);
        dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
        const formattedDate = dateStr ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Date';

        const newTask = {
            id: Date.now().toString(),
            title: title,
            desc: desc,
            rawDate: dateStr, 
            dateFormatted: formattedDate,
            priority: priority,
            status: 'todo-list',
            isArchived: false
        };

        tasks.push(newTask);
        saveTasksToStorage();
        createTaskElement(newTask);
        updateAllCounts();
        
        this.reset();
        clearValidation(this);
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-priority').value = 'All';
        applyFilters(); 

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });

    document.getElementById('edit-task-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        if(!validateForm(this)) return; 

        const id = document.getElementById('edit-task-id').value;
        const newStatus = document.getElementById('edit-task-status').value;
        const currentTask = tasks.find(t => t.id === id);

        // apply limit on edit (if status changes to a full column)
        if (currentTask && currentTask.status !== newStatus && isColumnFull(newStatus)) {
            swal("Limit Reached", `The '${formatStatusName(newStatus)}' column has reached its maximum limit.`, "error");
            return;
        }

        const submitBtn = this.querySelector('.btn-add');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        await simulateNetworkRequest(); 

        const title = document.getElementById('edit-task-title').value;
        const desc = document.getElementById('edit-task-desc').value;
        const dateStr = document.getElementById('edit-task-date').value;
        const priority = document.getElementById('edit-task-priority').value;

        const dateObj = new Date(dateStr);
        dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
        const formattedDate = dateStr ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Date';

        // update the task in array
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex > -1) {
            tasks[taskIndex].title = title;
            tasks[taskIndex].desc = desc;
            tasks[taskIndex].rawDate = dateStr;
            tasks[taskIndex].dateFormatted = formattedDate;
            tasks[taskIndex].priority = priority;
            tasks[taskIndex].status = newStatus;
            
            saveTasksToStorage();
            renderAllTasks();
            applyFilters();
            closeAllModals();
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
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
            buttons: {
                cancel: true,
                confirm: { text: "Archive", value: true, visible: true, className: "", closeModal: false }
            },
        }).then(async (willArchive) => {
            if (willArchive) {
                await simulateNetworkRequest(); 

                const idsToArchive = Array.from(checkedBoxes).map(cb => cb.value);
                tasks.forEach(t => {
                    if (idsToArchive.includes(t.id)) t.isArchived = true;
                });
                
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
            buttons: {
                cancel: true,
                confirm: { text: "Delete All", value: true, visible: true, className: "", closeModal: false }
            },
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

        // individual restore logic
        archiveListContainer.querySelectorAll('.archived-btn-restore').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const task = tasks.find(t => t.id === id);
                
                // apply limit on restore from archive
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

        // individual permanent delete logic
        archiveListContainer.querySelectorAll('.archived-btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                swal({
                    title: "Delete Permanently?",
                    text: "This action cannot be undone.",
                    icon: "warning",
                    buttons: {
                        cancel: true,
                        confirm: { text: "Delete", value: true, visible: true, className: "", closeModal: false }
                    },
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

    // archive modal bulk actions
    document.getElementById('archive-restore-selected-btn').addEventListener('click', () => {
        const checkedBoxes = document.querySelectorAll('.archive-checkbox:checked');
        if (checkedBoxes.length === 0) {
            swal("No tasks selected", "Please select at least one task to restore.", "info");
            return;
        }

        // apply limits logic for bulk restoring
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
            buttons: {
                cancel: true,
                confirm: { text: "Restore Selected", value: true, visible: true, className: "", closeModal: false }
            },
        }).then(async (willRestore) => {
            if (willRestore) {
                await simulateNetworkRequest(); 

                tasks.forEach(t => {
                    if (idsToRestore.includes(t.id)) t.isArchived = false;
                });
                
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
            buttons: {
                cancel: true,
                confirm: { text: "Delete Selected", value: true, visible: true, className: "", closeModal: false }
            },
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
            // prevent dragging if clicking buttons or checkboxes
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
        list.addEventListener('dragover', function(e) {
            e.preventDefault(); 
            this.classList.add('drag-over');
        });

        list.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });

        list.addEventListener('drop', function() {
            this.classList.remove('drag-over');
            if (draggedItem) {
                const taskId = draggedItem.dataset.id;
                const newStatus = this.id; 

                const taskIndex = tasks.findIndex(t => t.id === taskId);
                if (taskIndex > -1) {
                    const currentStatus = tasks[taskIndex].status;
                    
                    // apply limit on drag & drop
                    if (currentStatus !== newStatus && isColumnFull(newStatus)) {
                        swal("Limit Reached", `The '${formatStatusName(newStatus)}' column has reached its maximum limit.`, "error");
                        renderAllTasks(); // reverts visual UI state instantly
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
            const visibleCards = Array.from(col.querySelectorAll('.task-card'))
                                      .filter(card => card.style.display !== 'none');
            
            const countSpan = col.querySelector('.task-count');
            
            // check if column has a limit set to display eg "2/5 Tasks"
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
