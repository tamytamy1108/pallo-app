import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { Raised } from '@/components/ui/raised';
import { Colors } from '@/constants/theme';

import type { WorldSC } from './world/scenes';
import { WorldView } from './world/world-view';

type Layer = { key: string; id: string; sc: WorldSC; dir: number };

/**
 * 라이브러리 섬 지도 칸 (프로토타입 .st-world.w3d): 340:430 · 잉크 테두리 · 하드 섀도.
 * 맵이나 진도가 바뀌면 새 지도를 위에 0.4초 동안 서서히 띄우고, 다 뜨면 아래 지도를 치워요 (.m3-layer.m3-fade).
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
    setLayers((ls) => [...ls.slice(-1), { key, id, sc, dir }]);
  }, [key, id, sc, order]);

  const drop = (k: string) => setLayers((ls) => (ls.length > 1 && ls[ls.length - 1].key === k ? ls.slice(-1) : ls));

  return (
    <Raised radius={26}>
      <View style={styles.box}>
        {layers.map((l, i) => (
          <FadeLayer key={l.key} fade={i > 0} onDone={() => drop(l.key)}>
            <WorldView id={l.id} sc={l.sc} swapDir={l.dir} onOpen={onOpen} visible={visible} />
          </FadeLayer>
        ))}
      </View>
    </Raised>
  );
}

/** m3Fade .4s ease-out (움직임 줄이기면 바로) */
function FadeLayer({ fade, onDone, children }: { fade: boolean; onDone: () => void; children: ReactNode }) {
  const still = useReducedMotion();
  const o = useSharedValue(fade && !still ? 0 : 1);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    if (!fade) return;
    if (still) {
      done.current();
      return;
    }
    o.set(withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));
    const t = setTimeout(() => done.current(), 450);
    return () => clearTimeout(t);
  }, [fade, still, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  box: { aspectRatio: 340 / 430, borderWidth: 2, borderColor: Colors.ink, borderRadius: 26, overflow: 'hidden', backgroundColor: '#BFE4EC' },
});
