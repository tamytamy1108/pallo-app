import { type ExpoWebGLRenderingContext } from 'expo-gl';
import { useIsFocused } from 'expo-router';
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState, PanResponder, Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { MyCharacter } from '@/components/character/my-character';
import { Colors } from '@/constants/theme';

import { FocusCard } from './focus-card';
import { FLAT_MAPS, type FlatMap } from './flat-maps';
import { SafeGLView } from './safe-gl-view';
import { BOX, HERE_H, LabelBody } from './world-labels';
import { mountWorld, type WorldSC } from './scenes';
import type { FocusInfo, Host, LabelSpec, Stage } from './stage';
import { WorldFlat } from './world-flat';
import { WorldPhoto } from './world-photo';
import { canTryWorld3D, devCapture, GL_START_TIMEOUT, liteWorld } from './world-support';

/** 이름표를 가운데 맞추려고 두는 상자 너비 (프로토타입 translate(-50%)) */
/** 그리기 판이 이만큼(ms) 안 오면 판을 새로 만들어 다시 (두 번까지 · 그래도 안 되면 GL_START_TIMEOUT 에 2D) */
const GL_RETRY_MS = 800;
/** 바깥(library-world)에서 지도를 다루는 손잡이 */
export type WorldCtl = {
  /** 지금 바로 보여 줄 수 있어요 (만들어 그렸고 · GL 판이 살아 있어요) */
  ready: () => boolean;
  /** 이 지도로 바꿔 들어올 때: 처음 자리에서 도는 인트로를 다시 (dir: 1 시계 · -1 반대) */
  replay: (dir: number) => void;
};

type Props = {
  /** BUILD 이름 (study2 · travel · biz …) */
  id: string;
  sc: WorldSC;
  /** 아래 카드의 버튼 (교재 보기 · 장면 열기) */
  onOpen: (no: number) => void;
  /** false 면 그리기를 멈춰요 (스크롤해서 지도가 화면 밖일 때) */
  visible?: boolean;
  /** false 면 미리 만들어 두기만 하는 숨은 지도: 그리기를 멈추고, 탭에 돌아와도 보일 때까지 GL 판을 새로 만들지 않아요 */
  active?: boolean;
  /** 사진판을 서서히가 아니라 바로 치워요 (3D 가 돌며 들어오는 중) */
  coverNow?: boolean;
  /** 첫 장면을 그렸어요 (GL 판을 새로 붙여 다시 그렸을 때도) */
  onDrawn?: () => void;
  ctlRef?: { current: WorldCtl | null };
};

/**
 * 섬 지도 한 장. 3D(WebGL)를 그려 보고, 이 기기에서 안 되면 2D 지도(WorldFlat)로 바꿔요.
 * 2D 로 바꾸는 때: 웹에 WebGL 이 없음 · GL 이 5초 안에 시작 안 함 · 만들다 오류 · 그리다 오류 · GL 화면이 터짐.
 * 한 번 바꾸면 이 지도는 2D 로 남아요 (깜빡임 없이). 데이터 · 누르면 아래 카드 동작은 같아요.
 */
export function WorldView(props: Props) {
  const [flat, setFlat] = useState(() => !canTryWorld3D());
  const { onDrawn, ctlRef } = props;
  const drawnCb = useRef(onDrawn);
  useEffect(() => {
    drawnCb.current = onDrawn;
  });
  // 2D 지도는 만들 것 없이 바로 보여 줄 수 있어요 (돌기 없이)
  useEffect(() => {
    if (!flat) return;
    if (ctlRef) ctlRef.current = { ready: () => true, replay: () => {} };
    drawnCb.current?.();
  }, [flat, ctlRef]);
  if (flat) return <WorldFlat id={props.id} sc={props.sc} onOpen={props.onOpen} />;
  return (
    <GLBoundary onFail={() => setFlat(true)}>
      <World3D {...props} onFail={() => setFlat(true)} />
    </GLBoundary>
  );
}

/** GL 화면이 그리다 터지면 (네이티브 GL 모듈이 없음 등) 앱 대신 지도만 2D 로 */
class GLBoundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    console.warn('3D 지도를 그리지 못해서 2D 지도로 바꿔요', e);
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * 3D 섬 지도 (프로토타입 .m3-layer): GL 그림 + 이름표 · 내 캐릭터 · 확대 카드(.m3-zp).
 * 크기는 부모가 정해요. 화면을 떠나면(탭 이동 · 앱 내려감) 그리기를 멈춰요.
 */
