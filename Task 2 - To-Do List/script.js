// state management
let tasks = JSON.parse(localStorage.getItem('tasks')) || []; // get tasks from localstorage (parse from string to array). If null, we use empty array [].

// now dom elements
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const clearBtn = document.getElementById('clearBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');

// core functions of this todo list

// this handles saving of the data and updating the web page at the same time
function saveAndRender() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderUI();
}

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText !== "") {
        tasks.push({text: taskText, completed: false });
    }
    saveAndRender();
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveAndRender();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    saveAndRender();
}

function clearAll() {
    tasks = [];
    saveAndRender();
}

// DOM manipulation (updating the web page)
function renderUI() {
    taskList.innerHTML = '';
    taskCount.innerText = tasks.length;

    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        if (task.completed) {
            li.classList.add('completed');
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; // on click it will strikethrough the task
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTask(index));

        const span = document.createElement('span');
        span.innerText = task.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'Delete'; // on click it will delete the task
        deleteBtn.addEventListener('click', () => deleteTask(index));

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);

        taskList.appendChild(li);
    });
}

// event handling 
addBtn.addEventListener('click', addTask);
clearBtn.addEventListener('click', clearAll);

taskInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        addTask();
    }
})

// initialization. this will render the ui when the webpage first loads
renderUI();