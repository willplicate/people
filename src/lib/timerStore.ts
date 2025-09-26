// Global timer state that persists across page navigation
interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  customMinutes: number;
  startTime?: number;
  endTime?: number;
}

class TimerStore {
  private state: TimerState = {
    timeLeft: 20 * 60,
    isRunning: false,
    customMinutes: 20,
  };

  private listeners: Set<() => void> = new Set();
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.loadState();
    this.startInterval();
  }

  private loadState() {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('urgentTimer');
    if (saved) {
      try {
        const parsed: TimerState = JSON.parse(saved);

        // Calculate real remaining time if timer was running
        if (parsed.isRunning && parsed.endTime) {
          const now = Date.now();
          const remainingTime = Math.max(0, Math.ceil((parsed.endTime - now) / 1000));

          this.state = {
            ...parsed,
            timeLeft: remainingTime,
            isRunning: remainingTime > 0,
          };

          if (remainingTime <= 0 && parsed.isRunning) {
            console.log('Timer completed while away');
            this.onTimerComplete();
          }
        } else {
          this.state = parsed;
        }
      } catch (error) {
        console.error('Failed to load timer state:', error);
      }
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;

    const stateToSave: TimerState = {
      ...this.state,
      startTime: this.state.isRunning ? Date.now() - (this.state.customMinutes * 60 - this.state.timeLeft) * 1000 : undefined,
      endTime: this.state.isRunning ? Date.now() + this.state.timeLeft * 1000 : undefined,
    };

    localStorage.setItem('urgentTimer', JSON.stringify(stateToSave));
  }

  private startInterval() {
    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      if (this.state.isRunning && this.state.timeLeft > 0) {
        this.state.timeLeft -= 1;

        if (this.state.timeLeft <= 0) {
          this.onTimerComplete();
        }

        this.saveState();
        this.notifyListeners();
      }
    }, 1000);
  }

  private onTimerComplete() {
    this.state.isRunning = false;
    this.state.timeLeft = 0;

    // Play sound
    this.playSound();

    // Show notification
    if (Notification.permission === 'granted') {
      new Notification('Focus Timer Complete!', {
        body: 'Your focus session has ended. Time for a break!',
        icon: '/favicon-32x32.png'
      });
    }

    this.saveState();
    this.notifyListeners();
  }

  private playSound() {
    try {
      const audio = new Audio('/timer-complete.mp3');
      audio.volume = 0.7;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Public methods
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): TimerState {
    return { ...this.state };
  }

  async start() {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    this.state.isRunning = true;
    this.saveState();
    this.notifyListeners();
    console.log('Timer started:', this.state);
  }

  pause() {
    this.state.isRunning = false;
    this.saveState();
    this.notifyListeners();
    console.log('Timer paused:', this.state);
  }

  reset() {
    this.state.isRunning = false;
    this.state.timeLeft = this.state.customMinutes * 60;
    this.saveState();
    this.notifyListeners();
    console.log('Timer reset:', this.state);
  }

  setCustomTime(minutes: number) {
    if (minutes > 0 && minutes <= 120) {
      this.state.customMinutes = minutes;
      this.state.timeLeft = minutes * 60;
      this.state.isRunning = false;
      this.saveState();
      this.notifyListeners();
    }
  }

  testSound() {
    this.playSound();
  }
}

// Global singleton instance
export const timerStore = new TimerStore();