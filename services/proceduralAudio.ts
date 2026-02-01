
export type SoundType = 'MOVE' | 'SNAP' | 'WAVE' | 'DESTRUCT';

class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers: Map<SoundType, AudioBuffer> = new Map();
  private lastPlayTime: Map<SoundType, number> = new Map();

  constructor() {}

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 1.0;
    }
  }

  public getContext(): AudioContext | null {
    if (!this.ctx) this.init();
    return this.ctx;
  }

  public getMasterGain(): GainNode | null {
    if (!this.masterGain) this.init();
    return this.masterGain;
  }

  public async unlock() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public async setSound(type: SoundType, file: File) {
    this.init();
    if (!this.ctx) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.buffers.set(type, decodedBuffer);
    } catch (e) {
      console.error(`❌ [SonicEngine] Failed to decode ${type}:`, e);
      throw new Error(`خطا در پردازش صدا: ${type} - ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  public clearSound(type: SoundType) {
    this.buffers.delete(type);
  }

  public hasSound(type: SoundType): boolean {
    return this.buffers.has(type);
  }

  public getAllLoadedSounds(): SoundType[] {
    return Array.from(this.buffers.keys());
  }

  /**
   * تولید یک صدای تق (Snap) سنتز شده در صورتی که فایلی موجود نباشد
   */
  private playSnapFallback(volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    
    // لایه ۱: صدای فرکانس بالا (کلیک)
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    
    g.gain.setValueAtTime(volume * 0.5, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(g);
    g.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.1);

    // لایه ۲: نویز کوتاه (حس ضربه)
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    noiseSource.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noiseSource.start(now);
  }

  public play(type: SoundType, volume: number = 1.0, pitch: number = 1.0) {
    this.init();
    const buffer = this.buffers.get(type);
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const lastTime = this.lastPlayTime.get(type) || 0;
    
    // جلوگیری از تداخل
    if (type === 'SNAP' && now - lastTime < 0.1) return;
    if (type === 'MOVE' && now - lastTime < 0.2) return;

    this.lastPlayTime.set(type, now);

    // اگر بافر موجود است از آن استفاده کن، در غیر این صورت از صدای سنتز شده
    if (buffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = pitch;
      
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(volume, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + buffer.duration);
      
      source.connect(g);
      g.connect(this.masterGain);
      source.start(now);
    } else if (type === 'SNAP') {
      this.playSnapFallback(volume);
    }
  }
}

export const sonicEngine = new ProceduralAudioEngine();
