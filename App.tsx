import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Trash2, User, ChevronLeft, Calendar as CalendarIcon, PhoneOff, Cpu, HardDrive, Paperclip, CheckSquare, ListTodo, ShieldCheck, FileIcon, Search, PlusCircle, CreditCard, Inbox, CheckCircle2, FileText, Send, Kanban, MessageSquare, Briefcase, Zap, X, BrainCircuit, Sparkles, Mic, Lightbulb, MicOff, LayoutDashboard, Clock } from 'lucide-react';
import { Department, Message, ViewMode, Task, Attachment } from './types';
import { geminiService } from './services/geminiService';
import { driveService } from './services/driveService';
import { sheetsService } from './services/sheetsService';
import { calendarService } from './services/calendarService';
import { liveService } from './services/liveService';
import { processImageWithPhotoroom } from './services/imageService';
import { LEILA_AVATAR_URL, LINKED_WORKSPACES, DEPARTMENT_BOTS, getBotIcon, FINANCE_SPREADSHEET_ID } from './constants';
import DepartmentSidebar from './components/DepartmentSidebar';
import ChatMessage from './components/ChatMessage';
import KanbanBoard from './components/KanbanBoard';
import LiveSession from './components/LiveSession';
import IntegrationsPanel from './components/IntegrationsPanel';
import AnalyticsDashboard from './components/AnalyticsDashboard';

const STORAGE_KEYS = {
  MESSAGES: 'leila_os_messages_v2',
  TASKS: 'leila_os_tasks_v2',
  DEPT: 'leila_os_current_dept_v2',
  VIEW: 'leila_os_view_mode_v2',
  INPUT_DRAFT: 'leila_os_input_draft_v2',
  ATTACHMENTS: 'leila_os_attachments_draft_v2',
  PROCESSED_RECEIPTS: 'leila_os_processed_receipts_v1'
};

