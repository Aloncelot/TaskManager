'use client';

import React, { useState } from 'react';
import { X, History, ChevronDown, ChevronRight, ArchiveRestore } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export const HistoryModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { projects, tasks, restoreProject } = useTaskStore();
    const archivedProjects = projects.filter(p => p.isArchived);
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

    if (!isOpen) return null;

    const getStatusLabel = (status: string) => {
        if (status === 'todo' || status === 'in-progress') return '[NOT COMPLETED]';
        return `[${status.toUpperCase()}]`;
    };

    const getStatusColor = (status: string) => {
        if (status === 'todo' || status === 'in-progress') return 'text-red-500';
        if (status === 'done') return 'text-green-500';
        if (status === 'blocked') return 'text-yellow-500';
        return 'text-gray-500';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-[#0b2229] w-full max-w-2xl border border-cyan-900/50 shadow-[0_0_30px_rgba(0,255,255,0.1)] flex flex-col max-h-[80vh]">
                
                {/* HEADER */}
                <div className="p-4 border-b border-cyan-900/50 flex justify-between items-center bg-[#092026]">
                    <h2 className="font-black tracking-widest text-lg uppercase flex items-center gap-2 text-cyan-500">
                        <History size={18} /> Project Archive & History
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                    {archivedProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 opacity-50">
                            <ArchiveRestore size={32} className="mb-2 text-cyan-800" />
                            <p className="text-xs font-mono uppercase tracking-widest text-cyan-600">No archived projects found</p>
                        </div>
                    ) : (
                        archivedProjects.map(project => {
                            const projectTasks = tasks.filter(t => t.projectId === project.id);
                            const isExpanded = expandedProjectId === project.id;

                            return (
                                <div key={project.id} className="border border-cyan-900/30 bg-black/20">
                                    <button 
                                        onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-cyan-900/20 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {isExpanded ? <ChevronDown size={16} className="text-cyan-500" /> : <ChevronRight size={16} className="text-cyan-500" />}
                                            <span className="font-bold text-sm uppercase tracking-wider" style={{ color: project.colorTheme }}>
                                                {project.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 uppercase">
                                            <span>Tasks: {projectTasks.length}</span>
                                            {project.dueDate && (
                                                <span>Due: {new Date(project.dueDate).toISOString().split('T')[0]}</span>
                                            )}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="p-4 pt-0 border-t border-cyan-900/30">
                                            <div className="flex justify-end mt-4 mb-2">
                                                <button
                                                    onClick={() => restoreProject(project.id)}
                                                    className="px-4 py-2 border border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14] hover:text-black font-black uppercase text-[10px] tracking-widest transition-colors flex items-center gap-2"
                                                >
                                                    <ArchiveRestore size={14} /> Restore Project
                                                </button>
                                            </div>
                                            {projectTasks.length === 0 ? (
                                                <p className="text-xs font-mono text-gray-600 mt-4 uppercase">No tasks recorded.</p>
                                            ) : (
                                                <div className="mt-4 flex flex-col gap-2">
                                                    {projectTasks.map(task => (
                                                        <div key={task.id} className="flex justify-between items-center bg-black/40 p-2 text-xs font-mono">
                                                            <span className="text-gray-300 truncate pr-4">{task.title}</span>
                                                            <span className={`font-bold tracking-widest whitespace-nowrap ${getStatusColor(task.status)}`}>
                                                                {getStatusLabel(task.status)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
