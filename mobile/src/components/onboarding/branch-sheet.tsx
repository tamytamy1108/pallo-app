import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { relativePlace, type BranchOption, type Compass, type LatLng } from '@/api/onboarding';
import { branchBlockReason, useBranchOptions } from '@/api/use-onboarding';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';

const ALL = '전체';
/** 내 위치를 받았을 때 전체 탭의 한 묶음 이름 */
const NEAREST = '가까운 순';
/** 방위 → 화살표 돌릴 각도 (위쪽 = 북) */
const COMPASS_DEG: Record<Compass, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
/** 지역 탭이 이보다 많으면 탭 줄을 옆으로 밀어서 봐요 */
const FIT_TABS = 5;

/** link: 연동 요청 (이미 연동 · 확인 중인 지점은 막아요) · trial: 체험 신청 (쉬는 지점은 막아요) */
export type BranchPurpose = 'link' | 'trial';


/**
 * 지점 목록 시트 (프로토타입 .bs): 제목 · 검색 · 지역 탭 · 지역별 묶음 카드. 고르면 닫혀요.
 * 전체 탭 옆에 지점이 모두 몇 곳인지 보여 줘요. value 는 고른 지점 code.
 */
export function BranchSheet({
  open,
  onClose,
  title,
  value,
  onPick,
  purpose,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  value: string;
  onPick: (branch: BranchOption) => void;
  purpose: BranchPurpose;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title} tall>
      <BranchPicker
        value={value}
        purpose={purpose}
        onPick={(b) => {
          onPick(b);
          onClose();
        }}
      />
    </Sheet>
  );
}

/**
 * 지점 고르기 본문 (검색 · 지역 탭 · 지역별 묶음 카드). 시트 안에 그대로 넣어 써요
 * — 가입 단계 · 앱 안 체험 예약(TrialForm) · 연동 요청의 지점 시트(BranchSheet)가 써요.
 * 지점은 GET /branches (폐점 제외 · 지역). 고를 수 없는 지점은 숨기지 않고 흐리게 막고 이유를 보여 줘요 (branchBlockReason).
 * near(내 위치)를 주면 서버가 가까운 순으로 주고, 지점마다 내 위치에서 본 방향 화살표 · '남동쪽 8.8km' 를 붙여요.
 * 그때 전체 탭은 지역 묶음 대신 '가까운 순' 한 묶음, 지역 탭은 그 지역 안에서 가까운 순이에요. 좌표 없는 지점은 맨 뒤 · 거리 줄 없음.
 */
