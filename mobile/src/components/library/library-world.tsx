import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Raised } from '@/components/ui/raised';
import { Colors } from '@/constants/theme';
import { noteTouch, quietFor, useTabsFront } from '@/lib/quiet';

import type { WorldSC } from './world/scenes';
import { INTRO_MS } from './world/stage';
import { liteWorld } from './world/world-support';
import { WorldView, type WorldCtl } from './world/world-view';

/** 지도 칸에 올릴 지도 하나. slot: 자리 이름 (스터디 맵 · 상황 맵마다 하나) · order: 상황 맵 순서 (스터디 맵은 -1) */
export type LibWorld = { slot: string; id: string; sc: WorldSC; order: number };
type Layer = LibWorld & { key: string };
type Role = 'top' | 'under' | 'idle';

const keyOf = (w: LibWorld) => `${w.slot}|${w.id}|${JSON.stringify(w.sc)}|${w.sc.sel ?? ''}`;

/** 아직 안 만든 지도로 바꾸면: 이만큼(ms) 안에 그려지면 돌며 들어오고, 넘으면 그 지도의 사진판부터 띄워요 */
const SWAP_WAIT_MS = 1200;
/**
 * 미리 만들기: 지금 지도가 다 뜨고(인트로 · 서서히 뜨기 끝) 하나씩 이어서 — 한 장 만드는 동안 JS 가 0.3~1.3초 멈춰요.
 * 그사이 이만큼(ms) 쉬어요 (누르기 · 화면 갱신이 끼어들 틈)
 */
const WARM_GAP_MS = 60;
/** 메모리가 적은 폰(liteWorld)은 다음에 갈 것 같은 지도 이만큼만 미리 만들어요 (그림자 · 안티에일리어싱이 꺼져서 한 장이 가벼워요) */
const LITE_WARM = 2;
/**
 * 미리 만들기는 만드는 동안 화면이 멈춰서, 사람이 화면을 만지는 중이면 기다려요:
 * 다음에 누를 것 같은 첫 장(상황 맵 탭을 누르면 뜰 맵)만 바로 만들고, 나머지는 마지막 터치 · 스크롤 뒤 이만큼(ms) 조용할 때 하나씩.
 */
const IDLE_MS = 1800;
/** 라이브러리 화면이 터치 · 스크롤 때마다 불러요 (미리 만들기가 끼어들지 않게) */
export const noteLibTouch = noteTouch;

/** 새 지도가 뜨는 시간 (프로토타입 m3Fade 0.4초 → 인트로를 빠르게 하면서 함께 줄였어요) */
const FADE = { duration: 200, easing: Easing.out(Easing.ease) };

/**
 * 라이브러리 섬 지도 칸 (프로토타입 .st-world.w3d): 340:430 · 잉크 테두리 · 하드 섀도.
 * 맵을 바꾸면 새 지도가 위에 0.3초 동안 서서히 뜨면서 3D 인트로(옆으로 돌며 커지기)로 들어오고, 다 뜨면 아래 지도는 숨어요.
 * 바로 바뀌게: 지금 지도가 다 뜬 뒤 warm 의 지도(앞에 둔 것부터 · 스터디 맵 · 다른 상황 맵)를 하나씩 미리 만들어 숨겨 둬요 (그리기는 멈춤).
 * 미리 만든 지도로 바꾸면 만들 것 없이 바로 돌며 들어와요. 아직 안 만든 지도면 그려질 때까지 앞 지도가 그대로 있다가
 * 그려지면 돌며 들어오고, SWAP_WAIT_MS 를 넘으면 사진판부터 떠요. 메모리가 적은 폰(liteWorld)은 LITE_WARM 장만 미리 만들어요.
 * 새 지도가 돌며 들어오는 동안 아래 지도는 그리기를 멈춰요 (한 프레임에 한 장만 그려서 더 매끄럽게).
 * 미리 만들 지도가 남아 있는 동안 보이는 지도는 첫 장면 그대로 멈춰 있다가 다 만들면 움직여요 —
 * 만드는 사이사이 움직이면 분수 · 꽃잎이 뚝뚝 끊겨 보여서요 (처음 라이브러리에 들어올 때 2초 남짓).
 * 오른쪽 맵으로 가면 시계 방향, 왼쪽이면 반대로 돌며 들어와요.
 */
