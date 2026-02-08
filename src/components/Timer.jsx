import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTimerContext } from '../contexts/TimerContext';
import { useScheduledTimer } from '../hooks/useScheduledTimer';
import '../styles/Timer.css';
import { playAlarmPreview } from '../utils/alarmSounds';
import { calculateTargetTimeInSeconds } from '../utils/timeUtils';

import CircularProgress from './CircularProgress';
import { MinusIcon, PlusIcon } from './TimeAdjustIcon';

// Load target time from localStorage
const loadTargetTime = () => {
  try {
    const stored = localStorage.getItem('lrtimer_target_time');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...parsed, fromStorage: true };
    }
  } catch (error) {
    console.error('Failed to load target time from localStorage:', error);
  }
  // no stored value or failed parse
  return { hour: '19', minute: '00', second: '00', fromStorage: false };
};

export default function Timer() {
  const { globalSettings, updateSettings } = useTimerContext();

  // Load initial target time from localStorage
  const initialTargetTime = loadTargetTime();
  const { hour: initHour, minute: initMinute, second: initSecond, fromStorage } = initialTargetTime;

  // Scheduled mode states
  const [targetHour, setTargetHour] = useState(initHour);
  const [targetMinute, setTargetMinute] = useState(initMinute);
  const [targetSecond, setTargetSecond] = useState(initSecond);
  const [selectedAlarm, setSelectedAlarm] = useState(globalSettings.defaultAlarmType);
  // On first run, do not show edit mode if a target time exists in localStorage
  const [isEditMode, setIsEditMode] = useState(!fromStorage);
  const currentPreviewRef = useRef(null);


  // Save target time to localStorage whenever it changes
  const saveTargetTime = useCallback(() => {
    try {
      localStorage.setItem('lrtimer_target_time', JSON.stringify({
        hour: targetHour,
        minute: targetMinute,
        second: targetSecond
      }));
    } catch (error) {
      console.error('Failed to save target time to localStorage:', error);
    }
  }, [targetHour, targetMinute, targetSecond]);

  useEffect(() => {
    saveTargetTime();
  }, [saveTargetTime]);



  // List of schedules (keeps the array order)
  const schedules = useMemo(() => {
    const t1Sec = calculateTargetTimeInSeconds(targetHour, targetMinute, targetSecond);
    const t2Hour = (parseInt(targetHour, 10) + 12) % 24;
    const t2HourStr = String(t2Hour).padStart(2, '0');
    const t2Str = `${t2HourStr}:${targetMinute}:${targetSecond}`;
    const t2Sec = calculateTargetTimeInSeconds(t2HourStr, targetMinute, targetSecond);

    // Store and return the array ordered by seconds (time value) ascending
    // Place the earlier time first in the array
    if (t1Sec <= t2Sec) {
      return [
        { first: `${targetHour}:${targetMinute}:${targetSecond}`, seconds: t1Sec },
        { first: t2Str, seconds: t2Sec },
      ];
    }

    return [
      { first: t2Str, seconds: t2Sec },
      { first: `${targetHour}:${targetMinute}:${targetSecond}`, seconds: t1Sec },
    ];
  }, [targetHour, targetMinute, targetSecond]);

  // Map for storing enabled state in localStorage (keys are seconds)
  const loadEnabledMap = () => {
    try {
      const raw = localStorage.getItem('lrtimer_enabled_map');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load enabled map:', e);
    }
    return {};
  };

  const [enabledMap, setEnabledMap] = useState(() => loadEnabledMap());



  // Save enabledMap to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lrtimer_enabled_map', JSON.stringify(enabledMap || {}));
    } catch (e) {
      console.error('Failed to save enabled map:', e);
    }
  }, [enabledMap]);

  // When a new time is set, ensure schedules (by seconds key) exist in enabledMap.
  // If a schedule key is missing, add it with default true so the countdown can start (otherwise all-disabled state prevents starting).
  useEffect(() => {
    setEnabledMap((prev) => {
      const cur = prev || {};
      let changed = false;
      const next = { ...cur };
      schedules.forEach((s) => {
        const k = String(s.seconds);
        if (!(k in next)) {
          next[k] = true;
          changed = true;
        }
      });
      return changed ? next : cur;
    });
  }, [schedules]);

  const toggleEnabled = (seconds) => {
    const k = String(seconds);
    setEnabledMap((prev) => {
      const cur = prev || {};
      const next = { ...cur, [k]: !cur[k] };
      try {
        localStorage.setItem('lrtimer_enabled_map', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save enabled map:', e);
      }
      return next;
    });
  };

  // From enabled schedules, select the one closest to the current time (next occurrence within 24 hours)
  // Returns null if all are disabled
  const activeSchedule = useMemo(() => {
    const now = new Date();
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const enabled = schedules.filter((s) => (enabledMap ? enabledMap[String(s.seconds)] : true));
    if (enabled.length === 0) return null;

    const candidates = enabled;
    let best = candidates[0];
    const delta24 = (sec) => {
      let d = sec - nowSec;
      if (d <= 0) d += 24 * 3600;
      return d;
    };
    let bestLeft = delta24(best.seconds);

    candidates.forEach((c) => {
      const left = delta24(c.seconds);
      if (left < bestLeft) {
        best = c;
        bestLeft = left;
      }
    });

    return best;
  }, [schedules, enabledMap]);

  const [activeHour, activeMinute, activeSecond] = useMemo(() => {
    if (!activeSchedule) return ['00','00','00'];
    const parts = activeSchedule.first.split(':');
    return [parts[0], parts[1], parts[2]];
  }, [activeSchedule]);

  // Use custom hook (pass active schedule)
  const {
    isScheduledRunning,
    isAchieved,
    showModal,
    handleStart,
    handleStop,
    handleModalOk,
  } = useScheduledTimer(activeHour, activeMinute, activeSecond);

  // Start timer when modal is closed; stop when opened
  useEffect(() => {
    if (isEditMode) {
      // Stop timer when edit modal opens
      if (isScheduledRunning) {
        handleStop();
      }
    } else {
      // Start timer when edit modal closes (only if an active schedule exists)
      if (!isScheduledRunning && activeSchedule) {
        handleStart();
      }
      // Stop preview sound
      if (currentPreviewRef.current) {
        currentPreviewRef.current.stop();
        currentPreviewRef.current = null;
      }
    }
  }, [isEditMode, isScheduledRunning, handleStart, handleStop, activeSchedule]);

  // If activeSchedule becomes null (all disabled), stop the timer if running
  useEffect(() => {
    if (!activeSchedule && isScheduledRunning) {
      handleStop();
    }
  }, [activeSchedule, isScheduledRunning, handleStop]);



  // Visible time left (kept in component to ensure UI updates immediately when activeSchedule changes)
  const [visibleTimeLeft, setVisibleTimeLeft] = useState(null);

  useEffect(() => {
    if (!activeSchedule) {
      // avoid synchronous setState in effect body -> defer to next tick
      const t = setTimeout(() => setVisibleTimeLeft(null), 0);
      return () => clearTimeout(t);
    }

    const update = () => {
      const now = new Date();
      const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      let left = activeSchedule.seconds - nowSec;
      if (left <= 0) left += 24 * 3600; // next occurrence for this exact schedule within 24h
      setVisibleTimeLeft(left);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [activeSchedule]);

  // timeLeft is driven by visibleTimeLeft to ensure the circle updates smoothly
  const timeLeft = visibleTimeLeft;
  const incrementTime = useCallback((type) => {
    if (type === 'hour') {
      const newVal = (parseInt(targetHour) + 1) % 24;
      setTargetHour(String(newVal).padStart(2, '0'));
    } else if (type === 'minute') {
      const newVal = (parseInt(targetMinute) + 1) % 60;
      setTargetMinute(String(newVal).padStart(2, '0'));
    } else if (type === 'second') {
      const newVal = (parseInt(targetSecond) + 1) % 60;
      setTargetSecond(String(newVal).padStart(2, '0'));
    }
  }, [targetHour, targetMinute, targetSecond]);

  const decrementTime = useCallback((type) => {
    if (type === 'hour') {
      const newVal = (parseInt(targetHour) - 1 + 24) % 24;
      setTargetHour(String(newVal).padStart(2, '0'));
    } else if (type === 'minute') {
      const newVal = (parseInt(targetMinute) - 1 + 60) % 60;
      setTargetMinute(String(newVal).padStart(2, '0'));
    } else if (type === 'second') {
      const newVal = (parseInt(targetSecond) - 1 + 60) % 60;
      setTargetSecond(String(newVal).padStart(2, '0'));
    }
  }, [targetHour, targetMinute, targetSecond]);

  const toggleTheme = () => {
    const newTheme = globalSettings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
  };

  return (
    <div className="timer-container">
      <div className="date-display">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
      <h1>🕐 カウントダウンタイマー</h1>

      <div className="timer-mode">
        <div className="timer-header">
          <CircularProgress
            timeLeft={timeLeft}
            totalTime={15 * 60}
            isCountdown={false}
            isRunning={isScheduledRunning}
            isAchieved={isAchieved}
            isStarting={timeLeft === null}
          />
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-mobile"
            aria-label={`Switch to ${globalSettings.theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {globalSettings.theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {!isScheduledRunning && (
          <>
            {!isEditMode ? (
              // Display-only mode
              <div className="timer-display-mode">
                  {schedules.map((s) => {
                  // Treat undefined (key not set) as true by default
                  const enabled = enabledMap?.[String(s.seconds)] ?? true;
                  return (
                    <button
                      key={s.first}
                      type="button"
                      className={`schedule-btn ${enabled ? 'enabled' : 'disabled'} ${activeSchedule && s.seconds === activeSchedule.seconds ? 'active' : ''}`}
                      onClick={() => toggleEnabled(s.seconds)}
                      aria-pressed={enabled}
                      aria-label={`${s.first} の有効/無効切替`}
                    >
                      <span className="schedule-text">{s.first}</span>
                      <span className="schedule-indicator" aria-hidden="true">{enabled ? '●' : '○'}</span>
                    </button>
                  );
                })}
                <div className="timer-display-actions">
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="btn btn-edit"
                    aria-label="時刻を設定"
                  >
                    時刻設定
                  </button>
                </div>
              </div>
            ) : (
              // Edit mode - Modal on mobile, inline on desktop
              <>
                <div
                  className="edit-mode-overlay"
                  aria-hidden="true"
                  role="presentation"
                />
                <div className="timer-edit-modal">
                  <div className="alarm-selector">
                    <select
                      id="alarm-select"
                      value={selectedAlarm}
                      onChange={(e) => {
                        setSelectedAlarm(e.target.value);
                        // Stop existing preview
                        if (currentPreviewRef.current) {
                          currentPreviewRef.current.stop();
                        }
                        // Start new preview
                        const preview = playAlarmPreview(e.target.value);
                        currentPreviewRef.current = preview;
                      }}
                      disabled={isScheduledRunning}
                      className="alarm-select"
                      aria-label="アラーム音の種類を選択"
                    >
                      <option value="beep">ビープ音</option>
                      <option value="low">低いビープ音</option>
                      <option value="phone">電話音</option>
                      <option value="pulse">パルス音</option>
                      <option value="ascending">上昇音</option>
                    </select>
                  </div>

                  <div className="timer-input">
                  {/* Improved accessibility - added aria-labels and keyboard navigation support */}
                  <div className="time-input-group">
                    <button
                      className="time-adjust-btn"
                      onClick={() => incrementTime('hour')}
                      aria-label="時を増加"
                    >
                      <PlusIcon />
                    </button>
                    <div
                      className="time-display"
                      role="textbox"
                      aria-label="時間"
                      aria-readonly="true"
                    >
                      {targetHour}
                    </div>
                    <button
                      className="time-adjust-btn"
                      onClick={() => decrementTime('hour')}
                      aria-label="時を減少"
                    >
                      <MinusIcon />
                    </button>
                  </div>
                  <span className="time-separator" aria-hidden="true">:</span>
                  <div className="time-input-group">
                    <button
                      className="time-adjust-btn"
                      onClick={() => incrementTime('minute')}
                      aria-label="分を増加"
                    >
                      <PlusIcon />
                    </button>
                    <div
                      className="time-display"
                      role="textbox"
                      aria-label="分"
                      aria-readonly="true"
                    >
                      {targetMinute}
                    </div>
                    <button
                      className="time-adjust-btn"
                      onClick={() => decrementTime('minute')}
                      aria-label="分を減少"
                    >
                      <MinusIcon />
                    </button>
                  </div>
                  <span className="time-separator" aria-hidden="true">:</span>
                  <div className="time-input-group">
                    <button
                      className="time-adjust-btn"
                      onClick={() => incrementTime('second')}
                      aria-label="秒を増加"
                    >
                      <PlusIcon />
                    </button>
                    <div
                      className="time-display"
                      role="textbox"
                      aria-label="秒"
                      aria-readonly="true"
                    >
                      {targetSecond}
                    </div>
                    <button
                      className="time-adjust-btn"
                      onClick={() => decrementTime('second')}
                      aria-label="秒を減少"
                    >
                      <MinusIcon />
                    </button>
                  </div>
                </div>
                <div className="timer-input-actions">
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="btn btn-cancel"
                    aria-label="モーダルを閉じる"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </>
            )}
          </>
        )}

        {isScheduledRunning && (
          <>
            <div className="timer-display-mode">
              {schedules.map((s) => {
                const enabled = enabledMap?.[String(s.seconds)] ?? true;
                return (
                  <button
                    key={s.first}
                    type="button"
                    className={`schedule-btn ${enabled ? 'enabled' : 'disabled'}`}
                    onClick={() => toggleEnabled(s.seconds)}
                    aria-pressed={enabled}
                    aria-label={`${s.first} の有効/無効切替`}
                  >
                    <span className="schedule-text">{s.first}</span>
                    <span className="schedule-indicator" aria-hidden="true">{enabled ? '●' : '○'}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className="btn btn-edit"
                aria-label="時刻を設定"
              >
                時刻設定
              </button>
            </div>

            {isEditMode && (
              <>
                <div
                  className="edit-mode-overlay"
                  aria-hidden="true"
                  role="presentation"
                  onClick={() => setIsEditMode(false)}
                />
                <div className="timer-edit-modal">
                  <div className="alarm-selector">
                    <label htmlFor="alarm-select">アラーム音:</label>
                    <select
                      id="alarm-select"
                      value={selectedAlarm}
                      onChange={(e) => {
                        setSelectedAlarm(e.target.value);
                        // Stop existing preview
                        if (currentPreviewRef.current) {
                          currentPreviewRef.current.stop();
                        }
                        // Start new preview
                        const preview = playAlarmPreview(e.target.value);
                        currentPreviewRef.current = preview;
                      }}
                      disabled={isScheduledRunning}
                      className="alarm-select"
                      aria-label="アラーム音の種類を選択"
                    >
                      <option value="beep">ビープ音</option>
                      <option value="low">低いビープ音</option>
                      <option value="phone">電話音</option>
                      <option value="pulse">パルス音</option>
                      <option value="ascending">上昇音</option>
                    </select>
                  </div>

                    <div className="timer-input">
                    {/* Improved accessibility - added aria-labels and keyboard navigation support */}
                    <div className="time-input-group">
                      <button
                        className="time-adjust-btn"
                        onClick={() => incrementTime('hour')}
                        aria-label="時を増加"
                      >
                        <PlusIcon />
                      </button>
                      <div
                        className="time-display"
                        role="textbox"
                        aria-label="時間"
                        aria-readonly="true"
                      >
                        {targetHour}
                      </div>
                      <button
                        className="time-adjust-btn"
                        onClick={() => decrementTime('hour')}
                        aria-label="時を減少"
                      >
                        <MinusIcon />
                      </button>
                    </div>
                    <span className="time-separator" aria-hidden="true">:</span>
                    <div className="time-input-group">
                      <button
                        className="time-adjust-btn"
                        onClick={() => incrementTime('minute')}
                        aria-label="分を増加"
                      >
                        <PlusIcon />
                      </button>
                      <div
                        className="time-display"
                        role="textbox"
                        aria-label="分"
                        aria-readonly="true"
                      >
                        {targetMinute}
                      </div>
                      <button
                        className="time-adjust-btn"
                        onClick={() => decrementTime('minute')}
                        aria-label="分を減少"
                      >
                        <MinusIcon />
                      </button>
                    </div>
                    <span className="time-separator" aria-hidden="true">:</span>
                    <div className="time-input-group">
                      <button
                        className="time-adjust-btn"
                        onClick={() => incrementTime('second')}
                        aria-label="秒を増加"
                      >
                        <PlusIcon />
                      </button>
                      <div
                        className="time-display"
                        role="textbox"
                        aria-label="秒"
                        aria-readonly="true"
                      >
                        {targetSecond}
                      </div>
                      <button
                        className="time-adjust-btn"
                        onClick={() => decrementTime('second')}
                        aria-label="秒を減少"
                      >
                        <MinusIcon />
                      </button>
                    </div>
                  </div>
                  <div className="timer-input-actions">
                    <button
                      onClick={() => setIsEditMode(false)}
                      className="btn btn-cancel"
                      aria-label="編集をキャンセル"
                    >
                      閉じる
                    </button>
                  </div>
                </div>
            </>
            )}
          </>
        )}

        <div className="timer-controls">
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>目標時刻に到達しました！</p>
            <button onClick={handleModalOk} className="btn btn-start">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
