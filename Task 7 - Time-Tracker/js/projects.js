// js/projects.js

function renderProjects() {
    const projects = Storage.getProjects();
    const container = document.getElementById('project-list-container');
    
    // handle the empty state requirement
    if (projects.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">No projects yet. Create one above!</p>';
        updateProjectDropdown(projects);
        return;
    }

    // clear current list and render new items
    container.innerHTML = '';
    
    projects.forEach(project => {
        // create the card using the CSS classes from components.css
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div>
                <div class="card-title">
                    <span class="color-tag" style="background-color: ${project.color}"></span>
                    ${project.name}
                </div>
            </div>
            <button class="btn btn-danger btn-delete-project" data-id="${project.id}">Delete</button>
        `;
        container.appendChild(card);
    });

    // event delegation: Attach listeners to the dynamically created delete buttons
    container.querySelectorAll('.btn-delete-project').forEach(button => {
        button.addEventListener('click', (e) => {
            deleteProject(e.target.dataset.id);
        });
    });
    
    // always keep the timer's dropdown in sync
    updateProjectDropdown(projects);
}

function updateProjectDropdown(projects) {
    const select = document.getElementById('timer-project-select');
    // reset to default option
    select.innerHTML = '<option value="">Select Project</option>';
    
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        select.appendChild(option);
    });
}

function addProject(name, colorTag) {
    const projects = Storage.getProjects();
    const newProject = {
        id: Date.now().toString(),
        name: name,
        color: colorTag || '#cccccc', // default to a gray if no color is picked
        createdAt: Date.now()
    };
    
    projects.push(newProject);
    Storage.saveProjects(projects);
    renderProjects();
}

function deleteProject(id) {
    // modal confirmation dialog before deletion
    showConfirmModal("Are you sure you want to delete this project?", () => {
        let projects = Storage.getProjects();
        projects = projects.filter(p => p.id !== id);
        Storage.saveProjects(projects);
        renderProjects();
    });
}