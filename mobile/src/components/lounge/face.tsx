import type { ViewStyle } from 'react-native';

import { MemberAvatar } from '@/components/character/member-avatar';

/*
 * 라운지 프로필 동그라미 (프로토타입 .lg-av + lgFace). 모양은 마이 A 의 MemberAvatar(프로토타입 memberAv 그대로) 하나로 맞춰요.
 * 내 이름이면 내가 꾸민 모습. 'M' · 'S' 같은 동행 자리 표시도 이름처럼 늘 같은 모습이 나와요.
 */
export function Face({ name, size = 36, border = 2, style }: { name: string; size?: number; bg?: string; border?: number; style?: ViewStyle }) {
  return <MemberAvatar name={name} size={size} border={border} style={style} />;
}
