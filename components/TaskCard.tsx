'use client';

import React, { useState } from 'react';
import { Trash2, Clock, Pencil, Hourglass, CheckCircle2 } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { Task, Priority } from '../types';

interface TaskCardProps {
    task: Task;
    isActiveProject: boolean;
    projectColor: string;
    onEditTask: (task: Task) => void;
}

export const TaskCard = ({ task, isActiveProject, projectColor, onEditTask }: TaskCardProps) => {
    const deleteTask = useTaskStore(state => state.deleteTask);
    const editTask = useTaskStore(state => state.editTask);
    const [isDragging, setIsDragging] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);

    const handleEditSave = () => {
        if (editTitle.trim() && editTitle !== task.title) {
            editTask(task.id, { title: editTitle.trim() });
        }
        setIsEditing(false);
    };

    const handleDelete = () => {
        setIsDeleting(true); // Activa la animación
        setTimeout(() => {
            deleteTask(task.id); // Borra el dato medio segundo después
        }, 400);
    };

    const STAGNANT_MS = 4 * 24 * 60 * 60 * 1000;
    const timeSinceLastUpdate = new Date().getTime() - new Date(task.lastUpdated).getTime();

    // Solo marca estancamiento si está en backlog, todo o in-progress
    const isStagnant = isActiveProject &&
        (task.status === 'todo' || task.status === 'in-progress' || task.status === 'backlog') &&
        (timeSinceLastUpdate > STAGNANT_MS);

    // EL CEREBRO DEL COLOR: Si no está activo, forzamos un gris neutro. Si está activo, usamos su color real o el del proyecto.
    const activeColor = isActiveProject ? (task.color || projectColor) : '#6b7280';

    const getPriorityColor = (priority: Priority) => {
        if (!isActiveProject) return '#6b7280';
        switch (priority) {
            case 'low': return '#00ffff'; // Cyan
            case 'medium': return '#39ff14'; // Green
            case 'high': return '#ff8c00'; // Orange
            case 'critical': return '#ff3131'; // Red
            default: return activeColor;
        }
    };
    const priorityColor = getPriorityColor(task.priority);

    const cyberShape = 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))';

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => setIsDragging(true), 0);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    return (
        <div
            draggable={isActiveProject}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`
        relative transition-all duration-300 group transform-gpu animate-in fade-in slide-in-from-top-4
        ${isActiveProject
                    ? 'cursor-grab active:cursor-grabbing hover:scale-[1.02] hover:brightness-110'
                    : 'opacity-40 scale-95 pointer-events-none'
                }
        ${isDragging ? 'opacity-20 grayscale scale-95' : 'opacity-100'}
        ${isDeleting ? 'animate-purge' : ''}
      `}
            style={{ filter: isActiveProject && !isDragging ? `drop-shadow(0 0 8px ${activeColor}40)` : 'none' }}
        >
            {/* WRAPPER DEL BORDE */}
            <div className="p-[2px]" style={{ background: isActiveProject ? activeColor : '#374151', clipPath: cyberShape }}>

                {/* FONDO DE LA TARJETA */}
                <div className="bg-[#0b2229] p-4 relative" style={{ clipPath: cyberShape }}>
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none"></div>

                    <div className="relative z-10">

                        {/* CABECERA: ID y Botones */}
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-bold tracking-widest opacity-80" style={{ color: activeColor }}>
                                ID-SYS: {task.id.slice(0, 8)}
                            </span>

                            <div className="flex gap-2 items-center">
                                {isActiveProject && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setEditTitle(task.title);
                                                setIsEditing(true);
                                            }}
                                            className="opacity-60 hover:opacity-100 hover:brightness-150 transition-all"
                                            style={{ color: activeColor }}
                                        >
                                            <Pencil size={13} />
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="opacity-60 hover:opacity-100 hover:text-[#ff3131] transition-all"
                                            style={{ color: activeColor }}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* TÍTULO */}
                        {isEditing ? (
                            <input
                                autoFocus
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={handleEditSave}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleEditSave();
                                    if (e.key === 'Escape') {
                                        setEditTitle(task.title);
                                        setIsEditing(false);
                                    }
                                }}
                                className="w-full bg-black/50 border-b text-base font-bold mb-3 leading-tight outline-none p-1"
                                style={{ color: isActiveProject ? activeColor : '#4b5563', borderColor: activeColor }}
                            />
                        ) : (
                            <div className="flex items-start gap-2 mb-3">
                                {task.status === 'done' && (
                                    <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                                )}
                                <h3 className="font-bold text-base leading-tight break-words" style={{ color: isActiveProject ? activeColor : '#4b5563' }}>
                                    {task.title}
                                </h3>
                            </div>
                        )}

                        {/* BLOQUE REUNIÓN */}
                        {task.isMeeting && task.meetingTime && (
                            <div
                                className="flex items-center gap-2 mb-4 p-2 border"
                                style={{
                                    backgroundColor: isActiveProject ? '#39ff1410' : '#1f2937',
                                    borderColor: isActiveProject ? '#39ff1440' : '#374151'
                                }}
                            >
                                <Clock size={12} className={isActiveProject ? 'animate-pulse' : ''} style={{ color: isActiveProject ? '#39ff14' : '#6b7280' }} />
                                <span className="text-[10px] font-mono font-bold" style={{ color: isActiveProject ? '#39ff14' : '#6b7280' }}>
                                    {new Date(task.meetingTime).toLocaleString('es-MX', {
                                        hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
                                    })}
                                </span>
                            </div>
                        )}

                        {/* FOOTER: Prioridad y Fecha */}
                        <div className="flex justify-between items-center mt-auto">
                            <span
                                className="text-[8px] px-2 py-0.5 border font-black uppercase"
                                style={{ color: priorityColor, borderColor: isActiveProject ? `${priorityColor}80` : '#4b5563' }}
                            >
                                {task.priority}
                            </span>

                            {/* FECHA Y RADAR DE ESTANCAMIENTO */}
                            <div className="flex items-center gap-1.5" title={isStagnant ? "Task is stagnant (>4 days without movement)" : ""}>
                                {isStagnant && <Hourglass size={10} className="animate-pulse" style={{ color: activeColor }} />}
                                <span className="text-[9px] font-mono opacity-80 font-bold" style={{ color: activeColor }}>
                                    {new Date(task.createdAt).toISOString().split('T')[0]}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};