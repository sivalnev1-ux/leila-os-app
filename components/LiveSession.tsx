
import React, { useEffect, useRef, useState } from 'react';
import { liveService } from '../services/liveService';
import { geminiService } from '../services/geminiService';
import { Mic, MicOff, PhoneOff, Sparkles, Brain, Volume2, VolumeX, Activity, User, Ear } from 'lucide-react';
import { LEILA_AVATAR_URL } from '../constants';

const LiveSession: React.FC<{ onExit: (log: string) => void, contextPayload?: string }> = ({ onExit, contextPayload }) => {
  const [isActive, setIsActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerphone, setIsSpeakerphone] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [botAudioLevel, setBotAudioLevel] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [isListeningMode, setIsListeningMode] = useState(false);

  const [meetingLog, setMeetingLog] = useState('');
  const meetingLogRef = useRef('');

  const streamRef = useRef<MediaStream | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const speakingTimeoutRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const isActiveRef = useRef(false);

  useEffect(() => {
    startSession();
    return () => stopSession();
  }, []);

  const toggleSpeakerphone = async () => {
    if (!audioPlayerRef.current) return;
    try {
      // Not all browsers support setSinkId (like iOS Safari), we wrap in try-catch
      if ('setSinkId' in audioPlayerRef.current) {
        // Attempting to route to default speaker (empty string usually resets to default system route)
        // Advanced logic would require enumerating devices via navigator.mediaDevices.enumerateDevices()
        // For standard Android/Chrome, just calling it without specific ID might toggle output types or we need specific ID
        // Often, 'speaker' is not directly a deviceId. We just toggle the state for UI and hope standard WebRTC routing 
        // respects the HTMLAudioElement vs earpiece context.
        // Actually, forcing output to an Audio Element often bypasses the WebRTC earpiece lock on Chrome Android.

        // This is a UI toggle + basic sink attempt
        const newMode = !isSpeakerphone;
        setIsSpeakerphone(newMode);

        // If we had a specific device list we would call (audioPlayerRef.current as any).setSinkId(deviceId);
      } else {
        setIsSpeakerphone(!isSpeakerphone); // Just toggle UI if API unsupported
      }
    } catch (e) {
      console.warn("Speakerphone toggle error:", e);
      setIsSpeakerphone(!isSpeakerphone);
    }
  };

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const orchestratorConfig = geminiService.getOrchestratorConfig();

      await liveService.connect({
        systemContext: contextPayload,
        systemInstruction: orchestratorConfig.systemInstruction,
        tools: orchestratorConfig.tools,
        onMessage: (text) => {
          if (text.trim()) {
            meetingLogRef.current += `\nЛейла: ${text.trim()}`;
            setMeetingLog(meetingLogRef.current);
            setTranscription(prev => (prev + ' ' + text).slice(-120));
          }
          setIsBotSpeaking(true);
          setIsThinking(false);

          if (speakingTimeoutRef.current) window.clearTimeout(speakingTimeoutRef.current);
          speakingTimeoutRef.current = window.setTimeout(() => {
            setIsBotSpeaking(false);
            setBotAudioLevel(0);
          }, 1200);
        },
        onAudioData: (level) => {
          setBotAudioLevel(level);
        },
        onError: (err) => console.error("Live Service Error:", err),
      });

      // Hook up the liveService audio stream to our hidden audio element
      const botStream = liveService.getAudioStream();
      if (botStream && audioPlayerRef.current) {
        audioPlayerRef.current.srcObject = botStream;
      }

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!audioContextRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = average / 128;
        setAudioLevel(normalized);

        if (normalized > 0.2) {
          setIsThinking(false);
        }

        requestAnimationFrame(updateLevel);
      };

      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        if (isMicOn) {
          liveService.sendAudio(inputData);
          if (Math.max(...inputData) > 0.1 && !isBotSpeaking) {
            setIsThinking(true);
          }
        }
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      setIsActive(true);
      isActiveRef.current = true;
      updateLevel();

      // Start capturing user speech for the meeting log
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ru-RU';
        recognition.interimResults = false;
        recognition.continuous = true;

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            meetingLogRef.current += `\nСергей: ${currentTranscript.trim()}`;
            setMeetingLog(meetingLogRef.current);
          }
        };

        // Auto-restart if we are still active
        recognition.onend = () => {
          if (isActiveRef.current) {
            try { recognition.start(); } catch (e) { }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

    } catch (err) {
      console.error("Failed to start live session:", err);
    }
  };

  const stopSession = () => {
    isActiveRef.current = false;
    liveService.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (speakingTimeoutRef.current) window.clearTimeout(speakingTimeoutRef.current);
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) { }
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }
    setIsActive(false);
  };

  const toggleListeningMode = () => {
    const newMode = !isListeningMode;
    setIsListeningMode(newMode);

    // Hard mute the local audio playback so we don't hear any acknowledgements
    liveService.setMuted(newMode);

    // Clear transcription to show the system status
    setTranscription('');

    if (newMode) {
      liveService.sendSystemCommand("[СИСТЕМНОЕ СООБЩЕНИЕ ВАЖНО]: ПЕРЕВОЖУ ТЕБЯ В РЕЖИМ ФОНОВОГО ПРОСЛУШИВАНИЯ СОВЕЩАНИЯ. Твоя задача: слушать разговор, запоминать все факты, конспектировать даты, имена и договоренности. КРИТИЧЕСКОЕ ПРАВИЛО: Тебе ЗАПРЕЩЕНО давать нам советы, комментировать или писать длинные предложения, пока этот режим включен. На каждую нашу реплику или блок информации отвечай мне ТОЛЬКО ОДНИМ СЛОВОМ: «Пишу» (я выключил динамик, поэтому не услышу тебя). Продолжай конспектировать в уме.");
    } else {
      liveService.sendSystemCommand("[СИСТЕМНОЕ СООБЩЕНИЕ ВАЖНО]: Совещание окончено, РЕЖИМ СЛУШАТЕЛЯ ВЫКЛЮЧЕН. Выйди на связь голосом, подробно и профессионально резюмируй всё, что ты законспектировала за время встречи, и спроси, куда это сохранить.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#020205] flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-700 font-inter">

      <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${isBotSpeaking ? 'opacity-30 scale-110' : isThinking ? 'opacity-20 scale-100' : 'opacity-10 scale-90'
        }`}
        style={{
          background: isBotSpeaking
            ? 'radial-gradient(circle at center, #6366f1 0%, transparent 70%)'
            : isThinking
              ? 'radial-gradient(circle at center, #a855f7 0%, transparent 70%)'
              : 'radial-gradient(circle at center, #3b82f6 0%, transparent 70%)'
        }} />

      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />

      <div className="absolute top-10 left-10 flex items-center gap-4 animate-in slide-in-from-left-4 duration-1000">
        <div className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl">
          <Activity size={20} className="text-indigo-400 animate-pulse" />
        </div>
        <div>
          <h2 className="text-white font-black uppercase tracking-[0.3em] text-[10px]">Leila Adjutant Mode</h2>
          <p className="text-neutral-500 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${isListeningMode ? 'bg-amber-500 text-amber-500' : 'bg-emerald-500 text-emerald-500'}`} />
            {isListeningMode ? 'Background Listening' : 'Direct Neural Link Active'}
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full max-w-4xl p-6">

        <div className="relative group">
          <div className={`absolute -inset-20 border border-indigo-500/20 rounded-full transition-all duration-1000 ${isBotSpeaking || isThinking ? 'scale-110 opacity-100' : 'scale-90 opacity-0'
            }`}>
            <div className="absolute inset-0 border-t-2 border-indigo-500/40 rounded-full animate-[spin_10s_linear_infinite]" />
          </div>

          <div className={`absolute -inset-10 border border-white/5 rounded-full transition-all duration-1000 ${isBotSpeaking ? 'scale-105 opacity-100' : 'scale-95 opacity-0'
            }`}>
            <div className="absolute inset-0 border-b-2 border-white/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
          </div>

          <div className={`relative w-72 h-72 md:w-[420px] md:h-[420px] rounded-full border-2 transition-all duration-700 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] animate-[breathing_6s_ease-in-out_infinite] ${isBotSpeaking ? 'border-indigo-500/50 scale-105' : isThinking ? 'border-purple-500/50' : 'border-white/5'
            }`}>
            {!imgError ? (
              <img
                src={LEILA_AVATAR_URL}
                alt="Leila"
                onError={() => setImgError(true)}
                className={`w-full h-full object-cover object-top transition-all duration-1000 ease-out ${isBotSpeaking ? 'scale-110 brightness-110' : isThinking ? 'scale-105 brightness-100' : 'scale-100 brightness-75 grayscale-[20%]'
                  }`}
              />
            ) : (
              <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                <User size={120} className="text-neutral-700" />
              </div>
            )}

            {isBotSpeaking && (
              <div
                className="absolute bottom-[36%] left-1/2 -translate-x-1/2 w-20 h-8 bg-indigo-500/20 blur-xl rounded-full transition-transform duration-75"
                style={{ transform: `translateX(-50%) scaleY(${1.5 + botAudioLevel * 5})` }}
              />
            )}

            {isThinking && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent h-20 w-full animate-[scan_2s_linear_infinite] pointer-events-none" />
            )}

            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/5" />
          </div>

          <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-8 py-3 rounded-full border transition-all duration-500 shadow-2xl backdrop-blur-2xl ${isBotSpeaking ? 'bg-indigo-600 border-indigo-400 text-white' : isThinking ? 'bg-purple-600 border-purple-400 text-white' : isListeningMode ? 'bg-amber-600/20 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/10 text-neutral-400'
            }`}>
            {isThinking ? <Brain size={18} className="animate-pulse" /> : <Sparkles size={18} className={isBotSpeaking ? 'animate-spin-slow' : ''} />}
            <span className="text-[12px] font-black uppercase tracking-[0.25em]">
              {isBotSpeaking ? 'Leila Speaking' : isThinking ? 'Processing...' : isListeningMode ? 'Note-Taking' : 'Listening'}
            </span>
          </div>
        </div>

        <div className="mt-28 w-full max-w-2xl flex flex-col items-center gap-10">
          <div className="flex items-center gap-2 h-10">
            {[...Array(32)].map((_, i) => {
              const h = isActive ? (isBotSpeaking ? 4 : audioLevel * 80 * (0.4 + Math.random() * 0.6)) : 4;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-100 ${isBotSpeaking ? 'bg-neutral-800' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]'}`}
                  style={{ height: `${Math.max(4, h)}px` }}
                />
              );
            })}
          </div>

          <div className="w-full relative">
            <div className={`absolute -inset-1 blur-md rounded-3xl transition-colors duration-1000 ${isListeningMode ? 'bg-gradient-to-r from-transparent via-amber-500/10 to-transparent' : 'bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent'}`} />
            <div className="relative bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-3xl p-8 w-full text-center shadow-2xl">
              <p className={`text-xl font-medium italic min-h-[1.5em] leading-relaxed tracking-wide transition-colors duration-500 ${isListeningMode ? 'text-amber-200' : 'text-neutral-200'}`}>
                {transcription || (isListeningMode ? "Режим диктофона. Конспектирую встречу..." : "Готова к вашим поручениям, Сергей.")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 flex items-center gap-6 md:gap-12">
          {/* Speakerphone Toggle */}
          <button
            onClick={toggleSpeakerphone}
            className={`p-5 md:p-7 rounded-3xl transition-all border shadow-2xl hover:scale-110 active:scale-95 group relative ${isSpeakerphone ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/10 text-neutral-400'}`}
          >
            <Volume2 size={24} className={isSpeakerphone ? '' : 'opacity-50'} />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-neutral-900 rounded text-[9px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {isSpeakerphone ? 'Speakerphone ON' : 'Speakerphone OFF'}
            </div>
          </button>

          {/* Mic Toggle */}
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-5 md:p-7 rounded-3xl transition-all border shadow-2xl hover:scale-110 active:scale-95 group relative ${isMicOn ? 'bg-white/5 border-white/10 text-white' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}
          >
            {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-neutral-900 rounded text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              {isMicOn ? 'Mute' : 'Unmute'}
            </div>
          </button>

          {/* Hang Up Button */}
          <button
            onClick={() => {
              stopSession();
              onExit(meetingLogRef.current.trim());
            }}
            className="p-8 md:p-10 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-[0_20px_60px_rgba(220,38,38,0.4)] hover:scale-110 active:scale-90 transition-all border border-white/20"
          >
            <PhoneOff size={32} />
          </button>

          {/* Background Listening Mode */}
          <button
            onClick={toggleListeningMode}
            className={`p-5 md:p-7 rounded-3xl transition-all border shadow-2xl hover:scale-110 active:scale-95 group relative ${isListeningMode ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-white/5 border-white/10 text-neutral-400'}`}
          >
            <Ear size={24} className={isListeningMode ? 'animate-pulse' : ''} />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-neutral-900 rounded text-[9px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {isListeningMode ? 'Resume Active Mode' : 'Background Listen'}
            </div>
          </button>
        </div>

        {/* Hidden Audio element to route WebAudio stream to physical devices */}
        <audio ref={audioPlayerRef} autoPlay playsInline className="hidden" />
      </div>

      <style>{`
        @keyframes scan {
          from { transform: translateY(-100%); }
          to { transform: translateY(500%); }
        }
        @keyframes breathing {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.02); opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LiveSession;