function World3D({ id, sc, onOpen, visible = true, active = true, coverNow = false, onDrawn, ctlRef, onFail }: Props & { onFail: () => void }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [lite] = useState(liteWorld);
  const fail = useRef(onFail);
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const host = useRef<Host | null>(null);
  const stage = useRef<Stage | null>(null);
  const open = useRef(onOpen);
  const [labels, setLabels] = useState<LabelSpec[]>([]);
  const [zoomed, setZoomed] = useState(false);
  const [focus, setFocus] = useState<FocusInfo | null>(null);
  const xy = useSharedValue<number[]>([]);
  const rider = useSharedValue<number[]>([]);
  const zoomedNow = useRef(false);
  // 첫 장면이 그려지기 전엔 도는 표시 (안 그려진 하늘색 판만 보이면 멈춘 것 같아서)
  const [drawn, setDrawn] = useState(false);
  const drawnNow = useRef(false);
  const building = useRef<ReturnType<typeof setTimeout> | null>(null);
  const left = useRef(false);
  /** 탭을 떠났거나 앱이 내려갔었어요 (폰: 돌아오면 GL 판을 새로) */
  const gone = useRef(false);
  /** GL 판이 한 번이라도 붙었어요 (시간 초과 2D 판단용) */
  const glStarted = useRef(false);
  /** 판을 기다린 시간(앱이 움직일 수 있던 시간만) · 판을 새로 만든 횟수 */
  const glWaited = useRef(0);
  const glTries = useRef(0);
  const [glKey, setGlKey] = useState(0);
  /** 만드는 동안 보여 줄 지도 사진판 (2D 사진 지도 · 이름표 · 팔로까지 같은 자리). 없으면 도는 표시 */
  const [cover] = useState<FlatMap | null>(() => {
    const m = FLAT_MAPS[id];
    return m && sc.length <= m.stops.length ? m : null;
  });
  const drawnCb = useRef(onDrawn);

  useEffect(() => {
    open.current = onOpen;
    fail.current = onFail;
    drawnCb.current = onDrawn;
  });
  useEffect(() => {
    if (!ctlRef) return;
    ctlRef.current = {
      ready: () => drawnNow.current && !gone.current && stage.current != null,
      replay: (dir) => stage.current?.replay(dir),
    };
    return () => {
      ctlRef.current = null;
    };
  }, [ctlRef]);
  // 사진판 효과(자식)가 먼저 돌고 나서 알려요 → 바깥에서 바로 띄워도 사진판이 겹치지 않아요
  useEffect(() => {
    if (drawn) drawnCb.current?.();
  }, [drawn]);
  // GL 이 시작하지 않으면 (오래된 폰 · GL 없는 에뮬레이터) 2D 지도로. 탭에 돌아와 판을 새로 만들 때(glKey)도 같아요.
  // 앱이 움직일 수 있던 시간만 세요: 다른 지도를 만드느라 JS 가 멈춘 동안(프레임 사이는 최대 0.1초만) · 다른 탭에 가 있던 동안은 빼요.
  // 다 기다렸으면 이미 와 있던 '판 준비됨' 신호를 먼저 받게 두 프레임 더 보고 정해요.
  // 그리기 판이 안 오면 판을 새로 만들어 다시 (GL_RETRY_MS 마다 · 두 번까지) — 지도를 바꾸는 0.4초 동안은 두 지도가 GPU 를 같이 써서
  // 에뮬레이터 · 느린 폰에서 새 판이 안 만들어질 때가 있어요. 아래 지도가 치워진 뒤 다시 만들면 붙어요.
  useEffect(() => {
    if (!size) return;
    let raf = 0;
    let last = Date.now();
    let grace = 0;
    const tick = () => {
      if (glStarted.current || left.current) return;
      const now = Date.now();
      if (!gone.current) glWaited.current += Math.min(now - last, 100);
      last = now;
      if (glTries.current < 2 && glWaited.current >= (glTries.current + 1) * GL_RETRY_MS) {
        glTries.current += 1;
        setGlKey((k) => k + 1);
        return;
      }
      if (glWaited.current >= GL_START_TIMEOUT && grace++ >= 2) {
        console.warn('3D 지도가 시작하지 않아서 2D 지도로 바꿔요');
        fail.current();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [size, glKey]);
  // 탭을 떠나거나 앱이 내려가면 그리기 멈춤.
  // 폰은 그때 그리기 판(GL)이 사라져서, 돌아오면 판만 새로 만들어 붙여요 (지도는 다시 만들지 않아요 · stage.rebind)
  // 숨은 지도(active=false)는 보일 차례가 올 때 붙여요 — 돌아올 때 숨은 지도까지 한꺼번에 붙이면 멈칫해요
  useEffect(() => {
    const set = (appActive: boolean) => {
      if (!focused || !appActive) gone.current = true;
      else if (gone.current && active && stage.current && Platform.OS !== 'web') {
        gone.current = false;
        if (host.current) host.current.paused = true;
        drawnNow.current = false;
        setDrawn(false);
        glStarted.current = false;
        glWaited.current = 0;
        glTries.current = 0;
        setGlKey((k) => k + 1);
        return;
      }
      if (host.current) host.current.paused = !(focused && visible && active && appActive);
    };
    set(AppState.currentState === 'active');
    const sub = AppState.addEventListener('change', (st) => set(st === 'active'));
    return () => sub.remove();
  }, [focused, visible, active]);
  useEffect(
    () => () => {
      left.current = true;
      if (building.current) clearTimeout(building.current);
      stage.current?.dispose();
    },
    [],
  );

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    if (!size) return;
    glStarted.current = true;
    if (stage.current && host.current) {
      // 다시 만든 판: 이미 만든 지도를 새 GL 에 붙이기만
      host.current.paused = !(focused && visible && active && AppState.currentState === 'active');
      try {
        stage.current.rebind(gl);
      } catch (e) {
        console.warn('3D 지도를 다시 붙이지 못해서 2D 지도로 바꿔요', e);
        fail.current();
      }
      return;
    }
    const h: Host = {
      gl,
      width: size.w,
      height: size.h,
      reduced,
      lite,
      paused: !(focused && active),
      onLabels: (l) => setLabels(l.map((x) => x.spec)),
      onFrame: (lxy, r, z) => {
        if (!drawnNow.current) {
          drawnNow.current = true;
          setDrawn(true);
        }
        if (lxy.length) xy.set(lxy);
        if (r) rider.set(r);
        if (z !== zoomedNow.current) {
          zoomedNow.current = z;
          setZoomed(z);
        }
      },
      onFocus: setFocus,
      onError: (e) => {
        console.warn('3D 지도를 그리다 멈췄어요 → 2D 지도로 바꿔요', e);
        fail.current();
      },
    };
    host.current = h;
    if (building.current) clearTimeout(building.current);
    // 지도를 만드는 동안(폰에서 0.4~0.8초) JS 가 멈춰요 → 지금 화면(버튼 · 사진판)이 먼저 그려지게 다음 차례에 시작해요
    building.current = setTimeout(() => {
      building.current = null;
      if (left.current) return;
      try {
        stage.current = mountWorld(h, id, devCapture() ? openAll(sc) : sc, (no) => open.current(no));
        if (devCapture()) (globalThis as { __world?: Record<string, unknown> }).__world = { ...(globalThis as { __world?: Record<string, unknown> }).__world, [id]: stage.current };
      } catch (e) {
        // 셰이더 · 확장 기능이 안 되는 기기: 2D 지도로
        console.warn('3D 지도를 만들지 못해서 2D 지도로 바꿔요', e);
        stage.current?.dispose();
        stage.current = null;
        fail.current();
      }
    }, 0);
  };

  // 짧게 누르면 확대 · 옆으로 끌면 빙 돌기 (세로로 끌면 페이지 스크롤에 양보)
  const drag = useRef({ x: 0, y: 0, lastDx: 0 });
  // ref 는 손가락 이벤트가 올 때만 읽어요 (그리는 중엔 안 읽어요) — 컴파일러가 이걸 구분하지 못해서 이 줄만 규칙을 꺼요
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: (_, g) => Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: (e) => {
        drag.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY, lastDx: 0 };
      },
      onPanResponderMove: (_, g) => {
        stage.current?.drag(g.dx - drag.current.lastDx);
        drag.current.lastDx = g.dx;
      },
      onPanResponderRelease: (_, g) => {
        if (Math.hypot(g.dx, g.dy) <= 6) stage.current?.tap(drag.current.x, drag.current.y);
        stage.current?.release();
      },
    }),
  );

  return (
    <View style={styles.fill} onLayout={(e) => !size && setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {size && <SafeGLView key={glKey} style={styles.fill} onContextCreate={onContextCreate} msaaSamples={lite ? 0 : 2} />}
      {cover != null && <PhotoCover map={cover} sc={sc} hide={drawn} now={coverNow} />}
      <View style={styles.fill} {...pan.panHandlers} accessible={false} />
      <View style={styles.fill} pointerEvents="none">
        <RiderView rider={rider} />
        {labels.map((spec, i) => (
          <WorldLabel key={i} i={i} spec={spec} xy={xy} zoomed={zoomed} />
        ))}
      </View>
      <FocusCard info={focus} onGo={(no) => open.current(no)} onClose={() => stage.current?.reset()} />
      {!drawn && cover == null && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.ink} />
        </View>
      )}
    </View>
  );
}

