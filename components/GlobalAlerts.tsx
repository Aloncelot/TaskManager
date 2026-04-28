'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Calendar } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export const GlobalAlerts = () => {
    const { projects, tasks, editTask, activeProjectId } = useTaskStore();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, []);

    // 1. PROJECT DUE DATE ALERTS
    // Find projects that have a due date of today, and have tasks in todo or in-progress
    const dueProjects = projects.filter(p => {
        if (!p.dueDate || p.isArchived) return false;
        
        const due = new Date(p.dueDate);
        const today = new Date();
        const isToday = due.getDate() === today.getDate() &&
                        due.getMonth() === today.getMonth() &&
                        due.getFullYear() === today.getFullYear();
        
        if (!isToday) return false;

        const hasPendingTasks = tasks.some(t => 
            t.projectId === p.id && 
            (t.status === 'todo' || t.status === 'in-progress')
        );

        return hasPendingTasks;
    });

    // 2. MEETING ALERTS
    // Find tasks that have a meeting within 10 minutes, and are not snoozed past current time
    const meetingAlerts = tasks.filter(t => {
        if (!t.isMeeting || !t.meetingTime || t.status === 'done') return false;

        // If it was snoozed and the snooze time hasn't passed yet, don't show
        if (t.snoozedUntil && new Date(t.snoozedUntil) > currentTime) {
            return false;
        }

        const meetingTime = new Date(t.meetingTime).getTime();
        const now = currentTime.getTime();
        
        const diffMinutes = (meetingTime - now) / (1000 * 60);

        // Show alert if meeting is between 0 and 10 minutes away
        // Also show it if it's currently overdue by a little bit? Let's just say 0 to 10.
        return diffMinutes > 0 && diffMinutes <= 10;
    });

    const handleGotIt = (taskId: string, meetingTime: Date) => {
        // Snooze until meeting time, effectively dismissing it until the meeting happens
        editTask(taskId, { snoozedUntil: meetingTime });
    };

    const handleSnooze = (taskId: string) => {
        // Snooze for 5 minutes
        const snoozeTime = new Date(currentTime.getTime() + 5 * 60 * 1000);
        editTask(taskId, { snoozedUntil: snoozeTime });
    };

    if (dueProjects.length === 0 && meetingAlerts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 max-w-sm w-full">
            
            {/* Due Date Alerts */}
            {dueProjects.map(p => (
                <div 
                    key={p.id}
                    className="p-4 border-l-4 border-[#00ffff] bg-[#00ffff]/10 backdrop-blur-md animate-pulse shadow-[0_0_15px_rgba(0,255,255,0.3)] flex items-start gap-3"
                >
                    <AlertTriangle className="text-[#00ffff] shrink-0" />
                    <div>
                        <h4 className="text-[#00ffff] font-black uppercase text-xs tracking-widest">
                            Project Deadline Reached
                        </h4>
                        <p className="text-gray-300 text-xs mt-1">
                            [{p.name}] has pending tasks and is due today.
                        </p>
                    </div>
                </div>
            ))}

            {/* Meeting Alerts */}
            {meetingAlerts.map(t => {
                const diffMinutes = Math.ceil((new Date(t.meetingTime!).getTime() - currentTime.getTime()) / 60000);
                
                return (
                    <div 
                        key={t.id}
                        className="p-4 border border-[#fce83a]/50 bg-[#0b2229] backdrop-blur-md shadow-[0_0_20px_rgba(252,232,58,0.2)] flex flex-col gap-3"
                    >
                        <div className="flex items-start gap-3">
                            <Clock className="text-[#fce83a] shrink-0 animate-pulse" />
                            <div>
                                <h4 className="text-[#fce83a] font-black uppercase text-xs tracking-widest">
                                    Meeting Protocol Imminent
                                </h4>
                                <p className="text-gray-300 text-xs mt-1">
                                    <span className="font-bold text-white">{t.title}</span> starts in {diffMinutes} min.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 mt-2">
                            <button 
                                onClick={() => handleGotIt(t.id, new Date(t.meetingTime!))}
                                className="flex-1 bg-[#fce83a]/20 hover:bg-[#fce83a] text-[#fce83a] hover:text-black transition-colors text-[10px] font-black uppercase tracking-widest py-2"
                            >
                                Got it
                            </button>
                            <button 
                                onClick={() => handleSnooze(t.id)}
                                className="flex-1 border border-[#fce83a]/30 hover:border-[#fce83a] text-gray-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest py-2"
                            >
                                Remind in 5m
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
