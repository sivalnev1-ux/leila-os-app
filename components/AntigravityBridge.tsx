import React, { useState, useEffect } from 'react';
import { driveService } from '../services/driveService';
import { Volume2, VolumeX, ShieldAlert, Wifi, WifiOff } from 'lucide-react';

const BRIDGE_FILE = 'antigravity_bridge.json';

const AntigravityBridge: React.FC = () => {
  const [lastText, setLastText] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Ожидание активации...');

  useEffect(() => {
    let interval: any;
    if (isActive) {
      setStatus('Портал активен. Слушаю Антигравити...');
      interval = setInterval(checkForNewMessages, 3000);
    } else {
      setStatus('Портал выключен.');
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const checkForNewMessages = async () => {
    try {
      // 🕵️ Прямое чтение из публичной папки проекта БЕЗ ЛОГИНА
      const response = await fetch('/antigravity_bridge.json?t=' + Date.now()); // t=... for cache-busting
      if (response.ok) {
        setIsConnected(true);
        const data = await response.json();
        
        if (data.text && data.text !== lastText) {
          setLastText(data.text);
          speak(data.text);
        }
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      console.error('Bridge Error:', err);
      setIsConnected(false);
    }
  };

  const speak = (text: string) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.0;
    synth.speak(utterance);
  };

  return (
    <div className="flex flex-col items-center justify-center min-vh-100 bg-[#050505] text-white p-6 font-inter">
      <div className="relative w-48 h-48 mb-12">
        <div className={`absolute inset-0 rounded-full bg-indigo-600/20 blur-3xl animate-pulse ${isActive ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`w-full h-full rounded-full border-2 flex items-center justify-center transition-all duration-700 ${isActive ? 'border-indigo-500 shadow-[0_0_50px_rgba(79,70,229,0.5)] rotate-180' : 'border-white/10'}`}>
          {isActive ? <Volume2 size={64} className="text-indigo-400" /> : <VolumeX size={64} className="text-neutral-700" />}
        </div>
        {isConnected && <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#050505] animate-ping" />}
      </div>

      <h1 className="text-2xl font-black uppercase tracking-[0.3em] mb-2">Cyber Portal</h1>
      <p className="text-neutral-500 text-xs mb-12 uppercase tracking-widest flex items-center gap-2">
        {isConnected ? <Wifi size={12} className="text-emerald-500" /> : <WifiOff size={12} className="text-red-500" />}
        {status}
      </p>

      <button
        onClick={() => {
            setIsActive(!isActive);
            if (!isActive) {
                // Пытаемся разблокировать звук на мобиле
                const silent = new SpeechSynthesisUtterance('');
                window.speechSynthesis.speak(silent);
            }
        }}
        className={`w-full max-w-xs py-5 rounded-2xl font-bold transition-all active:scale-95 ${isActive ? 'bg-red-500/10 border border-red-500/50 text-red-500' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'}`}
      >
        {isActive ? 'ДЕАКТИВИРОВАТЬ ПОРТАЛ' : 'АКТИВИРОВАТЬ ПОРТАЛ'}
      </button>

      {lastText && (
        <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10 max-w-sm w-full">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-2 block">Последнее сообщение:</span>
          <p className="text-sm text-neutral-300 italic">"{lastText}"</p>
        </div>
      )}

      <div className="mt-auto pt-12">
        <p className="text-[10px] text-neutral-700 uppercase font-black tracking-widest flex items-center gap-2">
           <ShieldAlert size={10} /> Antigravity Bridge Protocol • v1.0
        </p>
      </div>
    </div>
  );
};

export default AntigravityBridge;
