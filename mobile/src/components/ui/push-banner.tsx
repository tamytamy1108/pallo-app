import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { SYMBOL } from '@/components/home/icons';
import { markNotiRead } from '@/components/home/noti-state';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic as playHaptic, sfx, type HapticKind } from '@/lib/feedback';
import { EASE, SPRING } from '@/lib/motion';
import { createStore } from '@/lib/store';

/** 위에서 내려오는 푸시 배너 한 장 */
export type PushBannerMsg = {
  title: string;
  /** 제목 아래 한 줄 (두 줄까지) */
  body?: string;
  /** 누르면 갈 화면. 없으면 누르면 닫히기만 해요 */
  href?: Href;
  /** 알림함의 같은 알림 id — 배너를 눌러 열면 그 알림도 읽음 */
  notiId?: string;
  /** 내려올 때 떨림 (기본 tap) */
  haptic?: HapticKind;
};

const HIDDEN_Y = -180;
/** 저절로 올라가기까지 (천천히 읽을 수 있게 넉넉히 — 누르거나 위로 밀면 바로 닫혀요) */
const SHOW_MS = 8000;
/** 이만큼 위로 밀면 닫혀요 */
const SWIPE_CLOSE = 36;

const store = createStore<{ msg: PushBannerMsg; key: number } | null>(null);
// React Compiler 가 x.use() 를 React use() 로 보고 건너뛰지 않게 useXxx 이름으로 불러요
const useBanner = store.useStore;
let seq = 0;
/** 배너는 한 번에 하나라 타이머도 하나 (토스트와 같은 방식) */
let hideTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * 앱을 보고 있을 때 온 푸시를 위에서 내려 보여요 (폰 알림 모양: 앱 아이콘 · PALLO · 지금 · 제목 · 한 줄).
 * 어디서든 showPushBanner({ title, body, href }) 로 불러요. 떠 있는 게 있으면 새 것으로 바꿔 끼워요.
 * PushBannerHost 는 맨 바깥(_layout)에 한 번만 있어요.
 * 부르는 곳: 지점 연동 결과(state/link-events) · 앱이 켜져 있을 때 온 FCM(api/use-foreground-push).
 */
export function showPushBanner(msg: PushBannerMsg) {
  clearTimeout(hideTimer);
  store.set({ msg, key: ++seq });
}

export const dismissPushBanner = () => {
  clearTimeout(hideTimer);
  store.set(null);
};

/** 맨 바깥(_layout)에 한 번만 */
export function PushBannerHost() {
  const banner = useBanner();
  if (!banner) return null;
  return <PushBanner key={banner.key} msg={banner.msg} />;
}

function PushBanner({ msg }: { msg: PushBannerMsg }) {
  const insets = useSafeAreaInsets();
  const still = useReducedMotion();
  const y = useSharedValue(still ? 0 : HIDDEN_Y);
  const fade = useSharedValue(still ? 0 : 1);
  // 밀고 있는 중이면 손을 뗄 때 눌림(onPress)으로 치지 않아요
  const dragged = useSharedValue(false);
  const { title, body, href, notiId } = msg;

  const hide = () => {
    clearTimeout(hideTimer);
    const done = () => store.set(null);
    if (still) {
      fade.set(withTiming(0, { duration: 160 }, (ok) => ok && runOnJS(done)()));
      return;
    }
    y.set(withTiming(HIDDEN_Y, { duration: 320, easing: EASE }, (ok) => ok && runOnJS(done)()));
  };
  const hideLater = (ms: number) => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, ms);
  };

  useEffect(() => {
    sfx('peek');
    playHaptic(msg.haptic ?? 'tap');
    if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(`PALLO 알림. ${title}`);
    if (still) fade.set(withTiming(1, { duration: 160 }));
    else y.set(withTiming(0, { duration: 460, easing: EASE }));
    hideLater(SHOW_MS);
    return () => clearTimeout(hideTimer);
    // 한 번 내려올 때만 (key 가 바뀌면 새로 그려요)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = () => {
    if (dragged.get()) return;
    // 푸시를 눌러 열면 알림함의 같은 알림도 읽음
    if (notiId) markNotiRead(notiId);
    dismissPushBanner();
    if (href) router.push(href);
  };

  // 위로 밀면 따라 올라가고, 아래로는 조금만 늘어나요 (배너 하나라 JS 쪽에서 움직여도 충분해요)
  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetY([-6, 6])
    .onStart(() => {
      dragged.set(true);
      clearTimeout(hideTimer);
    })
    .onUpdate((e) => {
      y.set(e.translationY < 0 ? e.translationY : Math.sqrt(e.translationY) * 2);
    })
    .onEnd((e) => {
      if (e.translationY < -SWIPE_CLOSE || e.velocityY < -500) {
        y.set(withTiming(HIDDEN_Y, { duration: 220, easing: EASE }, (ok) => ok && runOnJS(dismissPushBanner)()));
        return;
      }
      y.set(withTiming(0, { duration: 300, easing: SPRING }));
      hideLater(4000);
    })
    .onFinalize(() => {
      // 손을 뗀 뒤 눌림(onPress)이 따라오지 않게 한 틱 뒤에 풀어요
      setTimeout(() => dragged.set(false), 0);
    });

  const anim = useAnimatedStyle(() => ({ opacity: fade.get(), transform: [{ translateY: y.get() }] }));
  const label = body ? `PALLO 알림, ${title}. ${body}` : `PALLO 알림, ${title}`;

  return (
    <Animated.View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 8 }, anim]}>
      <GestureDetector gesture={pan}>
        <Pressable onPress={open} sound="tap" accessibilityRole="button" accessibilityLabel={label} accessibilityHint={href ? '눌러서 열어요' : '눌러서 닫아요'}>
          {({ pressed }) => (
            <View>
              <View pointerEvents="none" style={[styles.shadow, pressed && styles.shadowPressed]} />
              <View style={[styles.card, pressed && styles.cardPressed]}>
                <AppIcon />
                <View style={styles.tx}>
                  <View style={styles.meta}>
                    <PText style={styles.app}>PALLO</PText>
                    <PText style={styles.when} color={Colors.inkSub}>
                      · 지금
                    </PText>
                  </View>
                  <PText style={styles.title} numberOfLines={2}>
                    {title}
                  </PText>
                  {body ? (
                    <PText style={styles.body} color={Colors.inkSub} numberOfLines={2}>
                      {body}
                    </PText>
                  ) : null}
                </View>
              </View>
            </View>
          )}
        </Pressable>
      </GestureDetector>
    </Animated.View>
  );
}

/** 앱 아이콘: 보라 바탕 + 노란 PALLO 심볼 */
function AppIcon() {
  return (
    <View style={styles.icon}>
      <Svg width={22} height={22 * 0.887} viewBox="0 0 426.31 377.94">
        <Path d={SYMBOL} fill={Colors.yellow} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 70 },
  shadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, borderRadius: 22, backgroundColor: Colors.ink },
  shadowPressed: { opacity: 0 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingLeft: 12, paddingRight: 14, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  cardPressed: { transform: [{ translateX: 4 }, { translateY: 4 }] },
  icon: { width: 40, height: 40, borderRadius: 11, backgroundColor: Colors.purple, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  tx: { flex: 1, minWidth: 0 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  app: { fontFamily: Font.display, fontSize: 10.5, lineHeight: 14, letterSpacing: 0.6 },
  when: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 14 },
  title: { marginTop: 2, fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  body: { fontFamily: Font.body700, fontSize: 13, lineHeight: 18 },
});