const App: React.FC = () => {
  // Restore ViewMode
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.VIEW) as ViewMode) || 'chat';
  });

  const [isSaved, setIsSaved] = useState(true);
  const [isDriveLive, setIsDriveLive] = useState(false);
  const [isAiOnline, setIsAiOnline] = useState(false);

  // Restore Department
  const [currentDept, setCurrentDept] = useState<Department>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEPT);
    return (saved as Department) || Department.GENERAL;
  });

  // Restore Messages
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Critical: Failed to restore messages", e);
      }
    }
    return [{
      id: 'welcome-1',
      role: 'assistant',
      content: 'Лейла на связи, Сергей. Чем помогаю?',
      department: Department.GENERAL,
      timestamp: Date.now()
    }];
  });

  // Restore Tasks
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Restore Input Draft
  const [input, setInput] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.INPUT_DRAFT) || '';
  });

  // Restore Attachments Draft
  const [attachments, setAttachments] = useState<Attachment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTACHMENTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [];
  });

  // Restore Processed Receipts
  const [processedReceipts, setProcessedReceipts] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROCESSED_RECEIPTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [isTyping, setIsTyping] = useState(false);
  const [isAccessingDrive, setIsAccessingDrive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Directly in App.tsx so it's impossible to miss
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      driveService.setAccessToken(tokenResponse.access_token);
      const result = await driveService.verifyConnection();
      setIsDriveLive(result.success);
    },
    onError: errorResponse => console.error(errorResponse),
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar.events',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setIsAiOnline(!!process.env.API_KEY);
    // Periodically check if drive access is actually working
    const checkDrive = async () => {
      const status = await driveService.verifyConnection();
      setIsDriveLive(status.success);
    };
    checkDrive();
    const interval = setInterval(checkDrive, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []); // Run once on mount

  const saveToStorage = useCallback((key: string, data: any) => {
    setIsSaved(false);
    try {
      localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
      setTimeout(() => setIsSaved(true), 1000);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Persistence Effects
  useEffect(() => {
    // Strip heavy base64 data only when history gets too large to prevent QuotaExceededError
    let lightweightMessages = messages;
    try {
      const testStr = JSON.stringify(messages);
      if (testStr.length > 3000000) { // arbitrary safe limit for 5MB localStorage
        lightweightMessages = messages.map(msg => {
          if (!msg.attachments || msg.attachments.length === 0) return msg;
          return {
            ...msg,
            attachments: msg.attachments.map(att => ({ ...att, data: '', url: '' })) // clear heavy data
          };
        });
      }
    } catch (e) { }

    saveToStorage(STORAGE_KEYS.MESSAGES, lightweightMessages);
  }, [messages, saveToStorage]);

  useEffect(() => { saveToStorage(STORAGE_KEYS.TASKS, tasks); }, [tasks, saveToStorage]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.DEPT, currentDept); setImgError(false); }, [currentDept, saveToStorage]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.VIEW, viewMode); }, [viewMode, saveToStorage]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.INPUT_DRAFT, input); }, [input, saveToStorage]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PROCESSED_RECEIPTS, processedReceipts); }, [processedReceipts, saveToStorage]);
  useEffect(() => {
    // Draft attachments shouldn't be saved if they are huge either, or at least handled carefully
    // Since draft needs the data to send, we just don't save draft attachments to localStorage anymore to save quota.
    // They will be lost on refresh, but it prevents the complete crash of the app.
    try { localStorage.removeItem(STORAGE_KEYS.ATTACHMENTS); } catch (e) { console.error(e); }
  }, [attachments]);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(() => { if (viewMode === 'chat') scrollToBottom(); }, [messages, isTyping, viewMode]);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1];
          setAttachments(prev => [...prev, {
            name: `voice_message_${Date.now()}.webm`,
            mimeType: 'audio/webm',
            data: base64Data,
            url: reader.result as string
          }]);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Не удалось получить доступ к микрофону.");
    }
  };

  const clearHistory = () => {
    if (confirm("Вы уверены, что хотите полностью стереть историю?")) {
      const resetMsg: Message = { id: Date.now().toString(), role: 'assistant', content: 'Память очищена. Лейла готова к новым поручениям.', department: currentDept, timestamp: Date.now() };
      setMessages([resetMsg]);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          // Extract base64 part
          const base64Data = result.split(',')[1];
          setAttachments(prev => [...prev, {
            name: file.name,
            mimeType: file.type,
            data: base64Data,
            url: result
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (overrideInput?: string, overrideHiddenPrompt?: string) => {
    let textToSend = overrideInput !== undefined ? overrideInput : input;
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }

    const isManualSend = overrideInput === undefined;
    if (!textToSend.trim() && attachments.length === 0) return;
    if (isTyping && isManualSend) return;

    // Capture current attachments locally before clearing state
    const currentAttachments = isManualSend ? [...attachments] : [];

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      department: currentDept,
      timestamp: Date.now(),
      attachments: currentAttachments
    };

    setMessages(prev => [...prev, userMsg]);

    // Clear inputs immediately after send logic starts (only if this is a manual send)
    if (overrideInput === undefined) {
      setInput('');
      setAttachments([]);
    }

    setIsTyping(true);
    let promptForModel = overrideHiddenPrompt || textToSend;
    const executeBotRequest = async (
      promptText: string,
      attachs: any[],
      hist: any[],
      dept: Department,
      isSubTask = false
    ): Promise<string> => {
      let response = await geminiService.sendMessage(promptText, attachs, hist, dept, processedReceipts);
      let toolResponses: any[] = [];

      if (response.functionCalls && response.functionCalls.length > 0) {
        setIsAccessingDrive(true);
        for (const fc of response.functionCalls) {
          let result: any = null;

          if (fc.name === 'list_drive_files') {
            const query = ((fc.args?.query as string) || promptText).toLowerCase();
            result = await driveService.listFiles(query, dept);
          } else if (fc.name === 'create_drive_file') {
            const base64Data = attachs.length > 0 ? attachs[0].data : undefined;
            result = await driveService.createFile(fc.args.name as string, fc.args.mimeType as string || 'image/jpeg', base64Data);
          } else if (fc.name === 'insert_into_sheet') {
            const receipt_num = fc.args.receipt_number || '';
            const supplier = fc.args.supplier || '';
            if (receipt_num && supplier) {
              const uniqueKey = `${receipt_num}_${supplier} `;
              setProcessedReceipts(prev => [...new Set([...prev, uniqueKey])]);
            }
            const timestamp = new Date().toLocaleString('ru-RU');
            const rowValues = [
              timestamp, receipt_num, fc.args.file_name || 'Распознано',
              supplier, fc.args.product_name || '', fc.args.quantity || 1,
              fc.args.price || fc.args.cost || 0, fc.args.cost || 0,
              fc.args.margin || '', fc.args.date || timestamp.split(',')[0],
              fc.args.category || '', fc.args.notes || ''
            ];
            result = await sheetsService.appendRow(FINANCE_SPREADSHEET_ID, rowValues, 'parsed_data!A1');
          } else if (fc.name === 'create_task') {
            const newTask = {
              id: Math.random().toString(),
              title: fc.args.title as string,
              status: (fc.args.status as string) || 'todo',
              department: (fc.args.department as string) || dept,
              createdAt: Date.now()
            };
            setTasks(prev => [newTask, ...prev]);
            result = { status: 'success', message: `Task "${newTask.title}" created successfully.` };
          } else if (fc.name === 'list_calendar_events') {
            result = await calendarService.getUpcomingEvents(fc.args.timeMin as string, fc.args.timeMax as string);
          } else if (fc.name === 'create_calendar_event') {
            result = await calendarService.createEvent(fc.args.summary as string, fc.args.date as string, (fc.args.description as string) || '');
          } else if (fc.name === 'delegate_task') {
            const targetAgent = (fc.args.target_agent || Department.FINANCE) as Department;
            const desc = fc.args.task_description as string;

            setMessages(prev => [...prev, {
              id: Date.now().toString() + Math.random(),
              role: 'system',
              content: `🔄 ** Оркестратор делегирует задачу отделу ${targetAgent.toUpperCase()}**: \n * ${desc}* `,
              department: Department.GENERAL,
              timestamp: Date.now()
            }]);

            // Execute sub-request (with empty history so it focuses purely on the delegated task)
            const subResultText = await executeBotRequest(desc, attachs, [], targetAgent, true);
            result = { status: 'success', sub_agent_report: subResultText };
          } else if (fc.name === 'process_product_image') {
            const index = fc.args.image_index as number;
            const customPrompt = fc.args.prompt as string | undefined;
            if (attachs && attachs[index]) {
              try {
                const processedBase64 = await processImageWithPhotoroom(attachs[index].data, customPrompt);
                // Return a success message back to Gemini WITHOUT the heavy base64 string to avoid hitting the 1M token limit
                result = { status: 'success', message: 'Обработка завершена: белый студийный фон, тени, AI-ретушь. Картинка добавлена в чат.' };

                // Add the processed image directly to the chat as a system message
                setMessages(prev => [...prev, {
                  id: Date.now().toString() + Math.random(),
                  role: 'assistant',
                  content: `🔮 ** LensPerfect AI ** обработал фотографию: `,
                  department: Department.WIX,
                  timestamp: Date.now(),
                  attachments: [{ name: 'lensperfect_result.jpg', mimeType: 'image/jpeg', url: `data:image/jpeg;base64,${processedBase64}`, data: processedBase64 }]
                }]);
              } catch (err: any) {
                result = { status: 'error', message: `Ошибка API: ${err.message} ` };
              }
            } else {
              result = { status: 'error', message: 'Изображение с указанным индексом не найдено во вложениях.' };
            }
          }

          toolResponses.push({ functionResponse: { name: fc.name, id: fc.id, response: { result } } });
        }

        const finalResponse = await geminiService.sendToolResponse(
          [...hist, { role: 'user', parts: [{ text: promptText }] }, { role: 'model', parts: response.candidates?.[0]?.content?.parts || [] }],
          toolResponses,
          dept
        );
        response = finalResponse;
      }

      let responseText = '';
      try { responseText = response.text; } catch (e) { }

      if (!responseText && toolResponses.length > 0) {
        const insertSheetCalls = toolResponses.filter(t => t.functionResponse.name === 'insert_into_sheet');
        if (insertSheetCalls.length > 0) {
          const successCount = insertSheetCalls.filter(t => t.functionResponse.response.result?.status === 'success').length;
          const failCount = insertSheetCalls.length - successCount;
          responseText = successCount > 0 && failCount === 0 ? `✅ Успешно обработано и добавлено в Таблицу: ** ${successCount}** шт.` : `⚠️ Успешно: ${successCount}.Ошибок: ${failCount}.`;
        } else {
          const lastTool = toolResponses[toolResponses.length - 1];
          if (lastTool.functionResponse.name === 'list_drive_files') {
            const files = lastTool.functionResponse.response.result?.files;
            responseText = files?.length > 0 ? `📂 Найдено файлов: \n` + files.map((f: any) => `${f.name} `).join('\n') : "📂 Файлы не найдены.";
          } else if (lastTool.functionResponse.name === 'delegate_task') {
            responseText = `✅ Субагент завершил работу: \n${lastTool.functionResponse.response.result?.sub_agent_report} `;
          } else {
            responseText = "✅ Ограниченная команда выполнена.";
          }
        }
      }

      return responseText || 'Команда выполнена успешно.';
    };

    try {
      let history = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      })).slice(-20);

      const finalResponseText = await executeBotRequest(promptForModel, currentAttachments, history, Department.GENERAL);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalResponseText,
        department: Department.GENERAL,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Ошибка: ${err?.message || 'Неизвестный сбой (см. консоль)'} `, department: Department.GENERAL, timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
      setIsAccessingDrive(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const processLiveSessionLog = (log: string) => {
    setViewMode('chat');
    const meetingText = log.trim();

    // Always report back to the user to prove the function triggered
    if (!meetingText) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: `* (Система: Голосовой сеанс завершен.Лог стенограммы оказался пуст.Либо вы молчали, либо браузер не расслышал команду).* `,
        department: currentDept,
        timestamp: Date.now()
      }]);
      return;
    }

    const uiMessage = `* (Система: Обработка стенограммы аудиозвонка...)*\n\n ** Записанный лог звонка:**\n${meetingText} `;
    const hiddenPrompt = `Анализ только что завершенного голосового звонка(Live Session): \n\n${meetingText} \n\nИнструкция: Проанализируй эту стенограмму разговора.Выполни ВСЕ функции(создай задачи, сохрани события), которые ты пообещала сделать во время звонка.В чат выдай краткое резюме того, что было сохранено по итогам звонка.ОТВЕЧАЙ СТРОГО НА РУССКОМ ЯЗЫКЕ.Если ничего сохранять не нужно было, просто скажи "Голосовой сеанс завершен без создания новых записей."`;

    handleSend(uiMessage, hiddenPrompt);
  };

  const currentBot = DEPARTMENT_BOTS.find(b => b.id === currentDept);

  const renderViewContent = () => {
    switch (viewMode) {
      case 'integrations': return <IntegrationsPanel />;
      case 'analytics': return <AnalyticsDashboard />;
      case 'tasks': return <KanbanBoard tasks={tasks} department={currentDept} onUpdateTask={(id, u) => setTasks(t => t.map(x => x.id === id ? { ...x, ...u } : x))} onAddTask={(t) => setTasks(prev => [{ ...t, id: Math.random().toString(), createdAt: Date.now() }, ...prev])} />;
      default: return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scroll">
            <div className="max-w-3xl mx-auto">
              {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
              {(isTyping || isAccessingDrive) && (
                <div className="flex gap-4 items-center text-neutral-500 animate-pulse ml-1 mb-10">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-indigo-500/30 shadow-lg shadow-indigo-500/10 bg-neutral-900 flex items-center justify-center relative">
                    {currentBot?.avatarUrl && !imgError ? (
                      <img
                        src={currentBot.avatarUrl}
                        alt={currentBot.name}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${currentBot?.color || 'bg-neutral-800'} text-white`}>
                        {getBotIcon(currentDept, 24)}
                      </div>
                    )}
                    {/* Small badge to indicate which bot is active */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border border-black rounded-full" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{currentBot?.name || 'Assistant'} Node</span>
                    <span className="text-xs font-bold text-neutral-300">
                      {isAccessingDrive ? (<span className="flex items-center gap-2"><HardDrive size={12} className="animate-spin" /> Подключение к API...</span>) : `${currentBot?.name.split(' ')[0] || 'Бот'} печатает...`}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="p-4 md:p-8 pt-0 z-10 shrink-0">
            <div className="max-w-3xl mx-auto relative">
              {/* Attachment Previews */}
              {attachments.length > 0 && (
                <div className="flex gap-3 mb-3 overflow-x-auto py-2 px-1 scrollbar-hide">
                  {attachments.map((att, index) => (
                    <div key={index} className="relative group/item shrink-0 w-16 h-16 rounded-xl border border-white/20 overflow-hidden bg-neutral-900 shadow-lg">
                      {att.mimeType?.startsWith('image/') ? (
                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-800">
                          <FileIcon size={20} />
                          <span className="text-[8px] mt-1 max-w-[90%] truncate px-1">{att.name}</span>
                        </div>
                      )}
                      <button
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all text-white"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRecording ? 'Запись аудио... Отпустите или нажмите отправить.' : `Ваше поручение для Лейлы(Ctrl + Enter)...`}
                  className={`w-full bg-neutral-900/40 border transition-all duration-300 rounded-[2rem] py-5 pl-8 pr-44 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none glass border-white/10 ${isRecording ? 'ring-2 ring-red-500/50' : ''}`}
                  style={{ maxHeight: '200px', minHeight: '68px' }}
                />

                <div className="absolute right-4 bottom-3.5 flex items-center gap-3">
                  {currentDept === Department.FINANCE && (
                    <button
                      onClick={() => {
                        setInput(prev => prev + (prev ? ' ' : '') + 'Пожалуйста, распознай прикрепленные чеки (возможно, их несколько). ВАЖНО: Разбей их ПОСТРОЧНО ПО ТОВАРАМ! Извлеки каждую позицию по отдельности (каждый вкус, вид, количество, цену), чтобы я мог вести точную аналитику. Вызови функцию записи в таблицу для КАЖДОГО товара отдельной строкой.');
                        fileInputRef.current?.click();
                      }}
                      className="px-3 h-10 rounded-full flex items-center justify-center transition-all bg-emerald-500/20 text-emerald-400 hover:text-white hover:bg-emerald-500/40 active:scale-95 border border-emerald-500/30 text-xs font-medium"
                      title="OCR Пакет чеков"
                    >
                      OCR Чеки
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={handleFileSelect}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-700 hover:scale-105 active:scale-95 border border-white/5"
                    title="Прикрепить файл"
                  >
                    <Paperclip size={18} />
                  </button>
                  <button
                    onClick={toggleRecording}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border border-white/5 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-700 hover:scale-105 active:scale-95'}`}
                    title={isRecording ? "Остановить запись" : "Голосовой ввод (Голосовое сообщение)"}
                  >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  <button
                    onClick={() => handleSend()}
                    disabled={(!input.trim() && attachments.length === 0) || isTyping}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${(input.trim() || attachments.length > 0) && !isTyping ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
              <div className="flex justify-center mt-2">
                <p className="text-[9px] text-neutral-600 uppercase font-black tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck size={10} className="text-emerald-500" /> Secure Admin Session • Beersheba Node
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const liveContextPayload = `
ТЕКУЩИЙ СПИСОК ЗАДАЧ СЕРГЕЯ В СИСТЕМЕ:
${tasks.length === 0 ? 'Задач пока нет.' : tasks.map(t => `- [${t.status}] ${t.title}`).join('\n')}
`.trim();

  return (
    <div className="flex h-screen bg-[#050505] text-neutral-200 overflow-hidden relative font-inter">
      {viewMode === 'live' && <LiveSession onExit={processLiveSessionLog} contextPayload={liveContextPayload} />}

      <button onClick={() => setIsSidebarOpen(true)} className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 w-12 h-24 bg-neutral-900/90 border-r border-y border-white/10 rounded-r-3xl flex flex-col items-center justify-center gap-3 transition-all hover:w-16 hover:bg-neutral-800 group ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 shadow-[10px_0_30px_rgba(0,0,0,0.5)]'}`}>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500/50 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20 bg-neutral-900 flex items-center justify-center">
          {/* Show Leila's avatar in the menu button by default, or fallback to User icon */}
          <img
            src={LEILA_AVATAR_URL}
            alt="Menu"
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <User size={16} className="text-indigo-400 absolute" style={{ display: 'none' }} />
        </div>
        <ChevronLeft size={16} className="text-neutral-500 group-hover:text-white rotate-180 transition-transform" />
      </button>

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-[25px_0_60px_rgba(0,0,0,0.7)]`}>
        <DepartmentSidebar currentDept={currentDept} viewMode={viewMode} onSelectDept={(d) => { setCurrentDept(d); setIsSidebarOpen(false); if (viewMode !== 'chat' && viewMode !== 'tasks') setViewMode('chat'); }} onSelectView={(v) => { setViewMode(v); setIsSidebarOpen(false); }} onClearHistory={clearHistory} />
        <button onClick={() => setIsSidebarOpen(false)} className="absolute top-1/2 -right-6 -translate-y-1/2 w-6 h-20 bg-neutral-900 border-r border-y border-white/10 rounded-r-xl text-neutral-500 hover:text-white flex items-center justify-center transition-all"><ChevronLeft size={20} /></button>
      </aside>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-md z-40" />}

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 flex items-center justify-between px-8 z-20 shrink-0 bg-gradient-to-b from-[#050505] to-transparent">
          <div className="flex items-center gap-6">
            {/* Dynamic Status Header */}
            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                <Cpu size={12} className={isAiOnline ? 'text-indigo-400' : 'text-neutral-600'} />
                <span className={`text-[9px] font-black uppercase tracking-tighter ${isAiOnline ? 'text-white' : 'text-neutral-500'}`}>AI CORE: {isAiOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive size={12} className={isDriveLive ? 'text-emerald-400' : 'text-neutral-600'} />
                <span className={`text-[9px] font-black uppercase tracking-tighter ${isDriveLive ? 'text-emerald-400' : 'text-neutral-500'}`}>DRIVE: {isDriveLive ? 'LIVE' : 'SIMULATION'}</span>
                {!isDriveLive && (
                  <button onClick={() => loginWithGoogle()} className="ml-2 bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-md hover:bg-indigo-500 transition-all font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(79,70,229,0.4)]">
                    <ShieldCheck size={10} /> ВОЙТИ
                  </button>
                )}
              </div>
            </div>
            <div className="flex bg-neutral-900/50 p-1 rounded-xl border border-white/5 backdrop-blur-md">
              <button onClick={() => setViewMode('chat')} className={`p-2 rounded-lg transition-all ${viewMode === 'chat' ? 'bg-indigo-600 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300'}`}><MessageSquare size={16} /></button>
              <button onClick={() => setViewMode('tasks')} className={`p-2 rounded-lg transition-all ${viewMode === 'tasks' ? 'bg-indigo-600 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300'}`}><Kanban size={16} /></button>
              <button onClick={() => setViewMode('analytics')} className={`p-2 rounded-lg transition-all ${viewMode === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300'}`}><LayoutDashboard size={16} /></button>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2"><Clock size={14} /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST</span>
            </div>
          </div>
        </header>
        <div className="flex-1 flex flex-col min-h-0">{renderViewContent()}</div>
      </main>
    </div>
  );
};

export default App;
