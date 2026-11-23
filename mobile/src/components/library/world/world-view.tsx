import { type ExpoWebGLRenderingContext } from 'expo-gl';
import { useIsFocused } from 'expo-router';
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState, PanResponder, Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { MyCharacter } from '@/components/character/my-character';
import { Colors } from '@/constants/theme';

import { FocusCard } from './focus-card';
import { SafeGLView } from './safe-gl-view';
import { BOX, HERE_H, LabelBody } from './world-labels';
import { mountWorld, type WorldSC } from './scenes';
import type { FocusInfo, Host, LabelSpec, Stage } from './stage';
import { WorldFlat } from './world-flat';
import { canTryWorld3D, devCapture, GL_START_TIMEOUT, liteWorld } from './world-support';

/** 이름표를 가운데 맞추려고 두는 상자 너비 (프로토타입 translate(-50%)) */
/** 지도를 고르고 이만큼 머물면 만들기 시작 (빠르게 넘기는 동안의 지도는 만들지 않아요) */
const SETTLE_MS = 180;

type Props = {
  /** BUILD 이름 (study2 · travel · biz …) */
  id: string;
  sc: WorldSC;
  /** 맵을 바꿔 들어올 때 도는 방향 */
  swapDir: number;
  /** 아래 카드의 버튼 (교재 보기 · 장면 열기) */
  onOpen: (no: number) => void;
  /** false 면 그리기를 멈춰요 (스크롤해서 지도가 화면 밖일 때) */
  visible?: boolean;
};

/**
 * 섬 지도 한 장. 3D(WebGL)를 그려 보고, 이 기기에서 안 되면 2D 지도(WorldFlat)로 바꿔요.
 * 2D 로 바꾸는 때: 웹에 WebGL 이 없음 · GL 이 5초 안에 시작 안 함 · 만들다 오류 · 그리다 오류 · GL 화면이 터짐.
 * 한 번 바꾸면 이 지도는 2D 로 남아요 (깜빡임 없이). 데이터 · 누르면 아래 카드 동작은 같아요.
 */
export function WorldView(props: Props) {
  const [flat, setFlat] = useState(() => !canTryWorld3D());
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
function World3D({ id, sc, swapDir, onOpen, visible = true, onFail }: Props & { onFail: () => void }) {
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
  const [glKey, setGlKey] = useState(0);

  useEffect(() => {
    open.current = onOpen;
    fail.current = onFail;
  });
  // GL 이 시작하지 않으면 (오래된 폰 · GL 없는 에뮬레이터) 2D 지도로.
  // 화면에 보이는 동안 GL 판이 끝내 안 붙었을 때만 (다른 탭에 가 있느라 늦은 건 빼요)
  useEffect(() => {
    if (!size) return;
    const t = setTimeout(() => {
      if (!glStarted.current && !stage.current && !gone.current && !left.current) {
        console.warn('3D 지도가 시작하지 않아서 2D 지도로 바꿔요');
        fail.current();
      }
    }, GL_START_TIMEOUT);
    return () => clearTimeout(t);
  }, [size]);
  // 탭을 떠나거나 앱이 내려가면 그리기 멈춤.
  // 폰은 그때 그리기 판(GL)이 사라져서, 돌아오면 판만 새로 만들어 붙여요 (지도는 다시 만들지 않아요 · stage.rebind)
  useEffect(() => {
    const set = (appActive: boolean) => {
      if (!focused || !appActive) gone.current = true;
      else if (gone.current && stage.current && Platform.OS !== 'web') {
        gone.current = false;
        if (host.current) host.current.paused = true;
        drawnNow.current = false;
        setDrawn(false);
        setGlKey((k) => k + 1);
        return;
      }
      if (host.current) host.current.paused = !(focused && visible && appActive);
    };
    set(AppState.currentState === 'active');
    const sub = AppState.addEventListener('change', (st) => set(st === 'active'));
    return () => sub.remove();
  }, [focused, visible]);
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
      host.current.paused = !(focused && visible && AppState.currentState === 'active');
      try {
        stage.current.rebind(gl);
      } catch (e) {
        console.warn('3D 지도를 다시 붙이지 못했어요', e);
        setDrawn(true);
      }
      return;
    }
    const h: Host = {
      gl,
      width: size.w,
      height: size.h,
      reduced,
      lite,
      swapDir,
      paused: !focused,
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
    // 지도를 만드는 동안(폰에서 1~5초) JS 가 멈춰요 → 빠르게 다른 지도로 넘어가면 만들지 않게 잠깐 기다렸다가 시작해요
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
    }, SETTLE_MS);
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
      <View style={styles.fill} {...pan.panHandlers} accessible={false} />
      <View style={styles.fill} pointerEvents="none">
        <RiderView rider={rider} />
        {labels.map((spec, i) => (
          <WorldLabel key={i} i={i} spec={spec} xy={xy} zoomed={zoomed} />
        ))}
      </View>
      <FocusCard info={focus} onGo={(no) => open.current(no)} onClose={() => stage.current?.reset()} />
      {!drawn && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.ink} />
        </View>
      )}
    </View>
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
