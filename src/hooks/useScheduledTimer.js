import { useCallback, useEffect, useRef, useState } from 'react';
import { playAlarmSound } from '../utils/alarmSounds';
import { calculateTargetTimeInSeconds, calculateTimeLeft } from '../utils/timeUtils';

// Notification threshold constants
const NOTIFICATION_THRESHOLDS = {
  FIFTEEN_MIN: 15 * 60,        // 15 minutes in seconds
  FIVE_MIN: 5 * 60,            // 5 minutes in seconds
  PRE_15_TARGET: 900,          // Trigger 15-minute notification when crossing 900s
  PRE_5_TARGET: 300,           // Trigger 5-minute notification when crossing 300s
  COMPLETION: 0,               // Trigger completion notification at 0 seconds
  ALARM_DURATION: 3,           // Alarm sound duration in seconds (short playback requested)
  AUTO_RESTART_DELAY: 5 * 60,  // Delay before auto-restart in seconds
  ACHIEVEMENT_DISPLAY: 10,     // Duration to display achievement in seconds
};

export const useScheduledTimer = (targetHour, targetMinute, targetSecond, alarmType = 'phone') => {
  const [scheduledTimeLeft, setScheduledTimeLeft] = useState(() => {
    const now = new Date();
    const timeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const targetInSeconds = calculateTargetTimeInSeconds(targetHour, targetMinute, targetSecond);
    return calculateTimeLeft(targetInSeconds, timeInSeconds);
  });
  const [isAchieved, setIsAchieved] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const notificationRef = useRef({
    prev15min: null,
    prev5min: null,
    prevFinal: null,
    prevSecondsLeft: null,
    isFirstUpdate: true,
  });
  const animationTimeoutRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const alarmStopTimeoutRef = useRef(null);
  const autoRestartTimeoutRef = useRef(null);
  const autoRestartStartTimeoutRef = useRef(null);

  const playNotification = useCallback((message = 'Complete', alarmType = 'beep', showBrowserNotification = true) => {
    // Send browser notification only if enabled and permission is granted
    if (showBrowserNotification && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Timer', {
          body: message,
          icon: '⏰',
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }

    // AudioContext is managed in alarmSounds.js, just play the sound
    playAlarmSound(null, alarmType);
  }, []);

  const stopAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (alarmStopTimeoutRef.current) {
      clearTimeout(alarmStopTimeoutRef.current);
      alarmStopTimeoutRef.current = null;
    }
  };

  const startAlarmForDuration = useCallback((durationSeconds, alarmTypeToUse, message) => {
    stopAlarm();

    if (message) {
      playNotification(message, alarmTypeToUse, true);
    }

    const intervalMs = 900; // spacing between sound plays
    const startTime = Date.now();

    // play immediately and then at intervals until duration elapses
    playNotification('', alarmTypeToUse, false);
    alarmIntervalRef.current = setInterval(() => {
      if (Date.now() - startTime >= durationSeconds * 1000) {
        stopAlarm();
        setShowModal(false);
        return;
      }
      playNotification('', alarmTypeToUse, false);
    }, intervalMs);

    if (alarmStopTimeoutRef.current) {
      clearTimeout(alarmStopTimeoutRef.current);
    }
    alarmStopTimeoutRef.current = setTimeout(() => {
      stopAlarm();
      setShowModal(false);
      if (alarmStopTimeoutRef.current) {
        clearTimeout(alarmStopTimeoutRef.current);
        alarmStopTimeoutRef.current = null;
      }
    }, durationSeconds * 1000);
  }, [playNotification]);

  const handleModalOk = () => {
    stopAlarm();
    setShowModal(false);
  };

  // Initialize notification permission and state on mount/target changes
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        notificationRef.current.permission = true;
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission()
          .then((permission) => {
            notificationRef.current.permission = permission === 'granted';
          })
          .catch((error) => {
            console.error('Notification permission request failed:', error);
            notificationRef.current.permission = false;
          });
      } else {
        notificationRef.current.permission = false;
      }
    } else {
      console.warn('Notifications not supported in this browser');
      notificationRef.current.permission = false;
    }

    const now = new Date();
    const timeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const targetInSeconds = calculateTargetTimeInSeconds(targetHour, targetMinute, targetSecond);

    notificationRef.current = {
      prev15min: null,
      prev5min: null,
      prevFinal: null,
      prevDiff: targetInSeconds - timeInSeconds,
      permission: notificationRef.current.permission,
      isFirstUpdate: false,
    };
  }, [targetHour, targetMinute, targetSecond]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // すべてのタイマーをクリア
      const alarmInterval = alarmIntervalRef.current;
      if (alarmInterval) {
        clearInterval(alarmInterval);
      }
      const alarmStopTimeout = alarmStopTimeoutRef.current;
      if (alarmStopTimeout) {
        clearTimeout(alarmStopTimeout);
      }
      const animationTimeout = animationTimeoutRef.current;
      if (animationTimeout) {
        clearTimeout(animationTimeout);
      }
      const autoRestartTimeout = autoRestartTimeoutRef.current;
      if (autoRestartTimeout) {
        clearTimeout(autoRestartTimeout);
      }
      const autoRestartStartTimeout = autoRestartStartTimeoutRef.current;
      if (autoRestartStartTimeout) {
        clearTimeout(autoRestartStartTimeout);
      }
    };
  }, []);

  // Scheduled timer
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const timeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const targetInSeconds = calculateTargetTimeInSeconds(targetHour, targetMinute, targetSecond);

      const secondsLeft = calculateTimeLeft(targetInSeconds, timeInSeconds);

      // 秒数を更新（isAchievedでも更新する）
      setScheduledTimeLeft(secondsLeft);

      // 15分前の通知をトリガー
      if (
        secondsLeft <= NOTIFICATION_THRESHOLDS.FIFTEEN_MIN &&
        notificationRef.current.prev15min !== NOTIFICATION_THRESHOLDS.PRE_15_TARGET
      ) {
        notificationRef.current.prev15min = NOTIFICATION_THRESHOLDS.PRE_15_TARGET;
        setShowModal(true);
        // 設定されたアラーム音で再生（短時間）
        startAlarmForDuration(NOTIFICATION_THRESHOLDS.ALARM_DURATION, alarmType, '15分前です');
      }

      // 5分前の通知をトリガー
      if (
        secondsLeft <= NOTIFICATION_THRESHOLDS.FIVE_MIN &&
        notificationRef.current.prev5min !== NOTIFICATION_THRESHOLDS.PRE_5_TARGET
      ) {
        notificationRef.current.prev5min = NOTIFICATION_THRESHOLDS.PRE_5_TARGET;
        setShowModal(true);
        startAlarmForDuration(NOTIFICATION_THRESHOLDS.ALARM_DURATION, alarmType, '5分前です');
      }

      // 目標時刻に到達したらisAchievedをtrueにする（横切り検出でのみトリガー）
      const diff = targetInSeconds - timeInSeconds;
      const prevDiff = notificationRef.current.prevDiff ?? Number.POSITIVE_INFINITY;
      // トリガーは「前回は正、今回が0以下」のときのみ（＝時刻を横切った瞬間）に限定
      if (prevDiff > 0 && diff <= 0 && notificationRef.current.prevFinal !== NOTIFICATION_THRESHOLDS.COMPLETION) {
        notificationRef.current.prevFinal = NOTIFICATION_THRESHOLDS.COMPLETION;
        setIsAchieved(true);

        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = setTimeout(() => {
          setIsAchieved(false);
          notificationRef.current = {
            prev15min: NOTIFICATION_THRESHOLDS.PRE_15_TARGET,
            prev5min: NOTIFICATION_THRESHOLDS.PRE_5_TARGET,
            prevFinal: NOTIFICATION_THRESHOLDS.COMPLETION,
            prevSecondsLeft: null,
            prevDiff: null,
          };

          // 5分待機してから次サイクルの差分を初期化
          if (autoRestartTimeoutRef.current) {
            clearTimeout(autoRestartTimeoutRef.current);
          }
          autoRestartTimeoutRef.current = setTimeout(() => {
            const restartNow = new Date();
            const restartSeconds = restartNow.getHours() * 3600 + restartNow.getMinutes() * 60 + restartNow.getSeconds();
            const restartTarget = calculateTargetTimeInSeconds(targetHour, targetMinute, targetSecond);
            notificationRef.current = {
              prev15min: null,
              prev5min: null,
              prevFinal: null,
              prevSecondsLeft: null,
              prevDiff: restartTarget - restartSeconds,
              permission: notificationRef.current.permission,
              isFirstUpdate: false,
            };
          }, NOTIFICATION_THRESHOLDS.AUTO_RESTART_DELAY * 1000);
        }, NOTIFICATION_THRESHOLDS.ACHIEVEMENT_DISPLAY * 1000);
      }

      // diff を保存して次回判定に使う
      notificationRef.current.prevDiff = diff;
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetHour, targetMinute, targetSecond, isAchieved, startAlarmForDuration, alarmType]);

  return {
    scheduledTimeLeft,
    isAchieved,
    showModal,
    handleModalOk,
  };
};