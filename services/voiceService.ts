
class VoiceService {
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.initVoice();
  }

  private initVoice() {
    if (typeof window !== 'undefined' && this.synth) {
      setTimeout(() => {
        const voices = this.synth!.getVoices();
        // Ищем русский голос (предпочтительно)
        this.voice = voices.find(v => v.lang.includes('ru')) || voices[0];
      }, 100);
    }
  }

  speak(text: string) {
    if (!this.synth) return;
    
    this.stop(); // Прерываем предыдущую речь

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.voice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'ru-RU';

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const voiceService = new VoiceService();
