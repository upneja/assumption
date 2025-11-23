import { vi } from 'vitest';
import { subscribeToRoom, subscribeToImposterRoom, unsubscribeFromRoom } from './realtime';

let listeners: Record<string, ((payload: any) => void)[]>;
let removeChannel: ReturnType<typeof vi.fn>;
let send: ReturnType<typeof vi.fn>;
let channel: any;
let supabase: any;
let getSubscribeCallback: () => ((status: string) => void) | null;
let setSubscribeCallback: (cb: ((status: string) => void) | null) => void;

vi.mock('@/lib/supabaseClient', () => {
  listeners = {};
  let subscribeCallback: ((status: string) => void) | null = null;
  removeChannel = vi.fn();
  send = vi.fn(async ({ event, payload }: { event: string; payload: any }) => {
    listeners[event]?.forEach((handler) => handler({ payload }));
    return { status: 'ok' };
  });
  channel = {
    on: vi.fn((_type: string, filter: { event: string }, handler: any) => {
      listeners[filter.event] = listeners[filter.event] || [];
      listeners[filter.event].push(handler);
      return channel;
    }),
    subscribe: vi.fn((cb?: (status: string) => void) => {
      subscribeCallback = cb || null;
      cb?.('SUBSCRIBED');
      return { status: 'SUBSCRIBED' };
    }),
    send,
  };
  supabase = {
    channel: vi.fn(() => channel),
    removeChannel,
  };
  getSubscribeCallback = () => subscribeCallback;
  setSubscribeCallback = (cb) => {
    subscribeCallback = cb;
  };
  return {
    supabase,
    __mocks: {
      listeners,
      channel,
      removeChannel,
      send,
      getSubscribeCallback,
      setSubscribeCallback,
    },
  };
});

const supabaseModule = await import('@/lib/supabaseClient');
const realtimeMocks = (supabaseModule as {
  __mocks: {
    listeners: typeof listeners;
    channel: any;
    removeChannel: typeof removeChannel;
    send: typeof send;
    getSubscribeCallback: typeof getSubscribeCallback;
    setSubscribeCallback: typeof setSubscribeCallback;
  };
}).__mocks;

describe('realtime', () => {
  beforeEach(() => {
    Object.keys(realtimeMocks.listeners).forEach((key) => delete realtimeMocks.listeners[key]);
    vi.clearAllMocks();
    realtimeMocks.setSubscribeCallback(null);
  });

  it('subscribes and dispatches room updates', () => {
    const onRoomUpdate = vi.fn();
    const unsubscribe = subscribeToRoom('ROOM', { onRoomUpdate });
    expect(supabase.channel).toHaveBeenCalledWith('room:ROOM', expect.anything());

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
    realtimeMocks.getSubscribeCallback()?.('CHANNEL_ERROR');
    expect(onError).toHaveBeenCalledWith(new Error('Failed to connect to realtime channel'));
  });
});
