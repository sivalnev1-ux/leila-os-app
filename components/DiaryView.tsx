import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings, Plus, Clock, Calendar as CalendarIcon, RotateCw } from 'lucide-react';
import { calendarService } from '../services/calendarService';

interface DiaryViewProps {
  onClose?: () => void;
}

export const DiaryView: React.FC<DiaryViewProps> = ({ onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Hours range as requested: 08:00 to 20:00
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  useEffect(() => {
    fetchDayEvents();
  }, [currentDate]);

  const fetchDayEvents = async () => {
    setIsLoading(true);
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await calendarService.getUpcomingEvents(
      startOfDay.toISOString(),
      endOfDay.toISOString()
    );

    if (result.success) {
      setEvents(result.events || []);
    }
    setIsLoading(false);
  };

  const dayNumber = currentDate.getDate();
  const monthName = currentDate.toLocaleString('ru-RU', { month: 'long' });
  const year = currentDate.getFullYear();
  const dayOfWeek = currentDate.toLocaleString('ru-RU', { weekday: 'long' });

  // Mini-calendar logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return { firstDay: firstDay === 0 ? 6 : firstDay - 1, days };
  };

  const { firstDay, days } = getDaysInMonth(currentDate);

  return (
    <div className="flex-1 h-full overflow-hidden bg-[#0a0a0a] flex flex-col items-center p-4 md:p-8 relative">
      
      {/* ⚙️ Steampunk Background Elements */}
      <div className="absolute top-0 left-0 w-32 h-32 opacity-10 pointer-events-none">
        <RotateCw size={120} className="text-orange-500 animate-[spin_20s_linear_infinite]" />
      </div>
      <div className="absolute bottom-0 right-0 w-48 h-48 opacity-10 pointer-events-none">
        <RotateCw size={180} className="text-orange-700 animate-[spin_35s_linear_infinite_reverse]" />
      </div>

      {/* 📜 Main Parchment Container */}
      <div className="w-full max-w-4xl h-full glass rounded-[2rem] border-4 border-orange-900/40 relative flex flex-col shadow-[0_0_50px_rgba(154,52,18,0.2)] overflow-hidden">
        
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/parchment.png')] opacity-30 pointer-events-none mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/5 via-transparent to-orange-900/10 pointer-events-none" />

        {/* 📋 Header: Big Date & Mini Calendar */}
        <header className="flex flex-col md:flex-row justify-between p-8 border-b-2 border-orange-900/30 gap-8 relative z-10">
          
          {/* Big Date Section */}
          <div className="flex items-start gap-6">
            <div className="relative">
               <span className="text-8xl font-black text-orange-600/90 drop-shadow-[2px_2px_0px_#431407] font-serif">
                {dayNumber}
              </span>
              <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-orange-900/50 border border-orange-400/30 flex items-center justify-center">
                <div className="w-1 h-1 bg-orange-400 rounded-full" />
              </div>
            </div>
            <div className="flex flex-col pt-2 uppercase tracking-[0.2em]">
              <span className="text-xl font-bold text-orange-200/80">{monthName} / {year}</span>
              <span className="text-sm font-black text-orange-500/60 mt-1">{dayOfWeek}</span>
              <div className="h-0.5 w-full bg-gradient-to-r from-orange-600/50 to-transparent mt-2" />
            </div>
          </div>

          {/* Mini Calendar View */}
          <div className="bg-orange-950/20 p-4 rounded-2xl border border-orange-900/30 backdrop-blur-sm">
            <div className="text-[10px] grid grid-cols-7 gap-2 text-center font-bold uppercase text-orange-500/50 mb-2 tracking-tighter">
              <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
            </div>
            <div className="grid grid-cols-7 gap-2 text-[10px] font-bold text-orange-200/40">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: days }).map((_, i) => (
                <div 
                  key={i + 1} 
                  className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${
                    i + 1 === dayNumber ? 'bg-orange-600 text-white shadow-[0_0_10px_rgba(234,88,12,0.5)]' : 'hover:bg-orange-500/10'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button 
              onClick={() => {
                const prev = new Date(currentDate);
                prev.setDate(currentDate.getDate() - 1);
                setCurrentDate(prev);
              }}
              className="p-2 rounded-full hover:bg-orange-500/10 text-orange-400 transition-all border border-orange-900/20"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => {
                const next = new Date(currentDate);
                next.setDate(currentDate.getDate() + 1);
                setCurrentDate(next);
              }}
              className="p-2 rounded-full hover:bg-orange-500/10 text-orange-400 transition-all border border-orange-900/20"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </header>

        {/* 🕰️ Timeline: 08:00 - 20:00 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 custom-scroll selection:bg-orange-500/30">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] z-20">
              <RotateCw size={32} className="text-orange-500 animate-spin" />
            </div>
          )}
          
          <div className="space-y-0 relative">
            {hours.map((hour) => {
              const hourString = `${hour.toString().padStart(2, '0')}:00`;
              const hourEvents = events.filter(e => {
                const start = e.start?.dateTime ? new Date(e.start.dateTime) : (e.start?.date ? new Date(e.start.date) : null);
                return start && start.getHours() === hour;
              });

              return (
                <div key={hour} className="group flex items-start h-20 relative">
                  {/* Timeline Line */}
                  <div className="w-16 flex flex-col items-center shrink-0">
                    <span className="text-xs font-black text-orange-500/40 group-hover:text-orange-400 transition-colors">
                      {hourString}
                    </span>
                    <div className="w-px h-full bg-gradient-to-b from-orange-900/30 to-transparent mt-2" />
                  </div>
                  
                  {/* Row Content */}
                  <div className="flex-1 border-b border-orange-900/10 flex flex-col gap-2 py-1 px-4 relative">
                    {hourEvents.length > 0 ? (
                      hourEvents.map((event, idx) => (
                        <div 
                          key={event.id || idx}
                          className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 shadow-lg shadow-orange-950/20 group/event animate-in fade-in slide-in-from-left-2 transition-all hover:bg-orange-500/20"
                        >
                          <div className="flex items-center justify-between gap-2">
                             <h4 className="text-sm font-bold text-orange-100/90 font-serif lowercase tracking-wide italic">
                              {event.summary}
                            </h4>
                            <Clock size={12} className="text-orange-500/50" />
                          </div>
                          {event.description && (
                            <p className="text-[10px] text-orange-300/40 mt-1 line-clamp-1">{event.description}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="w-full h-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-4">
                        <Plus size={14} className="text-orange-900/50 hover:text-orange-500 cursor-pointer" />
                      </div>
                    )}
                  </div>

                  {/* Brass Rivet Effect */}
                  <div className="absolute left-16 top-0 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-700/30 border border-orange-400/20" />
                </div>
              );
            })}
          </div>
        </div>

        {/* ⚙️ Footer Info */}
        <footer className="p-4 border-t border-orange-900/20 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-orange-900/40 relative z-10 bg-orange-950/5">
          <span>Clockwork Registry 2.5</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Clock size={12} /> Sync: Online</span>
            <span className="flex items-center gap-1"><RotateCw size={12} /> G: Drive Link Status</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DiaryView;
