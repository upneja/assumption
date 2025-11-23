import { vi } from 'vitest';
import { subscribeToRoom, subscribeToImposterRoom, unsubscribeFromRoom } from './realtime';

const store = vi.hoisted(() => ({
  listeners: {} as Record<string, ((payload: any) => void)[]>,
  subscribeCallback: null as ((status: string) => void) | null,
  removeChannel: vi.fn(),
  send: vi.fn(),
  channel: null as any,
  supabase: null as any,
}));

vi.mock('@/lib/supabaseClient', () => {
  store.listeners = {};
  store.subscribeCallback = null;
  store.removeChannel = vi.fn();
  store.send = vi.fn(async ({ event, payload }: { event: string; payload: any }) => {
    store.listeners[event]?.forEach((handler) => handler({ payload }));
    return { status: 'ok' };
  });
  store.channel = {
    on: vi.fn((_type: string, filter: { event: string }, handler: any) => {
      store.listeners[filter.event] = store.listeners[filter.event] || [];
      store.listeners[filter.event].push(handler);
      return store.channel;
    }),
    subscribe: vi.fn((cb?: (status: string) => void) => {
      store.subscribeCallback = cb || null;
      cb?.('SUBSCRIBED');
      return { status: 'SUBSCRIBED' };
    }),
    send: store.send,
  };
  store.supabase = {
    channel: vi.fn(() => store.channel),
    removeChannel: store.removeChannel,
  };

  return {
    supabase: store.supabase,
    __mocks: store,
  };
});

const supabaseModule = await import('@/lib/supabaseClient');
const realtimeMocks = (supabaseModule as { __mocks: typeof store }).__mocks;

describe('realtime', () => {
  beforeEach(() => {
    Object.keys(realtimeMocks.listeners).forEach((key) => delete realtimeMocks.listeners[key]);
    vi.clearAllMocks();
    realtimeMocks.subscribeCallback = null;
  });

  it('subscribes and dispatches room updates', () => {
    const onRoomUpdate = vi.fn();
    const unsubscribe = subscribeToRoom('ROOM', { onRoomUpdate });
    expect(realtimeMocks.supabase.channel).toHaveBeenCalledWith('room:ROOM', expect.anything());

    realtimeMocks.listeners['room_updated']?.[0]?.({ payload: { room: { id: 'r1' } } });
    expect(onRoomUpdate).toHaveBeenCalledWith({ id: 'r1' });

    unsubscribe();
    expect(realtimeMocks.removeChannel).toHaveBeenCalled();
  });

  it('handles imposter channel events', () => {
    const onRoundResult = vi.fn();
    subscribeToImposterRoom('ROOM', { onRoundResult });
    realtimeMocks.listeners['imposter_round_result']?.[0]?.({
      payload: { result: { eliminatedPlayerId: 'p1' } },
    });
    expect(onRoundResult).toHaveBeenCalledWith({ eliminatedPlayerId: 'p1' });
  });

  it('calls error callback on channel error', () => {
    const onError = vi.fn();
    subscribeToRoom('ROOM', { onError });
    realtimeMocks.subscribeCallback?.('CHANNEL_ERROR');
    expect(onError).toHaveBeenCalledWith(new Error('Failed to connect to realtime channel'));
  });
});
