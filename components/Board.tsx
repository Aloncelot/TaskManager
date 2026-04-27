'use client';

import React, { useState } from 'react';
import { FolderKanban, Rocket, Zap, CheckCircle2, OctagonAlert, Plus } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { Task, Project, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { NewTaskModal } from './NewTaskModal';

interface Props {
    tasks: Task[];
    projects: Project[];
    activeProjectId: string;
}

// Definición arquitectónica de las columnas con degradado turquesa
const COLUMNS: { id: TaskStatus; label: string; Icon: React.ElementType; bgColor: string }[] = [
    { id: 'backlog', label: 'BACKLOG', Icon: FolderKanban, bgColor: 'bg-[#092026]' },
    { id: 'todo', label: 'TO DO', Icon: Rocket, bgColor: 'bg-[#0c2830]' },
    { id: 'in-progress', label: 'IN PROGRESS', Icon: Zap, bgColor: 'bg-[#0e2f38]' },
    { id: 'done', label: 'DONE', Icon: CheckCircle2, bgColor: 'bg-[#113843]' },
    { id: 'blocked', label: 'BLOCKED', Icon: OctagonAlert, bgColor: 'bg-[#15424d]' },
];

export const Board: React.FC<Props> = ({ tasks, projects, activeProjectId }) => {
    const activeProject = projects.find(p => p.id === activeProjectId);

    // Estados Locales
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeDragColumn, setActiveDragColumn] = useState<string | null>(null);

    // Funciones del Store
    const updateTaskStatus = useTaskStore(state => state.updateTaskStatus);

    // ==========================================
    // PROTOCOLO DRAG AND DROP (APIs Nativas)
    // ==========================================
    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault(); // Crítico para permitir el Drop
        setActiveDragColumn(columnId);
    };

    const handleDrop = (e: React.DragEvent, columnId: TaskStatus) => {
        e.preventDefault();
        setActiveDragColumn(null);

        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) {
            updateTaskStatus(taskId, columnId);
        }
    };

    return (
        <div className="flex-1 overflow-x-auto p-6 custom-scrollbar relative z-10">

            {/* ==========================================
          CABECERA DEL TABLERO
      ========================================== */}
            <div className="mb-8 flex items-center justify-between border-l-4 border-[#00ffff] pl-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
                        Project: <span style={{ color: activeProject?.colorTheme || '#00ffff' }}>
                            {activeProject?.name || 'Unselected'}
                        </span>
                    </h1>
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                        System Status: Operational // Active_Focus: {activeProjectId}
                    </p>
                </div>

                {/* BOTÓN DISPARADOR CON WRAPPER DE 2PX (Diagonal brillante perfecta) */}
                <div
                    className="p-[2px] transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                    style={{ background: '#00ffff', clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}
                >
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="relative bg-[#0b2229] hover:bg-[#00ffff] text-[#00ffff] hover:text-black px-6 py-2 flex items-center gap-3 font-black uppercase tracking-[0.2em] text-xs transition-colors duration-300"
                        style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}
                    >
                        <Plus size={18} className="animate-pulse" />
                        <span>Inyectar Tarea</span>
                    </button>
                </div>
            </div>

            {/* EL MODAL DE CREACIÓN */}
            <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            {/* ==========================================
          GRID DE COLUMNAS (KANBAN)
      ========================================== */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-w-[1200px] h-[calc(100vh-140px)]">
                {COLUMNS.map((column) => (
                    <div
                        key={column.id}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={() => setActiveDragColumn(null)}
                        onDrop={(e) => handleDrop(e, column.id as TaskStatus)}
                        className={`
              flex flex-col rounded-sm border transition-all duration-300 ${column.bgColor}
              ${activeDragColumn === column.id
                                ? 'border-[#39ff14] shadow-[inset_0_0_20px_rgba(57,255,20,0.15)]'
                                : 'border-cyan-900/30'
                            }
            `}
                    >
                        {/* Cabecera de la Columna */}
                        <div
                            className={`flex items-center gap-2 mb-4 bg-black/40 p-3 text-xs font-bold uppercase tracking-widest shadow-md transition-colors duration-300
                ${activeDragColumn === column.id ? 'text-[#39ff14]' : 'text-cyan-500'}
              `}
                            style={{ clipPath: 'polygon(0 0, 95% 0, 100% 100%, 0% 100%)' }}
                        >
                            <column.Icon size={16} />
                            <span>{column.label}</span>
                        </div>

                        {/* Contenedor Interior (Scrollable) */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-8 custom-scrollbar relative">
                            {/* Scanlines exclusivas del fondo de la columna */}
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none z-0"></div>

                            {/* Renderizado de Tarjetas */}
                            <div className="relative z-10 flex flex-col gap-4 mt-2">
                                {tasks
                                    .filter((t) => t.status === column.id)
                                    .map((task) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            isActiveProject={task.projectId === activeProjectId}
                                            projectColor={activeProject?.colorTheme || '#00ffff'}
                                            onEditTask={(task) => console.log('Próximamente: Editar', task.title)}
                                        />
                                    ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};