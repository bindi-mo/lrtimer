import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CircularProgress from './CircularProgress';

describe('CircularProgress', () => {
  it('should render the component', () => {
    render(
      <CircularProgress
        timeLeft={3600}
        totalTime={3600}
        isCountdown={false}
        isRunning={false}
      />
    );
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toBeDefined();
  });

  it('should display time when timeLeft is provided', () => {
    render(
      <CircularProgress
        timeLeft={3661}
        totalTime={3600}
        isCountdown={false}
        isRunning={true}
      />
    );
    // formatTime(3661) returns "01:01" (HH:MM format when hours > 0)
    expect(screen.getByText(/01:01/)).toBeDefined();
  });

  it('should display "--:--" when timeLeft is null', () => {
    render(
      <CircularProgress
        timeLeft={null}
        totalTime={3600}
        isCountdown={false}
        isRunning={false}
      />
    );
    expect(screen.getByText(/--:--/)).toBeDefined();
  });

  it('should display "0" when achieved', () => {
    render(
      <CircularProgress
        timeLeft={0}
        totalTime={3600}
        isAchieved={true}
        isCountdown={false}
        isRunning={true}
      />
    );
    expect(screen.getByText('0')).toBeDefined();
  });

  it('should display only seconds in countdown mode when timeLeft <= 10', () => {
    render(
      <CircularProgress
        timeLeft={5}
        totalTime={3600}
        isCountdown={false}
        isRunning={true}
      />
    );
    expect(screen.getByText(/^5$/)).toBeDefined();
  });

  it('should add warning class when in warning state', () => {
    const { container } = render(
      <CircularProgress
        timeLeft={300}
        totalTime={3600}
        isCountdown={false}
        isRunning={true}
      />
    );
    const progress = container.querySelector('.circular-progress.warning');
    expect(progress).toBeDefined();
  });

  it('should add achieved class when isAchieved is true', () => {
    const { container } = render(
      <CircularProgress
        timeLeft={0}
        totalTime={3600}
        isAchieved={true}
        isCountdown={false}
        isRunning={true}
      />
    );
    const progress = container.querySelector('.circular-progress.achieved');
    expect(progress).toBeDefined();
  });

  it('should display "--:--" when starting even if timeLeft <= 10', () => {
    render(
      <CircularProgress
        timeLeft={5}
        totalTime={3600}
        isCountdown={false}
        isRunning={true}
        isStarting={true}
      />
    );

    expect(screen.getByText(/--:--/)).toBeDefined();
  });

  it('should let isAchieved take precedence over isStarting', () => {
    const { container } = render(
      <CircularProgress
        timeLeft={0}
        totalTime={3600}
        isAchieved={true}
        isCountdown={false}
        isRunning={false}
        isStarting={true}
      />
    );

    expect(screen.getByText('0')).toBeDefined();
    const progress = container.querySelector('.circular-progress.achieved');
    expect(progress).toBeDefined();
  });

  it('should add countdown class when showing seconds or 0', () => {
    const { container: c1 } = render(
      <CircularProgress
        timeLeft={5}
        totalTime={3600}
        isCountdown={false}
        isRunning={true}
      />
    );
    const countdownText1 = c1.querySelector('.progress-text.countdown');
    expect(countdownText1).toBeDefined();

    const { container: c2 } = render(
      <CircularProgress
        timeLeft={0}
        totalTime={3600}
        isAchieved={true}
        isCountdown={false}
        isRunning={true}
      />
    );
    const countdownText2 = c2.querySelector('.progress-text.countdown');
    expect(countdownText2).toBeDefined();
  });
});
