import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playAlarmSound } from '../utils/alarmSounds';
import { calculateTargetTimeInSeconds, calculateTimeLeft } from '../utils/timeUtils';

// TODO: Refactor code - consolidate constants, unify comments to English, remove unused variables
// 定数定義
const TWELVE_HOURS = 12 * 3600;
const FIFTEEN_MINUTES = 15 * 60;
const FIVE_MINUTES = 5 * 60;

// 通知しきい値の定数
const NOTIFICATION_THRESHOLDS = {
  FIFTEEN_MIN: 15 * 60,        // 15分前
  FIVE_MIN: 5 * 60,            // 5分前
  COUNTDOWN: 10,               // カウントダウン開始秒数
  PRE_15_TRIGGER: 901,         // 15分前通知トリガー (901秒 → 900秒)
  PRE_15_TARGET: 900,          // 15分前通知ターゲット
  PRE_5_TRIGGER: 301,          // 5分前通知トリガー (301秒 → 300秒)
  PRE_5_TARGET: 300,           // 5分前通知ターゲット
  COMPLETION: 0,               // 完了時刻
  ALARM_DURATION: 15,          // アラーム継続時間（秒）
  AUTO_RESTART_DELAY: 5 * 60,  // 自動再開までの待機時間（秒）
  ACHIEVEMENT_DISPLAY: 15,     // 完了表示時間（秒）
};

