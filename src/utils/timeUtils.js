// 時間関連のユーティリティ関数
export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // When showing hours and minutes (HH:MM) or minute-only (MM:00) we want to
  // display one minute more than the actual time. This is done by adding 60
  // seconds before computing the displayed hour/minute values.
  const needsMinuteRounding = hours > 0 || minutes >= 15;
  if (needsMinuteRounding) {
    const ADJ = (seconds + 60) % (24 * 3600);
    const adjHours = Math.floor(ADJ / 3600);
    const adjMinutes = Math.floor((ADJ % 3600) / 60);

    if (adjHours > 0) {
      return `${String(adjHours).padStart(2, '0')}:${String(adjMinutes).padStart(2, '0')}`;
    }

    // hours === 0, show minutes only as MM:00
    return `${String(adjMinutes).padStart(2, '0')}:00`;
  }

  // Less than 15 minutes (hours === 0): show MM:SS without rounding
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const calculateTargetTimeInSeconds = (hour, minute, second) => {
  const hours = Math.max(0, Math.min(23, parseInt(hour) || 0));
  const minutes = Math.max(0, Math.min(59, parseInt(minute) || 0));
  const seconds = Math.max(0, Math.min(59, parseInt(second) || 0));
  return hours * 3600 + minutes * 60 + seconds;
};

export const getCurrentTimeInSeconds = () => {
  const now = new Date();
  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
};

// 12時間周期での残り時間を計算
export const calculateTimeLeft = (targetSeconds, currentSeconds) => {
  const TWELVE_HOURS = 12 * 3600;

  // Normalize difference into (0, TWELVE_HOURS] so that an exact -12h difference
  // (e.g. target is 12 hours before current) results in TWELVE_HOURS instead
  // of 0 which would incorrectly indicate immediate completion.
  let secondsLeft = ((targetSeconds - currentSeconds) % TWELVE_HOURS + TWELVE_HOURS) % TWELVE_HOURS;

  // If modulo resulted in 0, the next occurrence is exactly TWELVE_HOURS away.
  if (secondsLeft === 0) secondsLeft = TWELVE_HOURS;

  return secondsLeft;
};