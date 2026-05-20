import { create } from 'zustand';
import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where,
    setDoc
} from 'firebase/firestore';
import { Task, Project, TaskStatus } from '../types';

export interface UndoAction {
    description: string;
    undo: () => Promise<void>;
}

interface TaskStore {
    projects: Project[];
    tasks: Task[];
    activeProjectId: string;
    loading: boolean;
    userUid: string | null;
    undoStack: UndoAction[];

    setUserUid: (uid: string | null) => void;
    subscribeData: (uid: string) => () => void;
    setActiveProject: (id: string) => void;

    // Cloud Actions (uses internal uid)
    addProject: (project: Omit<Project, 'id'>) => Promise<void>;
    deleteProject: (projectId: string) => Promise<void>;
    archiveProject: (projectId: string) => Promise<void>;
    restoreProject: (projectId: string) => Promise<void>;
    addTask: (task: Omit<Task, 'id'>) => Promise<void>;
    updateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
    editTask: (taskId: string, updatedData: Partial<Task>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;

    // Undo Actions
    pushUndo: (description: string, undoFn: () => Promise<void>) => void;
    undo: () => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
    projects: [],
    tasks: [],
    activeProjectId: '',
    loading: true,
    userUid: null,
    undoStack: [],

    setUserUid: (uid) => set({ userUid: uid }),
    setActiveProject: (id) => set({ activeProjectId: id }),

    subscribeData: (uid) => {
        const convertTimestamps = (obj: any) => {
            if (!obj) return obj;
            const result = { ...obj };
            for (const key of Object.keys(result)) {
                if (result[key] && typeof result[key].toDate === 'function') {
                    result[key] = result[key].toDate();
                }
            }
            return result;
        };

        const qProjects = query(collection(db, `users/${uid}/projects`));
        const qTasks = query(collection(db, `users/${uid}/tasks`));

        const unsubProjects = onSnapshot(qProjects, (snapshot) => {
            const projects = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Project));
            set({ projects, loading: false });

            const activeProjects = projects.filter(p => !p.isArchived);
            const currentActive = get().activeProjectId;

            if (activeProjects.length > 0 && (!currentActive || !activeProjects.some(p => p.id === currentActive))) {
                set({ activeProjectId: activeProjects[0].id });
            } else if (activeProjects.length === 0) {
                set({ activeProjectId: '' });
            }
        });