export function BranchPicker({
  value,
  onPick,
  purpose,
  near = null,
}: {
  value: string | null;
  onPick: (branch: BranchOption) => void;
  purpose: BranchPurpose;
  near?: LatLng | null;
}) {
  const list = useBranchOptions(near);
  const [tab, setTab] = useState(ALL);
  const [q, setQ] = useState('');
  if (list.isPending) return <LoadingState />;
  if (list.isError) return <ErrorState onRetry={() => list.refetch()} />;
  const { rows, groups, nearest } = list.data;
  const tabs = [ALL, ...groups.map((g) => g.region)];
  const cur = tabs.includes(tab) ? tab : ALL;
  const scroll = tabs.length > FIT_TABS;
  const needle = q.trim();
  const shownGroups = nearest && cur === ALL ? [{ region: NEAREST, rows: nearest }] : groups;
  const regions = shownGroups
    .filter((g) => cur === ALL || g.region === cur)
    .map((g) => ({ region: g.region, rows: g.rows.filter((b) => !needle || b.name.includes(needle)) }))
    .filter((g) => g.rows.length > 0);
  const seg = tabs.map((t) => (
    <Pressable key={t} onPress={() => setTab(t)} accessibilityRole="tab" accessibilityState={{ selected: cur === t }} style={[styles.segItem, scroll && styles.segItemScroll, cur === t && styles.segOn]}>
      <PText style={[styles.segText, cur === t && styles.segTextOn]} numberOfLines={1}>
        {t}
        {t === ALL ? <PText style={[styles.segCount, cur === t && styles.segTextOn]}> {rows.length}</PText> : null}
      </PText>
    </Pressable>
  ));
  return (
    <View style={styles.picker}>
      <View style={styles.search}>
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Circle cx={11} cy={11} r={6.5} fill="none" stroke={Colors.inkSub} strokeWidth={2.4} />
          <Path d="M16 16l4 4" stroke={Colors.inkSub} strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
        <TextInput value={q} onChangeText={setQ} placeholder="지점 이름으로 찾기" placeholderTextColor="#A79F8F" style={styles.searchInput} accessibilityLabel="지점 이름으로 찾기" />
      </View>
      {scroll ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segScroll} contentContainerStyle={styles.seg} accessibilityRole="tablist">
          {seg}
        </ScrollView>
      ) : (
        <View style={styles.seg} accessibilityRole="tablist">
          {seg}
        </View>
      )}
      {regions.length === 0 ? <PText style={styles.empty}>{rows.length ? '찾는 지점이 없어요' : '아직 고를 수 있는 지점이 없어요'}</PText> : null}
      {regions.map((g) => (
        <View key={g.region}>
          <View style={styles.reg}>
            <PText style={styles.regName}>{g.region}</PText>
            <PText style={styles.regCount}>{g.rows.length}곳</PText>
          </View>
          <View style={styles.group}>
            {g.rows.map((b, i) => {
              const on = b.code === value;
              const blocked = branchBlockReason(b, purpose);
              const place = relativePlace(b);
              return (
                <Pressable
                  key={b.code}
                  disabled={!!blocked}
                  onPress={() => {
                    sfx('tap');
                    onPick(b);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on, disabled: !!blocked }}
                  accessibilityLabel={[b.name, place ? `내 위치에서 ${place}` : null, blocked].filter(Boolean).join(', ')}
                  style={({ pressed }) => [styles.row, i > 0 && styles.rowLine, on && styles.rowOn, pressed && styles.rowPressed]}>
                  {nearest ? <Bearing direction={b.distanceMeters != null ? b.direction : null} known={b.distanceMeters != null} off={!!blocked} /> : null}
                  <View style={styles.rowText}>
                    <PText style={[styles.rowName, on && styles.rowNameOn, blocked ? styles.rowNameOff : null]} numberOfLines={1}>
                      {b.name}
                    </PText>
                    {place ? (
                      <PText style={styles.rowPlace} numberOfLines={1}>
                        {place}
                      </PText>
                    ) : null}
                  </View>
                  {blocked ? <PText style={styles.rowWhy}>{blocked}</PText> : null}
                  <View style={[styles.chk, on && styles.chkOn, blocked ? styles.chkOff : null]}>
                    {on ? (
                      <Svg width={12} height={12} viewBox="0 0 24 24">
                        <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={Colors.white} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * 내 위치에서 본 지점 방향 — 동그라미 안 화살표(위 = 북). 바로 옆(방위 없음)이면 점, 좌표 없는 지점은 빈 동그라미.
 */
function Bearing({ direction, known, off }: { direction: Compass | null; known: boolean; off: boolean }) {
  const color = off ? '#B4AC9B' : Colors.purple;
  return (
    <View style={styles.bearing} accessible={false} importantForAccessibility="no-hide-descendants">
      {known && direction ? (
        <View style={{ transform: [{ rotate: `${COMPASS_DEG[direction]}deg` }] }}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M12 3l6.5 16L12 15.5 5.5 19z" fill={color} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
          </Svg>
        </View>
      ) : known ? (
        <View style={[styles.bearingDot, { backgroundColor: color }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // 시트 내용 칸 간격(12)과 같게
  picker: { gap: 12 },
  search: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, boxShadow: '2px 2px 0 #1E1A2B' },
  // 웹: 브라우저 기본 포커스 테두리(주황)를 없애요 — 바깥 검색 상자가 이미 테두리를 그려요 ('auto' 외곽선은 굵기 0 이어도 그려져서 solid · 투명으로)
  searchInput: { flex: 1, height: '100%', paddingVertical: 0, includeFontPadding: false, fontFamily: Font.body700, fontSize: 15, color: Colors.ink, outlineStyle: 'solid', outlineWidth: 0, outlineColor: 'transparent' },
  seg: { flexGrow: 1, flexDirection: 'row', padding: 3, borderRadius: 14, backgroundColor: '#EFE8D8' },
  segScroll: { flexGrow: 0, borderRadius: 14 },
  segItem: { flex: 1, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segItemScroll: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', minWidth: 64, paddingHorizontal: 14 },
  segOn: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink },
  segText: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 18, color: Colors.inkSub },
  segTextOn: { fontFamily: Font.body900, color: Colors.ink },
  segCount: { fontFamily: Font.display, fontSize: 12, color: Colors.inkSub },
  empty: { marginTop: 20, textAlign: 'center', fontFamily: Font.body700, fontSize: 14, color: Colors.inkSub },
  reg: { flexDirection: 'row', alignItems: 'baseline', gap: 5, paddingTop: 6, paddingBottom: 6, paddingHorizontal: 4 },
  regName: { fontFamily: Font.body900, fontSize: 14, lineHeight: 19 },
  regCount: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  group: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white, overflow: 'hidden' },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingRight: 14 },
  rowLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  rowOn: { backgroundColor: Colors.lavender },
  rowPressed: { backgroundColor: '#F6F1E4' },
  rowText: { flex: 1, minWidth: 0, paddingVertical: 8 },
  rowName: { fontFamily: Font.body800, fontSize: 15.5, lineHeight: 21 },
  rowPlace: { fontFamily: Font.body700, fontSize: 12, lineHeight: 16, color: Colors.inkSub },
  bearing: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  bearingDot: { width: 8, height: 8, borderRadius: 4 },
  rowNameOn: { fontFamily: Font.body900, color: Colors.purple },
  rowNameOff: { color: '#B4AC9B' },
  rowWhy: { fontFamily: Font.body800, fontSize: 12, lineHeight: 16, color: Colors.inkSub },
  chk: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CFC6B2', alignItems: 'center', justifyContent: 'center' },
  chkOn: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  chkOff: { opacity: 0 },
});
