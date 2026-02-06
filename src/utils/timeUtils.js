// 時間関連のユーティリティ関数
export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // 1時間以上は分と時のみ表示（秒は表示しない）
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  // 1時間未満は分と秒を表示
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
  let secondsLeft = targetSeconds - currentSeconds;

  if (secondsLeft <= 0) {
    secondsLeft += TWELVE_HOURS;
  } else if (secondsLeft > TWELVE_HOURS) {
    secondsLeft -= TWELVE_HOURS;
  }

  return secondsLeft;
};