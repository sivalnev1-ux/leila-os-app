
import React, { useState } from 'react';
import { Task, TaskStatus, Department, Assignee } from '../types';
import { TEAM_MEMBERS } from '../constants';
import { Plus, MoreVertical, Clock, AlertCircle, ChevronRight, X, AlignLeft, Link as LinkIcon, Lock, Unlock, Timer } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  department: Department;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'К выполнению', color: 'bg-neutral-500' },
  { id: 'in-progress', label: 'В работе', color: 'bg-blue-500' },
  { id: 'review', label: 'Проверка', color: 'bg-amber-500' },
  { id: 'done', label: 'Готово', color: 'bg-emerald-500' },
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, department, onUpdateTask, onAddTask }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(TEAM_MEMBERS[0].id);

  const filteredTasks = tasks.filter(t => t.department === department);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-amber-400';
      default: return 'text-neutral-400';
    }
  };

  const checkPrerequisites = (task: Task, targetStatus: TaskStatus): boolean => {
    if (targetStatus === 'todo') return true;
    if (!task.prerequisiteIds || task.prerequisiteIds.length === 0) return true;

    const unfinished = task.prerequisiteIds.filter(id => {
      const depTask = tasks.find(t => t.id === id);
      return depTask && depTask.status !== 'done';
    });

    if (unfinished.length > 0) {
      const titles = unfinished.map(id => tasks.find(t => t.id === id)?.title).join(', ');
      setError(`Невозможно начать: сначала завершите задачи: ${titles}`);
      return false;
    }
    return true;
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask({
      title: newTaskTitle,
      description: '',
      status: 'todo',
      department: department,
      priority: 'medium',
      assigneeId: newTaskAssignee,
      prerequisiteIds: [],
      estimatedTime: 0,
      actualTime: 0
    });
    setNewTaskTitle('');
    setShowAddModal(false);
  };

  const handleUpdateTaskDetails = () => {
    if (!editingTask || !editingTask.title.trim()) return;
    
    const originalTask = tasks.find(t => t.id === editingTask.id);
    if (originalTask && originalTask.status !== editingTask.status) {
      if (!checkPrerequisites(editingTask, editingTask.status)) return;
    }

    onUpdateTask(editingTask.id, {
      title: editingTask.title,
      description: editingTask.description,
      priority: editingTask.priority,
      assigneeId: editingTask.assigneeId,
      status: editingTask.status,
      prerequisiteIds: editingTask.prerequisiteIds,
      estimatedTime: editingTask.estimatedTime,
      actualTime: editingTask.actualTime
    });
    setEditingTask(null);
    setError(null);
  };

  const getAssignee = (id: string): Assignee => {
    return TEAM_MEMBERS.find(m => m.id === id) || TEAM_MEMBERS[0];
  };

  const togglePrerequisite = (id: string) => {
    if (!editingTask) return;
    const current = editingTask.prerequisiteIds || [];
    const updated = current.includes(id) 
      ? current.filter(pid => pid !== id) 
      : [...current, id];
    setEditingTask({ ...editingTask, prerequisiteIds: updated });
  };

  const calculateProgress = (actual: number = 0, estimated: number = 0) => {
    if (estimated === 0) return 0;
    return Math.min(Math.round((actual / estimated) * 100), 100);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6">
      {error && (
        <div className="fixed top-20 right-8 z-[60] glass border-red-500/50 p-4 rounded-xl shadow-2xl animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <div className="text-sm font-medium">{error}</div>
            <button onClick={() => setError(null)} className="ml-2 hover:text-white"><X size={16} /></button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Задачи: {department}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">Управление проектами и поручениями отдела</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus size={18} /> Новая задача
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex-shrink-0 w-80 flex flex-col glass rounded-2xl border-white/5">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-300">{col.label}</span>
                <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-neutral-500 font-mono">
                  {filteredTasks.filter(t => t.status === col.id).length}
                </span>
              </div>
              <button className="text-neutral-500 hover:text-neutral-300"><MoreVertical size={14} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {filteredTasks.filter(t => t.status === col.id).map(task => {
                const assignee = getAssignee(task.assigneeId);
                const hasPrerequisites = task.prerequisiteIds && task.prerequisiteIds.length > 0;
                const isLocked = hasPrerequisites && task.status === 'todo' && task.prerequisiteIds?.some(id => tasks.find(t => t.id === id)?.status !== 'done');
                const progress = calculateProgress(task.actualTime, task.estimatedTime);

                return (
                  <div 
                    key={task.id} 
                    onClick={() => { setEditingTask({ ...task }); setError(null); }}
                    className={`bg-neutral-800/40 border border-white/5 rounded-xl p-4 hover:border-white/20 hover:bg-neutral-800/60 transition-all group cursor-pointer active:scale-[0.98] ${isLocked ? 'opacity-80' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-tighter ${getPriorityColor(task.priority)} flex items-center gap-1`}>
                          <AlertCircle size={10} /> {task.priority}
                        </span>
                        {hasPrerequisites && (
                          <span className={`text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1 ${isLocked ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                            {task.prerequisiteIds?.length}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {col.id !== 'done' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextStatus: Record<TaskStatus, TaskStatus> = {
                                'todo': 'in-progress',
                                'in-progress': 'review',
                                'review': 'done',
                                'done': 'done'
                              };
                              const targetStatus = nextStatus[task.status];
                              if (checkPrerequisites(task, targetStatus)) {
                                onUpdateTask(task.id, { status: targetStatus });
                              }
                            }}
                            className="p-1 hover:bg-white/10 rounded text-indigo-400"
                          >
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="text-sm font-medium text-neutral-200 leading-snug mb-2">{task.title}</h4>
                    
                    {task.estimatedTime && task.estimatedTime > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between items-center text-[9px] text-neutral-500 uppercase font-bold tracking-widest mb-1">
                          <span>Прогресс</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {task.description && (
                      <p className="text-[10px] text-neutral-500 line-clamp-2 mb-3 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3">
                         <div className="flex items-center gap-1.5 text-neutral-500 text-[10px]">
                           <Clock size={12} />
                           {new Date(task.createdAt).toLocaleDateString()}
                         </div>
                         {task.estimatedTime && task.estimatedTime > 0 && (
                           <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold">
                             <Timer size={12} /> {task.actualTime || 0}/{task.estimatedTime}h
                           </div>
                         )}
                      </div>
                      <div 
                        title={assignee.name}
                        className={`w-7 h-7 rounded-full ${assignee.color} flex items-center justify-center text-[10px] font-bold text-white border border-white/10 shadow-sm`}
                      >
                        {assignee.avatarLabel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border-white/10 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Создать задачу</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">Название</label>
                <input 
                  autoFocus
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  placeholder="Что нужно сделать?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">Исполнитель</label>
                <div className="grid grid-cols-2 gap-2">
                  {TEAM_MEMBERS.map(member => (
                    <button
                      key={member.id}
                      onClick={() => setNewTaskAssignee(member.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all text-xs ${
                        newTaskAssignee === member.id 
                          ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-inner' 
                          : 'border-white/5 bg-neutral-900/50 text-neutral-400 hover:border-white/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${member.color} flex items-center justify-center text-[8px] font-bold text-white`}>
                        {member.avatarLabel}
                      </div>
                      {member.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={handleAddTask}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass w-full max-w-2xl rounded-2xl border-white/10 p-7 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div className="flex items-center gap-2">
                 <div className={`w-3 h-3 rounded-full ${COLUMNS.find(c => c.id === editingTask.status)?.color}`} />
                 <h3 className="text-lg font-bold text-white">Редактирование задачи</h3>
              </div>
              <button onClick={() => setEditingTask(null)} className="text-neutral-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scroll">
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">Заголовок</label>
                <input 
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                   <AlignLeft size={10} /> Описание
                </label>
                <textarea 
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all min-h-[100px] resize-none"
                  placeholder="Добавьте подробное описание..."
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>

              {/* Time Tracking Section */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4 block flex items-center gap-1.5">
                   <Timer size={12} /> Time Tracking & Progress
                </label>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[9px] font-medium text-neutral-500 mb-1.5 block">Оценка (часов)</label>
                    <input 
                      type="number"
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                      value={editingTask.estimatedTime || 0}
                      onChange={(e) => setEditingTask({ ...editingTask, estimatedTime: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-medium text-neutral-500 mb-1.5 block">Затрачено (часов)</label>
                    <input 
                      type="number"
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                      value={editingTask.actualTime || 0}
                      onChange={(e) => setEditingTask({ ...editingTask, actualTime: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                {editingTask.estimatedTime ? (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase">Текущий прогресс</span>
                      <span className="text-sm font-bold text-white">{calculateProgress(editingTask.actualTime, editingTask.estimatedTime)}%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden p-0.5">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                        style={{ width: `${calculateProgress(editingTask.actualTime, editingTask.estimatedTime)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-[10px] text-neutral-500 italic">
                    Укажите оценку времени для визуализации прогресса
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">Приоритет</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map(p => (
                      <button
                        key={p}
                        onClick={() => setEditingTask({ ...editingTask, priority: p as any })}
                        className={`flex-1 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
                          editingTask.priority === p 
                            ? 'bg-neutral-700 border-white/20 text-white ring-1 ring-white/10' 
                            : 'bg-neutral-900/50 border-white/5 text-neutral-500 hover:border-white/10'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">Статус</label>
                  <select 
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as any })}
                  >
                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Dependencies Section */}
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                   <LinkIcon size={10} /> Зависимости (Завершите эти задачи первыми)
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto bg-neutral-900/30 rounded-xl p-3 border border-white/5">
                  {filteredTasks
                    .filter(t => t.id !== editingTask.id)
                    .map(depTask => (
                      <button
                        key={depTask.id}
                        onClick={() => togglePrerequisite(depTask.id)}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-all text-xs ${
                          editingTask.prerequisiteIds?.includes(depTask.id)
                            ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                            : 'bg-transparent border-white/5 text-neutral-500 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                           <div className={`w-2 h-2 rounded-full ${COLUMNS.find(c => c.id === depTask.status)?.color}`} />
                           <span className="truncate">{depTask.title}</span>
                        </div>
                        {editingTask.prerequisiteIds?.includes(depTask.id) && <X size={12} />}
                      </button>
                    ))}
                  {filteredTasks.length <= 1 && (
                    <div className="text-center py-4 text-xs text-neutral-600">Нет других задач в этом отделе</div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">Исполнитель</label>
                <div className="grid grid-cols-4 gap-2">
                  {TEAM_MEMBERS.map(member => (
                    <button
                      key={member.id}
                      onClick={() => setEditingTask({ ...editingTask, assigneeId: member.id })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        editingTask.assigneeId === member.id 
                          ? 'border-indigo-500 bg-indigo-500/10' 
                          : 'border-white/5 bg-neutral-900/50 hover:border-white/10'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                        {member.avatarLabel}
                      </div>
                      <span className={`text-[9px] font-medium ${editingTask.assigneeId === member.id ? 'text-white' : 'text-neutral-500'}`}>
                        {member.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-10 shrink-0">
              <button 
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={handleUpdateTaskDetails}
                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95"
              >
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
