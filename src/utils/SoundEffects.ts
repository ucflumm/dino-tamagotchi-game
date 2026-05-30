// Retro 8-bit synthesizer sound effects powered by the Web Audio API

let isMuted = false;

export const setMuted = (muted: boolean) => {
  isMuted = muted;
};

export const getMuted = () => isMuted;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
}

/**
 * Play a low-level synth frequency over a duration
 */
export function playTone(freq: number, type: OscillatorType, duration: number, gainValue = 0.1) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Check state and resume if suspended (standard browser behavior)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gainNode.gain.setValueAtTime(gainValue, ctx.currentTime);
  // Linear ramp down to prevent popping sound
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export const SoundEffects = {
  click: () => {
    // Elegant tiny beep
    playTone(880, 'square', 0.08, 0.08);
  },

  jump: () => {
    // Sliding frequency upwards
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  },

  success: () => {
    // Happy chime
    playTone(523.25, 'triangle', 0.1, 0.1); // C5
    setTimeout(() => {
      playTone(659.25, 'triangle', 0.1, 0.1); // E5
      setTimeout(() => {
        playTone(783.99, 'triangle', 0.15, 0.1); // G5
        setTimeout(() => {
          playTone(1046.50, 'triangle', 0.25, 0.15); // C6
        }, 80);
      }, 80);
    }, 80);
  },

  eat: () => {
    // Double munching crunch sounds
    playTone(330, 'sawtooth', 0.08, 0.1);
    setTimeout(() => {
      playTone(261, 'sawtooth', 0.1, 0.1);
    }, 120);
  },

  clean: () => {
    // Bubbling sound sweep
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.1);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  },

  hurt: () => {
    // Sad alarm buzz
    playTone(180, 'sawtooth', 0.25, 0.15);
    setTimeout(() => {
      playTone(120, 'sawtooth', 0.3, 0.15);
    }, 200);
  },

  hatch: () => {
    // Magical hatching cascade
    playTone(300, 'square', 0.1, 0.1);
    setTimeout(() => {
      playTone(450, 'square', 0.1, 0.1);
      setTimeout(() => {
        playTone(600, 'square', 0.1, 0.08);
        setTimeout(() => {
          playTone(900, 'sine', 0.4, 0.15);
        }, 100);
      }, 100);
    }, 100);
  },

  levelUp: () => {
    // Fanfare
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playTone(freq, 'square', 0.15, 0.1);
      }, idx * 120);
    });
  },
};
