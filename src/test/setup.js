import '@testing-library/jest-dom';

// Mock AudioContext for tests
global.AudioContext = class {
  createOscillator() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      type: '',
      frequency: { setValueAtTime: vi.fn() },
    };
  }
  createGain() {
    return {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
  }
  currentTime = 0;
};

global.webkitAudioContext = global.AudioContext;
