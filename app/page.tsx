// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Terminal, Trash2, Plus, History, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useTaskStore } from '../store/useTaskStore';
import { Board } from '../components/Board';
import { GlobalAlerts } from '../components/GlobalAlerts';
import { HistoryModal } from '../components/HistoryModal';
import localFont from 'next/font/local';

const morexin = localFont({
  src: '../public/fonts/Morexin.ttf',
  display: 'swap',
});

const pondar = localFont({
  src: '../public/fonts/Pondar.otf',
  display: 'swap',
});

export default function Home() {
  const {
    projects, tasks, activeProjectId,
    setActiveProject, addProject, deleteProject,
    userUid, setUserUid, subscribeData,
    undoStack, undo
  } = useTaskStore();

  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#00ffff');
  const [newProjectDueDate, setNewProjectDueDate] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string | null; email: string | null } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  useEffect(() => {
    setIsMounted(true);
    let unsubData: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserUid(currentUser.uid);
        setUserProfile({ name: currentUser.displayName, email: currentUser.email });
        unsubData = subscribeData(currentUser.uid);
      } else {
        setUserUid(null);
        setUserProfile(null);
        if (unsubData) unsubData();
        router.push('/login');
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubData) unsubData();
    };
  }, [router, setUserUid, subscribeData]);
  if (!isMounted) return null;

  return (
    <main className="flex h-screen w-full bg-[#06181d] overflow-hidden relative">

      {/* SIDEBAR */}
      <aside className="w-72 bg-[#041114] border-r border-cyan-900/50 flex flex-col p-6 z-10 shadow-[5px_0_15px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3 mb-6 text-[#00ffff]">
          <h2 className={`tracking-[0.2em] text-3xl ${pondar.className}`}>TASK-OPS</h2>
        </div>

        {userProfile && (
          <div className="mb-8 relative group drop-shadow-[0_0_8px_rgba(0,255,255,0.15)] hover:drop-shadow-[0_0_12px_rgba(0,255,255,0.4)] transition-all duration-300">

            {/* NEON BORDER WRAPPER */}
            <div
              className="p-[1px] transition-all duration-300 group-hover:p-[2px] bg-[#00ffff]/50 group-hover:bg-[#00ffff]"
              style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
            >

              {/* INNER CONTAINER (Dark Background) */}
              <div
                className="bg-[#092026] relative p-4 flex flex-col gap-3"
                style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
              >
                {/* SCANLINES (z-0, below text) */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none z-0"></div>

                {/* MAIN CONTENT (z-10, sharp and bright) */}
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#00ffff] rounded-sm animate-pulse shadow-[0_0_8px_#00ffff]"></div>
                    <span className="text-xs font-mono text-[#00ffff] uppercase truncate tracking-wider font-bold drop-shadow-md" title={userProfile.name || userProfile.email || 'USER'}>
                      {userProfile.name || userProfile.email || 'USER'}
                    </span>
                  </div>

                  <button
                    onClick={async () => {
                      await signOut(auth);
                      document.cookie = "auth_session=; path=/; max-age=0;";
                    }}
                    className="text-[9px] text-[#00ffff]/60 hover:text-[#ff3131] uppercase font-bold tracking-[0.2em] flex items-center gap-2 transition-colors mt-1 self-start"
                  >
                    <LogOut size={12} className="transition-transform group-hover:-translate-x-1" /> Disconnect
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Project List</h3>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="text-[10px] text-cyan-500 hover:text-[#00ffff] font-mono tracking-widest uppercase flex items-center gap-1 transition-colors"
          >
            <History size={12} /> History
          </button>
        </div>

        <div className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
          {projects.filter(p => !p.isArchived).map(p => (
            <div key={p.id} className="relative group flex items-stretch">
              <button
                onClick={() => setActiveProject(p.id)}
                className={`flex-1 text-left p-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 border-l-4 ${activeProjectId === p.id
                  ? 'border-[#00ffff] bg-[#00ffff]/10 text-white shadow-[inset_20px_0_20px_-20px_rgba(0,255,255,0.3)]'
                  : 'border-transparent text-gray-500 hover:bg-gray-900 hover:text-gray-300'
                  }`}
              >
                {p.name}
              </button>
              {projects.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity px-3 text-red-500 hover:bg-red-500/20"
                  title="Eliminar Proyecto"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ADD PROJECT FORM */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newProjectName.trim()) return;

            const newProject: any = {
              name: newProjectName.trim(),
              isActive: true,
              colorTheme: newProjectColor,
              createdAt: new Date()
            };
            
            if (newProjectDueDate) {
                newProject.dueDate = new Date(newProjectDueDate);
            }
            
            addProject(newProject);
            setNewProjectName('');
            setNewProjectDueDate('');
          }}
          className="mt-6 flex flex-col gap-2"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="NEW PROJECT..."
              className="w-full bg-[#092026] text-[#00ffff] border border-cyan-900/50 p-2 text-xs outline-none focus:border-[#00ffff] font-mono uppercase placeholder:opacity-50"
              style={{ color: newProjectColor, borderColor: newProjectColor + '80' }}
            />
            <button
              type="submit"
              disabled={!newProjectName.trim()}
              className="bg-[#0b2229] border border-cyan-900/50 text-[#00ffff] p-2 hover:bg-[#00ffff] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              style={{ color: newProjectColor, borderColor: newProjectColor + '80' }}
            >
              <Plus size={16} />
            </button>
          </div>
          <select
            value={newProjectColor}
            onChange={(e) => setNewProjectColor(e.target.value)}
            className="w-full bg-[#092026] text-xs p-2 outline-none font-mono uppercase cursor-pointer"
            style={{ color: newProjectColor, border: `1px solid ${newProjectColor}80` }}
          >
            <option value="#00ffff">Cyan Neon</option>
            <option value="#ff00ff">Magenta</option>
            <option value="#39ff14">Matrix Green</option>
            <option value="#ff3131">Alert Red</option>
            <option value="#fce83a">Cyber Yellow</option>
          </select>
          <input
            type="date"
            value={newProjectDueDate}
            onChange={(e) => setNewProjectDueDate(e.target.value)}
            className="w-full bg-[#092026] text-gray-400 border border-cyan-900/50 p-2 text-xs outline-none focus:border-[#00ffff] font-mono uppercase"
            title="Optional Due Date"
          />
        </form>
      </aside>

      {/* MAIN BOARD */}
      <Board tasks={tasks} projects={projects} activeProjectId={activeProjectId} />

      {/* UNDO TRIGGER */}
      {undoStack.length > 0 && (
        <button
          onClick={() => undo()}
          className="fixed bottom-6 left-80 z-50 bg-[#0b2229] hover:bg-[#00ffff] text-[#00ffff] hover:text-black border border-cyan-900/50 hover:border-[#00ffff] px-4 py-2.5 font-mono text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,255,0.15)] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)] transition-all duration-300 flex items-center gap-3 cursor-pointer"
          style={{
            clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
          }}
          title={`Deshacer: ${undoStack[undoStack.length - 1].description}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffff] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ffff]"></span>
          </span>
          <span className="font-bold">DESHACER ACCIÓN ({undoStack.length})</span>
          <span className="opacity-40 text-[9px] font-bold border border-cyan-900/30 px-1 py-0.5 rounded bg-black/40">CTRL+Z</span>
        </button>
      )}

      {/* ALERTS AND MODALS */}
      <GlobalAlerts />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </main>
  );
}