/**
 * 지도 사진판: 3D 가 그려질 때까지 덮어 두고(누르기는 3D 로), 그려지면 서서히 사라져요. 탭에 돌아와 판을 새로 만들 때도 다시 덮어요.
 * now: 3D 가 돌며 들어오는 중이라 바로 치워요 (사진은 끝 구도라 겹치면 어긋나 보여요)
 */
function PhotoCover({ map, sc, hide, now }: { map: FlatMap; sc: WorldSC; hide: boolean; now: boolean }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.set(!hide ? 1 : now ? 0 : withTiming(0, { duration: 260 }));
  }, [hide, now, o]);
  const fade = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={[styles.fill, fade]} pointerEvents="none">
      <WorldPhoto map={map} sc={sc} onOpen={() => {}} />
    </Animated.View>
  );
}

/** 이름표 하나: 3D 점의 화면 좌표를 따라가요 */
function WorldLabel({ i, spec, xy, zoomed }: { i: number; spec: LabelSpec; xy: SharedValue<number[]>; zoomed: boolean }) {
  const here = spec.kind === 'here';
  const pos = useAnimatedStyle(() => {
    const x = xy.value[2 * i];
    const y = xy.value[2 * i + 1];
    if (x === undefined || y === undefined) return { opacity: 0 };
    return { opacity: 1, transform: [{ translateX: x - BOX / 2 }, { translateY: here ? y - HERE_H : y }] };
  });
  return (
    <Animated.View style={[styles.labelBox, pos]}>
      <LabelBody spec={spec} zoomed={zoomed} />
    </Animated.View>
  );
}


