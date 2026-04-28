// app/login/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, ShieldCheck, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

// 1. INJECT LOCAL FONT
// Locate the font file in public/fonts
import localFont from 'next/font/local';
const morexin = localFont({
    src: '../../public/fonts/Morexin.ttf',
    display: 'swap',
});

export default function LoginPage() {
    const [status, setStatus] = useState('AWAITING_INPUT');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [cursorVisible, setCursorVisible] = useState(true);
    const router = useRouter();

    // 2. TERMINAL CURSOR EFFECT (Hard Blink)
    // Pure toggle blink effect without CSS transitions
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            setCursorVisible(v => !v);
        }, 500);
        return () => clearInterval(blinkInterval);
    }, []);

    const handleLogin = async () => {
        setStatus('AWAITING_AUTHORIZATION');

        try {
            const result = await signInWithPopup(auth, googleProvider);
            document.cookie = `auth_session=${result.user.uid}; path=/; max-age=86400;`;

            setStatus('INITIALIZING_PROTOCOL');
            const interval = setInterval(() => {
                setLoadingProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setStatus('ACCESS_GRANTED');
                        setTimeout(() => router.push('/'), 1000);
                        return 100;
                    }
                    return prev + 5;
                });
            }, 30);

        } catch (error) {
            console.error("Fallo en la autenticación:", error);
            setStatus('ACCESS_DENIED');
            setTimeout(() => setStatus('AWAITING_INPUT'), 3000);
        }
    };

    return (
        <div className="h-screen w-full bg-[#041114] flex items-center justify-center relative overflow-hidden font-mono">

            {/* BACKGROUND AND SCANLINES */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none z-0 opacity-80"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00ffff]/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

            {/* SIDE GRID LINES */}
            <div className="absolute top-0 left-8 md:left-16 bottom-0 w-[30px] pointer-events-none z-0 opacity-40">
                <div className="absolute top-0 left-0 w-[1px] h-[33%] bg-[#00ffff]"></div>
                <div className="absolute top-[33%] left-0 w-[42px] h-[1px] bg-[#00ffff] origin-top-left rotate-45"></div>
                <div className="absolute top-[calc(33%+30px)] left-[30px] w-[1px] h-[calc(67%-30px)] bg-[#00ffff]"></div>
            </div>

            <div className="absolute top-0 right-8 md:right-16 bottom-0 w-[30px] pointer-events-none z-0 opacity-40">
                <div className="absolute top-0 right-[41px] w-[1px] h-[66%] bg-[#00ffff]"></div>
                <div className="absolute top-[66%] right-[0px] w-[42px] h-[1px] bg-[#00ffff] origin-top-left rotate-45"></div>
                <div className="absolute top-[calc(66%+30px)] right-3 w-[1px] h-[calc(34%-30px)] bg-[#00ffff]"></div>
            </div>

            {/* LOGIN MODULE */}
            <div className="relative z-10 w-full max-w-md p-4">
                <div
                    className="p-[2px] transition-all duration-700 shadow-[0_0_40px_rgba(0,255,255,0.1)]"
                    style={{
                        background: status === 'ACCESS_GRANTED' ? '#39ff14' : (status === 'ACCESS_DENIED' ? '#ff3131' : '#00ffff'),
                        clipPath: 'polygon(0 20px, 20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)'
                    }}
                >
                    <div
                        className="bg-[#0b2229] p-10 flex flex-col items-center text-center relative"
                        style={{ clipPath: 'polygon(0 20px, 20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
                    >
                        {/* INTERNAL SCANLINES */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none z-0 opacity-80"></div>

                        <div className="relative z-10 flex flex-col items-center w-full">

                            <div className={`mb-6 p-4 rounded-full border-2 transition-all duration-500 ${status === 'ACCESS_GRANTED' ? 'border-[#39ff14] bg-[#39ff14]/10 shadow-[0_0_20px_rgba(57,255,20,0.4)]' :
                                (status === 'ACCESS_DENIED' ? 'border-[#ff3131] bg-[#ff3131]/10 shadow-[0_0_20px_rgba(255,49,49,0.4)]' : 'border-[#00ffff]/30')
                                }`}>
                                {status === 'ACCESS_GRANTED' ? <ShieldCheck size={40} className="text-[#39ff14]" /> :
                                    (status === 'ACCESS_DENIED' ? <ShieldAlert size={40} className="text-[#ff3131] animate-bounce" /> :
                                        <Lock size={40} className="text-[#00ffff] animate-pulse" />)}
                            </div>

                            {/* 3. APPLY MOREXIN FONT */}
                            {/* Font class interpolated directly into the heading */}
                            <h1 className={`text-4xl tracking-[0.2em] text-white mb-2 drop-shadow-md ${morexin.className}`}>
                                TASK<span className="text-[#00ffff]">-</span>OPS
                            </h1>

                            <p className="text-[10px] text-cyan-400 uppercase tracking-widest mb-10 opacity-90 drop-shadow-md">
                                User Identification Required // Individual_Node_01
                            </p>

                            {status === 'AWAITING_INPUT' ? (
                                <button
                                    onClick={handleLogin}
                                    className="group relative w-full py-4 bg-[#00ffff] text-black font-black uppercase tracking-[0.2em] text-xs hover:brightness-125 transition-all overflow-hidden shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60%, 90% 100%, 0 100%)' }}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Initialize Sync <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                </button>
                            ) : (
                                <div className="w-full space-y-4">
                                    <div className={`flex justify-between text-[10px] font-bold uppercase tracking-tighter ${status === 'ACCESS_GRANTED' ? 'text-[#39ff14]' : (status === 'ACCESS_DENIED' ? 'text-[#ff3131]' : 'text-[#00ffff]')
                                        }`}>
                                        <span>{status}</span>
                                        {status !== 'AWAITING_AUTHORIZATION' && status !== 'ACCESS_DENIED' && <span>{loadingProgress}%</span>}
                                    </div>

                                    {status !== 'AWAITING_AUTHORIZATION' && status !== 'ACCESS_DENIED' && (
                                        <div className="h-1 w-full bg-black/50 relative overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-100 ${status === 'ACCESS_GRANTED' ? 'bg-[#39ff14] shadow-[0_0_10px_#39ff14]' : 'bg-[#00ffff] shadow-[0_0_10px_#00ffff]'}`}
                                                style={{ width: `${loadingProgress}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-8 flex gap-4 opacity-60">
                                <Terminal size={14} className="text-[#00ffff]" />
                                <div className="h-[1px] w-12 bg-[#00ffff] self-center"></div>
                                <span className="text-[8px] text-[#00ffff] uppercase font-bold tracking-tighter">Secure Link Established</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. BLINKING PROMPT FOOTER */}
                <div className="mt-8 flex justify-center items-center gap-1">
                    <p className="text-[9px] text-cyan-900 uppercase tracking-widest font-bold">
                        Authorized personnel only. All access attempts are logged at CDMX_NODE
                    </p>
                    <span
                        className={`text-[#00ffff] text-sm font-black transition-opacity duration-100 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}
                    >
                        _
                    </span>
                </div>
            </div>
        </div>
    );
}