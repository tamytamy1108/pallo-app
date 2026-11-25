import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { runAfterSheetClose } from '@/components/ui/sheet';
import { Pressable } from '@/components/ui/pressable';
import { sfx } from '@/lib/feedback';
import { getMe } from '@/state/me';

/**
 * 멤버 프로필 열기: 내 이름이면 마이, 아니면 프로필 시트(/me/profile/[이름]).
 * 앱 어디서든 얼굴 · 이름을 누르면 이걸로 열어요.
 */
export function openProfile(name: string) {
  if (!name) return;
  sfx('tap');
  router.push((name === getMe().name ? '/my' : `/me/profile/${encodeURIComponent(name)}`) as Href);
}

/** 시트 안에서 누를 때: 시트를 먼저 닫고 다 내려간 뒤에 프로필을 열어요 (시트 위에 화면이 겹치지 않게) */
export function openProfileFromSheet(name: string, closeSheet: () => void) {
  if (!name) return;
  runAfterSheetClose(() => openProfile(name));
  closeSheet();
}

/** 얼굴 · 이름을 감싸서 누르면 프로필이 열리게 해요 */
export function ProfileTap({ name, children, style, onPress }: { name: string; children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress ?? (() => openProfile(name))} disabled={!name} accessibilityRole="button" accessibilityLabel={`${name} 프로필`} hitSlop={4} style={style}>
      {children}
    </Pressable>
  );
}
