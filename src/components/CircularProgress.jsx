
import { formatTime } from '../utils/timeUtils';

const CircularProgress = ({
  timeLeft,
  totalTime,
  isCountdown = false,
  isRunning = false,
  isAchieved = false,
  isStarting = false
}) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  let progress = 0;
  let isWarning = false;

  // timeLeft が null の場合は計算用に 0 として扱う
  const displayTimeLeft = timeLeft ?? 0;

  // 表示ロジックを関数化して優先順位を明示
  const computeDisplay = () => {
    // isAchieved / 残り0 は最優先で "0" を表示
    if (isAchieved || timeLeft === 0) {
      return { element: <span>0</span>, isCountdown: true };
    }

    // 開始直後は "--:--"
    if (isStarting) {
      return { element: <span>--:--</span>, isCountdown: false };
    }

    // カウントダウン中の10〜1秒は秒数のみ表示（countdown クラス）
    if (!isStarting && displayTimeLeft <= 10 && isRunning) {
      return { element: <span>{displayTimeLeft}</span>, isCountdown: true };
    }

    // 通常表示：timeLeft が null の場合は "--:--" を表示
    return { element: timeLeft !== null ? <span>{formatTime(displayTimeLeft)}</span> : <span>--:--</span>, isCountdown: false };
  };

  const { element: displayElement, isCountdown: isCountdownDisplay } = computeDisplay();

  if (isCountdown) {
    // カウントダウンモード：残り時間で計算
    progress = isAchieved ? 100 : (displayTimeLeft / totalTime) * 100;
  } else {
    // 指定時刻モード：15分間（900秒）から10秒前までの間で100%→0%
    const FIFTEEN_MINUTES = 15 * 60;
    const CRITICAL_TIME = 10;

    if (isAchieved || timeLeft === 0) {
      progress = 100;
    } else if (displayTimeLeft > CRITICAL_TIME && displayTimeLeft <= FIFTEEN_MINUTES) {
      isWarning = true;
      progress = ((displayTimeLeft - CRITICAL_TIME) / (FIFTEEN_MINUTES - CRITICAL_TIME)) * 100;
    } else if (displayTimeLeft <= CRITICAL_TIME && displayTimeLeft > 0) {
      // 10秒以下：赤いセグメントを表示
      progress = 25;
    } else {
      progress = displayTimeLeft <= 0 ? 0 : 100;
    }
  }

  const gapLength = ((100 - progress) / 100) * circumference;
  const activeLength = (progress / 100) * circumference;

  // 10秒以下の場合、赤色とアニメーションをつける
  const isCritical = displayTimeLeft <= 10 && displayTimeLeft > 0 && isRunning && !isAchieved;

  return (
    <div className={`circular-progress ${isWarning ? 'warning' : ''} ${isCritical ? 'critical' : ''} ${(isAchieved || timeLeft === 0) ? 'achieved' : ''}`}>
      <svg viewBox="0 0 200 200" className="progress-svg" role="img" style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          className="progress-background"
        />
        {/* Progress circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          className="progress-circle"
          style={{
            strokeDasharray: isCritical ? circumference : ((isAchieved || timeLeft === 0) ? circumference : `0 ${gapLength} ${activeLength} ${circumference}`),
            strokeDashoffset: isCritical ? circumference : 0,
          }}
        />
      </svg>
      <div className={`progress-text ${isCountdownDisplay ? 'countdown' : ''}`}>
        {displayElement}
      </div>
    </div>
  );
};

// 時間フォーマット関数は timeUtils.js からインポート済み

export default CircularProgress;