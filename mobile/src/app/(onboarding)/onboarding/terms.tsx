import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { logout } from '@/api/auth';
import type { ConsentDoc } from '@/api/onboarding';
import { useOnboardingInfo } from '@/api/use-onboarding';
import { Bob } from '@/components/onboarding/fx-motion';
import { NextButton } from '@/components/onboarding/parts';
import { TermsRow, TermsCheck } from '@/components/onboarding/start-terms';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors, Radius } from '@/constants/theme';
import { EASE } from '@/lib/motion';
import { SCREEN } from '@/lib/transitions';
import { getOnboarding, updateOnboarding } from '@/state/onboarding';

/** 버전 id → 동의했는지 */
type Agreed = Record<string, boolean>;

const JUMP = require('@/assets/characters/c-purple-jump-3d.png');

/**
 * 약관 동의 (가입 단계 맨 앞 · 진행 바 칸에 넣지 않아요).
 * 카카오 동의 창에서 돌아오면 바로 올라오는 시트예요 (시안: 노란 바탕 위). '전체 동의' 한 번이면 끝,
 * 필수 약관을 다 체크해야 '동의하고 시작하기'가 켜져요. 바깥을 누르면 첫 화면으로 돌아가요.
 * 약관은 서버 현행 버전 (GET /onboarding consents · 순서 그대로) — 답은 버전 id 로 담아 가입 완료(POST /onboarding)에 보내요.
 * 같은 응답의 카카오 값(prefill)으로 닉네임 · 이름 · 번호를 여기서 한 번만 미리 채워요. 전문이 있는 약관은 '보기'로 시트를 열어요.
 */
export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const still = useReducedMotion();
  const info = useOnboardingInfo();
  const docs = info.data?.consents ?? [];
  const [agreed, setAgreed] = useState<Agreed>(() => Object.fromEntries(getOnboarding().consents.map((c) => [c.versionId, c.agreed])));
  const [reading, setReading] = useState<ConsentDoc | null>(null);

  const allOn = docs.length > 0 && docs.every((d) => agreed[d.versionId]);
  const ready = docs.length > 0 && docs.every((d) => !d.required || agreed[d.versionId]);

  // 바탕이 .3초 어두워지고 시트가 .55초 올라와요 (ui/sheet 와 같은 움직임)
  const shown = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) shown.set(withTiming(1, { duration: 550, easing: EASE }));
  }, [still, shown]);
  const dimStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, shown.get() * 1.8) }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - shown.get()) * 520 }] }));

  // 가입 첫 화면에서 닫으면 가입을 그만둬요 → 로그아웃하면 app/_layout.tsx 가 첫 화면(welcome)으로 보내요
  const leave = () => (router.canGoBack() ? router.back() : void logout());
  const close = () => {
    if (still) return leave();
    shown.set(withTiming(0, { duration: 300, easing: EASE }, (done) => done && runOnJS(leave)()));
  };

  const toggle = (id: string) => setAgreed((a) => ({ ...a, [id]: !a[id] }));
  const toggleAll = () => setAgreed(Object.fromEntries(docs.map((d) => [d.versionId, !allOn])));

  const start = () => {
    if (!info.data) return;
    const consents = docs.map((d) => ({ versionId: d.versionId, agreed: !!agreed[d.versionId] }));
    const o = getOnboarding();
    const p = info.data.prefill;
    // 카카오 값은 처음 한 번만 (뒤로 와서 다시 동의해도 고친 값을 덮지 않아요)
    updateOnboarding(o.prefilled ? { consents } : { consents, prefilled: true, nickname: p.nickname ?? '', realName: p.realName ?? '', phone: p.phone ?? '' });
    router.push('/onboarding/nickname');
  };

  return (
    <View style={styles.root}>
      {/* 첫 화면에서 서서히 바뀌고, 그 위로 시트가 올라와요 */}
      <Stack.Screen options={SCREEN.fade} />
      {/* 시안 그대로: 노란 바탕 + 뛰어오르는 팔로로 (그림이라 화면 읽기에서는 건너뛰어요) */}
      <View style={styles.backdrop} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Bob amp={10} ms={2400} tilt={3} style={[styles.jump, { top: insets.top + 40 }]}>
          <Image source={JUMP} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityIgnoresInvertColors />
        </Bob>
      </View>
      <Animated.View style={[StyleSheet.absoluteFill, dimStyle]}>
        <Pressable style={[StyleSheet.absoluteFill, styles.dim]} onPress={close} accessibilityRole="button" accessibilityLabel="닫기" />
      </Animated.View>

      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }, sheetStyle]} accessibilityViewIsModal onAccessibilityEscape={close}>
        <View style={styles.handle} />
        <PText style={styles.title} accessibilityRole="header">
          PALLO를 쓰려면{'\n'}동의가 필요해요
        </PText>

        {info.isPending ? (
          <LoadingState />
        ) : info.isError ? (
          <ErrorState onRetry={() => info.refetch()} />
        ) : (
          <>
            <Pressable onPress={toggleAll} accessibilityRole="checkbox" accessibilityLabel="전체 동의하기" accessibilityState={{ checked: allOn }}>
              {({ pressed }) => (
                <View style={[styles.all, allOn && styles.allOn, pressed && styles.pressed]}>
                  <TermsCheck on={allOn} />
                  <PText style={styles.allText}>전체 동의하기</PText>
                </View>
              )}
            </Pressable>

            <View style={styles.list}>
              {docs.map((d) => (
                <TermsRow
                  key={d.versionId}
                  label={d.title}
                  required={d.required}
                  on={!!agreed[d.versionId]}
                  onToggle={() => toggle(d.versionId)}
                  onOpen={d.body.trim() ? () => setReading(d) : undefined}
                />
              ))}
            </View>
          </>
        )}

        <View style={styles.cta}>
          <NextButton label="동의하고 시작하기" onPress={start} disabled={!ready} />
        </View>
      </Animated.View>

      <Sheet open={!!reading} onClose={() => setReading(null)} title={reading?.title ?? ''} tall>
        <ScrollView>
          <PText style={styles.docBody}>{reading?.body ?? ''}</PText>
        </ScrollView>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: Colors.yellow },
  jump: { position: 'absolute', alignSelf: 'center', width: 260, height: 262 },
  dim: { backgroundColor: 'rgba(30,26,43,0.45)' },
  // 옆 테두리는 화면 밖으로 빼서 위 모서리 곡선만 보여요 (시안: border-top 만)
  sheet: {
    marginHorizontal: -2,
    paddingTop: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.cream,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: Colors.ink,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#CFC6B2', marginBottom: 18 },
  title: { fontFamily: Font.body900, fontSize: 22, lineHeight: 30, letterSpacing: -0.5 },
  all: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 15, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  allOn: { borderColor: Colors.purple, backgroundColor: Colors.lavender },
  allText: { fontFamily: Font.body900, fontSize: 17, lineHeight: 24 },
  pressed: { opacity: 0.85 },
  list: { paddingTop: 6, paddingHorizontal: 4 },
  cta: { marginTop: 14 },
  docBody: { fontFamily: Font.body600, fontSize: 14, lineHeight: 22, color: Colors.ink },
});
