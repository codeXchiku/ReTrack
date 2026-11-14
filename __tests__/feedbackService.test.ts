jest.mock('@/core/feedback', () => ({
  haptic: jest.fn(),
}));

import { eventBus } from '@/core/events';
import { haptic } from '@/core/feedback';
import { feedbackService } from '@/features/focus/services/feedbackService';

describe('feedbackService', () => {
  beforeEach(() => {
    feedbackService.destroy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    feedbackService.destroy();
  });

  it('triggers medium haptic on focus/phaseStarted', () => {
    feedbackService.init();

    eventBus.emit('focus/phaseStarted', {
      sessionId: 'sess-1',
      phase: 'focus',
      endsAt: Date.now() + 1500000,
      silence: true,
    });

    expect(haptic).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledWith('medium');
  });

  it('triggers light haptic on focus/paused', () => {
    feedbackService.init();

    eventBus.emit('focus/paused', { sessionId: 'sess-1' });

    expect(haptic).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledWith('light');
  });

  it('triggers light haptic on focus/resumed', () => {
    feedbackService.init();

    eventBus.emit('focus/resumed', {
      sessionId: 'sess-1',
      phase: 'focus',
      endsAt: Date.now() + 1000000,
      silence: true,
    });

    expect(haptic).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledWith('light');
  });

  it('triggers light haptic on focus/stopped', () => {
    feedbackService.init();

    eventBus.emit('focus/stopped', { sessionId: 'sess-1' });

    expect(haptic).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledWith('light');
  });

  it('triggers success haptic on focus/finished when completed is true', () => {
    feedbackService.init();

    eventBus.emit('focus/finished', {
      sessionId: 'sess-1',
      focusedSecs: 1500,
      completed: true,
    });

    expect(haptic).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledWith('success');
  });

  it('does NOT trigger success haptic on focus/finished when completed is false', () => {
    feedbackService.init();

    eventBus.emit('focus/finished', {
      sessionId: 'sess-1',
      focusedSecs: 300,
      completed: false,
    });

    expect(haptic).not.toHaveBeenCalled();
  });

  it('does not double subscribe on multiple init calls', () => {
    feedbackService.init();
    feedbackService.init();

    eventBus.emit('focus/paused', { sessionId: 'sess-1' });

    expect(haptic).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes listeners on destroy', () => {
    feedbackService.init();
    feedbackService.destroy();

    eventBus.emit('focus/paused', { sessionId: 'sess-1' });

    expect(haptic).not.toHaveBeenCalled();
  });
});
