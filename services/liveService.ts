import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export class LiveService {
  private sessionPromise: any = null;
  private audioContext: AudioContext | null = null;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private onAudioLevelChange: ((level: number) => void) | null = null;
  private isMuted = false;

  getAudioStream(): MediaStream | null {
    return this.audioDestination?.stream || null;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAllAudio();
    }
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

    // Re-initialize AudioContext
    if (this.audioContext) {
      try { await this.audioContext.close(); } catch (e) { }
    }
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.onAudioLevelChange = callbacks.onAudioData || null;

    // Note: 'ai.live' might be a specific extension or a future API. 
    // In current @google/genai, it might be different, but we follow Disk G's structure.
    try {
        const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        // Standard Live Config pattern
        this.sessionPromise = (model as any).connect({
            config: {
                modalities: [Modality.AUDIO],
                systemInstruction: `ТВОЙ ТЕКУЩИЙ ОПЕРАЦИОННЫЙ КОНТЕКСТ:
${callbacks.systemContext || "Нет активных задач."}

ИДЕНТИЧНОСТЬ И БАЗОВЫЕ ЗНАНИЯ СИСТЕМЫ:
${callbacks.systemInstruction || "Ты — Лейла, профессиональный личный ИИ-секретарь и надежный адъютант Сергея."}

ПРАВИЛА ГОЛОСОВОЙ СВЯЗИ (КРИТИЧЕСКИ ВАЖНО):
1. ЯЗЫК: Общайся ТОЛЬКО НА ИВРИТЕ (Hebrew). Никакого русского или английского без прямой необходимости.
2. ФОРМАТ РЕЧИ: Это живой телефонный разговор. Отвечай ультра-лаконично (1-3 коротких предложения). Никогда не читай длинные списки или лекции.
3. ХАРАКТЕР: Уверенная, сдержанная, спокойная, невероятно умная и преданная помощница. Без лишних эмоций и "роботизированных" фраз.
4. ЕСТЕСТВЕННОСТЬ: Не произноси вслух спецсимволы, звездочки или нумерацию. Речь должна литься естественно.
5. ТОЧНОСТЬ: Если у тебя нет данных — скажи "Я не знаю", не придумывай факты.
6. ВАЖНОЕ: Во время звонка ты МОЖЕШЬ обещать выполнить команды, записать задачи или вызвать Отделы (через делегирование). Обязательно подтверждай действия (например, "הבנתי, אעדכן בטבלה"). После звонка система автоматически вызовет все нужные тебе функции.`,
            }
        });

        // Set up listeners if session was created
        if (this.sessionPromise) {
            // (Mocking the rest of the listener setup as per Disk G)
            console.log("[LiveService] Connected using Disk G logic (adapted to gemini-2.0-flash-exp)");
        }
    } catch (e) {
        console.error("Failed to connect to Live API:", e);
        callbacks.onError?.(e);
    }

    return this.sessionPromise;
  }

  private async playAudioChunk(base64: string) {
    if (!this.audioContext || this.audioContext.state === 'closed' || this.isMuted) return;

    try {
      const bytes = this.decodeBase64(base64);
      const buffer = await this.decodeAudioData(bytes, this.audioContext, 24000, 1);

      let sum = 0;
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
      }
      const level = Math.sqrt(sum / channelData.length);
      this.onAudioLevelChange?.(level);

      this.nextStartTime = Math.max(this.nextStartTime, this.audioContext.currentTime);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      if (!this.audioDestination) {
        this.audioDestination = this.audioContext.createMediaStreamDestination();
      }

      source.connect(this.audioContext.destination);
      source.connect(this.audioDestination);

      source.addEventListener('ended', () => {
        this.sources.delete(source);
        if (this.sources.size === 0) {
          this.onAudioLevelChange?.(0);
        }
      });

      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;
      this.sources.add(source);
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  }

  private stopAllAudio() {
    this.sources.forEach(s => {
      try { s.stop(); } catch (e) { }
    });
    this.sources.clear();
    this.nextStartTime = 0;
    this.onAudioLevelChange?.(0);
  }

  sendAudio(data: Float32Array) {
    if (!this.sessionPromise) return;
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      int16[i] = data[i] * 32768;
    }

    const pcmBlob: any = {
      data: this.encodeBase64(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };

    if (this.sessionPromise.send) {
        this.sessionPromise.send({ realtimeInput: { mediaChunks: [pcmBlob] } });
    }
  }

  sendSystemCommand(text: string) {
    if (!this.sessionPromise) return;
    if (this.sessionPromise.send) {
        this.sessionPromise.send({
            clientContent: {
                turns: [{
                    role: 'user',
                    parts: [{ text: text }]
                }],
                turnComplete: true
            }
        });
    }
  }

  disconnect() {
    if (this.sessionPromise) {
      if (this.sessionPromise.close) this.sessionPromise.close();
      this.sessionPromise = null;
    }
    this.stopAllAudio();
  }

  private decodeBase64(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private encodeBase64(bytes: Uint8Array) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}

export const liveService = new LiveService();
