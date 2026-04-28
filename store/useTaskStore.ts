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
    where
} from 'firebase/firestore';
import { Task, Project, TaskStatus } from '../types';

interface TaskStore {
    projects: Project[];
    tasks: Task[];
    activeProjectId: string;
    loading: boolean;
    userUid: string | null;

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
}

export const useTaskStore = create<TaskStore>((set, get) => ({
    projects: [],
    tasks: [],
    activeProjectId: '',
    loading: true,
    userUid: null,

    setUserUid: (uid) => set({ userUid: uid }),
    setActiveProject: (id) => set({ activeProjectId: id }),

    subscribeData: (uid) => {
        const qProjects = query(collection(db, `users/${uid}/projects`));
        const qTasks = query(collection(db, `users/${uid}/tasks`));

        const unsubProjects = onSnapshot(qProjects, (snapshot) => {
            const projects = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project));
            set({ projects, loading: false });
            if (projects.length > 0 && !get().activeProjectId) {
                set({ activeProjectId: projects[0].id });
            }
        });

        const unsubTasks = onSnapshot(qTasks, (snapshot) => {
            const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
            set({ tasks });
        });

        return () => { unsubProjects(); unsubTasks(); };
    },

    addProject: async (project) => {
        const uid = get().userUid;
        if (!uid) return;
        await addDoc(collection(db, `users/${uid}/projects`), project);
    },

    deleteProject: async (projectId) => {
        const uid = get().userUid;
        if (!uid) return;
        await deleteDoc(doc(db, `users/${uid}/projects`, projectId));
    },

    archiveProject: async (projectId) => {
        const uid = get().userUid;
        if (!uid) return;
        const projRef = doc(db, `users/${uid}/projects`, projectId);
        await updateDoc(projRef, { isArchived: true });
        
        // Clear activeProjectId if archived project was selected
        const state = get();
        if (state.activeProjectId === projectId) {
            const remainingActive = state.projects.filter(p => p.id !== projectId && !p.isArchived);
            set({ activeProjectId: remainingActive.length > 0 ? remainingActive[0].id : '' });
        }
    },

    restoreProject: async (projectId) => {
        const uid = get().userUid;
        if (!uid) return;
        const projRef = doc(db, `users/${uid}/projects`, projectId);
        await updateDoc(projRef, { isArchived: false });
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
        const taskRef = doc(db, `users/${uid}/tasks`, taskId);
        await updateDoc(taskRef, {
            status: newStatus,
            lastUpdated: new Date()
        });
    },

    editTask: async (taskId, updatedData) => {
        const uid = get().userUid;
        if (!uid) return;
        const taskRef = doc(db, `users/${uid}/tasks`, taskId);
        await updateDoc(taskRef, {
            ...updatedData,
            lastUpdated: new Date()
        });
    },

    deleteTask: async (taskId) => {
        const uid = get().userUid;
        if (!uid) return;
        await deleteDoc(doc(db, `users/${uid}/tasks`, taskId));
    }
}));