import { type ExpoWebGLRenderingContext } from 'expo-gl';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, PanResponder, Platform, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { MyCharacter } from '@/components/character/my-character';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import { SafeGLView } from './safe-gl-view';
import { mountWorld, type WorldSC } from './scenes';
import type { FocusInfo, Host, LabelSpec, Stage } from './stage';

/** 이름표를 가운데 맞추려고 두는 상자 너비 (프로토타입 translate(-50%)) */
const BOX = 240;
const HERE_H = 20;
const SUB = '#5A5366';
const SOON_LINE = '#9A93A6';
const SOON_INK = '#6F6880';
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
 * 3D 섬 지도 한 장 (프로토타입 .m3-layer): GL 그림 + 이름표 · 내 캐릭터 · 확대 카드(.m3-zp).
 * 크기는 부모가 정해요. 화면을 떠나면(탭 이동 · 앱 내려감) 그리기를 멈춰요.
 */
export function WorldView({ id, sc, swapDir, onOpen, visible = true }: Props) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
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
  const [glKey, setGlKey] = useState(0);

  useEffect(() => {
    open.current = onOpen;
  });
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
    };
    host.current = h;
    if (building.current) clearTimeout(building.current);
    // 지도를 만드는 동안(폰에서 1~5초) JS 가 멈춰요 → 빠르게 다른 지도로 넘어가면 만들지 않게 잠깐 기다렸다가 시작해요
    building.current = setTimeout(() => {
      building.current = null;
      if (left.current) return;
      try {
        stage.current = mountWorld(h, id, sc, (no) => open.current(no));
      } catch (e) {
        // GL 이 안 되는 기기 · 브라우저: 지도 없이 바탕색만 (아래 목록은 그대로 써요)
        console.warn('3D 지도를 그리지 못했어요', e);
        setDrawn(true);
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
      {size && <SafeGLView key={glKey} style={styles.fill} onContextCreate={onContextCreate} msaaSamples={2} />}
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

const ZP_EASE = Easing.bezier(0.2, 0.9, 0.3, 1.2);

/** 눌러서 확대했을 때 아래 카드 (프로토타입 .m3-zp) */
function FocusCard({ info, onGo, onClose }: { info: FocusInfo | null; onGo: (no: number) => void; onClose: () => void }) {
  const [shown, setShown] = useState<FocusInfo | null>(info);
  const p = useSharedValue(0);
  const reduced = useReducedMotion();
  // 닫히는 동안에도 마지막 카드를 보여 줘요 (그리는 중에 바로 기억)
  if (info && info !== shown) setShown(info);
  useEffect(() => {
    p.set(reduced ? (info ? 1 : 0) : withTiming(info ? 1 : 0, { duration: 350, easing: ZP_EASE }));
  }, [info, p, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - p.value) * 110 }] }));
  if (!shown) return null;
  const soon = shown.st === 'soon';
  const go = soon ? (shown.soonT ?? '곧 열려요') : (shown.goT ?? (shown.st === 'done' ? '다시 하기' : '장면 열기'));
  return (
    <Animated.View style={[styles.zp, style]} pointerEvents={info ? 'auto' : 'none'}>
      <View style={styles.zpT}>
        <PText style={styles.zpSmall} numberOfLines={1}>
          {shown.k ?? `${shown.no}번 장면`}
        </PText>
        <PText style={styles.zpB} numberOfLines={1}>
          {shown.n}
        </PText>
      </View>
      <Pressable onPress={() => onGo(shown.no)} accessibilityRole="button" accessibilityLabel={go} style={({ pressed }) => [styles.zpGo, soon && styles.zpGoSoon, pressed && styles.pressed]}>
        <PText style={[styles.zpGoText, soon && { color: '#8C8597' }]}>{go}</PText>
      </Pressable>
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="전체 보기" hitSlop={6} style={({ pressed }) => [styles.zpX, pressed && styles.pressed]}>
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path d="M2 2l10 10M12 2L2 12" stroke={Colors.ink} strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  loading: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
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
  // .m3-zp
  zp: { position: 'absolute', left: 12, right: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingRight: 12, paddingLeft: 16, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, boxShadow: `3px 4px 0 ${Colors.ink}` },
  zpT: { flex: 1, minWidth: 0 },
  zpSmall: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15, color: Colors.purple },
  zpB: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  zpGo: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, justifyContent: 'center' },
  zpGoSoon: { backgroundColor: '#EFEAE0', borderStyle: 'dashed', borderColor: SOON_LINE },
  zpGoText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  zpX: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.96 }] },
});
