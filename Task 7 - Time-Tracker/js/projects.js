// project crud logic
import { getData, saveData } from './storage.js';

export const getProjects = () => getData('projects');

export const addProject = (name, color) => {
    const projects = getProjects();
    const newProj = {
        id: crypto.randomUUID(),
        name: name,
        color: color,
        createdAt: Date.now()
    };
    projects.push(newProj);
    saveData('projects', projects);
    return newProj;
};

export const getProjectById = (id) => {
    return getProjects().find(p => p.id === id);
};
