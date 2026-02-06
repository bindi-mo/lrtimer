import { useCallback, useMemo, useState } from 'react';
import { useScheduledTimer } from '../hooks/useScheduledTimer';
import '../styles/Timer.css';
import { playAlarmPreview } from '../utils/alarmSounds';
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
  // Fixed: useMemo dependency array - scheduledTimeLeft is updated in real-time within useScheduledTimer
  // currentTimeInSeconds is not needed here, as useScheduledTimer manages real-time updates
  const timeLeft = useMemo(() => {
    if (!isScheduledRunning) {
      return scheduledTimeLeft; // 開始前はscheduledTimeLeftを使う（useScheduledTimer内でリアルタイム更新）
    }
    return scheduledTimeLeft; // 実行中もscheduledTimeLeftを使う（1秒ごと更新）
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
              <label htmlFor="alarm-select">アラーム音:</label>
              <select
                id="alarm-select"
                value={selectedAlarm}
                onChange={(e) => setSelectedAlarm(e.target.value)}
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
              <button
                onClick={handleAlarmPreview}
                disabled={isScheduledRunning}
                className="btn-play"
                aria-label="選択したアラーム音を5秒間プレビュー"
              >
                ▶
              </button>
            </div>

            <div className="timer-input">
              {/* Improved accessibility - added aria-labels and keyboard navigation support */}
              <div className="time-input-group">
                <button
                  className="time-adjust-btn"
                  onClick={() => incrementTime('hour')}
                  aria-label="時を増加"
                >
                  +
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
                  −
                </button>
              </div>
              <span className="time-separator" aria-hidden="true">:</span>
              <div className="time-input-group">
                <button
                  className="time-adjust-btn"
                  onClick={() => incrementTime('minute')}
                  aria-label="分を増加"
                >
                  +
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
                  −
                </button>
              </div>
              <span className="time-separator" aria-hidden="true">:</span>
              <div className="time-input-group">
                <button
                  className="time-adjust-btn"
                  onClick={() => incrementTime('second')}
                  aria-label="秒を増加"
                >
                  +
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
                  −
                </button>
              </div>
            </div>
            <button
              onClick={handleStart}
              disabled={isScheduledRunning}
              className="btn btn-start"
              aria-label="指定時刻のタイマーを開始"
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
              aria-label="タイマーを停止"
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