export const useScheduledTimer = (targetHour, targetMinute, targetSecond) => {
  const [scheduledTimeLeft, setScheduledTimeLeft] = useState(0);
  const [isScheduledRunning, setIsScheduledRunning] = useState(false);
  const [isAchieved, setIsAchieved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // 開始前の残り時間を計算
  const initialTimeLeft = useMemo(() => {
    const now = new Date();
    const timeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const targetInSeconds = calculateTargetTimeInSeconds(targetHour, targetMinute, targetSecond);
    return calculateTimeLeft(targetInSeconds, timeInSeconds);
  }, [targetHour, targetMinute, targetSecond]);

  const notificationRef = useRef({
    prev15min: null,
    prev5min: null,
    prevFinal: null,
    prevSecondsLeft: null,
    isFirstUpdate: true,
  });
  const animationTimeoutRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const autoRestartTimeoutRef = useRef(null);
  const autoRestartStartTimeoutRef = useRef(null);

  const playNotification = (message = '完了', alarmType = 'beep', showBrowserNotification = true) => {
    // ブラウザ通知が有効な場合のみ送信
    if (showBrowserNotification && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('タイマー', {
          body: message,
          icon: '⏰',
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }

    // AudioContextはalarmSounds.jsで管理されるため、ここでは直接使用しない
    playAlarmSound(null, alarmType);
  };

  const stopAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  };

  const startAlarmForDuration = useCallback((durationSeconds, alarmType) => {
    stopAlarm();

    playNotification('15分前です', alarmType, true);

    alarmIntervalRef.current = setInterval(() => {
      playNotification('', alarmType, false);
      stopAlarm();
      setShowModal(false);
    }, NOTIFICATION_THRESHOLDS.ALARM_DURATION * 1000);
  }, []);

  const handleModalOk = () => {
    stopAlarm();
    setShowModal(false);
  };

  const handleStart = () => {
    // Fixed: Add error handling for Notification permission denials
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        notificationRef.current.permission = true;
      } else if (Notification.permission !== 'denied') {
        // ユーザーまだ選択していない場合のみ要求
        Notification.requestPermission()
          .then((permission) => {
            notificationRef.current.permission = permission === 'granted';
          })
          .catch((error) => {
            console.error('Notification permission request failed:', error);
            notificationRef.current.permission = false;
          });
      } else {
        // ユーザーが拒否している
        notificationRef.current.permission = false;
      }
    } else {
      console.warn('Notifications not supported in this browser');
      notificationRef.current.permission = false;
    }

    notificationRef.current = {
      prev15min: null,
      prev5min: null,
      prevFinal: null,
      permission: notificationRef.current.permission,
      isFirstUpdate: false,
    };
    setIsScheduledRunning(true);
  };

  const handleStop = () => {
    setIsScheduledRunning(false);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // すべてのタイマーをクリア
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (autoRestartTimeoutRef.current) {
        clearTimeout(autoRestartTimeoutRef.current);
      }
      if (autoRestartStartTimeoutRef.current) {
        clearTimeout(autoRestartStartTimeoutRef.current);
      }
    };
  }, []);

  // 開始前に残り時間をリアルタイム更新
  useEffect(() => {
    if (!isScheduledRunning) {
      // 初回計算を遅延実行（マウント直後）
      const initialTimeout = setTimeout(() => {
        const now = new Date();
        const timeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const targetInSeconds = calculateTargetTimeInSeconds(targetHour, targetMinute, targetSecond);
        const newTimeLeft = calculateTimeLeft(targetInSeconds, timeInSeconds);
        setScheduledTimeLeft(newTimeLeft);
      }, 0);

      const interval = setInterval(() => {
        const now = new Date();
        const timeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const targetInSeconds = calculateTargetTimeInSeconds(targetHour, targetMinute, targetSecond);
        const newTimeLeft = calculateTimeLeft(targetInSeconds, timeInSeconds);
        setScheduledTimeLeft(newTimeLeft);
      }, 1000);
      return () => {
        clearTimeout(initialTimeout);
        clearInterval(interval);
      };
    }
  }, [isScheduledRunning, targetHour, targetMinute, targetSecond]);

  // Scheduled timer
  useEffect(() => {
    let interval;

    if (isScheduledRunning && !isAchieved) {
      interval = setInterval(() => {
        const now = new Date();
        const timeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const targetInSeconds = calculateTargetTimeInSeconds(targetHour, targetMinute, targetSecond);

        let secondsLeft = targetInSeconds - timeInSeconds;

        if (secondsLeft < 0) {
          secondsLeft += TWELVE_HOURS;
        }

        if (!notificationRef.current.isFirstUpdate) {
          setScheduledTimeLeft(secondsLeft);
        } else {
          notificationRef.current.isFirstUpdate = false;
        }

        // Fixed: Relax strict second-based comparisons to prevent missed notifications
        // 前のフレームが閾値以上で、現在のフレームが閾値以下の場合に通知をトリガー
        // 15分前の通知（901秒 → 900秒以下に到達したら発動）
        if ((notificationRef.current.prevSecondsLeft === null || notificationRef.current.prevSecondsLeft > NOTIFICATION_THRESHOLDS.PRE_15_TARGET) &&
            secondsLeft <= NOTIFICATION_THRESHOLDS.PRE_15_TARGET &&
            notificationRef.current.prev15min !== NOTIFICATION_THRESHOLDS.PRE_15_TARGET) {
          notificationRef.current.prev15min = NOTIFICATION_THRESHOLDS.PRE_15_TARGET;
          setModalMessage('15分前です');
          setShowModal(true);
          startAlarmForDuration(NOTIFICATION_THRESHOLDS.ALARM_DURATION, 'beep'); // 15秒間アラームを鳴らす
        }

        // 5分前の通知（301秒 → 300秒以下に到達したら発動）
        if ((notificationRef.current.prevSecondsLeft === null || notificationRef.current.prevSecondsLeft > NOTIFICATION_THRESHOLDS.PRE_5_TARGET) &&
            secondsLeft <= NOTIFICATION_THRESHOLDS.PRE_5_TARGET &&
            notificationRef.current.prev5min !== NOTIFICATION_THRESHOLDS.PRE_5_TARGET) {
          notificationRef.current.prev5min = NOTIFICATION_THRESHOLDS.PRE_5_TARGET;
          playNotification('5分前', 'beep');
        }

        notificationRef.current.prevSecondsLeft = secondsLeft;

        // 指定時刻（0秒以下に到達したら発動）
        if (secondsLeft <= NOTIFICATION_THRESHOLDS.COMPLETION && notificationRef.current.prevFinal !== NOTIFICATION_THRESHOLDS.COMPLETION) {
          notificationRef.current.prevFinal = NOTIFICATION_THRESHOLDS.COMPLETION;
          setIsAchieved(true);

          if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
          }
          animationTimeoutRef.current = setTimeout(() => {
            setIsAchieved(false);
            notificationRef.current = {
              prev15min: null,
              prev5min: null,
              prevFinal: null,
              prevSecondsLeft: null,
            };

          // Fixed: Add cleanup for setTimeout/setInterval on component unmount
            // 5分待機してから自動開始
            if (autoRestartTimeoutRef.current) {
              clearTimeout(autoRestartTimeoutRef.current);
            }
            autoRestartTimeoutRef.current = setTimeout(() => {
              setIsScheduledRunning(false);
              if (autoRestartStartTimeoutRef.current) {
                clearTimeout(autoRestartStartTimeoutRef.current);
              }
              autoRestartStartTimeoutRef.current = setTimeout(() => {
                handleStart();
              }, 100);
            }, NOTIFICATION_THRESHOLDS.AUTO_RESTART_DELAY * 1000);
          }, NOTIFICATION_THRESHOLDS.ACHIEVEMENT_DISPLAY * 1000);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isScheduledRunning, targetHour, targetMinute, targetSecond, isAchieved, startAlarmForDuration]);

  return {
    scheduledTimeLeft: isScheduledRunning ? scheduledTimeLeft : initialTimeLeft,
    isScheduledRunning,
    isAchieved,
    showModal,
    modalMessage,
    handleStart,
    handleStop,
    handleModalOk,
  };
};