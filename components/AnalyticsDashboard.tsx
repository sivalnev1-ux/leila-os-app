
import React, { useState } from 'react';
import { Invoice, Order } from '../types';
import { BarChart3, Receipt, Package, Filter, ArrowUpRight, ArrowDownRight, Search, FileDown } from 'lucide-react';

const MOCK_INVOICES: Invoice[] = [
  { id: 'inv-001', source: 'info.pitaron@gmail.com', amount: 1250, currency: 'USD', date: '2024-05-18', status: 'pending', description: 'AWS Infrastructure Services' },
  { id: 'inv-002', source: 'omni.israeloffice@gmail.com', amount: 4500, currency: 'ILS', date: '2024-05-15', status: 'paid', description: 'Office Rent - Tel Aviv' },
  { id: 'inv-003', source: 'sivalnev1@gmail.com', amount: 200, currency: 'USD', date: '2024-05-10', status: 'overdue', description: 'Adobe Creative Cloud' },
];

const MOCK_ORDERS: Order[] = [
  { id: 'ord-99', source: 'omni.israeloffice@gmail.com', item: 'MacBook Pro M3', vendor: 'Apple Store', date: '2024-05-20', status: 'shipped' },
  { id: 'ord-102', source: 'info.pitaron@gmail.com', item: 'Office Supplies', vendor: 'Amazon', date: '2024-05-19', status: 'processing' },
];

const AnalyticsDashboard: React.FC = () => {
  const [filterSource, setFilterSource] = useState<string>('all');

  const filteredInvoices = filterSource === 'all' ? MOCK_INVOICES : MOCK_INVOICES.filter(i => i.source.includes(filterSource));

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            Аналитика и Фильтры Данных
            <div className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full animate-pulse">Live Scanning</div>
          </h2>
          <p className="text-sm text-neutral-500">Автоматический сбор из: Pitaron, Sivalnev, Omni.</p>
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
              <option value="pitaron">Pitaron</option>
              <option value="omni">Omni</option>
              <option value="sivalnev">Personal</option>
            </select>
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">
            <FileDown size={16} /> Экспорт PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass p-6 rounded-3xl border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Receipt size={80} />
          </div>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Общая сумма инвойсов</p>
          <h3 className="text-3xl font-black text-white mb-2">$5,950.00</h3>
          <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold">
            <ArrowUpRight size={14} /> +12% к прошлому месяцу
          </div>
        </div>
        <div className="glass p-6 rounded-3xl border-white/5 relative overflow-hidden group">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Ожидают оплаты</p>
          <h3 className="text-3xl font-black text-amber-500 mb-2">$1,450.00</h3>
          <p className="text-[10px] text-neutral-500 uppercase tracking-tighter">Всего 3 счета требуют внимания</p>
        </div>
        <div className="glass p-6 rounded-3xl border-white/5 relative overflow-hidden group">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Заказы в пути</p>
          <h3 className="text-3xl font-black text-blue-500 mb-2">2</h3>
          <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-bold">
            <Package size={14} /> Ближайшая доставка: Завтра
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Invoices List */}
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2 mb-2 uppercase tracking-widest">
            <Receipt size={16} className="text-indigo-400" /> Последние Счета
          </h4>
          <div className="space-y-3">
            {filteredInvoices.map(inv => (
              <div key={inv.id} className="bg-neutral-900/40 border border-white/5 p-4 rounded-2xl hover:bg-neutral-800/40 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 
                    inv.status === 'overdue' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {inv.currency === 'USD' ? '$' : '₪'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{inv.description}</p>
                    <p className="text-[10px] text-neutral-500">{inv.source}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">{inv.currency} {inv.amount}</p>
                  <p className="text-[10px] text-neutral-600">{inv.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2 mb-2 uppercase tracking-widest">
            <Package size={16} className="text-blue-400" /> Статус Заказов
          </h4>
          <div className="space-y-3">
            {MOCK_ORDERS.map(order => (
              <div key={order.id} className="bg-neutral-900/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Package size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{order.item}</p>
                    <p className="text-[10px] text-neutral-500">От: {order.vendor}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                     order.status === 'shipped' ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-neutral-800 text-neutral-400'
                   }`}>
                     {order.status}
                   </div>
                   <p className="text-[9px] text-neutral-600 italic">ID: {order.id}</p>
                </div>
              </div>
            ))}
            <div className="p-8 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-neutral-600">
               <BarChart3 size={32} className="mb-2 opacity-20" />
               <p className="text-[11px] font-bold uppercase">Дополнительная аналитика в процессе генерации</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
