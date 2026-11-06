import { clearEventBus, emit, off, on } from '@/core/events/bus';

describe('EventBus', () => {
  beforeEach(() => {
    clearEventBus();
  });

  it('delivers payloads to all registered handlers', () => {
    const received1: string[] = [];
    const received2: string[] = [];

    on('focus/paused', payload => {
      received1.push(payload.sessionId);
    });

    on('focus/paused', payload => {
      received2.push(payload.sessionId);
    });

    emit('focus/paused', { sessionId: 's-123' });

    expect(received1).toEqual(['s-123']);
    expect(received2).toEqual(['s-123']);
  });

  it('unsubscribes via returned function', () => {
    const received: string[] = [];
    const unsubscribe = on('focus/paused', payload => {
      received.push(payload.sessionId);
    });

    emit('focus/paused', { sessionId: 's-1' });
    unsubscribe();
    emit('focus/paused', { sessionId: 's-2' });

    expect(received).toEqual(['s-1']);
  });

  it('unsubscribes via off function', () => {
    const received: string[] = [];
    const handler = (payload: { sessionId: string }) => {
      received.push(payload.sessionId);
    };

    on('focus/paused', handler);
    emit('focus/paused', { sessionId: 's-1' });
    off('focus/paused', handler);
    emit('focus/paused', { sessionId: 's-2' });

    expect(received).toEqual(['s-1']);
  });

  it('a throwing handler does not block other handlers', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const received: string[] = [];

    on('focus/stopped', () => {
      throw new Error('Boom in handler 1');
    });

    on('focus/stopped', payload => {
      received.push(payload.sessionId);
    });

    expect(() => {
      emit('focus/stopped', { sessionId: 'sess-abc' });
    }).not.toThrow();

    expect(received).toEqual(['sess-abc']);
    errorSpy.mockRestore();
  });

  it('emit with no handlers is safe', () => {
    expect(() => {
      emit('cards/changed', { subjectId: null });
    }).not.toThrow();
  });
});

