import type { StyleProp, ViewStyle } from 'react-native';

import { MemberFace } from './avatar';

/**
 * 다른 멤버의 작은 동그란 얼굴 (프로토타입 lgFace — 이니셜 대신 그 사람 캐릭터).
 * 멤버별 꾸밈은 프로토타입 memberAv 그대로 (이름으로 늘 같은 조합 · data/my memberAvatar). 내 이름이면 내가 꾸민 모습.
 * size: 지름(px) · border: 테두리(기본 2, 프로토타입 .lg-av) · bg: 테두리 안 바탕(없으면 그 사람 배경색).
 * 담당: 마이 A — 라운지 · 마이 B · 랭킹이 가져다 써요.
 */
export function MemberAvatar({ name, size = 36, border = 2, bg, style }: { name: string; size?: number; border?: number; bg?: string; style?: StyleProp<ViewStyle> }) {
  return <MemberFace name={name} size={size} border={border} bg={bg} style={style} />;
}
