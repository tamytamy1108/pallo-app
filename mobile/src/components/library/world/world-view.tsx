import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useIsFocused } from 'expo-router';
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, PanResponder, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { MyCharacter } from '@/components/character/my-character';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import { FocusCard } from './focus-card';
import { mountWorld, type WorldSC } from './scenes';
import type { FocusInfo, Host, LabelSpec, Stage } from './stage';
import { WorldFlat } from './world-flat';
import { canTryWorld3D, GL_START_TIMEOUT, liteWorld } from './world-support';

/** 이름표를 가운데 맞추려고 두는 상자 너비 (프로토타입 translate(-50%)) */
const BOX = 240;
const HERE_H = 20;
const SUB = '#5A5366';
const SOON_LINE = '#9A93A6';
const SOON_INK = '#6F6880';

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

  useEffect(() => {
    open.current = onOpen;
    fail.current = onFail;
  });
  // GL 이 시작하지 않으면 (오래된 폰 · GL 없는 에뮬레이터) 2D 지도로
  useEffect(() => {
    if (!size) return;
    const t = setTimeout(() => {
      if (!stage.current) {
        console.warn('3D 지도가 시작하지 않아서 2D 지도로 바꿔요');
        fail.current();
      }
    }, GL_START_TIMEOUT);
    return () => clearTimeout(t);
  }, [size]);
  // 탭을 떠나거나 앱이 내려가면 그리기 멈춤
  useEffect(() => {
    const set = (active: boolean) => {
      if (host.current) host.current.paused = !active;
    };
    set(focused && visible && AppState.currentState === 'active');
    const sub = AppState.addEventListener('change', (st) => set(focused && visible && st === 'active'));
    return () => sub.remove();
  }, [focused, visible]);
  useEffect(() => () => stage.current?.dispose(), []);

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    if (!size || stage.current) return;
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
    try {
      stage.current = mountWorld(h, id, sc, (no) => open.current(no));
    } catch (e) {
      // 셰이더 · 확장 기능이 안 되는 기기: 2D 지도로
      console.warn('3D 지도를 만들지 못해서 2D 지도로 바꿔요', e);
      stage.current?.dispose();
      stage.current = null;
      fail.current();
    }
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
      {size && <GLView style={styles.fill} onContextCreate={onContextCreate} msaaSamples={lite ? 0 : 2} />}
      <View style={styles.fill} {...pan.panHandlers} accessible={false} />
      <View style={styles.fill} pointerEvents="none">
        <RiderView rider={rider} />
        {labels.map((spec, i) => (
          <WorldLabel key={i} i={i} spec={spec} xy={xy} zoomed={zoomed} />
        ))}
      </View>
      <FocusCard info={focus} onGo={(no) => open.current(no)} onClose={() => stage.current?.reset()} />
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

function LabelBody({ spec, zoomed }: { spec: LabelSpec; zoomed: boolean }) {
  if (spec.kind === 'lv') {
    const soon = spec.st === 'soon';
    return (
      <View style={[styles.lv, spec.st === 'cur' && styles.lvCur, soon && styles.lvSoon]}>
        <PText style={[styles.lvTitle, soon && { color: SOON_INK }]} numberOfLines={1}>
          {spec.title}
        </PText>
        <PText style={[styles.lvSub, soon && { color: SOON_INK }]} numberOfLines={1}>
          {spec.sub}
        </PText>
      </View>
    );
  }
  if (spec.kind === 'here')
    return (
      <View style={styles.here}>
        <PText style={styles.hereText}>{spec.text}</PText>
      </View>
    );
  if (spec.kind === 'tag')
    return (
      <View style={[styles.tag, styles.tagCur]}>
        <PText style={styles.tagText} numberOfLines={1}>
          {spec.text}
        </PText>
      </View>
    );
  // 정류장 번호: 멀리서는 동그라미 번호, 확대하면 장면 이름 (.m3-tag.min)
  return zoomed ? (
    <View style={[styles.tag, spec.soon && styles.tagSoon]}>
      <PText style={[styles.tagText, spec.soon && { color: SOON_INK }]} numberOfLines={1}>
        {spec.text}
      </PText>
    </View>
  ) : (
    <View style={[styles.min, spec.soon && styles.tagSoon]}>
      <PText style={[styles.minText, spec.soon && { color: SOON_INK }]}>{spec.num}</PText>
    </View>
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
  labelBox: { position: 'absolute', left: 0, top: 0, width: BOX, alignItems: 'center' },
  // .m3-lv
  lv: { paddingTop: 4, paddingBottom: 5, paddingHorizontal: 10, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', boxShadow: `2px 2px 0 ${Colors.ink}` },
  lvCur: { backgroundColor: Colors.yellow },
  lvSoon: { borderStyle: 'dashed', borderColor: SOON_LINE, backgroundColor: 'rgba(255,255,255,0.9)', boxShadow: 'none' },
  lvTitle: { fontFamily: Font.display, fontSize: 11, lineHeight: 12.65 },
  lvSub: { fontFamily: Font.body800, fontSize: 10, lineHeight: 11.5, color: SUB },
  // .m3-tag
  tag: { paddingTop: 2, paddingBottom: 3, paddingHorizontal: 8, borderRadius: 11, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  tagCur: { backgroundColor: Colors.yellow, boxShadow: `2px 2px 0 ${Colors.ink}` },
  tagSoon: { borderStyle: 'dashed', borderColor: SOON_LINE, backgroundColor: 'rgba(255,255,255,0.88)' },
  tagText: { fontFamily: Font.body900, fontSize: 11, lineHeight: 14.3 },
  min: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  minText: { fontFamily: Font.display, fontSize: 10, lineHeight: 12 },
  // .m3-here
  here: { height: HERE_H, paddingHorizontal: 9, borderRadius: 10, backgroundColor: Colors.ink, justifyContent: 'center' },
  hereText: { fontFamily: Font.display, fontSize: 10, lineHeight: 12, color: Colors.yellow },
  rider: { position: 'absolute', left: 0, top: 0, width: RIDER_W, height: RIDER_H, transformOrigin: 'bottom' },
  riderImg: { width: RIDER_W, height: RIDER_H },
  pressed: { transform: [{ scale: 0.96 }] },
});
