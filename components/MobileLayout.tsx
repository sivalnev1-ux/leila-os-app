import React from 'react';
import { MessageSquare, Camera, LayoutDashboard, Kanban, Settings, Activity, Radio, Paperclip, Book } from 'lucide-react';
import { ViewMode, Department } from '../types';

interface MobileLayoutProps {
  viewMode: ViewMode;
  setViewMode: (view: ViewMode) => void;
  renderContent: () => React.ReactNode;
  isAiOnline: boolean;
  isDriveLive: boolean;
  currentDept: Department;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  viewMode, 
  setViewMode, 
  renderContent,
  isAiOnline,
  isDriveLive,
  currentDept 
}) => {
  return (
    <div className="flex flex-col h-screen bg-[#050505] text-neutral-200 overflow-hidden font-inter select-none">
      
      {/* 📱 Header (Compact / Cyber) */}
      <header className="h-16 flex items-center justify-between px-5 bg-zinc-900/80 border-b border-white/5 backdrop-blur-xl z-50 shrink-0 pt-safe">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0-8px_rgba(16,185,129,0.8)]" />
          <h1 className="text-lg font-black italic tracking-tighter text-emerald-400">
            LEILA <span className="text-[10px] text-zinc-500 not-italic font-bold ml-1 uppercase">M-Node</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity size={14} className={isAiOnline ? 'text-indigo-400' : 'text-zinc-600'} />
            <Radio size={14} className={isDriveLive ? 'text-emerald-400' : 'text-zinc-600'} />
          </div>
          <button className="p-2 text-zinc-400">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* 🌌 Main Viewport */}
      <main className="flex-1 overflow-hidden relative flex flex-col min-h-0 bg-neutral-950">
        {renderContent()}
      </main>

      {/* 📱 Bottom Navigation (WhatsApp Style) */}
      <nav className="h-20 pb-safe bg-zinc-900 border-t border-white/5 flex items-center justify-around px-2 z-50 shrink-0">
        <NavButton 
          active={viewMode === 'chat'} 
          onClick={() => setViewMode('chat')}
          icon={<MessageSquare size={24} />}
          label="Чат"
        />
        <NavButton 
          active={viewMode === 'diary'} 
          onClick={() => setViewMode('diary')}
          icon={<Book size={24} />}
          label="Дневник"
        />
        <NavButton 
          active={viewMode === 'visual'} 
          onClick={() => setViewMode('visual')}
          icon={<Camera size={24} />}
          label="Скан"
          highlight
        />
        <NavButton 
          active={viewMode === 'tasks'} 
          onClick={() => setViewMode('tasks')}
          icon={<Kanban size={24} />}
          label="Задачи"
        />
        <NavButton 
          active={viewMode === 'analytics'} 
          onClick={() => setViewMode('analytics')}
          icon={<LayoutDashboard size={24} />}
          label="Финансы"
        />
      </nav>

      {/* 💠 Quick Capture Floating Button */}
      {viewMode === 'chat' && (
        <div className="absolute bottom-24 right-5 z-40 flex flex-col gap-3">
          <button className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shadow-2xl text-zinc-400 active:scale-90 transition-transform">
            <Paperclip size={20} />
          </button>
          <button 
            onClick={() => setViewMode('visual')}
            className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-[0_0-20px_rgba(79,70,229,0.4)] text-white active:scale-95 transition-transform"
          >
            <Camera size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  highlight?: boolean;
}> = ({ active, onClick, icon, label, highlight }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 relative ${
      active ? 'text-indigo-400' : 'text-zinc-500'
    }`}
  >
    <div className={`p-2 rounded-2xl transition-all ${
      active ? 'bg-indigo-500/10 scale-110' : ''
    } ${highlight && !active ? 'text-emerald-400' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
    {active && (
      <div className="absolute -top-1 w-1 h-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
    )}
  </button>
);
