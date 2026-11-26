import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { BranchPicker } from '@/components/onboarding/branch-sheet';
import { OnbScreen } from '@/components/onboarding/parts';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { useMyLocation, type LocateStatus } from '@/lib/location';
import { stepsFor, updateOnboarding, useOnboarding } from '@/state/onboarding';

/** 위치 상태 줄 — 글 · 버튼 (버튼이 없으면 null) */
const LOCATE_LINE: Record<LocateStatus, [string, string | null]> = {
  locating: ['내 위치를 찾고 있어요…', null],
  ok: ['내 위치에서 가까운 순이에요', null],
  denied: ['위치 권한이 없어 지역별로 보여 드려요', '위치 켜기'],
  off: ['위치를 찾지 못해 지역별로 보여 드려요', '다시 찾기'],
};

/**
 * 가입 › 앱 구경 › 나에게 가장 가까운 지점 (6/6).
 * 화면이 열리면 내 위치를 한 번 받아(권한을 처음이면 물어요) GET /branches?lat=&lng= 로 가까운 순 · 지점마다 방향 · 거리를 보여 줘요.
 * 위치를 못 받으면(거절 · 위치 꺼짐 · 위치 모듈 없는 옛 빌드) 지역별 목록 그대로 — 위 줄의 버튼으로 다시 찾아요 (다시 못 묻게 거절했으면 앱 설정).
 * 지점 하나를 누르면 그 지점 안내 전체 화면(onboarding/branch)으로 가요. 거기서 '앱 둘러보기' → 홈.
 * 고른 지점은 나의 지점(me.branch)이 돼요 (연동은 아니라서 비회원 권한 그대로). 쉬는 지점은 체험처럼 흐리게 막아요 (purpose trial).
 * 위치는 저장하지 않고, 서버에는 약 100m 로 깎아 목록 요청에만 실어요.
 */
export default function OnboardingNear() {
  const branchCode = useOnboarding((s) => s.branchCode);
  const loc = useMyLocation();
  const [text, action] = LOCATE_LINE[loc.status];
  return (
    <OnbScreen step={6} total={stepsFor('app')} title={'나에게 가장\n가까운 지점은?'}>
      <View style={styles.locate} accessibilityLiveRegion="polite">
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke={loc.status === 'ok' ? Colors.purple : Colors.inkSub} strokeWidth={2.2} />
          <Circle cx={12} cy={9.5} r={2.4} fill={loc.status === 'ok' ? Colors.purple : Colors.inkSub} />
        </Svg>
        <PText style={styles.locateT} color={loc.status === 'ok' ? Colors.purple : Colors.inkSub} numberOfLines={2}>
          {text}
        </PText>
        {action ? (
          <Pressable
            onPress={() => {
              sfx('tap');
              loc.retry();
            }}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.locateBtn}>
            <PText style={styles.locateBtnT}>{action}</PText>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.picker}>
        <BranchPicker
          value={branchCode || null}
          purpose="trial"
          near={loc.point}
          onPick={(b) => {
            updateOnboarding({ branchCode: b.code, branch: b.name });
            router.push('/onboarding/branch');
          }}
        />
      </View>
    </OnbScreen>
  );
}

const styles = StyleSheet.create({
  // 제목과 위치 줄 사이 (회원 확인 화면 첫 카드와 같은 20), 위치 줄과 검색 칸 사이 12
  locate: { marginTop: 20, minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 6 },
  locateT: { flex: 1, minWidth: 0, fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  locateBtn: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center' },
  locateBtnT: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 16 },
  picker: { marginTop: 12 },
});
