import React, { useState } from 'react';
import { DEPARTMENT_BOTS, getBotIcon } from '../constants';
import { Department, ViewMode } from '../types';
import { Settings, Radio, Globe, BarChart3, User, Trash2, Camera, Book } from 'lucide-react';

interface DepartmentSidebarProps {
  currentDept: Department;
  viewMode: ViewMode;
  onSelectDept: (dept: Department) => void;
  onSelectView: (view: ViewMode) => void;
  onClearHistory?: () => void;
}

const DepartmentSidebar: React.FC<DepartmentSidebarProps> = ({ currentDept, viewMode, onSelectDept, onSelectView, onClearHistory }) => {
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const handleImgError = (id: string) => {
    setImgError(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="w-64 h-full border-r border-white/10 flex flex-col glass">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            Leila OS
          </h1>
          <button
            onClick={onClearHistory}
            className="text-neutral-500 hover:text-red-400 transition-colors p-1"
            title="Очистить историю сессии"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <p className="text-xs text-neutral-400 uppercase tracking-widest font-medium">Assistant Hub</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll">
        <div className="mb-2">
          <button
            onClick={() => onSelectView('bridge')}
            className={`w-full group flex items-center gap-4 p-4 rounded-3xl border transition-all duration-500 ${
              viewMode === 'bridge'
                ? 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(79,70,229,0.4)] border-indigo-400'
                : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className={`p-3 rounded-2xl transition-all duration-500 ${
              viewMode === 'bridge' ? 'bg-white/20' : 'bg-neutral-800'
            }`}>
              <Radio size={20} className={viewMode === 'bridge' ? 'animate-pulse' : ''} />
            </div>
            <div className="flex flex-col items-start translate-y-[-1px]">
              <span className={`text-[10px] font-black uppercase tracking-widest ${viewMode === 'bridge' ? 'text-white' : 'text-neutral-500'}`}>Node Protocol</span>
              <span className="text-sm font-bold">CYBER PORTAL</span>
            </div>
          </button>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-neutral-500 uppercase ml-2 mb-2 tracking-widest">Main Channels</p>
          <div className="space-y-1">
            <button
              onClick={() => onSelectView('live')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${viewMode === 'live' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                }`}
            >
              <Radio size={18} className={viewMode === 'live' ? 'animate-pulse' : ''} />
              <div className="text-left">
                <div className="text-sm font-semibold">Gemini Live</div>
              </div>
            </button>
            <button
              onClick={() => onSelectView('analytics')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${viewMode === 'analytics' ? 'bg-white/10 text-white border border-white/10' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                }`}
            >
              <BarChart3 size={18} />
              <div className="text-left">
                <div className="text-sm font-semibold">Аналитика</div>
              </div>
            </button>
            <button
              onClick={() => onSelectView('integrations')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${viewMode === 'integrations' ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                }`}
            >
              <Globe size={18} />
              <div className="text-left">
                <div className="text-sm font-semibold">Integrations</div>
              </div>
            </button>
            <button
              onClick={() => onSelectView('visual')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${viewMode === 'visual' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                }`}
            >
              <Camera size={18} className={viewMode === 'visual' ? 'animate-pulse' : ''} />
              <div className="text-left">
                <div className="text-sm font-semibold">Visual Center</div>
              </div>
            </button>
            <button
              onClick={() => onSelectView('diary')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${viewMode === 'diary' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                }`}
            >
              <Book size={18} />
              <div className="text-left">
                <div className="text-sm font-semibold">Daily Diary</div>
              </div>
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-neutral-500 uppercase ml-2 mb-2 tracking-widest">Team Availability</p>
          <div className="space-y-1">
            {DEPARTMENT_BOTS.map((bot) => (
              <div
                key={bot.id}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${bot.id === Department.GENERAL
                  ? 'bg-white/5 text-white border border-white/10 ring-1 ring-indigo-500/20'
                  : 'text-neutral-500 opacity-80'
                  }`}
              >
                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl overflow-hidden shadow-lg border ${bot.id === Department.GENERAL ? 'border-indigo-400/50' : 'border-white/5'}`}>
                    {bot.avatarUrl && !imgError[bot.id] ? (
                      <img
                        src={bot.avatarUrl}
                        alt={bot.name}
                        onError={() => handleImgError(bot.id)}
                        className={`w-full h-full object-cover object-top ${bot.id === Department.GENERAL ? 'brightness-110' : 'grayscale-[30%] brightness-75'}`}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${bot.color} text-white opacity-80`}>
                        {getBotIcon(bot.id, 18)}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#050505] rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className={`text-sm font-bold truncate ${bot.id === Department.GENERAL ? 'text-white' : 'text-neutral-400'}`}>
                    {bot.name}
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">
                    System Node • Online
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      <div className="p-4 border-t border-white/10 space-y-4">
        <div className="bg-neutral-800/50 rounded-2xl p-3 flex items-center justify-between border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg border border-white/10">
              S
            </div>
            <div>
              <div className="text-xs font-bold text-white">Сергей</div>
              <div className="text-[10px] text-neutral-500 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Admin Session
              </div>
            </div>
          </div>
          <button className="p-2 text-neutral-600 hover:text-white transition-colors bg-white/5 rounded-lg">
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentSidebar;
