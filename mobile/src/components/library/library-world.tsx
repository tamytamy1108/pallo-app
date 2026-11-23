import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Raised } from '@/components/ui/raised';
import { Colors } from '@/constants/theme';

import type { WorldSC } from './world/scenes';
import { SWAP_WAIT_MS, WorldView } from './world/world-view';

type Layer = { key: string; id: string; sc: WorldSC; dir: number };

/**
 * 라이브러리 섬 지도 칸 (프로토타입 .st-world.w3d): 340:430 · 잉크 테두리 · 하드 섀도.
 * 맵이나 진도가 바뀌면 새 지도를 위에 0.3초 동안 서서히 띄우고, 다 뜨면 아래 지도를 치워요 (.m3-layer.m3-fade).
 * 새 3D 가 그려질 때까지는 앞 지도를 그대로 두고, 그려지면 3D 인트로(돌며 커지기)와 함께 띄워요 (프로토타입처럼).
 * SWAP_WAIT_MS 안에 안 그려지면 그때 띄워요 (새 지도의 사진판이 먼저 보여요).
 * order: 상황 맵 순서 — 오른쪽 맵으로 가면 시계 방향, 왼쪽이면 반대로 돌며 들어와요.
 */
export function LibraryWorld({ id, sc, order, onOpen, visible = true }: { id: string; sc: WorldSC; order: number; onOpen: (no: number) => void; visible?: boolean }) {
  const key = `${id}|${JSON.stringify(sc)}|${sc.sel ?? ''}`;
  const last = useRef({ key, order });
  const [layers, setLayers] = useState<Layer[]>([{ key, id, sc, dir: 1 }]);

  useEffect(() => {
    if (last.current.key === key) return;
    const prev = last.current;
    last.current = { key, order };
    const dir = order >= prev.order ? 1 : -1;
    // 아직 뜨는 중인 지도가 있으면(빠르게 넘김) 그건 버리고, 보이던 아래 지도 위에 새 지도를 올려요
    setLayers((ls) => [ls[0], { key, id, sc, dir }]);
  }, [key, id, sc, order]);

  const drop = (k: string) => setLayers((ls) => (ls.length > 1 && ls[ls.length - 1].key === k ? ls.slice(-1) : ls));

  return (
    <Raised radius={26}>
      <View style={styles.box}>
        {layers.map((l, i) => (
          <FadeLayer key={l.key} fade={i > 0} onDone={() => drop(l.key)}>
            {(show) => <WorldView id={l.id} sc={l.sc} swapDir={l.dir} swap={i > 0} onSpinIn={show} onOpen={onOpen} visible={visible} />}
          </FadeLayer>
        ))}
      </View>
    </Raised>
  );
}

/**
 * m3Fade ease-out 0.3초 (프로토타입 0.4초 → 인트로를 빠르게 하면서 함께 줄였어요 · 움직임 줄이기면 바로). 바꿔 들어온 층은 show() 가 오면 바로, 안 오면 SWAP_WAIT_MS 뒤에 띄워요.
 * 기다리는 시간은 UI 스레드에서 세요 — 3D 를 만드는 동안 JS 가 멈춰도 제때 떠요.
 */
function FadeLayer({ fade, onDone, children }: { fade: boolean; onDone: () => void; children: (show: () => void) => ReactNode }) {
  const still = useReducedMotion();
  const o = useSharedValue(fade && !still ? 0 : 1);
  const done = useRef(onDone);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    if (!fade) return;
    if (still) {
      done.current();
      return;
    }
    o.set(withDelay(SWAP_WAIT_MS, withTiming(1, FADE)));
    timer.current = setTimeout(() => done.current(), SWAP_WAIT_MS + FADE.duration + 50);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [fade, still, o]);
  const [show] = useState(() => () => {
    if (!fade || still) return;
    o.set(withTiming(1, FADE));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => done.current(), FADE.duration + 50);
  });
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children(show)}</Animated.View>;
}

const FADE = { duration: 300, easing: Easing.out(Easing.ease) };

const styles = StyleSheet.create({
  box: { aspectRatio: 340 / 430, borderWidth: 2, borderColor: Colors.ink, borderRadius: 26, overflow: 'hidden', backgroundColor: '#BFE4EC' },
});
