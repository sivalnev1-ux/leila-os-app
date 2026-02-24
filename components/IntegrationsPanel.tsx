
import React, { useState, useEffect } from 'react';
import { Mail, Calendar, HardDrive, Image as ImageIcon, CheckCircle, RefreshCcw, ShieldCheck, Globe, Clock, Edit3, FolderOpen, ExternalLink, Database, Terminal, AlertTriangle, Key, Activity, User as UserIcon, HelpCircle, ArrowRight, Copy, ChevronDown, ChevronRight, Link, LogOut } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { LINKED_WORKSPACES } from '../constants';
import { driveService } from '../services/driveService';

const IntegrationsPanel: React.FC = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success?: boolean, message?: string, user?: string } | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    setApiKeyStatus(!!process.env.API_KEY);
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsVerifying(true);
    // Even if no local token, verify() will return a clean "Token not set" message we can use
    const result = await driveService.verifyConnection();
    setVerificationResult(result);
    if (result.success) {
      setActiveStep(2); // Done
    } else {
      setActiveStep(1);
    }
    setIsVerifying(false);
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsVerifying(true);
      // We receive tokenResponse.access_token
      driveService.setAccessToken(tokenResponse.access_token);

      const result = await driveService.verifyConnection();
      setVerificationResult(result);
      setIsVerifying(false);

      if (result.success) {
        setActiveStep(2);
      }
    },
    onError: errorResponse => {
      console.error(errorResponse);
      setVerificationResult({ success: false, message: "Ошибка авторизации Google" });
    },
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets',
  });

  const handleDisconnect = () => {
    driveService.disconnect();
    setVerificationResult(null);
    setActiveStep(1);
  };

  const isConnected = verificationResult?.success;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-3">
          Центр Интеграций
          <div className={`px-2 py-1 rounded border text-[10px] uppercase tracking-tighter ${isConnected ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/20 border-amber-500/30 text-amber-400'}`}>
            {isConnected ? 'System Normal' : 'Setup Required'}
          </div>
        </h2>
        <p className="text-xs md:text-sm text-neutral-500">Мастер настройки доступа к Google Диску и Таблицам.</p>
      </div>

      <div className="flex flex-col gap-6 max-w-2xl">

        {/* Status Card */}
        <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className={isConnected ? "text-emerald-400" : "text-amber-400"} />
              Статус Подключения
            </h3>
            {isConnected && (
              <button onClick={handleDisconnect} className="text-[10px] text-neutral-500 hover:text-white underline flex items-center gap-1">
                <LogOut size={10} /> Сбросить токен
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="text-[10px] text-neutral-500 font-bold uppercase mb-1">AI Core</div>
              <div className="flex items-center gap-2 text-xs font-medium text-white">
                <div className={`w-2 h-2 rounded-full ${apiKeyStatus ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {apiKeyStatus ? 'Online' : 'Offline'}
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Drive Link</div>
              <div className="flex items-center gap-2 text-xs font-medium text-white">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                {isConnected ? verificationResult?.user || 'Active' : 'Not Connected'}
              </div>
            </div>
          </div>

          {!isConnected && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                {verificationResult?.message || "Требуется авторизация. Выполните шаги ниже."}
              </p>
            </div>
          )}
        </div>

        {/* Wizard Steps - Only show if not connected */}
        {!isConnected && (
          <div className="space-y-6">
            {/* Step 1 */}
            <div className={`relative pl-8 transition-all duration-300 ${activeStep === 1 ? 'opacity-100' : 'opacity-50'}`}>
              <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10" />
              <div className={`absolute left-[-12px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 z-10 ${activeStep === 1 ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-neutral-900 border-white/10 text-neutral-500'}`}>1</div>

              <h3 className="text-sm font-bold text-white mb-2">Авторизация Google Аккаунта</h3>
              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                Layla OS нужен доступ к вашему Google Диску и Таблицам для работы с файлами и финансами. Нажмите кнопку ниже для безопасного входа.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => loginWithGoogle()}
                  disabled={isVerifying}
                  className={`w-full p-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${isVerifying ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  {isVerifying ? <RefreshCcw size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                  Войти через Google
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connected View */}
        {isConnected && (
          <div className="mt-4 p-6 glass border border-emerald-500/20 bg-emerald-500/5 rounded-3xl text-center animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Лейла подключена!</h3>
            <p className="text-sm text-neutral-400 max-w-xs mx-auto mb-6">
              Доступ к Google Аккаунту "{verificationResult?.user}" активен. Теперь вы можете просить Лейлу искать документы, а также Финансовый Бот сможет записывать расходы в Таблицы.
            </p>
            <div className="flex gap-2 justify-center">
              {LINKED_WORKSPACES.map(ws => (
                <a key={ws.id} href={`https://drive.google.com/drive/folders/${ws.id}`} target="_blank" className="p-3 bg-neutral-900/50 hover:bg-neutral-800 rounded-xl border border-white/5 text-neutral-400 hover:text-white transition-all">
                  <FolderOpen size={20} />
                </a>
              ))}
            </div>

            <button
              onClick={handleDisconnect}
              className="mt-6 text-xs text-red-400 hover:text-red-300 underline"
            >
              Отключить и удалить токен
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationsPanel;
