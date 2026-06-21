/**
 * sound.js - Web Audio API Sound Synthesizer
 * Generates beautiful, playful sound effects programmatically.
 * Initiates only after user interaction to respect browser auto-play policies.
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export const SoundManager = {
  muted: false,

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  },

  playClick() {
    if (this.muted) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio playing failed:", e);
    }
  },

  playCoin() {
    if (this.muted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Coins usually have 2 distinct high metallic tones close together
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      playTone(987.77, now, 0.12); // B5 note
      playTone(1318.51, now + 0.08, 0.25); // E6 note
    } catch (e) {
      console.warn("Audio playing failed:", e);
    }
  },

  playSuccess() {
    if (this.muted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Cheerful major arpeggio: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const noteDuration = 0.1;
      
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + (index * 0.08));
        
        gain.gain.setValueAtTime(0.12, now + (index * 0.08));
        gain.gain.exponentialRampToValueAtTime(0.001, now + (index * 0.08) + 0.25);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + (index * 0.08));
        osc.stop(now + (index * 0.08) + 0.25);
      });
    } catch (e) {
      console.warn("Audio playing failed:", e);
    }
  },

  playLevelUp() {
    if (this.muted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Ascending celebratory melody with a rich vibrato (using sawtooth and sine mixed)
      const playRichTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(freq * 1.005, startTime); // slightly detuned for fullness

        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc2.start(startTime);
        osc.stop(startTime + duration);
        osc2.stop(startTime + duration);
      };

      // Celebratory level up: C5 -> F5 -> G5 -> C6 (sustained)
      playRichTone(523.25, now, 0.15);
      playRichTone(698.46, now + 0.12, 0.15);
      playRichTone(783.99, now + 0.24, 0.15);
      playRichTone(1046.50, now + 0.36, 0.6);
    } catch (e) {
      console.warn("Audio playing failed:", e);
    }
  },

  playError() {
    if (this.muted) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio playing failed:", e);
    }
  }
};