        const unsubTasks = onSnapshot(qTasks, (snapshot) => {
            const tasks = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Task));
            set({ tasks });
        });

        return () => { unsubProjects(); unsubTasks(); };
    },

    pushUndo: (description, undoFn) => {
        set(state => ({
            undoStack: [...state.undoStack, { description, undo: undoFn }].slice(-20)
        }));
    },

    undo: async () => {
        const state = get();
        if (state.undoStack.length === 0) return;
        const lastAction = state.undoStack[state.undoStack.length - 1];

        try {
            await lastAction.undo();
            set(state => ({
                undoStack: state.undoStack.slice(0, -1)
            }));
        } catch (error) {
            console.error("Undo failed:", error);
        }
    },

    addProject: async (project) => {
        const uid = get().userUid;
        if (!uid) return;
        const docRef = await addDoc(collection(db, `users/${uid}/projects`), project);
        set({ activeProjectId: docRef.id });
    },

    deleteProject: async (projectId) => {
        const uid = get().userUid;
        if (!uid) return;

        const state = get();
        const projectToDelete = state.projects.find(p => p.id === projectId);
        if (!projectToDelete) return;
        const tasksToDelete = state.tasks.filter(t => t.projectId === projectId);

        // Optimistic local update
        const remainingProjects = state.projects.filter(p => p.id !== projectId);
        const remainingActive = remainingProjects.filter(p => !p.isArchived);
        set({
            projects: remainingProjects,
            activeProjectId: state.activeProjectId === projectId
                ? (remainingActive.length > 0 ? remainingActive[0].id : '')
                : state.activeProjectId
        });

        get().pushUndo(`Delete project: ${projectToDelete.name}`, async () => {
            await setDoc(doc(db, `users/${uid}/projects`, projectToDelete.id), {
                name: projectToDelete.name,
                isActive: projectToDelete.isActive,
                colorTheme: projectToDelete.colorTheme,
                createdAt: projectToDelete.createdAt,
                ...(projectToDelete.description && { description: projectToDelete.description }),
                ...(projectToDelete.dueDate && { dueDate: projectToDelete.dueDate }),
                ...(projectToDelete.isArchived && { isArchived: projectToDelete.isArchived })
            });

            for (const task of tasksToDelete) {
                await setDoc(doc(db, `users/${uid}/tasks`, task.id), {
                    projectId: task.projectId,
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                    createdAt: task.createdAt,
                    lastUpdated: task.lastUpdated,
                    isMeeting: task.isMeeting,
                    ...(task.dueDate && { dueDate: task.dueDate }),
                    ...(task.meetingTime && { meetingTime: task.meetingTime }),
                    ...(task.color && { color: task.color }),
                    ...(task.snoozedUntil && { snoozedUntil: task.snoozedUntil })
                });
            }
        });

        await deleteDoc(doc(db, `users/${uid}/projects`, projectId));
        for (const task of tasksToDelete) {
            await deleteDoc(doc(db, `users/${uid}/tasks`, task.id));
        }
    },

    archiveProject: async (projectId) => {
        const uid = get().userUid;
        if (!uid) return;
        const state = get();
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return;

        // Optimistic local update
        const updatedProjects = state.projects.map(p => p.id === projectId ? { ...p, isArchived: true } : p);
        const activeProjects = updatedProjects.filter(p => !p.isArchived);
        set({
            projects: updatedProjects,
            activeProjectId: state.activeProjectId === projectId
                ? (activeProjects.length > 0 ? activeProjects[0].id : '')
                : state.activeProjectId
        });

        get().pushUndo(`Archive project: ${project.name}`, async () => {
            // Optimistic local undo
            set(s => ({
                projects: s.projects.map(p => p.id === projectId ? { ...p, isArchived: false } : p)
            }));
            await updateDoc(doc(db, `users/${uid}/projects`, projectId), { isArchived: false });
        });

        await updateDoc(doc(db, `users/${uid}/projects`, projectId), { isArchived: true });
    },

    restoreProject: async (projectId) => {
        const uid = get().userUid;
        if (!uid) return;
        const state = get();
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return;

        // Optimistic local update
        set(s => ({
            projects: s.projects.map(p => p.id === projectId ? { ...p, isArchived: false } : p)
        }));

        get().pushUndo(`Restore project: ${project.name}`, async () => {
            set(s => ({
                projects: s.projects.map(p => p.id === projectId ? { ...p, isArchived: true } : p)
            }));
            await updateDoc(doc(db, `users/${uid}/projects`, projectId), { isArchived: true });
        });

        await updateDoc(doc(db, `users/${uid}/projects`, projectId), { isArchived: false });
    },

    addTask: async (task) => {
        const uid = get().userUid;
        if (!uid) return;
        await addDoc(collection(db, `users/${uid}/tasks`), {
            ...task,
            lastUpdated: new Date()
        });
    },

    updateTaskStatus: async (taskId, newStatus) => {
        const uid = get().userUid;
        if (!uid) return;
        const state = get();
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return;
        const oldStatus = task.status;

        get().pushUndo(`Move task: ${task.title}`, async () => {
            await updateDoc(doc(db, `users/${uid}/tasks`, taskId), {
                status: oldStatus,
                lastUpdated: new Date()
            });
        });

        const taskRef = doc(db, `users/${uid}/tasks`, taskId);
        await updateDoc(taskRef, {
            status: newStatus,
            lastUpdated: new Date()
        });
    },

    editTask: async (taskId, updatedData) => {
        const uid = get().userUid;
        if (!uid) return;
        const state = get();
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return;

        const previousData: Partial<Task> = {};
        for (const key of Object.keys(updatedData) as Array<keyof Task>) {
            if (task[key] !== undefined) {
                (previousData as any)[key] = task[key];
            }
        }

        get().pushUndo(`Edit task: ${task.title}`, async () => {
            await updateDoc(doc(db, `users/${uid}/tasks`, taskId), {
                ...previousData,
                lastUpdated: new Date()
            });
        });

        const taskRef = doc(db, `users/${uid}/tasks`, taskId);
        await updateDoc(taskRef, {
            ...updatedData,
            lastUpdated: new Date()
        });
    },

    deleteTask: async (taskId) => {
        const uid = get().userUid;
        if (!uid) return;
        const state = get();
        const taskToDelete = state.tasks.find(t => t.id === taskId);
        if (!taskToDelete) return;

        get().pushUndo(`Delete task: ${taskToDelete.title}`, async () => {
            await setDoc(doc(db, `users/${uid}/tasks`, taskToDelete.id), {
                projectId: taskToDelete.projectId,
                title: taskToDelete.title,
                status: taskToDelete.status,
                priority: taskToDelete.priority,
                createdAt: taskToDelete.createdAt,
                lastUpdated: taskToDelete.lastUpdated,
                isMeeting: taskToDelete.isMeeting,
                ...(taskToDelete.dueDate && { dueDate: taskToDelete.dueDate }),
                ...(taskToDelete.meetingTime && { meetingTime: taskToDelete.meetingTime }),
                ...(taskToDelete.color && { color: taskToDelete.color }),
                ...(taskToDelete.snoozedUntil && { snoozedUntil: taskToDelete.snoozedUntil })
            });
        });

        await deleteDoc(doc(db, `users/${uid}/tasks`, taskId));
    }
}));