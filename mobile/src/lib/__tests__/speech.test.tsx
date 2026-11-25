/**
 * 듣기 흐름(useSpeech) 테스트.
 * 진짜 마이크 대신 '가짜 음성 인식 엔진'으로, 폰 · 사파리에서 실제로 생기는 일들을 흉내 내요.
 * 실행: npm test
 */
import { act, renderHook } from '@testing-library/react-native';
import { AppState, Platform } from 'react-native';

type Listener = (e?: unknown) => void;

type MockEngine = {
  listeners: Map<string, Set<Listener>>;
  granted: boolean;
  start: jest.Mock;
  stop: jest.Mock;
  abort: jest.Mock;
  emit: (name: string, e?: unknown) => void;
  say: (transcript: string, isFinal?: boolean) => void;
  reset: () => void;
};

/** 가짜 엔진: 테스트가 직접 start · result · error · end 소식을 보내요 */
const mockEngine: MockEngine = {
  listeners: new Map<string, Set<Listener>>(),
  granted: true,
  start: jest.fn(),
  stop: jest.fn(() => mockEngine.emit('end')),
  abort: jest.fn(() => {
    mockEngine.emit('error', { error: 'aborted', message: '' });
    mockEngine.emit('end');
  }),
  emit(name: string, e?: unknown) {
    mockEngine.listeners.get(name)?.forEach((l: Listener) => l(e));
  },
  /** 말이 들림 (조각 · 끝난 조각 여부) */
  say(transcript: string, isFinal = false) {
    mockEngine.emit('result', { isFinal, results: [{ transcript, confidence: 1, segments: [] }] });
  },
  reset() {
    mockEngine.listeners.clear();
    mockEngine.granted = true;
    mockEngine.start.mockClear();
    mockEngine.stop.mockClear();
    mockEngine.abort.mockClear();
  },
};

jest.mock('expo-speech-recognition', () => ({
  ExpoSpeechRecognitionModule: {
    isRecognitionAvailable: () => true,
    requestPermissionsAsync: async () => ({ granted: mockEngine.granted }),
    start: (o: unknown) => mockEngine.start(o),
    stop: () => mockEngine.stop(),
    abort: () => mockEngine.abort(),
    addListener: (name: string, l: Listener) => {
      if (!mockEngine.listeners.has(name)) mockEngine.listeners.set(name, new Set());
      mockEngine.listeners.get(name)!.add(l);
      return { remove: () => mockEngine.listeners.get(name)?.delete(l) };
    },
  },
}));

// eslint-disable-next-line import/first
import { MAX_RESTARTS, PAUSE_MS, STUCK_MS, useSpeech } from '../speech';

const setOS = (os: 'ios' | 'web') => Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });

async function setup() {
  const onText = jest.fn();
  const onPause = jest.fn();
  const onEnd = jest.fn();
  const hook = await renderHook(() => useSpeech({ onText, onPause, onEnd }));
  return { hook, onText, onPause, onEnd, s: () => hook.result.current };
}

/** 버튼을 눌러 듣기 시작 → 엔진이 '시작했어요' */
async function begin(s: () => ReturnType<typeof useSpeech>, hints: string[] = []) {
  await act(async () => {
    await s().start(hints);
  });
  await act(() => mockEngine.emit('start'));
}

const lastText = (fn: jest.Mock) => fn.mock.calls.at(-1)?.[0];

beforeEach(() => {
  mockEngine.reset();
  jest.useFakeTimers();
  setOS('ios');
});
afterEach(() => {
  jest.useRealTimers();
});

describe('시작', () => {
  test('영어로 · 말하는 동안 결과 · 문제 낱말 힌트를 주고 시작해요 (폰은 계속 듣기)', async () => {
    const { s } = await setup();
    await begin(s, ['order', 'latte']);
    expect(mockEngine.start).toHaveBeenCalledWith(expect.objectContaining({ lang: 'en-US', interimResults: true, continuous: true, contextualStrings: ['order', 'latte'] }));
    expect(s().listening).toBe(true);
  });
  test('웹(사파리)은 계속 듣기가 고장 나기 쉬워서 한 문장씩 들어요', async () => {
    setOS('web');
    const { s } = await setup();
    await begin(s);
    expect(mockEngine.start).toHaveBeenCalledWith(expect.objectContaining({ continuous: false }));
  });
  test('마이크를 허용하지 않으면 시작하지 않고 안내해요', async () => {
    mockEngine.granted = false;
    const { s } = await setup();
    await act(async () => {
      await s().start();
    });
    expect(mockEngine.start).not.toHaveBeenCalled();
    expect(s().problem).toBe('denied');
  });
});

