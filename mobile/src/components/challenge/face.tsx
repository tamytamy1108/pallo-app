import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { MemberAvatar } from '@/components/character/member-avatar';
import { Colors } from '@/constants/theme';

/*
 * 멤버 얼굴 동그라미 (프로토타입 lgAv + lgFace: .lg-av.fc 안에 각자의 팔로 캐릭터).
 * 모양은 마이 A 의 MemberAvatar(memberAv 꾸밈 그대로) 하나로 맞춰요. 내 이름이면 내가 꾸민 모습.
 */
type Props = {
  name: string;
  /** 바깥 동그라미 색 (p.av) — 캐릭터 바탕이 덮어서 거의 안 보여요 (프로토타입도 같아요) */
  color?: string;
  size?: number;
  /** 카드 위 얼굴 (.chav: 2px 그림자) */
  shadow?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Face({ name, size = 36, shadow = false, style }: Props) {
  return (
    <View style={[{ width: size + (shadow ? 2 : 0), height: size + (shadow ? 2 : 0) }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {shadow ? <View style={[styles.shadow, { width: size, height: size, borderRadius: size / 2 }]} /> : null}
      <MemberAvatar name={name} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute', left: 2, top: 2, backgroundColor: Colors.ink },
});
