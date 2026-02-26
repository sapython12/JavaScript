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
            themeToggle.textContent = '☀️'; 
        } else {
            themeStyle.setAttribute('href', 'light-style.css');
            localStorage.setItem('kanban-theme', 'light');
            themeToggle.textContent = '🌙'; 
        }
    }

    // state management (localStorage)
    let tasks = JSON.parse(localStorage.getItem('kanban-data')) || [];

    function saveTasksToStorage() {
        localStorage.setItem('kanban-data', JSON.stringify(tasks));
    }

    // dom manipulation and rendering
    const lists = {
        'todo-list': document.getElementById('todo-list'),
        'inprogress-list': document.getElementById('inprogress-list'),
        'completed-list': document.getElementById('completed-list')
    };

    function renderAllTasks() {
        Object.values(lists).forEach(list => list.innerHTML = '');
        tasks.forEach(task => createTaskElement(task));
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
        
        // card header wrapper and delete button (as extra)
        card.innerHTML = `
            <div class="card-header">
                <h4>${task.title}</h4>
                <button class="delete-btn" title="Delete Task">&times;</button>
            </div>
            <p>${task.desc}</p>
            <div class="task-meta">
                <span class="due-date">Due: ${task.dateFormatted}</span>
                <span class="priority-badge ${displayClass}">${displayPriority}</span>
            </div>
        `;

        // delete event
        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // prevents drag event from firing
            if(confirm('Are you sure you want to delete this task?')) {
                // remove from array then save then re-render
                tasks = tasks.filter(t => t.id !== task.id);
                saveTasksToStorage();
                renderAllTasks();
                applyFilters(); // keep filters the same after re-render
            }
        });

        addDragEvents(card);
        lists[task.status].appendChild(card);
    }

    // add new task
    document.getElementById('add-task-form').addEventListener('submit', function(e) {
        e.preventDefault();

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
            dateFormatted: formattedDate,
            priority: priority,
            status: 'todo-list' 
        };

        tasks.push(newTask);
        saveTasksToStorage();
        createTaskElement(newTask);
        updateAllCounts();
        
        // reset form and clear filters so the new task is actually visible
        this.reset();
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-priority').value = 'All';
        applyFilters(); 
    });


    // drag and drop
    let draggedItem = null;

    function addDragEvents(card) {
        card.addEventListener('dragstart', function(e) {
            // dont drag if they clicked the delete button
            if(e.target.classList.contains('delete-btn')) return; 
            
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

    // update counter
    function updateAllCounts() {
        document.querySelectorAll('.column').forEach(col => {
            const visibleCards = Array.from(col.querySelectorAll('.task-card'))
                                      .filter(card => card.style.display !== 'none');
            
            const countSpan = col.querySelector('.task-count');
            countSpan.textContent = `${visibleCards.length} Task${visibleCards.length !== 1 ? 's' : ''}`;
        });
    }

    // initialize the board on page load
    renderAllTasks();
});