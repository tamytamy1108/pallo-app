import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { MemberLock } from '@/components/common/member-lock';
import { memberGate } from '@/components/common/trial-guide';
import { Pressable } from '@/components/ui/pressable';
import { Colors } from '@/constants/theme';
import { canUse } from '@/state/access';
import { lockView } from '@/state/lock-hits';
import { useMe } from '@/state/me';

export type LockScreen = 'lounge' | 'event' | 'my';

const LOCK_TOAST = '지점 회원이 되면 다 볼 수 있어요';
/** 화면마다 '잠긴 칸이 보이는지' 재는 함수 (화면의 onScroll 이 checkScrollLock 으로 불러요) */
const sensors = new Map<LockScreen, () => void>();

/** 스크롤할 때마다 불러요: 잠긴 칸이 화면 안으로 들어오면 잠김 보기 1번 (한 번 들어올 때 한 번만) */
export function checkScrollLock(screen: LockScreen) {
  sensors.get(screen)?.();
}

/**
 * 스크롤 잠김 (09-onboarding '회원 · 비회원 권한'): 라운지(모든 탭) · 이벤트 · 마이 공통.
 * 회원은 그대로. 비회원은 children 을 peek 높이까지만 보여 주고, 아래쪽을 크림색으로 흐리게 덮은 뒤
 * '지점 회원이 되면 다 볼 수 있어요' 칸(누구냐에 따라 버튼이 달라요 · MemberLock)을 붙여요.
 * 흐린 곳을 누르면 늘 체험 안내 시트 (memberGate '끝까지 보려면'). 잠긴 칸까지 스크롤하면 잠김 1번 — 화면에 들어올 때마다 한 번만,
 * 3번째마다 권유 시트 (state/lock-hits lockView).
 */
/** inset: 잠김 칸 양옆 여백 — 바깥에 여백이 없는 화면(라운지)은 16 */
export function ScrollLock({ screen, peek, panel, inset = 0, children }: { screen: LockScreen; peek: number; panel?: ReactNode; inset?: number; children: ReactNode }) {
  const locked = useMe((m) => !canUse(m, 'fullScroll'));
  if (!locked) return children;
  return (
    <LockedTail screen={screen} peek={peek} panel={panel} inset={inset}>
      {children}
    </LockedTail>
  );
}

function LockedTail({ screen, peek, panel, inset, children }: { screen: LockScreen; peek: number; panel?: ReactNode; inset: number; children: ReactNode }) {
  const { height } = useWindowDimensions();
  const panelRef = useRef<ComponentRef<typeof View>>(null);
  const counted = useRef(false);

  // 화면에 다시 들어오면 다시 셀 수 있어요
  useFocusEffect(
    useCallback(() => {
      counted.current = false;
    }, []),
  );

  // 스크롤로 잠긴 칸이 보였을 때만 세요 (화면에 들어올 때마다 한 번) — 3번째마다 권유 시트 (state/lock-hits)
  const seen = useCallback(() => {
    if (counted.current) return;
    counted.current = true;
    lockView(LOCK_TOAST);
  }, []);

  useEffect(() => {
    sensors.set(screen, () => {
      if (counted.current) return;
      panelRef.current?.measureInWindow((_x, y) => {
        // 잠긴 칸 윗부분이 화면 아래쪽(탭 바 위)까지 올라왔으면
        if (y > 0 && y < height - 140) seen();
      });
    });
    return () => {
      sensors.delete(screen);
    };
  }, [screen, height, seen]);

  return (
    <View>
      <View style={[styles.clip, { maxHeight: peek }]}>
        {children}
        <Pressable onPress={() => memberGate('끝까지 보려면')} sound={false} accessibilityRole="button" accessibilityLabel={LOCK_TOAST} style={styles.fade}>
          <LinearGradient colors={['rgba(251,246,234,0)', 'rgba(251,246,234,0.85)', Colors.cream]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
        </Pressable>
      </View>
      <View ref={panelRef} collapsable={false} style={[styles.panel, { paddingHorizontal: inset }]}>
        {panel ?? <MemberLock title={LOCK_TOAST} sub="지금은 위쪽만 미리 볼 수 있어요. 지점에서 연동하면 끝까지 열려요." />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 170 },
  panel: { marginTop: -24 },
});