/** 내 캐릭터 (프로토타입 .m3-me): 아래 가운데가 3D 점에 오고, 콩콩 뛸 때 눌림 · 방향 반전을 따라가요.
 * 그림은 정해진 크기(RIDER_W × RIDER_H, 프로토타입 .av-char 520:332)로 그리고 크기는 scale 로 맞춰요 */
const RIDER_H = 64;
const RIDER_W = (RIDER_H * 520) / 332;
function RiderView({ rider }: { rider: SharedValue<number[]> }) {
  const box = useAnimatedStyle(() => {
    const r = rider.value;
    if (r.length < 6) return { opacity: 0 };
    const [x, y, hh, fl, sx, sy] = r;
    const k = hh / RIDER_H;
    return { opacity: 1, transform: [{ translateX: x - RIDER_W / 2 }, { translateY: y - RIDER_H }, { scaleX: k * fl * sx }, { scaleY: k * sy }] };
  });
  return (
    <Animated.View style={[styles.rider, box]}>
      <MyCharacter style={styles.riderImg} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  loading: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  labelBox: { position: 'absolute', left: 0, top: 0, width: BOX, alignItems: 'center' },
  rider: { position: 'absolute', left: 0, top: 0, width: RIDER_W, height: RIDER_H, transformOrigin: 'bottom' },
  riderImg: { width: RIDER_W, height: RIDER_H },
  pressed: { transform: [{ scale: 0.96 }] },
});

/** 개발용 사진 찍기: 모든 정류장 · 섬을 '열림'으로 (지금 섬 · 곧 열림은 2D 지도가 위에 그려요) */
function openAll(sc: WorldSC): WorldSC {
  return sc.map(([a, b]) => [a, b, 'open']) as WorldSC;
}
