/**
 * 폼 시트에서 하나를 고르면 다음 칸이 보이게 살짝 올려 줘요.
 * 고른 칸 아래로 NEXT_ROOM 만큼이 화면 안에 들어오도록 스크롤 (이미 보이면 그대로).
 * - 시트(SheetPage · Sheet)가 useFormScroll 로 스크롤을 맡고 FormScrollContext 로 넘겨요: const [scrollRef, boxRef, onScroll, reveal] = useFormScroll()
 * - 알약 줄 등은 useRevealNext() 로 받은 함수에 자기 View 를 넘겨 불러요.
 */
import { createContext, useContext, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollViewInstance, ViewInstance } from 'react-native';

/** 고른 칸 아래로 이만큼은 보여야 '다음 칸이 보인다' (다음 질문 제목 + 알약 한 줄쯤) */
const NEXT_ROOM = 150;

type Reveal = (target: ViewInstance | null) => void;
export const FormScrollContext = createContext<Reveal | null>(null);

/** 알약 줄 · 칩 등에서: 고른 뒤 불러요 (폼 시트 밖이면 아무것도 안 해요) */
export function useRevealNext(): Reveal {
  return useContext(FormScrollContext) ?? (() => {});
}

/** 시트 쪽: 스크롤 · 보이는 칸을 기억하고 reveal 을 만들어요 */
export function useFormScroll() {
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
  return [scroll, box, onScroll, reveal] as const;
}
