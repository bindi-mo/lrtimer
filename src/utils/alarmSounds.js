// アラーム音再生ユーティリティ

// Fixed: Add error handling for AudioContext creation failures
// AudioContextの再利用
let audioContext = null;
const getAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.error('AudioContext creation failed:', error);
      return null;
    }
  }
  return audioContext;
};

export const playAlarmSound = (audioContext, type) => {
  // audioContextがnullの場合は内部で取得
  const ctx = audioContext || getAudioContext();

  // AudioContextが利用できない場合はスキップ
  if (!ctx) {
    console.warn('AudioContext not available, skipping sound playback');
    return;
  }

  switch(type) {
    case 'beep':
      return playBeepSound(ctx);
    case 'low':
      return playLowSound(ctx);
    case 'phone':
      return playPhoneSound(ctx);
    case 'pulse':
      return playPulseSound(ctx);
    case 'ascending':
      return playAscendingSound(ctx);
    default:
      return playBeepSound(ctx);
  }
};

const playBeepSound = (audioContext) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};

const playLowSound = (audioContext) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.value = 400;
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.8);
};

const playPhoneSound = (audioContext) => {
  for (let i = 0; i < 2; i++) {
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);

    osc1.frequency.value = 1000;
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.25, audioContext.currentTime + i * 0.4);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.4 + 0.2);
    osc1.start(audioContext.currentTime + i * 0.4);
    osc1.stop(audioContext.currentTime + i * 0.4 + 0.2);

    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);

    osc2.frequency.value = 500;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.25, audioContext.currentTime + i * 0.4 + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.4 + 0.4);
    osc2.start(audioContext.currentTime + i * 0.4 + 0.2);
    osc2.stop(audioContext.currentTime + i * 0.4 + 0.4);
  }
};

const playPulseSound = (audioContext) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.value = 600;
  oscillator.type = 'square';

  for (let i = 0; i < 3; i++) {
    gainNode.gain.setValueAtTime(0.18, audioContext.currentTime + i * 0.25);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + i * 0.25 + 0.12);
  }

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.75);
};

const playAscendingSound = (audioContext) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.type = 'sine';

  oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator.frequency.linearRampToValueAtTime(1200, audioContext.currentTime + 0.8);

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.8);
};

// プレビュー再生関数
export const playAlarmPreview = (alarmType) => {
  const audioContext = getAudioContext();

  // AudioContextが利用できない場合はスキップ
  if (!audioContext) {
    console.warn('AudioContext not available, cannot play preview');
    return;
  }

  const duration = 5; // 5秒間

  const playMultiple = (soundFn) => {
    let elapsed = 0;
    const interval = setInterval(() => {
      if (elapsed >= duration) {
        clearInterval(interval);
        return;
      }
      soundFn(audioContext);
      elapsed += 0.8; // 各音は最大0.8秒
    }, 900); // 0.9秒間隔で再生
  };

  switch(alarmType) {
    case 'beep':
      playMultiple(playBeepSound);
      break;
    case 'low':
      playMultiple(playLowSound);
      break;
    case 'phone':
      playPhoneSound(audioContext);
      setTimeout(() => playPhoneSound(audioContext), 1700);
      setTimeout(() => playPhoneSound(audioContext), 3400);
      break;
    case 'pulse':
      playMultiple(playPulseSound);
      break;
    case 'ascending':
      playMultiple(playAscendingSound);
      break;
    default:
      playMultiple(playBeepSound);
  }
};