'use client';

import { useState, useEffect } from 'react';
import { timerStore } from '@/lib/timerStore';

interface CountdownTimerProps {
  className?: string;
}

export default function CountdownTimer({ className = '' }: CountdownTimerProps) {
  const [state, setState] = useState(timerStore.getState());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Subscribe to timer store changes
    const unsubscribe = timerStore.subscribe(() => {
      setState(timerStore.getState());
    });

    // Initial state load
    setState(timerStore.getState());

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    timerStore.start();
  };

  const handlePause = () => {
    timerStore.pause();
  };

  const handleReset = () => {
    timerStore.reset();
  };

  const handleSetCustomTime = () => {
    timerStore.setCustomTime(state.customMinutes);
    setShowSettings(false);
  };

  const handleTestSound = () => {
    timerStore.testSound();
  };

  const getTimeLeftPercent = () => {
    const totalTime = state.customMinutes * 60;
    return totalTime > 0 ? (state.timeLeft / totalTime) * 100 : 0;
  };

  const getTimerColor = () => {
    const percent = getTimeLeftPercent();
    if (percent > 50) return 'text-green-600';
    if (percent > 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = () => {
    const percent = getTimeLeftPercent();
    if (percent > 50) return 'bg-green-500';
    if (percent > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Focus Timer</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          ⚙️
        </button>
      </div>

      {showSettings && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="custom-minutes" className="text-sm font-medium text-gray-700">
              Minutes:
            </label>
            <input
              id="custom-minutes"
              type="number"
              min="1"
              max="120"
              value={state.customMinutes}
              onChange={(e) => {
                const minutes = parseInt(e.target.value) || 20;
                timerStore.setCustomTime(minutes);
              }}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSetCustomTime}
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Set Time
            </button>
            <button
              onClick={handleTestSound}
              className="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              Test Sound
            </button>
          </div>
        </div>
      )}

      <div className="text-center mb-4">
        <div className={`text-4xl font-mono font-bold ${getTimerColor()}`}>
          {formatTime(state.timeLeft)}
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
            style={{ width: `${getTimeLeftPercent()}%` }}
          ></div>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        {!state.isRunning ? (
          state.timeLeft === 0 ? (
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded font-medium border-2 border-blue-600"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                minHeight: '40px',
                minWidth: '100px'
              }}
            >
              Reset Timer
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="px-4 py-2 rounded font-medium border-2 border-green-600"
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                minHeight: '40px',
                minWidth: '80px'
              }}
            >
              Start
            </button>
          )
        ) : (
          <button
            onClick={handlePause}
            className="px-4 py-2 rounded font-medium border-2 border-yellow-600"
            style={{
              backgroundColor: '#ca8a04',
              color: '#ffffff',
              minHeight: '40px',
              minWidth: '80px'
            }}
          >
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded font-medium border-2 border-gray-600"
          style={{
            backgroundColor: '#6b7280',
            color: '#ffffff',
            minHeight: '40px',
            minWidth: '80px'
          }}
        >
          Reset
        </button>
      </div>

      {state.timeLeft === 0 && (
        <div className="mt-3 text-center text-red-600 font-semibold">
          Time&apos;s up! 🎉
        </div>
      )}

      {/* Debug info - remove in production */}
      <div className="mt-2 text-xs text-gray-400 text-center">
        Status: {state.isRunning ? 'Running' : 'Stopped'} |
        Time: {state.timeLeft}s |
        Settings: {state.customMinutes}min
      </div>
    </div>
  );
}