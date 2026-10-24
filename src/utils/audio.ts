let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Synthesizes a warm, resonant kitchen bell chime (like a polished brass bell).
 * Uses additive synthesis with exponential decay. Zero external audio files.
 */
export function playKitchenChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic frequencies for a warm bell
    const frequencies = [880, 1760, 2640]; // A5, A6, E7 harmonic
    const gains = [0.4, 0.2, 0.08];
    const decayTimes = [1.8, 1.2, 0.6];

    // Master gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.7, now);
    masterGain.connect(ctx.destination);

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Attack: instantaneous, followed by pleasant exponential decay
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(gains[i], now + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decayTimes[i]);

      osc.connect(gainNode);
      gainNode.connect(masterGain);

      osc.start(now);
      osc.stop(now + decayTimes[i]);
    });
  } catch (err) {
    console.warn('Could not play synthesized audio chime:', err);
  }
}
