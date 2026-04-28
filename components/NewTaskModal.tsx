'use client';

import React, { useState } from 'react';
import { X, Plus, Calendar, Clock } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { Priority, TaskStatus, Task } from '../types';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskToEdit?: Task | null;
    editTask: (id: string, updatedData: Partial<Task>) => void;
}

export const NewTaskModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { activeProjectId, addTask, editTask } = useTaskStore();
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<Priority>('medium');
    const [isMeeting, setIsMeeting] = useState(false);
    const [meetingTime, setMeetingTime] = useState('');
    const [taskColor, setTaskColor] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        addTask({
            projectId: activeProjectId,
            title,
            status: 'todo' as TaskStatus,
            priority,
            isMeeting,
            createdAt: new Date(),
            lastUpdated: new Date(),
            // If it's a meeting, save the selected date
            meetingTime: isMeeting ? new Date(meetingTime) : undefined,
            color: taskColor || undefined,
        });

        setTitle('');
        setMeetingTime('');
        setTaskColor('');
        onClose();
    };

    const borderColor = isMeeting ? '#39ff14' : '#00ffff';
    const cyberShape = 'polygon(0 0, 95% 0, 100% 5%, 100% 100%, 5% 100%, 0 95%)';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            {/* BORDER WRAPPER (Glowing line) */}
            <div
                className="p-[2px] w-full max-w-md transition-colors duration-500"
                style={{ background: borderColor, clipPath: cyberShape }}
            >
                {/* INNER CONTENT */}
                <div
                    className="bg-[#0b2229] w-full p-6 relative overflow-hidden"
                    style={{ clipPath: cyberShape }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-cyan-500 hover:text-white z-20">
                        <X size={20} />
                    </button>

                    <h2 className="relative z-10 font-black tracking-tighter text-xl mb-6 uppercase flex items-center gap-2" style={{ color: borderColor }}>
                        <Plus size={20} /> New Task Protocol
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-[10px] text-cyan-500 uppercase font-bold mb-2 tracking-widest">Task Designation</label>
                            <input
                                autoFocus
                                className="w-full bg-black/40 border-b-2 border-cyan-900 p-3 text-white focus:border-[#00ffff] outline-none transition-all font-mono"
                                placeholder="Nombre de la tarea..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] text-cyan-500 uppercase font-bold mb-2 tracking-widest">Priority</label>
                                <select
                                    className="w-full bg-black/40 border-b-2 border-cyan-900 p-2 text-white focus:border-[#00ffff] outline-none"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as Priority)}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-cyan-500 uppercase font-bold mb-2 tracking-widest">Task Color</label>
                                <select
                                    className="w-full bg-black/40 border-b-2 border-cyan-900 p-2 text-white focus:border-[#00ffff] outline-none"
                                    value={taskColor}
                                    onChange={(e) => setTaskColor(e.target.value)}
                                >
                                    <option value="">Project Default</option>
                                    <option value="#00ffff">Cyan Neon</option>
                                    <option value="#ff00ff">Magenta</option>
                                    <option value="#39ff14">Matrix Green</option>
                                    <option value="#ff3131">Alert Red</option>
                                    <option value="#fce83a">Cyber Yellow</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <button
                                    type="button"
                                    onClick={() => setIsMeeting(!isMeeting)}
                                    className={`w-full p-2 border-2 flex items-center justify-center gap-2 transition-all uppercase text-[10px] font-black ${isMeeting ? 'border-[#39ff14] text-[#39ff14] bg-[#39ff14]/10 shadow-[0_0_10px_rgba(57,255,20,0.3)]' : 'border-gray-700 text-gray-500'
                                        }`}
                                >
                                    <Calendar size={14} /> {isMeeting ? 'Meeting Protocol Active' : 'Enable Meeting Protocol'}
                                </button>
                            </div>
                        </div>

                        {/* CONDITIONAL DATE/TIME SECTION */}
                        {isMeeting && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-[10px] text-[#39ff14] uppercase font-bold mb-2 tracking-widest flex items-center gap-2">
                                    <Clock size={12} /> Set Meeting Schedule (Local Time)
                                </label>
                                <input
                                    type="datetime-local"
                                    required={isMeeting}
                                    className="w-full bg-black/40 border-b-2 border-[#39ff14]/50 p-3 text-white focus:border-[#39ff14] outline-none font-mono"
                                    value={meetingTime}
                                    onChange={(e) => setMeetingTime(e.target.value)}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full relative text-black font-black uppercase py-4 tracking-[0.3em] hover:brightness-125 transition-all mt-4 overflow-hidden group"
                            style={{
                                background: borderColor,
                                clipPath: 'polygon(0 0, 90% 0, 100% 30%, 100% 100%, 10% 100%, 0 70%)'
                            }}
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                            <span className="relative z-10">Execute Sync</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};