
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class LiveService {
  private sessionPromise: Promise<any> | null = null;
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
    // Re-initialize AudioContext to ensure it is fresh
    if (this.audioContext) {
      try { await this.audioContext.close(); } catch (e) { }
    }
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.onAudioLevelChange = callbacks.onAudioData || null;

    this.sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => console.log("Live connection established."),
        onmessage: async (message: LiveServerMessage) => {
          const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64EncodedAudioString) {
            this.playAudioChunk(base64EncodedAudioString);
          }

          let textChunk = '';
          const parts = message.serverContent?.modelTurn?.parts || [];
          for (const part of parts) {
            if (part.text) {
              textChunk += part.text;
            }
          }
          if (message.serverContent?.outputTranscription) {
            textChunk += (message.serverContent.outputTranscription.text || '');
          }

          if (textChunk.trim()) {
            callbacks.onMessage?.(textChunk);
          }

          if (message.serverContent?.interrupted) {
            this.stopAllAudio();
          }
        },
        onerror: (e) => {
          console.error("Live Session Connection Error:", e);
          callbacks.onError?.(e);
        },
        onclose: (e) => {
          console.log("Live Session Closed:", e.reason);
          this.sessionPromise = null;
          callbacks.onClose?.();
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        tools: callbacks.tools,
        systemInstruction: `ТВОЙ ТЕКУЩИЙ ОПЕРАЦИОННЫЙ КОНТЕКСТ:
${callbacks.systemContext || "Нет активных задач."}

ИДЕНТИЧНОСТЬ И БАЗОВЫЕ ЗНАНИЯ СИСТЕМЫ:
${callbacks.systemInstruction || "Ты — Лейла, профессиональный личный ИИ-секретарь и надежный адъютант Сергея."}

ПРАВИЛА ГОЛОСОВОЙ СВЯЗИ (КРИТИЧЕСКИ ВАЖНО):
1. ЯЗЫК: Общайся ТОЛЬКО НА РУССКОМ языке. Никакого иврита или английского без прямой просьбы.
2. ФОРМАТ РЕЧИ: Это живой телефонный разговор. Отвечай ультра-лаконично (1-3 коротких предложения). Никогда не читай длинные списки или лекции.
3. ХАРАКТЕР: Уверенная, сдержанная, спокойная, невероятно умная и преданная помощница. Без лишних эмоций и "роботизированных" фраз.
4. ЕСТЕСТВЕННОСТЬ: Не произноси вслух спецсимволы, звездочки или нумерацию. Речь должна литься естественно.
5. ТОЧНОСТЬ: Если у тебя нет данных — скажи "Я не знаю", не придумывай факты.
6. ВАЖНОЕ: Во время звонка ты МОЖЕШЬ обещать выполнить команды, записать задачи или вызвать Отделы (через делегирование). Обязательно подтверждай: "Поняла, добавлю в Таблицу" или "Поручу Отделу Финансов". После звонка система автоматически вызовет все нужные тебе функции.`,
      },
    });

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

      // Connect to the default hardware destination so standard Web Audio API playback still works
      source.connect(this.audioContext.destination);

      // Also connect to our custom MediaStream destination so we can route it to <audio> for setSinkId
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

    const pcmBlob: Blob = {
      data: this.encodeBase64(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };

    this.sessionPromise.then((session) => {
      if (session) session.sendRealtimeInput({ media: pcmBlob });
    }).catch(err => console.error("Failed to send audio data:", err));
  }

  sendSystemCommand(text: string) {
    if (!this.sessionPromise) return;
    this.sessionPromise.then((session) => {
      if (session) {
        session.send({
          clientContent: {
            turns: [{
              role: 'user',
              parts: [{ text: text }]
            }],
            turnComplete: true
          }
        });
      }
    }).catch(err => console.error("Failed to send system command:", err));
  }

  disconnect() {
    if (this.sessionPromise) {
      this.sessionPromise.then(s => {
        if (s) s.close();
      });
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
