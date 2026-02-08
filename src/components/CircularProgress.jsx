
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

  if (isCountdown) {
    // カウントダウンモード：残り時間で計算
    progress = (displayTimeLeft / totalTime) * 100;
  } else {
    // 指定時刻モード：15分以下の時のみプログレス表示
    const FIFTEEN_MINUTES = 15 * 60;
    if (displayTimeLeft <= FIFTEEN_MINUTES) {
      isWarning = true;
      progress = (displayTimeLeft / FIFTEEN_MINUTES) * 100;
    } else {
      progress = 100;
    }

    // 10秒以下の時は秒数のみを表示（タイマーが実行中の場合のみ）
    if (displayTimeLeft <= 10 && isRunning) {
      displayElement = <span>{displayTimeLeft}</span>;
      isCountdownDisplay = true;
    }
  }

  const strokeDashoffset = (progress / 100) * circumference;

  return (
    <div className={`circular-progress ${isWarning ? 'warning' : ''} ${isAchieved ? 'achieved' : ''}`}>
      <svg viewBox="0 0 200 200" className="progress-svg">
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
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
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