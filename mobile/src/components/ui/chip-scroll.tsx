/**
 * 옆으로 넘기는 칩 · 탭 줄: 누른 곳을 가운데 쪽으로 데려와요 (끝에 반쯤 잘린 칩을 눌러도 다 보이게).
 * ScrollView horizontal 대신 그대로 바꿔 쓰면 돼요 — 칩마다 따로 연결하지 않아도 돼요.
 * 밀어서 넘기는 중(손가락이 움직인 경우)에는 아무것도 안 해요.
 */
import { useRef, type Ref } from 'react';
import { Platform, ScrollView, type GestureResponderEvent, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance, type ScrollViewProps } from 'react-native';

const MOVE = 8;

type Props = ScrollViewProps & { ref?: Ref<ScrollViewInstance> };

export function ChipScroll({ ref, onLayout, onScroll, onTouchStart, onTouchEnd, ...rest }: Props) {
  const own = useRef<ScrollViewInstance>(null);
  const x = useRef(0);
  const w = useRef(0);
  const start = useRef<number | null>(null);

  const setRef = (el: ScrollViewInstance | null) => {
    own.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) (ref as { current: ScrollViewInstance | null }).current = el;
  };
  // 누른 점을 줄 가운데로 (끝이면 스크롤이 알아서 멈춰요)
  const centerAt = (pageX: number) => {
    own.current?.measureInWindow?.((bx) => {
      const tapInContent = x.current + (pageX - bx);
      own.current?.scrollTo({ x: Math.max(0, tapInContent - w.current / 2), animated: true });
    });
  };
  const down = (pageX: number) => {
    start.current = pageX;
  };
  const up = (pageX: number) => {
    if (start.current != null && Math.abs(pageX - start.current) < MOVE) centerAt(pageX);
    start.current = null;
  };

  const web = Platform.OS === 'web';
  const webHandlers = web
    ? {
        onPointerDown: (e: { nativeEvent: { pageX: number } }) => down(e.nativeEvent.pageX),
        onPointerUp: (e: { nativeEvent: { pageX: number } }) => up(e.nativeEvent.pageX),
      }
    : {};
  return (
    <ScrollView
      ref={setRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={32}
      {...rest}
      {...webHandlers}
      onLayout={(e: LayoutChangeEvent) => {
        w.current = e.nativeEvent.layout.width;
        onLayout?.(e);
      }}
      onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
        x.current = e.nativeEvent.contentOffset.x;
        onScroll?.(e);
      }}
      onTouchStart={(e: GestureResponderEvent) => {
        if (!web) down(e.nativeEvent.pageX);
        onTouchStart?.(e);
      }}
      onTouchEnd={(e: GestureResponderEvent) => {
        if (!web) up(e.nativeEvent.pageX);
        onTouchEnd?.(e);
      }}
    />
  );
}
