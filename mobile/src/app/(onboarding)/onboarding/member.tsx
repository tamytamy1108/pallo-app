import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { OnbScreen } from '@/components/onboarding/parts';
import { Appear } from '@/components/ui/appear';
import { Pressable } from '@/components/ui/pressable';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { stepsFor, updateOnboarding, useOnboarding, type OnbPath } from '@/state/onboarding';

/** 몸 그림 원본 520 × 332 (av/body-*.png · 캐릭터 고르기와 같은 그림) */
const BODY_RATIO = 332 / 520;

/**
 * 세 갈래 길 (시안 #dest-decide .go-opt). 칸을 누르면 바로 그 길의 첫 화면으로 ('다음' 버튼 없음).
 * 오른쪽 끝에서 빼꼼 내다보는 팔로로 몸 색으로 길을 나눠요 (늘 같은 색): 지점 회원 보라 속눈썹 · 체험 핑크 · 앱 구경 노랑.
 * 첫 카드(지점 회원)만 분홍 바탕으로 눈에 띄게, 나머지는 흰 바탕.
 */
const PATHS: { path: Exclude<OnbPath, 'browse'>; title: string; sub: string; to: Href; hero: number; bg?: string }[] = [
  {
    path: 'member',
    title: '네, 지점 회원이에요',
    sub: '다니는 지점에 연동을 요청해요',
    to: '/onboarding/link',
    hero: require('@/assets/characters/av/body-purple-lash.png'),
    // 강조: 진한 무대 분홍 (첫 화면 무대 바닥 가장자리 색)
    bg: '#DE7593',
  },
  { path: 'trial', title: '체험해 보고 싶어요', sub: '가까운 지점 체험 세션 1회', to: '/onboarding/trial', hero: require('@/assets/characters/av/body-pink.png') },
  { path: 'app', title: '앱 구경할래요', sub: '가까운 지점만 고르고 둘러볼게요', to: '/onboarding/langs', hero: require('@/assets/characters/av/body-yellow.png') },
];

const RADIUS = 18;
const CARD_H = 96;
const HERO_W = 132;

/**
 * 가입 3단계 · 지점 회원이에요? 여기서 길이 갈려요.
 * 고른 답으로 길(path)이 정해지고, 뒤로 오면 이 화면에서 다시 고를 수 있어요.
 */
export default function MemberScreen() {
  const path = useOnboarding((s) => s.path);

  const go = (p: (typeof PATHS)[number]) => {
    updateOnboarding({ path: p.path });
    router.push(p.to);
  };

  return (
    <OnbScreen step={3} total={stepsFor(path)} title={'PALLO 지점에\n다니고 있나요?'} desc="고른 길에 따라 다음 화면이 달라져요.">
      {/* 카드마다 OnbScreen 이 차례로 올려 줘요. 팔로로는 카드가 자리 잡은 뒤 오른쪽 끝에서 빼꼼 솟아요 */}
      {PATHS.map((p, i) => (
        <Pressable key={p.path} onPress={() => go(p)} accessibilityRole="button" accessibilityLabel={`${p.title}. ${p.sub}`} style={i === 0 ? styles.first : styles.next}>
          {({ pressed }) => (
            <Raised radius={RADIUS} pressed={pressed}>
              <View style={[styles.card, p.bg ? { backgroundColor: p.bg } : null]}>
                <Appear kind="reactHop" delay={420 + i * 90} style={styles.hero}>
                  <Image source={p.hero} style={StyleSheet.absoluteFill} contentFit="contain" accessible={false} accessibilityIgnoresInvertColors />
                </Appear>
                <View style={styles.cardText}>
                  <PText style={styles.cardTitle}>{p.title}</PText>
                  <View style={styles.subRow}>
                    <PText style={[styles.cardSub, p.bg ? styles.cardSubOnColor : null]}>{p.sub}</PText>
                    <Svg width={15} height={15} viewBox="0 0 24 24">
                      <Path d="M9 4.5l7.5 7.5L9 19.5" fill="none" stroke={Colors.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                </View>
              </View>
            </Raised>
          )}
        </Pressable>
      ))}
    </OnbScreen>
  );
}

const styles = StyleSheet.create({
  first: { marginTop: 20 },
  next: { marginTop: 14 },
  // 팔로로가 카드 오른쪽 끝에서 잘려 보이게 (빼꼼)
  card: { height: CARD_H, justifyContent: 'center', paddingLeft: 18, paddingRight: 104, borderRadius: RADIUS, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, overflow: 'hidden' },
  hero: { position: 'absolute', right: -30, bottom: -22, width: HERO_W, height: HERO_W * BODY_RATIO },
  cardText: { gap: 3 },
  cardTitle: { fontFamily: Font.body900, fontSize: 17, lineHeight: 24, letterSpacing: -0.3 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardSub: { flexShrink: 1, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 19, color: Colors.inkSub },
  // 색 바탕 위 보조 글자는 잉크 80% (회보라는 분홍 위에서 흐려 보여요)
  cardSubOnColor: { color: 'rgba(30,26,43,0.8)' },
});