describe('들린 말 모으기', () => {
  test('폰: 매번 지금까지 전체 문장이 와요', async () => {
    const { s, onText } = await setup();
    await begin(s);
    await act(() => mockEngine.say("I'd like"));
    await act(() => mockEngine.say("I'd like to order"));
    expect(lastText(onText)).toBe("I'd like to order");
  });
  test('사파리: 말을 조각으로 보내도 이어 붙여요', async () => {
    setOS('web');
    const { s, onText } = await setup();
    await begin(s);
    await act(() => mockEngine.say("I'd like to", true));
    await act(() => mockEngine.say('order an'));
    expect(lastText(onText)).toBe("I'd like to order an");
    await act(() => mockEngine.say('order an iced latte', true));
    expect(lastText(onText)).toBe("I'd like to order an iced latte");
  });
  test('사파리: 같은 조각을 되풀이해 보내도 두 번 붙이지 않아요', async () => {
    setOS('web');
    const { s, onText } = await setup();
    await begin(s);
    await act(() => mockEngine.say("I'd like to", true));
    await act(() => mockEngine.say("I'd like to", true));
    expect(lastText(onText)).toBe("I'd like to");
  });
  test('사파리: 처음부터 다시 보낸 긴 문장은 그대로 써요', async () => {
    setOS('web');
    const { s, onText } = await setup();
    await begin(s);
    await act(() => mockEngine.say("I'd like to", true));
    await act(() => mockEngine.say("I'd like to order", true));
    expect(lastText(onText)).toBe("I'd like to order");
  });
});

describe('사용자가 누를 때까지 계속 듣기', () => {
  test('엔진이 스스로 끝나도 조용히 다시 켜고, 들린 말은 이어져요', async () => {
    const { s, onText, onEnd } = await setup();
    await begin(s);
    await act(() => mockEngine.say("I'd like to"));
    await act(() => mockEngine.emit('end'));
    await act(() => jest.advanceTimersByTime(200));
    expect(mockEngine.start).toHaveBeenCalledTimes(2);
    expect(s().listening).toBe(true);
    expect(onEnd).not.toHaveBeenCalled();
    await act(() => mockEngine.emit('start'));
    await act(() => mockEngine.say('order an iced latte'));
    expect(lastText(onText)).toBe("I'd like to order an iced latte");
  });
  test('아무 말 없음(no-speech) 오류도 그냥 다시 켜요', async () => {
    const { s } = await setup();
    await begin(s);
    await act(() => mockEngine.emit('error', { error: 'no-speech', message: '' }));
    await act(() => mockEngine.emit('end'));
    await act(() => jest.advanceTimersByTime(200));
    expect(mockEngine.start).toHaveBeenCalledTimes(2);
    expect(s().problem).toBeNull();
  });
  test('사용자가 누르면 멈추고, 그때까지 들린 말로 채점해요', async () => {
    const { s, onEnd } = await setup();
    await begin(s);
    await act(() => mockEngine.say("I'd like to have"));
    await act(() => s().stop());
    await act(() => jest.advanceTimersByTime(500));
    expect(onEnd).toHaveBeenCalledWith("I'd like to have");
    expect(s().listening).toBe(false);
    expect(mockEngine.start).toHaveBeenCalledTimes(1);
  });
  test('말하다 잠깐 멈추면 듣기는 그대로 두고 채점만 해요', async () => {
    const { s, onPause } = await setup();
    await begin(s);
    await act(() => mockEngine.say("I'd like to have"));
    await act(() => jest.advanceTimersByTime(PAUSE_MS + 10));
    expect(onPause).toHaveBeenCalledWith("I'd like to have");
    expect(s().listening).toBe(true);
  });
  test('소리 없이 멈춰 버리면(사파리) 잠시 뒤 다시 켜요', async () => {
    const { s } = await setup();
    await begin(s);
    await act(() => jest.advanceTimersByTime(STUCK_MS + 10));
    expect(mockEngine.abort).toHaveBeenCalled();
    await act(() => jest.advanceTimersByTime(200));
    expect(mockEngine.start).toHaveBeenCalledTimes(2);
  });
  test('너무 자주 끊기면 다시 켜기를 그만두고 안내해요', async () => {
    const { s } = await setup();
    await begin(s);
    for (let k = 0; k <= MAX_RESTARTS; k++) {
      await act(() => mockEngine.emit('end'));
      await act(() => jest.advanceTimersByTime(200));
      await act(() => mockEngine.emit('start'));
    }
    await act(() => mockEngine.emit('end'));
    expect(s().listening).toBe(false);
    expect(s().problem).toBe('other');
  });
});

