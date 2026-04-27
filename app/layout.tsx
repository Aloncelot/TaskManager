import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cyber-Task Manager',
  description: 'Gestor Ágil de Proyectos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#020202] text-white h-screen overflow-hidden flex font-sans selection:bg-[#00ffff] selection:text-black">
        {children}
      </body>
    </html>
  );
}