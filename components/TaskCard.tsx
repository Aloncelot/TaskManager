'use client';

import React, { useState } from 'react';
import { GripVertical, Trash2, Clock, Pencil } from 'lucide-react';
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
    const [isDragging, setIsDragging] = useState(false);

    // Asignación de colores base
    const getBaseColor = (priority: Priority, isMeeting: boolean) => {
        if (isMeeting) return '#39ff14'; // Verde Neón
        if (priority === 'critical' || priority === 'high') return '#ff3131'; // Rojo Neón
        return projectColor; // Cian (o el color del proyecto)
    };

    // EL CEREBRO DEL COLOR: Si no está activo, forzamos un gris neutro. Si está activo, usamos su color real.
    const activeColor = isActiveProject ? getBaseColor(task.priority, task.isMeeting) : '#6b7280';

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
        relative transition-all duration-300 group 
        ${isActiveProject
                    ? 'cursor-grab active:cursor-grabbing hover:scale-[1.02] hover:brightness-110'
                    : 'opacity-40 scale-95 pointer-events-none'
                }
        ${isDragging ? 'opacity-20 grayscale scale-95' : 'opacity-100'}
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

                            <div className="flex gap-1.5 items-center">
                                {isActiveProject && (
                                    <>
                                        {/* Botón Borrar: Hereda color, cambia a rojo fuerte en hover */}
                                        <button
                                            onClick={() => deleteTask(task.id)}
                                            className="opacity-60 hover:opacity-100 hover:text-[#ff3131] transition-all"
                                            style={{ color: activeColor }}
                                        >
                                            <Trash2 size={13} />
                                        </button>

                                        {/* Botones de acción: Heredan color brillante */}
                                        <div className="flex flex-col gap-1 items-center">
                                            <GripVertical size={13} className="opacity-70" style={{ color: activeColor }} />
                                            <button
                                                onClick={() => onEditTask(task)}
                                                className="opacity-60 hover:opacity-100 hover:brightness-150 transition-all"
                                                style={{ color: activeColor }}
                                            >
                                                <Pencil size={11} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* TÍTULO */}
                        <h3 className="font-bold text-base mb-3 leading-tight" style={{ color: isActiveProject ? activeColor : '#4b5563' }}>
                            {task.title}
                        </h3>

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

                        {/* FOOTER: Prioridad y Fecha (Ambos heredan el color dinámico) */}
                        <div className="flex justify-between items-center mt-auto">
                            <span
                                className="text-[8px] px-2 py-0.5 border font-black uppercase"
                                style={{ color: activeColor, borderColor: isActiveProject ? `${activeColor}80` : '#4b5563' }}
                            >
                                {task.priority}
                            </span>
                            <span className="text-[9px] font-mono opacity-80 font-bold" style={{ color: activeColor }}>
                                {new Date(task.createdAt).toISOString().split('T')[0]}
                            </span>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};