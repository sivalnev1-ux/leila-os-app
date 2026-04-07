import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Layers, FileText, ShoppingCart, DollarSign, Activity, X } from 'lucide-react';
import { geminiService } from '../services/omniGeminiService';
import { driveService } from '../services/driveService';
import { wixService } from '../services/wixService';
import { Department } from '../types';

interface VisualResult {
  category: 'PRODUCT' | 'DOCUMENT' | 'PRICE' | 'UNKNOWN';
  name: string;
  data: any;
  confidence: number;
}

export const VisualPortal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('ГОТОВ К СКАНИРОВАНИЮ');
  const [lastResult, setLastResult] = useState<VisualResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setStatus('КАМЕРА АКТИВНА');
    } catch (err) {
      setError('Нет доступа к камере. Убедитесь, что используете HTTPS.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsScanning(true);
    setStatus('ID ОБЪЕКТА...');

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      try {
        const analysis = await geminiService.sendMessage(
          "Identify and classify: product for Wix, business document, or price inquiry.",
          [{ name: 'visual_snapshot.jpg', mimeType: 'image/jpeg', data: base64Image }],
          [],
          Department.GENERAL
        );
        setStatus('АНАЛИЗ ЗАВЕРШЕН');
      } catch (err) {
        setStatus('ОШИБКА АНАЛИЗА');
      }
    }
    setIsScanning(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden font-mono select-none">
      
      {/* 🌌 Top Bar (Safe Area Padding) */}
      <div className="flex items-center justify-between p-4 pt-safe bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <h2 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">LEILA EYES <span className="text-zinc-600">M-NODE</span></h2>
        </div>
        <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-zinc-400 active:scale-90 transition-transform">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 🧿 Визор (Full Height with Safe Insets) */}
      <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className="w-full h-full object-cover opacity-90"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* 💠 Scanner Line */}
        {isScanning && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="w-full h-[3px] bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.8)] animate-scan" />
            <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />
          </div>
        )}

        {/* 💠 Оверлей результатов */}
        {lastResult && (
          <div className="absolute top-6 left-6 p-4 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl max-w-[240px] animate-in fade-in slide-in-from-top-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-2 text-indigo-400">
              {lastResult.category === 'PRODUCT' && <ShoppingCart size={14} />}
              {lastResult.category === 'DOCUMENT' && <FileText size={14} />}
              {lastResult.category === 'PRICE' && <DollarSign size={14} />}
              <span className="text-[10px] font-black uppercase tracking-widest">{lastResult.category}</span>
            </div>
            <h3 className="text-base font-black text-white italic tracking-tighter leading-tight">{lastResult.name}</h3>
          </div>
        )}

        {/* 💠 Статус-бар */}
        <div className="absolute bottom-8 px-5 py-2 bg-black/60 backdrop-blur-xl border border-white/5 rounded-full">
          <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${isScanning ? 'text-indigo-400 animate-pulse' : 'text-zinc-500'}`}>
            {status}
          </span>
        </div>
      </div>

      {/* ⚙️ Mobile Main Controls */}
      <div className="p-8 pb-safe bg-zinc-950 border-t border-white/5 flex items-center justify-between px-12">
        <button className="flex flex-col items-center gap-1.5 text-zinc-600 hover:text-white transition-colors">
          <Layers size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest">AUTO</span>
        </button>

        <button 
          onClick={captureAndAnalyze}
          disabled={isScanning}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isScanning ? 'bg-zinc-800 scale-90 opacity-50' : 'bg-white hover:scale-105 active:scale-90 shadow-[0_0_40px_rgba(255,255,255,0.15)] ring-4 ring-white/10'
          }`}
        >
          <Camera className={`w-8 h-8 ${isScanning ? 'text-zinc-600' : 'text-black'}`} />
          {!isScanning && <div className="absolute -inset-2 border-2 border-dashed border-white/20 rounded-full animate-spin-[20s]" />}
        </button>

        <button className="flex flex-col items-center gap-1.5 text-zinc-600 hover:text-white transition-colors">
          <RefreshCw size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest">SWITCH</span>
        </button>
      </div>
    </div>
  );
};