describe('여러 번 누르기 (3~4번 뒤 안 들리던 문제)', () => {
  test('듣는 중에 다시 시작하면 이전 듣기를 완전히 끝낸 뒤 새로 켜요', async () => {
    const { s } = await setup();
    await begin(s);
    await begin(s);
    expect(mockEngine.abort).toHaveBeenCalledTimes(1);
    expect(mockEngine.start).toHaveBeenCalledTimes(2);
    const abortOrder = mockEngine.abort.mock.invocationCallOrder[0];
    const secondStart = mockEngine.start.mock.invocationCallOrder[1];
    expect(abortOrder).toBeLessThan(secondStart);
  });
  test('5번 연달아 말하고 멈춰도 매번 들려요', async () => {
    const { s, onEnd } = await setup();
    for (let k = 1; k <= 5; k++) {
      await begin(s);
      await act(() => mockEngine.say(`try ${k}`));
      await act(() => s().stop());
      await act(() => jest.advanceTimersByTime(300));
      expect(lastText(onEnd)).toBe(`try ${k}`);
    }
    expect(mockEngine.start).toHaveBeenCalledTimes(5);
  });
});

describe('멈춰야 할 때', () => {
  test('마이크 권한이 막히면 다시 켜지 않고 안내해요', async () => {
    const { s } = await setup();
    await begin(s);
    await act(() => mockEngine.emit('error', { error: 'not-allowed', message: '' }));
    await act(() => mockEngine.emit('end'));
    await act(() => jest.advanceTimersByTime(300));
    expect(mockEngine.start).toHaveBeenCalledTimes(1);
    expect(s().problem).toBe('denied');
    expect(s().listening).toBe(false);
  });
  test('마이크를 못 켜면(audio-capture) 화면에 알려 줘요 (onProblem) — 누를 때마다', async () => {
    const onProblem = jest.fn();
    const hook = await renderHook(() => useSpeech({ onText: jest.fn(), onProblem }));
    const s = () => hook.result.current;
    for (let i = 0; i < 2; i++) {
      await begin(s);
      await act(() => mockEngine.emit('error', { error: 'audio-capture', message: '' }));
      await act(() => mockEngine.emit('end'));
    }
    expect(onProblem.mock.calls).toEqual([['other'], ['other']]);
    expect(s().listening).toBe(false);
  });
  test('조용해서 끝난 건(no-speech) 알리지 않아요', async () => {
    const onProblem = jest.fn();
    const hook = await renderHook(() => useSpeech({ onText: jest.fn(), onProblem }));
    await begin(() => hook.result.current);
    await act(() => mockEngine.emit('error', { error: 'no-speech', message: '' }));
    expect(onProblem).not.toHaveBeenCalled();
  });
  test('전화 등으로 끊기면(interrupted) 멈추고 안내해요', async () => {
    const { s } = await setup();
    await begin(s);
    await act(() => mockEngine.emit('error', { error: 'interrupted', message: '' }));
    await act(() => mockEngine.emit('end'));
    await act(() => jest.advanceTimersByTime(300));
    expect(mockEngine.start).toHaveBeenCalledTimes(1);
    expect(s().problem).toBe('interrupted');
  });
  test('앱이 뒤로 가면 듣기를 멈춰요', async () => {
    let onApp: ((st: string) => void) | undefined;
    const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_t, h) => {
      onApp = h as (st: string) => void;
      return { remove: () => {} } as ReturnType<typeof AppState.addEventListener>;
    });
    const { s, onEnd } = await setup();
    await begin(s);
    await act(() => onApp?.('background'));
    await act(() => jest.advanceTimersByTime(300));
    expect(mockEngine.stop).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalled();
    expect(mockEngine.start).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
  test('화면을 나가면 듣기를 끄고 소식도 그만 받아요', async () => {
    const { s, hook, onText } = await setup();
    await begin(s);
    await hook.unmount();
    expect(mockEngine.abort).toHaveBeenCalled();
    mockEngine.say('after');
    expect(onText).not.toHaveBeenCalledWith('after');
  });
});
