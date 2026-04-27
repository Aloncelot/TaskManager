// Definimos los posibles estados de una tarea
export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'done' | 'blocked';

// Niveles de prioridad con sus colores neón asociados
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    isActive: boolean; // Para el efecto de resaltado/atenuado
    colorTheme: string; // Ej: '#00ffff' (cian)
}

export interface Task {
    id: string;
    projectId: string; // Relación con el proyecto
    title: string;
    status: TaskStatus;
    priority: Priority;
    createdAt: Date;
    dueDate?: Date;      // Para las alertas ROJAS
    meetingTime?: Date;  // Para las alertas VERDES
    lastUpdated: Date;   // Para detectar el "estancamiento" (+7 días = ÁMBAR)
    isMeeting: boolean;
}

export interface UserProfile {
    id: string;
    email: string;
    name: string;
}