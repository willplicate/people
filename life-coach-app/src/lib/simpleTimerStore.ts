// Simple timer store for testing
interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  targetMinutes: number;
}

class SimpleTimerStore {
  private state: TimerState = {
    timeLeft: 5 * 60, // Default 5 minutes for testing
    isRunning: false,
    targetMinutes: 5,
  };

  private listeners: Set<() => void> = new Set();
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    // Only start interval on client side (not during SSR)
    if (typeof window !== 'undefined') {
      this.startInterval();
    }
  }

  private startInterval() {
    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      if (this.state.isRunning && this.state.timeLeft > 0) {
        this.state.timeLeft -= 1;

        console.log('Timer tick:', this.state.timeLeft);

        if (this.state.timeLeft <= 0) {
          this.state.isRunning = false;
          this.state.timeLeft = 0;
          console.log('Timer completed!');
          this.playSound();
        }

        this.notifyListeners();
      }
    }, 1000);
  }

  private playSound() {
    try {
      const audio = new Audio('/timer-complete.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.error('Sound play error:', err));
    } catch (error) {
      console.error('Failed to create audio:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): TimerState {
    return { ...this.state };
  }

  start() {
    console.log('Starting timer with', this.state.timeLeft, 'seconds remaining');
    this.state.isRunning = true;
    this.notifyListeners();
  }

  pause() {
    console.log('Pausing timer at', this.state.timeLeft, 'seconds');
    this.state.isRunning = false;
    this.notifyListeners();
  }

  reset() {
    console.log('Resetting timer to', this.state.targetMinutes, 'minutes');
    this.state.isRunning = false;
    this.state.timeLeft = this.state.targetMinutes * 60;
    this.notifyListeners();
  }

  setMinutes(minutes: number) {
    if (minutes > 0 && minutes <= 120) {
      console.log('Setting timer to', minutes, 'minutes');
      this.state.targetMinutes = minutes;
      this.state.timeLeft = minutes * 60;
      this.state.isRunning = false;
      this.notifyListeners();
    }
  }
}

export const simpleTimerStore = new SimpleTimerStore();
