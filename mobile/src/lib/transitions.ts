/**
 * 화면 넘어가는 효과 (프로토타입 그대로). 앱 전체 Stack 이 이 값을 써요.
 * - push: 오른쪽에서 밀려 들어와요 .36초 · 뒤로는 .28초. 뒤 화면은 왼쪽으로 24% 밀리고 흐려져요(.6) — 프로토타입 .push / .app.pushed
 * - rise: 아래에서 올라와요 .38초 · 내려가기 .28초 (레슨 · 듣기) — 프로토타입 .practice
 * - fade: 서서히 나타나요 .24초 · 사라지기 .2초 (로그인 · 스토리)
 * 프로토타입 값(.5초)은 폰에서 느리다는 의견이 있어 짧게 줄였어요 (2026-11-26). 닫힐 때(뒤로)는 열릴 때보다 더 빨리.
 * 웹은 기본이 '효과 없음'이라 animation: 'default' 로 꼭 켜 줘요.
 * - overlay: 뒤 화면 위에 투명하게 겹쳐요. 시트가 스스로 올라와요 (효과 없음)
 */
import { Animated, Easing } from 'react-native';
import type { StackCardStyleInterpolator, StackNavigationOptions } from 'expo-router/js-stack';

import { Colors } from '@/constants/theme';

type TransitionSpec = NonNullable<StackNavigationOptions['transitionSpec']>['open'];

/** 프로토타입 --ease */
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const timing = (duration: number): TransitionSpec => ({ animation: 'timing', config: { duration, easing: EASE } });
const both = (open: number, close = open) => ({ open: timing(open), close: timing(close) });
const clamp = 'clamp' as const;

const forPush: StackCardStyleInterpolator = ({ current, next, layouts: { screen } }) => {
  const enter = current.progress.interpolate({ inputRange: [0, 1], outputRange: [screen.width, 0], extrapolate: clamp });
  if (!next) {
    return {
      cardStyle: { transform: [{ translateX: enter }] },
      shadowStyle: { shadowColor: '#1E1A2B', shadowOffset: { width: -10, height: 0 }, shadowRadius: 30, shadowOpacity: current.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.15], extrapolate: clamp }) },
    };
  }
  const away = next.progress.interpolate({ inputRange: [0, 1], outputRange: [0, -screen.width * 0.24], extrapolate: clamp });
  return {
    cardStyle: {
      transform: [{ translateX: Animated.add(enter, away) }],
      opacity: next.progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6], extrapolate: clamp }),
    },
  };
};

const forRise: StackCardStyleInterpolator = ({ current, layouts: { screen } }) => ({
  cardStyle: { transform: [{ translateY: current.progress.interpolate({ inputRange: [0, 1], outputRange: [screen.height, 0], extrapolate: clamp }) }] },
});

const forFade: StackCardStyleInterpolator = ({ current }) => ({
  cardStyle: { opacity: current.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: clamp }) },
});

const forNone: StackCardStyleInterpolator = () => ({});

/**
 * 화면 틀: 웹에서 Stack 은 기본으로 '문서 전체가 스크롤'하는 방식(minHeight 100%)인데,
 * Expo 웹은 문서 스크롤을 막아 둬서 화면이 안 내려가요. 화면 높이에 맞추고 안쪽 ScrollView 가 스크롤하게 해요.
 */
export const CARD = { flex: 1, overflow: 'hidden' } as const;

export const SCREEN = {
  push: { animation: 'default', cardStyleInterpolator: forPush, transitionSpec: both(360, 280), gestureDirection: 'horizontal', cardOverlayEnabled: false },
  rise: { animation: 'default', cardStyleInterpolator: forRise, transitionSpec: both(380, 280), gestureEnabled: false, cardOverlayEnabled: false },
  fade: { animation: 'default', cardStyleInterpolator: forFade, transitionSpec: both(240, 200), gestureEnabled: false, cardOverlayEnabled: false },
  overlay: { presentation: 'transparentModal', animation: 'none', cardStyleInterpolator: forNone, transitionSpec: both(0), gestureEnabled: false, cardOverlayEnabled: false, cardStyle: { ...CARD, backgroundColor: 'transparent' } },
  /** 뒤 화면 위에 겹치면서 서서히 (이벤트 시트 화면) */
  overlayFade: { presentation: 'transparentModal', animation: 'default', cardStyleInterpolator: forFade, transitionSpec: both(240, 200), gestureEnabled: false, cardOverlayEnabled: false, cardStyle: { ...CARD, backgroundColor: 'transparent' } },
} satisfies Record<string, StackNavigationOptions>;

/** 모든 Stack(가장 바깥 · 그룹 폴더 안)의 기본값: 머리 없음 · 크림 바탕 · 오른쪽에서 밀려 들어오기 */
export const STACK_OPTIONS = {
  headerShown: false,
  cardStyle: { ...CARD, backgroundColor: Colors.cream },
  ...SCREEN.push,
} satisfies StackNavigationOptions;
