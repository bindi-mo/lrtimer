import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playAlarmSound } from '../utils/alarmSounds';
import { calculateTargetTimeInSeconds, calculateTimeLeft } from '../utils/timeUtils';

// Constants for time calculations
const TWELVE_HOURS = 12 * 3600;

// Notification threshold constants
const NOTIFICATION_THRESHOLDS = {
  FIFTEEN_MIN: 15 * 60,        // 15 minutes in seconds
  FIVE_MIN: 5 * 60,            // 5 minutes in seconds
  PRE_15_TARGET: 900,          // Trigger 15-minute notification when crossing 900s
  PRE_5_TARGET: 300,           // Trigger 5-minute notification when crossing 300s
  COMPLETION: 0,               // Trigger completion notification at 0 seconds
  ALARM_DURATION: 15,          // Alarm sound duration in seconds
  AUTO_RESTART_DELAY: 5 * 60,  // Delay before auto-restart in seconds
  ACHIEVEMENT_DISPLAY: 10,     // Duration to display achievement in seconds
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

  const playNotification = (message = 'Complete', alarmType = 'beep', showBrowserNotification = true) => {
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
  };

  const stopAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  };

  const startAlarmForDuration = useCallback((durationSeconds, alarmType) => {
    stopAlarm();

    playNotification('15 minutes remaining', alarmType, true);

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
        // Request permission only if user hasn't made a choice yet
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

  // Update time remaining before timer starts
  useEffect(() => {
    if (!isScheduledRunning) {
      // Defer initial calculation to next tick (after mount)
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

    if (isScheduledRunning) {
      interval = setInterval(() => {
        const now = new Date();
        const timeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const targetInSeconds = calculateTargetTimeInSeconds(targetHour, targetMinute, targetSecond);

        const secondsLeft = calculateTimeLeft(targetInSeconds, timeInSeconds);

        // 秒数を更新（isAchievedでも更新する）
        setScheduledTimeLeft(secondsLeft);

        // 目標時刻に到達したらisAchievedをtrueにする
        const diff = targetInSeconds - timeInSeconds;
        if (diff <= 0 && notificationRef.current.prevFinal !== NOTIFICATION_THRESHOLDS.COMPLETION) {
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