import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { MyCharacter } from '@/components/character/my-character';
import { Colors } from '@/constants/theme';

/*
 * 멤버 프로필 동그라미 (프로토타입 .lg-av.fc + lgFace(name) · memberAv(name)).
 * 이름으로 늘 같은 몸 색 · 배경 · 좌우 방향이 나와요. 몸 그림은 원본 3D PNG (assets/av/up-*.png, 다른 색은 프로토타입 avTintMake 와 같은 방법으로 색만 바꾼 PNG).
 * 모자 · 안경 같은 아이템은 아직 안 그려요 — 멤버 꾸미기 데이터가 생기면 마이 A 의 캐릭터 부품으로 바꿔요.
 */

const BODY = {
  yellow: require('@/assets/images/common/up-yellow.png'),
  purple: require('@/assets/images/common/up-purple.png'),
  pink: require('@/assets/images/common/up-pink.png'),
  sky: require('@/assets/images/common/up-sky.png'),
  green: require('@/assets/images/common/up-green.png'),
  coral: require('@/assets/images/common/up-coral.png'),
  '#8B5CF6': require('@/assets/images/common/up-8b5cf6.png'),
  '#2DD4BF': require('@/assets/images/common/up-2dd4bf.png'),
  '#FFB800': require('@/assets/images/common/up-ffb800.png'),
  '#E5484D': require('@/assets/images/common/up-e5484d.png'),
  '#38BDF8': require('@/assets/images/common/up-38bdf8.png'),
} satisfies Record<string, number>;
type BodyColor = keyof typeof BODY;
const BODY_PICK: BodyColor[] = ['yellow', 'purple', 'pink', 'sky', 'green', 'coral', '#8B5CF6', '#2DD4BF', '#FFB800', '#E5484D', '#38BDF8'];
// AV_BG 중 잠기지 않은 배경의 바탕색 (크림 룸 · 팔로 옐로 · 맑은 하늘 · 여름 바다 · 노을 · 벚꽃길 · 도서관 · 단골 카페 · 러닝 트랙 · 파티 조명 · 서울 야경 · 우주 정거장)
const BG_PICK = ['#FBF6EA', '#FFE200', '#BFE0F2', '#BFE0F2', '#FFB36B', '#FCE4EC', '#E8D9BF', '#D9B48F', '#5CBF8A', '#493087', '#1E1A2B', '#120F24'];

/** memberAv(name) 의 섞기 그대로: 이름이 달라도 겹치지 않게 */
export function memberLook(name: string) {
  const h = [...name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const pick = <T,>(L: T[], k: number) => L[((h >>> k % 5) + k * 7) % L.length];
  return { body: pick(BODY_PICK, 0), bg: pick(BG_PICK, 3), flip: h % 2 === 0 };
}

/**
 * 멤버 얼굴 동그라미. 내 것(me)은 꾸미기 캐릭터 (마이 A MyCharacter), 다른 멤버는 이름으로 고른 모습.
 * size 는 동그라미 지름 (댓글 38 · 답글 28 · 목록 36).
 */
export function MemberFace({ name, size = 38, me = false, border = 2 }: { name: string; size?: number; me?: boolean; border?: number }) {
  const look = memberLook(name);
  // .fc .lgf .av-char { left: -8%; width: 116%; top: 22%; aspect-ratio: 520 / 332 } — 테두리 안쪽 크기 기준
  const inner = size - border * 2;
  const w = inner * 1.16;
  return (
    <View
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, borderWidth: border, backgroundColor: me ? Colors.cream : look.bg }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {me ? (
        // my-default.png 는 모자까지 들어 있는 1087×896 그림 — 몸이 같은 자리에 오게 조금 크게 · 위로
        <MyCharacter size={inner * 1.34} style={{ position: 'absolute', left: -inner * 0.2, top: -inner * 0.16, width: inner * 1.34, height: inner * 1.34 * (896 / 1087) }} />
      ) : (
        <Image
          source={BODY[look.body]}
          contentFit="contain"
          style={{ position: 'absolute', left: -inner * 0.08, top: inner * 0.22, width: w, height: w * (332 / 520), transform: [{ scaleX: look.flip ? -1 : 1 }] }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { borderColor: Colors.ink, overflow: 'hidden' },
});
