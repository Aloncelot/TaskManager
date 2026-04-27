'use client';

import { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { Board } from '../components/Board';

export default function Home() {
  const { projects, tasks, activeProjectId, setActiveProject } = useTaskStore();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) return null;

  return (
    <main className="flex h-screen w-full bg-[#06181d] overflow-hidden relative">

      {/* Panel Lateral (Sidebar) */}
      <aside className="w-72 bg-[#041114] border-r border-cyan-900/50 flex flex-col p-6 z-10 shadow-[5px_0_15px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3 mb-10 text-[#00ffff]">
          <Terminal size={28} />
          <h2 className="font-black tracking-widest text-xl">TASK-OPS</h2>
        </div>

        <h3 className="text-[10px] text-gray-500 font-bold tracking-widest mb-4 uppercase">Project List</h3>

        <div className="flex flex-col gap-2">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveProject(p.id)}
              className={`text-left p-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 border-l-4 ${activeProjectId === p.id
                ? 'border-[#00ffff] bg-[#00ffff]/10 text-white shadow-[inset_20px_0_20px_-20px_rgba(0,255,255,0.3)]'
                : 'border-transparent text-gray-500 hover:bg-gray-900 hover:text-gray-300'
                }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </aside>

      {/* Tablero Principal */}
      <Board tasks={tasks} projects={projects} activeProjectId={activeProjectId} />
    </main>
  );
}