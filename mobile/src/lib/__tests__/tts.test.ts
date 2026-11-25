/**
 * 읽어 주기 도우미 (lib/tts): 이어 읽을 때 '멈춤'을 보내지 않는지 · 저절로 끊긴 줄을 다시 읽는지 · 우리가 멈추면 끝나는지.
 */
type Opts = { onDone?: () => void; onStopped?: () => void; onError?: () => void };
const calls: { text: string; opts: Opts }[] = [];
const stops: number[] = [];

jest.mock('expo-speech', () => ({
  speak: (text: string, opts: Opts) => calls.push({ text, opts }),
  stop: () => {
    stops.push(calls.length);
    return Promise.resolve();
  },
}));

// eslint-disable-next-line import/first
import { isSpeaking, readLines, speak, stopSpeaking } from '../tts';

beforeEach(() => {
  jest.useFakeTimers();
  calls.length = 0;
  stops.length = 0;
  stopSpeaking(); // 앞 테스트가 남긴 줄 정리
  stops.length = 0;
});
afterEach(() => jest.useRealTimers());

const last = () => calls[calls.length - 1];

test('이어 읽기: 앞 줄이 다 끝난 뒤에는 멈춤을 보내지 않아요', () => {
  const lines: number[] = [];
  const fin = jest.fn();
  readLines(['a', 'b', 'c'], { onLine: (i) => lines.push(i), onFinish: fin });
  expect(last().text).toBe('a');
  last().opts.onDone?.();
  jest.advanceTimersByTime(250);
  expect(last().text).toBe('b');
  last().opts.onDone?.();
  jest.advanceTimersByTime(250);
  last().opts.onDone?.();
  jest.advanceTimersByTime(250);
  expect(calls.map((c) => c.text)).toEqual(['a', 'b', 'c']);
  expect(stops).toEqual([]);
  expect(lines).toEqual([0, 1, 2]);
  expect(fin).toHaveBeenCalledTimes(1);
  expect(isSpeaking()).toBe(false);
});

test('저절로 끊긴 줄은 한 번 더 읽고, 두 번째도 끊기면 다음 줄로', () => {
  readLines(['a', 'b'], {});
  last().opts.onStopped?.();
  jest.advanceTimersByTime(250);
  expect(last().text).toBe('a');
  last().opts.onStopped?.();
  jest.advanceTimersByTime(250);
  expect(last().text).toBe('b');
});

test('멈추면(stopSpeaking) 이어 읽기가 끝나고 다시 읽지 않아요', () => {
  const fin = jest.fn();
  readLines(['a', 'b'], { onFinish: fin });
  stopSpeaking();
  expect(fin).toHaveBeenCalledTimes(1);
  calls[0].opts.onStopped?.(); // 멈춤에 따라 뒤늦게 오는 소식
  jest.advanceTimersByTime(1000);
  expect(calls.map((c) => c.text)).toEqual(['a']);
  expect(stops).toHaveLength(1);
});

test('다른 줄이 끼어들면 이어 읽기는 끝나고, 새 줄은 멈춤 뒤 잠깐 있다가 읽어요', () => {
  const fin = jest.fn();
  readLines(['a', 'b'], { onFinish: fin });
  speak('tap');
  expect(fin).toHaveBeenCalledTimes(1);
  expect(stops).toEqual([1]);
  expect(calls.map((c) => c.text)).toEqual(['a']);
  jest.advanceTimersByTime(80);
  expect(last().text).toBe('tap');
  jest.advanceTimersByTime(1000);
  expect(calls.map((c) => c.text)).toEqual(['a', 'tap']);
});

test('읽는 게 없으면 멈춤을 보내지 않아요', () => {
  stopSpeaking();
  speak('x');
  expect(stops).toEqual([]);
  expect(calls.map((c) => c.text)).toEqual(['x']);
});
