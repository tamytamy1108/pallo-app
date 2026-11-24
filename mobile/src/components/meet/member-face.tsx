import { StyleSheet, View } from 'react-native';

import { MemberFace } from '@/components/common/member-face';
import { Colors } from '@/constants/theme';

import { Icon } from './icons';

/**
 * 멤버 얼굴 + 왕관 (프로토타입 lgCrownAv: 호스트 = 노랑 왕관, 코호스트 = 흰 왕관 — 프로필 오른쪽 아래).
 * 얼굴은 공통 MemberFace 를 그대로 써요.
 */
export function CrownFace({ name, size = 36, me = false, role = '' }: { name: string; size?: number; me?: boolean; role?: string }) {
  const crown = role === '호스트' || role === '코호스트' || role === '호스트 · 나';
  return (
    <View style={{ width: size, height: size }}>
      <MemberFace name={name} size={size} me={me} />
      {crown ? (
        <View style={[styles.crown, role === '코호스트' ? styles.sub : styles.host]} accessibilityLabel={role}>
          <Icon name="crown" size={11} fill={role === '코호스트' ? 'none' : Colors.ink} strokeWidth={2.4} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // .lg-crown: 18 × 18 · 잉크 1px · 오른쪽 -4 · 아래 -3
  crown: { position: 'absolute', right: -4, bottom: -3, width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  host: { backgroundColor: Colors.yellow },
  sub: { backgroundColor: Colors.white },
});
