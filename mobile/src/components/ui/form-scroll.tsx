/**
 * 폼 시트 · 가입 화면 스크롤 돕기.
 * 1) 하나를 고르면 다음 칸이 보이게 살짝 올려 줘요 (reveal · useRevealNext):
 *    고른 칸 아래로 NEXT_ROOM 만큼이 화면 안에 들어오도록 스크롤 (이미 보이면 그대로).
 * 2) 길게 쓰는 칸이 늘어나도 쓰는 줄(칸 아래 끝)이 아래 버튼 · 흐림 · 키보드에 가리지 않게 따라 내려가요 (keep · useKeepVisible).
 *    GrowInput 이 포커스 중에 늘어날 때 불러요. 위로는 절대 안 올리고, 이미 보이면 그대로.
 * - 스크롤을 가진 쪽(Sheet · SheetPage · OnbScreen)이 useFormScroll 로 만들고 두 Context 로 넘겨요:
 *   const [scrollRef, boxRef, onScroll, reveal, keep] = useFormScroll(room)
 * - 알약 줄 등은 useRevealNext(), 글 칸은 useKeepVisible() 로 받아요.
 */
import { createContext, useContext, useEffect, useRef, type RefObject } from 'react';
import { Keyboard, Platform, TextInput, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance, type ViewInstance } from 'react-native';

/** 고른 칸 아래로 이만큼은 보여야 '다음 칸이 보인다' (다음 질문 제목 + 알약 한 줄쯤) */
const NEXT_ROOM = 150;
/** 쓰는 줄 아래 숨 쉴 틈 */
export const CARET_ROOM = 20;

type Reveal = (target: ViewInstance | null) => void;
export const FormScrollContext = createContext<Reveal | null>(null);

/** 글 칸 아래 끝(쓰는 줄)이 보이게 내려요 (비워 둘 높이는 스크롤을 가진 쪽이 정해요) */
export type KeepVisible = (target: ViewInstance | null) => void;
export const KeepVisibleContext = createContext<KeepVisible | null>(null);

/** 알약 줄 · 칩 등에서: 고른 뒤 불러요 (폼 시트 밖이면 아무것도 안 해요) */
export function useRevealNext(): Reveal {
  return useContext(FormScrollContext) ?? (() => {});
}

/** 글 칸에서: 늘어날 때 불러요. 스크롤을 가진 쪽이 없으면 null (웹은 GrowInput 이 가까운 스크롤 칸을 직접 찾아요) */
export const useKeepVisible = () => useContext(KeepVisibleContext);

/** 키보드 위쪽 끝 (화면 기준). 네이티브에서 키보드가 떠 있을 때만 */
const keyboardTop = () => (Platform.OS === 'web' ? Infinity : (Keyboard.metrics()?.screenY ?? Infinity));

/**
 * target 아래 끝 + room 이 box(보이는 스크롤 칸) · 키보드 위로 들어오게 scroll 을 내려요. 위로는 안 올려요.
 * 글을 쓰는 중이라 움직임 없이 바로 (쓰는 줄이 출렁이지 않게).
 * scrollY: 지금 스크롤 위치. 스크롤 알림은 늦게 와서, 내린 자리를 바로 적어 둬요 (빨리 쓰면 한 줄씩 밀리지 않게).
 * animated: 칸을 눌러 키보드가 올라온 뒤처럼 한 번 옮길 때는 부드럽게.
 */
export function keepInView(target: ViewInstance | null, box: ViewInstance | null, scroll: ScrollViewInstance | null, scrollY: RefObject<number>, room: number, animated = false) {
  if (!target || !box || !scroll) return;
  target.measureInWindow((_tx, ty, _tw, th) => {
    box.measureInWindow((_bx, by, _bw, bh) => {
      const visibleBottom = Math.min(by + bh, keyboardTop());
      const over = ty + th + room - visibleBottom;
      if (over <= 1) return;
      // 웹은 지금 스크롤 위치를 바로 읽어요 (화면이 다시 그려져 스크롤이 처음으로 돌아간 경우에도 맞게)
      const node: unknown = scroll.getScrollableNode?.();
      const now = typeof HTMLElement !== 'undefined' && node instanceof HTMLElement ? node.scrollTop : scrollY.current;
      scrollY.current = now + over;
      scroll.scrollTo({ y: scrollY.current, animated });
    });
  });
}

/**
 * 시트 쪽: 스크롤 · 보이는 칸을 기억하고 reveal · keep 을 만들어요.
 * room: 쓰는 줄 아래로 비워 둘 높이 (스크롤 칸 아래를 덮는 흐림이 있으면 그 높이까지 더해요)
 */
export function useFormScroll(room = CARET_ROOM) {
  const scroll = useRef<ScrollViewInstance>(null);
  const box = useRef<ViewInstance>(null);
  const y = useRef(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    y.current = e.nativeEvent.contentOffset.y;
  };
  const reveal: Reveal = (target) => {
    if (!target || !box.current) return;
    // 고른 표시가 그려진 다음에 재요 (알약 색이 바뀐 뒤)
    setTimeout(() => {
      target.measureInWindow((_tx, ty, _tw, th) => {
        box.current?.measureInWindow((_bx, by, _bw, bh) => {
          const over = ty + th + NEXT_ROOM - (by + bh);
          if (over > 4) scroll.current?.scrollTo({ y: y.current + over, animated: true });
        });
      });
    }, 60);
  };
  const keep: KeepVisible = (target) => keepInView(target, box.current, scroll.current, y, room);
  // 칸을 눌렀을 때 (키보드가 다 올라온 뒤 한 번): 부드럽게
  const show: KeepVisible = (target) => keepInView(target, box.current, scroll.current, y, room, true);
  return [scroll, box, onScroll, reveal, keep, show] as const;
}

/**
 * 칸을 눌러 키보드가 다 올라오면, 지금 쓰는 칸이 키보드 · 아래 버튼 위로 다 보이게 내려요 (KeyboardAvoidingView 가 화면을 줄인 다음에 재요).
 * box 안의 칸만 (다른 시트 · 화면의 칸이면 그대로). 칸을 옮겨 다닐 때는 GrowInput 이 포커스 때 맞춰요.
 */
export function useShowFocusedOnKeyboard(box: RefObject<ViewInstance | null>, show: KeepVisible) {
  const showRef = useRef(show);
  useEffect(() => {
    showRef.current = show;
  });
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const clear = () => timers.splice(0).forEach(clearTimeout);
    const check = () => {
      const target = TextInput.State.currentlyFocusedInput();
      const b = box.current;
      if (!target || !b) return;
      // box 안에 없는 칸이면 measureLayout 이 실패해요
      target.measureLayout(
        b,
        () => showRef.current(target),
        () => {},
      );
    };
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      clear();
      // 안드로이드: 키보드가 다 올라온 뒤에도 시트(KeyboardAvoidingView)가 줄어드는 데 시간이 조금 걸려요.
      // 바로 재면 아직 큰 칸 기준이라 '안 가려짐'으로 보고 그냥 지나가서, 맨 아래 칸이 버튼 뒤에 가려졌어요 → 자리 잡은 뒤 한 번 더 (이미 보이면 그대로)
      timers.push(setTimeout(check, 60), setTimeout(check, 320));
    });
    return () => {
      sub.remove();
      clear();
    };
  }, [box]);
}
