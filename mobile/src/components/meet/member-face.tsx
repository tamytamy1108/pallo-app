import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { MyCharacter } from '@/components/character/my-character';
import { Colors } from '@/constants/theme';
import { Icon } from './icons';

/*
 * 멤버 얼굴 동그라미 (프로토타입 lgFace · memberAv — 이름으로 늘 같은 모습).
 * 캐릭터는 원본 3D PNG 의 몸 색만 바꿔요. 모자 · 안경 같은 꾸미기 아이템은 마이 꾸미기 담당이 만들면 붙여요.
 */
const BODY = {
  yellow: require('@/assets/images/meet/av/up-yellow.png'),
  purple: require('@/assets/images/meet/av/up-purple.png'),
  pink: require('@/assets/images/meet/av/up-pink.png'),
  sky: require('@/assets/images/meet/av/up-sky.png'),
  green: require('@/assets/images/meet/av/up-green.png'),
  coral: require('@/assets/images/meet/av/up-coral.png'),
};
type Body = keyof typeof BODY;
// memberAv 의 몸 색 11가지 → 가진 PNG 6가지로 (hex 색은 가장 가까운 몸 색)
const BODIES: Body[] = ['yellow', 'purple', 'pink', 'sky', 'green', 'coral', 'purple', 'green', 'yellow', 'coral', 'sky'];
// AV_BG 중 잠기지 않은 배경의 첫 색
const BGS = ['#FBF6EA', '#FFE200', '#BFE0F2', '#BFE0F2', '#FFB36B', '#FCE4EC', '#E8D9BF', '#D9B48F', '#5CBF8A', '#493087', '#1E1A2B', '#120F24'];

const look = (name: string) => {
  const h = [...name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const pick = <T,>(L: T[], k: number) => L[((h >>> k % 5) + k * 7) % L.length];
  return { body: pick(BODIES, 0), bg: pick(BGS, 3), flip: h % 2 === 0 };
};

type Props = { name: string; size?: number; me?: boolean; role?: '호스트' | '서브 호스트' | '' };

/** 동그라미 얼굴 + (호스트 노랑 왕관 · 서브 호스트 흰 왕관) — 프로토타입 .lg-av.fc · lgCrownAv */
export function MemberFace({ name, size = 36, me = false, role = '' }: Props) {
  const l = look(name);
  return (
    <View style={{ width: size, height: size }}>
      <View style={StyleSheet.flatten([styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: me ? Colors.cream : l.bg }])}>
        {me ? (
          <View style={{ position: 'absolute', left: -size * 0.08, top: size * 0.12 }}>
            <MyCharacter size={size * 1.16} />
          </View>
        ) : (
          <Image
            source={BODY[l.body]}
            contentFit="contain"
            style={{ position: 'absolute', left: -size * 0.08, top: size * 0.22, width: size * 1.16, height: (size * 1.16 * 332) / 520, transform: [{ scaleX: l.flip ? -1 : 1 }] }}
          />
        )}
      </View>
      {role ? (
        <View style={StyleSheet.flatten([styles.crown, role === '호스트' ? styles.crownHost : styles.crownSub])} accessibilityLabel={role}>
          <Icon name="crown" size={11} fill={role === '호스트' ? Colors.ink : 'none'} strokeWidth={2.4} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { overflow: 'hidden', borderWidth: 2, borderColor: Colors.ink },
  crown: { position: 'absolute', right: -5, bottom: -5, width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  crownHost: { backgroundColor: Colors.yellow },
  crownSub: { backgroundColor: Colors.white },
});