export function LibraryWorld({ world, warm = [], onOpen, visible = true }: { world: LibWorld; warm?: LibWorld[]; onOpen: (no: number) => void; visible?: boolean }) {
  const key = keyOf(world);
  const [layers, setLayers] = useState<Layer[]>(() => [{ ...world, key }]);
  const [top, setTop] = useState(key);
  const [under, setUnder] = useState<string | null>(null);
  const [dir, setDir] = useState(1);
  /** 맵을 바꾼 횟수 (맨 위 지도가 새로 들어올 때마다 하나씩) */
  const [turn, setTurn] = useState(0);
  const [drawn, setDrawn] = useState<ReadonlySet<string>>(() => new Set());
  /** 지금 미리 만드는 지도 */
  const [warming, setWarming] = useState<string | null>(null);
  /** 맨 위 지도가 돌며 들어오기 시작했어요 → 아래 지도는 그리기를 멈춰요 */
  const [topIn, setTopIn] = useState(true);
  const [lite] = useState(liteWorld);
  const last = useRef({ key, order: world.order });
  const want = lite ? warm.slice(0, LITE_WARM) : warm;
  const warmNow = useRef(want);
  useEffect(() => {
    warmNow.current = want;
  });
  const warmSig = want.map(keyOf).join('\n');
  useEffect(() => {
    if (__DEV__) console.log(`[lib] 지도 칸 · 가벼운 폰 ${lite} · 미리 만들 지도 ${warmNow.current.length}장`);
  }, [lite]);

  // 맵이 바뀌면: 미리 만든 지도가 있으면 그걸 맨 위로, 없으면 새로 올려요. 앞 지도는 새 지도가 다 뜰 때까지 아래에
  useEffect(() => {
    if (last.current.key === key) return;
    const prev = last.current;
    last.current = { key, order: world.order };
    setDir(world.order >= prev.order ? 1 : -1);
    // 아직 안 만든 지도면 두 프레임 뒤에 올려요: 탭 · 칩 · 아래 목록이 먼저 바뀌어 보이고, 멈추는 지도 만들기는 그다음에
    let raf = 0;
    const add = () =>
      setLayers((ls) => {
        if (__DEV__) console.log(`[lib] 맵 바꾸기 → ${world.slot} · ${ls.some((l) => l.key === key) ? '미리 만든 지도' : '새로 만들어요'} · 지도 ${ls.length}장`);
        return ls.some((l) => l.key === key) ? ls : [...ls, { ...world, key }];
      });
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(add);
    });
    setUnder(prev.key);
    setTop(key);
    setTopIn(false);
    setTurn((t) => t + 1);
    return () => cancelAnimationFrame(raf);
  }, [key, world]);

  // 미리 만들기: 하나씩, 바꾸는 중이 아닐 때만. warm 에 없는 숨은 지도(진도가 바뀐 옛 지도 · 다른 언어)는 치워요
  const [idleTick, setIdleTick] = useState(0);
  // 다른 탭에 있을 때도(탭 바가 라이브러리를 미리 열어 둬요) 화면을 안 만질 때만 이어서 만들어요 — 들어오면 이미 다 만들어져 있게.
  // 레슨 · 장면 같은 화면이 위에 있으면 멈췄다가 돌아오면 이어서 — 만드는 동안 JS 가 멈춰서 그 화면 누르기가 씹혀요
  const focused = useIsFocused();
  const tabsFront = useTabsFront();
  useEffect(() => {
    if (!(focused || tabsFront) || under || warming || !drawn.has(top)) return;
    const keys = new Set(warmSig.split('\n'));
    const next = warmNow.current.find((w) => !layers.some((l) => l.key === keyOf(w)));
    const stale = layers.some((l) => l.key !== top && !keys.has(l.key));
    if (!next && !stale) return;
    // 첫 장(다음에 누를 것 같은 지도)은 바로, 나머지는 화면을 안 만질 때만 (만지는 중이면 조용해질 때 다시 봐요)
    const first = !!next && keyOf(next) === keyOf(warmNow.current[0] ?? next);
    // 다른 탭에 있을 때는 첫 장도 조용할 때만 (그 탭 누르기가 씹히지 않게)
    const quiet = quietFor();
    if (next && (!first || !focused) && quiet < IDLE_MS) {
      const r = setTimeout(() => setIdleTick((n) => n + 1), IDLE_MS - quiet + 30);
      return () => clearTimeout(r);
    }
    const t = setTimeout(() => {
      setLayers((ls) => {
        const kept = ls.filter((l) => l.key === top || keys.has(l.key));
        return next ? [...kept, { ...next, key: keyOf(next) }] : kept;
      });
      if (next) {
        if (__DEV__) console.log(`[lib] 미리 만들기 ${next.slot}`);
        setWarming(keyOf(next));
      }
    }, WARM_GAP_MS);
    return () => clearTimeout(t);
  }, [focused, tabsFront, under, warming, drawn, top, layers, warmSig, idleTick]);

  // 아직 만들 지도가 있어요 (지금 만드는 중이거나 · 다음 차례) → 보이는 지도는 멈춰 둬요
  const pending = !!warming || (drawn.has(top) && want.some((w) => !layers.some((l) => l.key === keyOf(w))));
  const wasPending = useRef(false);
  useEffect(() => {
    if (__DEV__ && wasPending.current !== pending) console.log(pending ? '[lib] 미리 만드는 동안 지도를 멈춰요' : '[lib] 미리 만들기 끝 · 지도가 움직여요');
    wasPending.current = pending;
  }, [pending]);

  const onDrawn = (k: string) => {
    setDrawn((d) => (d.has(k) ? d : new Set(d).add(k)));
    setWarming((w) => (w === k ? null : w));
  };
  const onEnter = (k: string) => {
    if (k === top) setTopIn(true);
  };
  // 새 지도가 다 떴어요: 아래 지도는 숨기고, 같은 자리의 옛 지도(진도가 바뀌어 새로 만든 경우)는 치워요
  const onShown = (k: string) => {
    if (k !== top) return;
    setUnder(null);
    const slot = layers.find((l) => l.key === k)?.slot;
    setLayers((ls) => ls.filter((l) => l.key === k || l.slot !== slot));
  };

  return (
    <Raised radius={26}>
      <View style={styles.box}>
        {layers.map((l) => {
          const role: Role = l.key === top ? 'top' : l.key === under ? 'under' : 'idle';
          return (
            <MapLayer
              key={l.key}
              layer={l}
              role={role}
              turn={role === 'top' ? turn : -1}
              live={role === 'top' ? !pending || under != null : role === 'under' && !topIn}
              dir={dir}
              visible={visible}
              onOpen={onOpen}
              onDrawn={onDrawn}
              onEnter={onEnter}
              onShown={onShown}
            />
          );
        })}
      </View>
    </Raised>
  );
}

