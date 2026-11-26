import type { Decorator } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { popupsQuery } from '@/api/queries';
import { setClockOffset } from '@/components/home/attendance';
import { applyDevParams } from '@/components/home/dev';
import { PText } from '@/components/ui/text';
import type { Season } from '@/constants/season';
import { Colors } from '@/constants/theme';
import { STUDY_STEPS } from '@/data/library';
import { STUDY_LEVELS } from '@/data/library-lessons';
import { STAGES } from '@/data/mock';
import { stepKey } from '@/state/progress';

import { freshDevice } from '../_support/fresh-device';

type Cleanup = () => void;

/** 오늘 hh:mm 으로 홈 시계(attendance nowDate)를 옮긴다 — 출석 카드 · 시트 · 체험 카드가 이 시각을 본다. */
export function setHomeTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const want = new Date();
  want.setHours(h, m, 0, 0);
  setClockOffset(want.getTime() - Date.now());
}

/**
 * 홈 스토리의 beforeEach — 기기에 남는 값을 모두 처음으로 돌리고(freshDevice) 시계 · 맵 계절을 고정한 뒤 setup.
 * 끝나면 시계 · 계절을 원래대로 (다른 스토리에 남지 않게).
 * time: 기본 12:00 (오늘 두 수업 18:00 · 20:00 모두 시작 전 · QR 창 닫힘). season: 없으면 기기 날짜의 계절.
 */
export const homeDevice = ({ time = '12:00', season }: { time?: string; season?: Season } = {}, setup?: () => void | Cleanup) =>
  freshDevice(() => {
    setHomeTime(time);
    applyDevParams({ season });
    const done = setup?.();
    return () => {
      setClockOffset(0);
      applyDevParams({});
      done?.();
    };
  });

/** 시작 팝업을 끄는 쿼리 값 — 화면 스토리에서 팝업이 다른 상태를 가리지 않게 */
export const NO_POPUPS = [popupsQuery().queryKey, []] as const;

/** 레벨의 단계 id (홈 맵 정류장 순서 그대로 · 예습 → 본학습 → 복습) */
export function levelStepIds(lv: number): string[] {
  const L = STUDY_LEVELS.find((x) => x.lv === lv) ?? STUDY_LEVELS[0];
  return STAGES.flatMap((g) => STUDY_STEPS[L.kind][g.key].map((s) => s.id));
}
/** 그 레벨 · 과의 단계 키들 */
export const unitStepKeys = (lv: number, unit: number) => levelStepIds(lv).map((id) => stepKey(lv, unit, id));

/**
 * 아무것도 그리지 않는 상태(받기 전 · 실패 · 0개)를 위한 안내 — 부품 위에 점선 메모를 붙인다.
 * 부품이 null 이어도 캔버스가 비지 않게 (스모크 검사 · 보는 사람 모두).
 */
export const withNote =
  (note: string): Decorator =>
  (Story) => (
    <View style={styles.wrap}>
      <View style={styles.note}>
        <PText variant="small" color={Colors.inkSub}>
          {note}
        </PText>
      </View>
      <Story />
    </View>
  );

/** 시트 · 팝업(포털로 뜨는 것) 뒤에 까는 홈 바탕 자리 */
export const behindSheet: Decorator = (Story) => (
  <View style={styles.behind}>
    <PText variant="small" color={Colors.inkSub}>
      홈 화면 자리
    </PText>
    <Story />
  </View>
);

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 12 },
  note: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.line },
  behind: { flex: 1, padding: 20 },
});
