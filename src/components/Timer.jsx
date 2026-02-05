import { useCallback, useMemo, useState } from 'react';
import { useScheduledTimer } from '../hooks/useScheduledTimer';
import '../styles/Timer.css';
import { playAlarmPreview } from '../utils/alarmSounds';
import { calculateTargetTimeInSeconds, getCurrentTimeInSeconds } from '../utils/timeUtils';
import CircularProgress from './CircularProgress';

export default function Timer() {
  // Scheduled mode states
  const [targetHour, setTargetHour] = useState('12');
  const [targetMinute, setTargetMinute] = useState('00');
  const [targetSecond, setTargetSecond] = useState('00');
  const [selectedAlarm, setSelectedAlarm] = useState('beep');

  // カスタムフックを使用
  const {
    scheduledTimeLeft,
    isScheduledRunning,
    isAchieved,
    showModal,
    modalMessage,
    handleStart,
    handleStop,
    handleModalOk,
  } = useScheduledTimer(targetHour, targetMinute, targetSecond);

  // メモ化された計算値
  const targetTimeInSeconds = useMemo(() =>
    calculateTargetTimeInSeconds(targetHour, targetMinute, targetSecond),
    [targetHour, targetMinute, targetSecond]
  );

  const currentTimeInSeconds = useMemo(() => getCurrentTimeInSeconds(), []);
  // TODO: Fix useMemo dependency array - ensure currentTimeInSeconds updates in real-time
  const timeLeft = useMemo(() => {
    if (!isScheduledRunning) {
      return scheduledTimeLeft; // 開始前はscheduledTimeLeftを使う（リアルタイム更新されている）
    }
    return scheduledTimeLeft;
  }, [isScheduledRunning, scheduledTimeLeft]);

  // コールバック関数をメモ化
  const handleTargetTimeChange = useCallback((type, value) => {
    const num = Math.max(0, parseInt(value) || 0);

    if (type === 'hour') {
      setTargetHour(String(Math.min(23, num)).padStart(2, '0'));
    } else if (type === 'minute') {
      setTargetMinute(String(Math.min(59, num)).padStart(2, '0'));
    } else if (type === 'second') {
      setTargetSecond(String(Math.min(59, num)).padStart(2, '0'));
    }
  }, []);

  const incrementTime = useCallback((type) => {
    if (type === 'hour') {
      const newVal = (parseInt(targetHour) + 1) % 24;
      handleTargetTimeChange('hour', String(newVal));
    } else if (type === 'minute') {
      const newVal = (parseInt(targetMinute) + 1) % 60;
      handleTargetTimeChange('minute', String(newVal));
    } else if (type === 'second') {
      const newVal = (parseInt(targetSecond) + 1) % 60;
      handleTargetTimeChange('second', String(newVal));
    }
  }, [targetHour, targetMinute, targetSecond, handleTargetTimeChange]);

  const decrementTime = useCallback((type) => {
    if (type === 'hour') {
      const newVal = (parseInt(targetHour) - 1 + 24) % 24;
      handleTargetTimeChange('hour', String(newVal));
    } else if (type === 'minute') {
      const newVal = (parseInt(targetMinute) - 1 + 60) % 60;
      handleTargetTimeChange('minute', String(newVal));
    } else if (type === 'second') {
      const newVal = (parseInt(targetSecond) - 1 + 60) % 60;
      handleTargetTimeChange('second', String(newVal));
    }
  }, [targetHour, targetMinute, targetSecond, handleTargetTimeChange]);

  const handleAlarmPreview = useCallback(() => {
    playAlarmPreview(selectedAlarm);
  }, [selectedAlarm]);

  return (
    <div className="timer-container">
      <div className="date-display">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
      <h1>🕐 指定時刻通知タイマー</h1>

      <div className="timer-mode">
        <CircularProgress
          timeLeft={timeLeft}
          totalTime={15 * 60}
          isCountdown={false}
          isRunning={isScheduledRunning}
          isAchieved={isAchieved}
          isStarting={timeLeft === null}
        />

        {!isScheduledRunning && (
          <div className="timer-input-container">
            <div className="alarm-selector">
              <select
                id="alarm-select"
                value={selectedAlarm}
                onChange={(e) => setSelectedAlarm(e.target.value)}
                disabled={isScheduledRunning}
                className="alarm-select"
              >
                <option value="beep">ビープ音</option>
                <option value="low">低いビープ音</option>
                <option value="phone">電話音</option>
                <option value="pulse">パルス音</option>
                <option value="ascending">上昇音</option>
              </select>
              <button
                onClick={handleAlarmPreview}
                disabled={isScheduledRunning}
                className="btn-play"
                title="5秒間プレビュー"
              >
                ▶
              </button>
            </div>

            <div className="timer-input">
              {/* TODO: Improve accessibility - add aria-labels to buttons and support keyboard navigation */}
              <div className="time-input-group">
                <button className="time-adjust-btn" onClick={() => incrementTime('hour')}>+</button>
                <div className="time-display">{targetHour}</div>
                <button className="time-adjust-btn" onClick={() => decrementTime('hour')}>−</button>
              </div>
              <span className="time-separator">:</span>
              <div className="time-input-group">
                <button className="time-adjust-btn" onClick={() => incrementTime('minute')}>+</button>
                <div className="time-display">{targetMinute}</div>
                <button className="time-adjust-btn" onClick={() => decrementTime('minute')}>−</button>
              </div>
              <span className="time-separator">:</span>
              <div className="time-input-group">
                <button className="time-adjust-btn" onClick={() => incrementTime('second')}>+</button>
                <div className="time-display">{targetSecond}</div>
                <button className="time-adjust-btn" onClick={() => decrementTime('second')}>−</button>
              </div>
            </div>
            <button
              onClick={handleStart}
              disabled={isScheduledRunning}
              className="btn btn-start"
            >
              開始
            </button>
          </div>
        )}

        <div className="timer-controls">
          {isScheduledRunning && (
            <button
              onClick={handleStop}
              disabled={!isScheduledRunning}
              className="btn btn-pause"
            >
              停止
            </button>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>{modalMessage}</p>
            <button onClick={handleModalOk} className="btn btn-start">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
