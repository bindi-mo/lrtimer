import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTimerContext } from '../contexts/TimerContext';
import { useScheduledTimer } from '../hooks/useScheduledTimer';
import '../styles/Timer.css';
import { playAlarmPreview } from '../utils/alarmSounds';
import CircularProgress from './CircularProgress';
import { MinusIcon, PlusIcon } from './TimeAdjustIcon';

export default function Timer() {
  // Scheduled mode states
  const [targetHour, setTargetHour] = useState('19');
  const [targetMinute, setTargetMinute] = useState('00');
  const [targetSecond, setTargetSecond] = useState('00');
  const [selectedAlarm, setSelectedAlarm] = useState('beep');
  // 初回起動時は時刻設定を表示する
  const [isEditMode, setIsEditMode] = useState(true);

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

  // モーダルが閉じられたときにタイマーを開始、開かれたときは停止
  useEffect(() => {
    if (isEditMode) {
      // 時刻設定モーダルが開かれたのでタイマーを停止
      if (isScheduledRunning) {
        handleStop();
      }
    } else {
      // 時刻設定モーダルが閉じられたのでタイマーを開始
      if (!isScheduledRunning) {
        handleStart();
      }
    }
  }, [isEditMode, isScheduledRunning, handleStart, handleStop]);

  // メモ化された計算値
  const timeLeft = useMemo(() => {
    return scheduledTimeLeft;
  }, [scheduledTimeLeft]);

  // 12時間後の時間を計算
  const next12HourTime = useMemo(() => {
    const hour = (parseInt(targetHour) + 12) % 24;
    return `${String(hour).padStart(2, '0')}:${targetMinute}:${targetSecond}`;
  }, [targetHour, targetMinute, targetSecond]);

  // コールバック関数をメモ化
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

  const { globalSettings, updateSettings } = useTimerContext();

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
                <div className="time-display-large">
                  {targetHour}:{targetMinute}:{targetSecond}
                </div>
                <div className="time-display-large">
                  {next12HourTime}
                </div>
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
                    <label htmlFor="alarm-select">アラーム音:</label>
                    <select
                      id="alarm-select"
                      value={selectedAlarm}
                      onChange={(e) => {
                        setSelectedAlarm(e.target.value);
                        playAlarmPreview(e.target.value);
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
              <div className="time-display-large">
                {targetHour}:{targetMinute}:{targetSecond}
              </div>
              <div className="time-display-large">
                {next12HourTime}
              </div>
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
                        playAlarmPreview(e.target.value);
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
