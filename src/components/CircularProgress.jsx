
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
  const displayTimeLeft = timeLeft !== null ? timeLeft : 0;

  // 開始直後は "--:--" を表示（isStarting = true）
  let displayElement = isStarting ? <span>--:--</span> : (timeLeft !== null && timeLeft !== 0 ? <span>{formatTime(displayTimeLeft)}</span> : <span>--:--</span>);

  // カウントダウン中の表示用（別変数）
  let isCountdownDisplay = false;

  // 開始後、カウントダウン中の10-0秒は秒数のみを表示（countdownクラスを追加）
  if (!isStarting && displayTimeLeft <= 10 && isRunning) {
    displayElement = <span>{displayTimeLeft}</span>;
    isCountdownDisplay = true;
  }

  // isAchieved（0秒で点滅中）の場合は強制的に "0" を表示
  if (isAchieved) {
    displayElement = <span>0</span>;
    isCountdownDisplay = true;
  }

  if (isCountdown) {
    // カウントダウンモード：残り時間で計算
    progress = isAchieved ? 100 : (displayTimeLeft / totalTime) * 100;
  } else {
    // 指定時刻モード：15分間（900秒）から10秒前までの間で100%→0%
    const FIFTEEN_MINUTES = 15 * 60;
    const CRITICAL_TIME = 10;

    if (isAchieved) {
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
    <div className={`circular-progress ${isWarning ? 'warning' : ''} ${isCritical ? 'critical' : ''} ${isAchieved ? 'achieved' : ''}`}>
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
            strokeDasharray: isCritical ? circumference : (isAchieved ? circumference : `0 ${gapLength} ${activeLength} ${circumference}`),
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