import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { EASE, SPRING } from '@/lib/motion';
import { haptic, sfx } from '@/lib/feedback';
import { dismissLinkPush, useLinkEvents, type LinkResult } from '@/state/link-events';

import { markNotiRead } from './noti-state';
import { SYMBOL } from './icons';

const HIDDEN_Y = -180;
/** 저절로 올라가기까지 (천천히 읽을 수 있게 넉넉히 — 누르거나 위로 밀면 바로 닫혀요) */
const SHOW_MS = 8000;
/** 이만큼 위로 밀면 닫혀요 */
const SWIPE_CLOSE = 36;
/** 배너는 한 번에 하나라 타이머도 하나 (토스트와 같은 방식) */
let hideTimer: ReturnType<typeof setTimeout> | undefined;

const COPY: Record<LinkResult, { title: (b: string) => string; body: string; href: Href }> = {
  linked: { title: (b) => `${b} 연동이 끝났어요`, body: '이제 출석 · 내 팀 · 이용권을 쓸 수 있어요', href: '/my' },
  rejected: { title: (b) => `${b}에서 회원 정보를 찾지 못했어요`, body: '지점에서 남긴 말을 보고 다시 요청할 수 있어요', href: '/link-rejected' },
};

/**
 * 지점 연동 결과 푸시 (앱을 보고 있을 때 위에서 내려오는 알림 배너).
 * 앱 아이콘 · PALLO · 지금 · 제목 · 한 줄. 누르면 마이(연동됨) · 연동 안 됨 화면, 8초 뒤 저절로 올라가요. 위로 밀어 닫아요.
 * 지금은 홈 화면에 붙어 있어요 (개발용 '지점 처리 흉내'가 홈에 있어서). 어디서든 보이게 하려면 맨 바깥 _layout 의 ToastHost 옆으로 옮겨요.
 */
export function LinkPushHost() {
  const push = useLinkEvents((s) => s.push);
  if (!push) return null;
  return <LinkPush key={push.key} result={push.result} branch={push.branch} notiId={`link-${push.key}`} />;
}

function LinkPush({ result, branch, notiId }: { result: LinkResult; branch: string; notiId: string }) {
  const insets = useSafeAreaInsets();
  const still = useReducedMotion();
  const y = useSharedValue(still ? 0 : HIDDEN_Y);
  const fade = useSharedValue(still ? 0 : 1);
  // 밀고 있는 중이면 손을 뗄 때 눌림(onPress)으로 치지 않아요
  const dragged = useSharedValue(false);
  const copy = COPY[result];
  const title = copy.title(branch);

  const hide = () => {
    clearTimeout(hideTimer);
    const done = () => dismissLinkPush();
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
    haptic(result === 'linked' ? 'success' : 'warning');
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
    clearTimeout(hideTimer);
    // 푸시를 눌러 열면 알림함의 같은 알림도 읽음
    markNotiRead(notiId);
    dismissLinkPush();
    router.push(copy.href);
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
        y.set(withTiming(HIDDEN_Y, { duration: 220, easing: EASE }, (ok) => ok && runOnJS(dismissLinkPush)()));
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

  return (
    <Animated.View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 8 }, anim]}>
      <GestureDetector gesture={pan}>
        <Pressable onPress={open} sound="tap" accessibilityRole="button" accessibilityLabel={`PALLO 알림, ${title}. ${copy.body}`} accessibilityHint="눌러서 열어요">
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
                  <PText style={styles.body} color={Colors.inkSub} numberOfLines={2}>
                    {copy.body}
                  </PText>
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