type LayerProps = {
  layer: Layer;
  role: Role;
  /** 맨 위일 때 맵을 바꾼 횟수 (0 = 처음 연 지도 · 돌기 없이) · 아니면 -1 */
  turn: number;
  /** 그리기를 계속해요 (맨 위 · 새 지도가 아직 안 들어온 동안의 아래 지도) */
  live: boolean;
  dir: number;
  visible: boolean;
  onOpen: (no: number) => void;
  onDrawn: (key: string) => void;
  /** 돌며 들어오기 시작했어요 */
  onEnter: (key: string) => void;
  onShown: (key: string) => void;
};

/**
 * 지도 한 장 (프로토타입 .m3-layer). 맨 위(top)로 들어올 때:
 * 그려져 있으면 바로 인트로를 다시 하며 서서히 떠요. 아직이면 그려지는 순간(SWAP_WAIT_MS 안) 돌며 뜨고, 늦으면 사진판부터 떠요.
 * 숨은 지도(idle)는 안 보이고 그리기도 멈춰요. 움직임 줄이기면 돌기 · 서서히 없이 바로 바꿔요.
 */
function MapLayer({ layer, role, turn, live, dir, visible, onOpen, onDrawn, onEnter, onShown }: LayerProps) {
  const still = useReducedMotion();
  const ctl = useRef<WorldCtl | null>(null);
  const o = useSharedValue(role === 'top' && turn === 0 ? 1 : 0);
  /** 들어오라고 한 때 (그려지기를 기다리는 중) */
  const waitFrom = useRef<number | null>(null);
  const shownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [coverNow, setCoverNow] = useState(false);
  const cb = useRef({ onDrawn, onEnter, onShown, dir, key: layer.key });
  useEffect(() => {
    cb.current = { onDrawn, onEnter, onShown, dir, key: layer.key };
  });
  // 아래 두 함수는 ref · 공유 값만 써요
  const [act] = useState(() => {
    const shownAfter = (ms: number) => {
      if (shownTimer.current) clearTimeout(shownTimer.current);
      shownTimer.current = setTimeout(() => cb.current.onShown(cb.current.key), ms);
    };
    const spinIn = () => {
      ctl.current?.replay(cb.current.dir);
      o.set(0);
      o.set(withTiming(1, FADE));
      cb.current.onEnter(cb.current.key);
      // 다 돌고 나서 '다 떴어요' — 그 뒤에야 미리 만들기가 다시 시작돼요 (돌기가 끊기지 않게)
      shownAfter(Math.max(FADE.duration, INTRO_MS) + 30);
    };
    return { shownAfter, spinIn };
  });

  useEffect(() => {
    // 맨 위가 아니게 되면 기다리던 것은 잊어요 (빠르게 넘김) — 늦게 그려져도 돌며 뜨지 않게
    if (role !== 'top') waitFrom.current = null;
    if (role === 'idle') {
      if (shownTimer.current) clearTimeout(shownTimer.current);
      o.set(0);
      return;
    }
    if (role !== 'top' || turn <= 0) return;
    if (still) {
      ctl.current?.replay(cb.current.dir);
      o.set(1);
      act.shownAfter(0);
      return;
    }
    if (ctl.current?.ready()) {
      waitFrom.current = null;
      act.spinIn();
      return;
    }
    // 아직 안 그려졌어요: 앞 지도를 두고 기다려요. 늦으면 사진판째로 떠요 (기다림은 UI 스레드에서 세요 — 만드는 동안 JS 가 멈춰도 제때)
    waitFrom.current = Date.now();
    o.set(0);
    o.set(withDelay(SWAP_WAIT_MS, withTiming(1, FADE)));
    act.shownAfter(SWAP_WAIT_MS + FADE.duration + 30);
  }, [role, turn, still, o, act]);
  useEffect(
    () => () => {
      if (shownTimer.current) clearTimeout(shownTimer.current);
    },
    [],
  );

  const drawnHere = () => {
    cb.current.onDrawn(layer.key);
    const from = waitFrom.current;
    if (from == null) return;
    waitFrom.current = null;
    // 늦었으면 사진판이 이미 떠 있어요 → 3D 는 같은 구도로 이어지고 사진판만 서서히 사라져요
    if (Date.now() - from >= SWAP_WAIT_MS) return;
    setCoverNow(true);
    act.spinIn();
  };

  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: role === 'top' ? 3 : role === 'under' ? 2 : 1 }, style]} pointerEvents={role === 'top' ? 'auto' : 'none'}>
      <WorldView id={layer.id} sc={layer.sc} onOpen={onOpen} visible={visible} active={live} coverNow={coverNow} ctlRef={ctl} onDrawn={drawnHere} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { aspectRatio: 340 / 430, borderWidth: 2, borderColor: Colors.ink, borderRadius: 26, overflow: 'hidden', backgroundColor: '#BFE4EC' },
});
