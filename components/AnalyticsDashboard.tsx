
import React, { useState } from 'react';
import { BarChart3, Receipt, Package, Filter, FileDown, AreaChart, PieChart, Activity } from 'lucide-react';

const AnalyticsDashboard: React.FC = () => {
  const [filterSource, setFilterSource] = useState<string>('all');

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            Автоматизация и Аналитика
            <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-[9px] px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
              <Activity size={10} /> Live Scanning
            </div>
          </h2>
          <p className="text-sm text-neutral-500">Автоматический сбор данных из Google Drive, Wix, Sheets.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
            <Filter size={16} className="text-neutral-500" />
            <select
              className="bg-transparent border-none outline-none text-xs text-neutral-300 font-bold uppercase tracking-wider"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="all">Все аккаунты</option>
              <option value="finance">Финансы (Finance)</option>
              <option value="wix">Каталог (Wix)</option>
            </select>
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">
            <FileDown size={16} /> Экспорт PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass p-6 rounded-3xl border-white/5 relative overflow-hidden group flex flex-col items-center justify-center min-h-[160px] text-neutral-600">
          <Receipt size={32} className="mb-3 opacity-50" />
          <p className="text-xs font-bold uppercase tracking-widest text-center">Нет финансовых данных</p>
          <p className="text-[10px] text-center mt-1 max-w-[80%]">Загрузите чеки или подключите Google Sheets.</p>
        </div>
        <div className="glass p-6 rounded-3xl border-white/5 relative overflow-hidden group flex flex-col items-center justify-center min-h-[160px] text-neutral-600">
          <Package size={32} className="mb-3 opacity-50 text-amber-500/50" />
          <p className="text-xs font-bold uppercase tracking-widest text-center">Нет открытых заказов</p>
          <p className="text-[10px] text-center mt-1 max-w-[80%]">Уведомления о заказах из внешних систем.</p>
        </div>
        <div className="glass p-6 rounded-3xl border-white/5 relative overflow-hidden group flex flex-col items-center justify-center min-h-[160px] text-neutral-600">
          <AreaChart size={32} className="mb-3 opacity-50 text-emerald-500/50" />
          <p className="text-xs font-bold uppercase tracking-widest text-center">Анализ доходов</p>
          <p className="text-[10px] text-center mt-1 max-w-[80%]">Ожидание данных для расчета трендов.</p>
        </div>
      </div>

      <div className="glass flex-1 rounded-3xl border border-white/5 p-8 flex flex-col items-center justify-center text-neutral-500 min-h-[300px]">
        <div className="w-24 h-24 mb-6 rounded-full bg-neutral-900 flex items-center justify-center border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <PieChart size={40} className="text-neutral-700" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Аналитический дашборд готов</h3>
        <p className="text-sm text-center max-w-md">Пока нет доступных данных от субагентов. Когда модуль Финансов обработает чеки, реальные данные появятся здесь в реальном времени.</p>

        <div className="mt-8 flex gap-4">
          <div className="px-4 py-2 rounded-xl bg-neutral-900 border border-white/5 flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Ожидание данных чеков...
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
