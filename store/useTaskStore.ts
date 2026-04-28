import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, Project, TaskStatus } from '../types';

// Datos de prueba para arrancar la obra
const mockProjects: Project[] = [
    { id: 'proj-1', name: 'Maple St. Building', isActive: true, colorTheme: '#00ffff', createdAt: new Date() },
    { id: 'proj-2', name: 'White Center', isActive: false, colorTheme: '#ff00ff', createdAt: new Date() }
];

const mockTasks: Task[] = [
    { id: 'tsk-001', projectId: 'proj-1', title: 'Cálculo de fundaciones', status: 'done', priority: 'high', createdAt: new Date('2026-04-10'), isMeeting: false, lastUpdated: new Date() },
    { id: 'tsk-002', projectId: 'proj-1', title: 'Wall panels primer nivel', status: 'in-progress', priority: 'medium', createdAt: new Date(), isMeeting: false, lastUpdated: new Date('2026-04-20') },
    { id: 'tsk-003', projectId: 'proj-2', title: 'Revisión de planos estructurales', status: 'todo', priority: 'critical', createdAt: new Date(), dueDate: new Date('2026-04-26'), isMeeting: false, lastUpdated: new Date() },
    { id: 'tsk-004', projectId: 'proj-1', title: 'Junta de aclaraciones', status: 'todo', priority: 'medium', createdAt: new Date(), meetingTime: new Date('2026-04-24T15:00:00'), isMeeting: true, lastUpdated: new Date() },
    { id: 'tsk-005', projectId: 'proj-2', title: 'Cotización de aceros', status: 'backlog', priority: 'low', createdAt: new Date('2026-04-01'), isMeeting: false, lastUpdated: new Date('2026-04-01') }
];

interface TaskStore {
    projects: Project[];
    tasks: Task[];
    activeProjectId: string;
    setActiveProject: (id: string) => void;
    addProject: (project: Project) => void;
    archiveProject: (id: string) => void;
    restoreProject: (id: string) => void;
    deleteProject: (id: string) => void;
    addTask: (task: Task) => void;
    deleteTask: (id: string) => void;
    updateTaskStatus: (id: string, newStatus: TaskStatus) => void;
    editTask: (id: string, updatedData: Partial<Task>) => void;
}

export const useTaskStore = create<TaskStore>()(
    persist(
        (set) => ({
            projects: mockProjects,
            tasks: mockTasks,
            activeProjectId: 'proj-1',

            setActiveProject: (id) => set({ activeProjectId: id }),

            editTask: (id, updatedData) =>
                set((state) => ({
                    tasks: state.tasks.map(t =>
                        t.id === id ? { ...t, ...updatedData, lastUpdated: new Date() } : t
                    )
                })),

            addProject: (newProject) =>
                set((state) => ({
                    projects: [...state.projects, newProject]
                })),

            archiveProject: (id) =>
                set((state) => {
                    const updatedProjects = state.projects.map(p => 
                        p.id === id ? { ...p, isArchived: true } : p
                    );
                    const remainingActive = updatedProjects.filter(p => !p.isArchived);
                    return {
                        projects: updatedProjects,
                        activeProjectId: state.activeProjectId === id
                            ? (remainingActive.length > 0 ? remainingActive[0].id : '')
                            : state.activeProjectId
                    };
                }),

            restoreProject: (id) =>
                set((state) => {
                    const updatedProjects = state.projects.map(p => 
                        p.id === id ? { ...p, isArchived: false } : p
                    );
                    return { projects: updatedProjects };
                }),

            deleteProject: (id) =>
                set((state) => {
                    const remainingProjects = state.projects.filter(p => p.id !== id);
                    return {
                        projects: remainingProjects,
                        tasks: state.tasks.filter(t => t.projectId !== id),
                        activeProjectId: state.activeProjectId === id
                            ? (remainingProjects.length > 0 ? remainingProjects[0].id : '')
                            : state.activeProjectId
                    };
                }),

            addTask: (newTask) =>
                set((state) => ({
                    tasks: [...state.tasks, newTask]
                })),

            deleteTask: (id) =>
                set((state) => ({
                    tasks: state.tasks.filter(t => t.id !== id)
                })),

            updateTaskStatus: (id, newStatus) =>
                set((state) => ({
                    tasks: state.tasks.map(t =>
                        t.id === id
                            ? { ...t, status: newStatus, lastUpdated: new Date() }
                            : t
                    )
                })),
        }),
        {
            name: 'cyber-task-storage', // 3. Este es el nombre del archivo en el "disco duro" del navegador
            // Por defecto, Zustand usa localStorage, que es exactamente lo que queremos.
        }
    )
);

