import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export class LiveService {
  private sessionPromise: any = null;
  private audioContext: AudioContext | null = null;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private onAudioLevelChange: ((level: number) => void) | null = null;
  private isMuted = false;

  getAudioStream(): MediaStream | null { return this.audioDestination?.stream || null; }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) this.stopAllAudio();
  }

  async connect(callbacks: {
    systemContext?: string;
    systemInstruction?: string;
    tools?: any[];
    onMessage?: (text: string) => void;
    onAudioData?: (level: number) => void;
    onClose?: () => void;
    onError?: (err: any) => void;
  }) {
    if (typeof window === 'undefined') return;
    if (this.audioContext) try { await this.audioContext.close(); } catch (e) { }
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.onAudioLevelChange = callbacks.onAudioData || null;

    try {
        const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        this.sessionPromise = (model as any).connect({
            config: {
                modalities: [Modality.AUDIO],
                systemInstruction: `${callbacks.systemInstruction || "Ты — Лейла, профессиональный личный ИИ-секретарь."}`,
            }
        });
    } catch (e) {
        console.error("Failed to connect:", e);
        callbacks.onError?.(e);
    }
    return this.sessionPromise;
  }

  private stopAllAudio() {
    this.sources.forEach(s => { try { s.stop(); } catch (e) { } });
    this.sources.clear();
    this.nextStartTime = 0;
    this.onAudioLevelChange?.(0);
  }

  disconnect() {
    if (this.sessionPromise) {
      if (this.sessionPromise.close) this.sessionPromise.close();
      this.sessionPromise = null;
    }
    this.stopAllAudio();
  }
}
export const liveService = new LiveService();
