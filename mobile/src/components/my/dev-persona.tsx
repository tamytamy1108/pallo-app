import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { DEV_CLUB_ROLES, DEV_PERSONAS, devClubRole, devProfile, switchDevProfile, type DevClubRole, type DevPersona } from '@/lib/dev-profile';
import { sfx } from '@/lib/feedback';

/** 지금 사람 이름 ('' = 보통) */
const nowLabel = DEV_PERSONAS.find((p) => p.k === devProfile)?.label ?? '보통';

/**
 * 개발용 (개발 서버에서만): 마이 제목 옆 '개발 · 사람' 알약 → 시트에서 비회원 · 체험 · 연동 대기 · 회원 · 프로 · 지점 관리자 … 를 골라 앱을 다시 열어요.
 * 동아리 안 역할(멤버 · 호스트 · 코호스트)도 여기서. 고르는 법 · 저장은 lib/dev-profile.
 */
export function DevPersonaPill() {
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState<DevPersona | 'none'>(devProfile || 'none');
  const [club, setClub] = useState<DevClubRole>(devClubRole);
  if (!__DEV__) return null;
  const changed = who !== (devProfile || 'none') || club !== devClubRole;
  return (
    <>
      <Pressable
        onPress={() => {
          sfx('tap');
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`개발용 사람 바꾸기 · 지금 ${nowLabel}`}
        hitSlop={6}>
        {({ pressed }) => (
          <View style={[styles.pill, pressed && styles.pillDown]}>
            <PText style={styles.devTag} color={Colors.ink}>
              DEV
            </PText>
            <PText style={styles.pillText} color={Colors.white}>
              {nowLabel}
              {devClubRole !== 'auto' ? ` · 동아리 ${DEV_CLUB_ROLES.find((r) => r.k === devClubRole)?.label}` : ''}
            </PText>
          </View>
        )}
      </Pressable>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="누구로 볼까요?"
        tall
        footer={<Button label={changed ? '이 사람으로 다시 열기' : '지금 보는 사람이에요'} wide disabled={!changed} onPress={() => switchDevProfile({ who, club })} />}>
        <PText style={styles.desc} color={Colors.inkSub}>
          개발용이에요 (실제 앱에는 없어요). 고르면 앱을 다시 열고 가입 단계를 건너뛰어요. 사람마다 기록(진도 · 포인트 · 글)이 따로 남아요.
        </PText>
        {(['멤버', '프로 · 직원'] as const).map((g) => (
          <View key={g} style={styles.group}>
            <PText style={styles.groupT} color={Colors.inkSub}>
              {g}
            </PText>
            {DEV_PERSONAS.filter((p) => p.group === g).map((p) => (
              <Row key={p.k} label={p.label} desc={p.desc} on={who === p.k} onPress={() => setWho(p.k)} />
            ))}
          </View>
        ))}
        <View style={styles.group}>
          <PText style={styles.groupT} color={Colors.inkSub}>
            처음부터
          </PText>
          <Row label="보통 (가입부터)" desc="개발용 사람 없이 첫 화면 · 가입 단계부터" on={who === 'none'} onPress={() => setWho('none')} />
        </View>
        <View style={styles.group}>
          <PText style={styles.groupT} color={Colors.inkSub}>
            동아리 안에서 나
          </PText>
          <View style={styles.seg} accessibilityRole="radiogroup">
            {DEV_CLUB_ROLES.map((r) => (
              <Pressable key={r.k} onPress={() => setClub(r.k)} accessibilityRole="radio" accessibilityState={{ checked: club === r.k }} style={[styles.segItem, club === r.k && styles.segOn]}>
                <PText style={styles.segT}>{r.label}</PText>
              </Pressable>
            ))}
          </View>
          <PText style={styles.note} color={Colors.inkSub}>
            그대로: 내가 연 동아리만 호스트 · 나머지는 모든 동아리를 그 역할로 열어요 (번개 호스트는 번개를 직접 열어서 봐요)
          </PText>
        </View>
        <PText style={styles.note} color={Colors.inkSub}>
          웹은 주소에 ?who=pro · ?who=guest 처럼 붙이면 그 탭만 그 사람이에요 (탭을 나란히 띄워 비교할 때). 본사 운영자는 앱에 아직 역할이 없어요.
        </PText>
      </Sheet>
    </>
  );
}

function Row({ label, desc, on, onPress }: { label: string; desc: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${label} · ${desc}`}>
      {({ pressed }) => (
        <View style={[styles.row, on && styles.rowOn, pressed && styles.rowDown]}>
          <View style={[styles.dot, on && styles.dotOn]} />
          <View style={styles.flex}>
            <PText style={styles.rowT}>{label}</PText>
            <PText style={styles.rowD} color={Colors.inkSub}>
              {desc}
            </PText>
          </View>
          {label === nowLabel ? (
            <PText style={styles.now} color={Colors.purple}>
              지금
            </PText>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // 개발용이라 앱 버튼과 다르게: 잉크 바탕 · 노란 점선 (홈 '지점 처리 흉내'와 같은 모양)
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingLeft: 5,
    paddingRight: 12,
    borderRadius: 17,
    backgroundColor: Colors.ink,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.yellow,
  },
  pillDown: { transform: [{ scale: 0.96 }] },
  pillText: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
  devTag: {
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: Colors.yellow,
    fontFamily: Font.display,
    fontSize: 9,
    lineHeight: 14,
    letterSpacing: 0.6,
  },
  desc: { fontFamily: Font.body600, fontSize: 13.5, lineHeight: 21 },
  group: { gap: 8 },
  groupT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
  },
  rowOn: { backgroundColor: '#FFF6BF' },
  rowDown: { transform: [{ scale: 0.98 }] },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
  },
  dotOn: { borderWidth: 6 },
  rowT: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
  rowD: { fontFamily: Font.body600, fontSize: 12.5, lineHeight: 17 },
  now: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  seg: { flexDirection: 'row', gap: 6 },
  segItem: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segOn: { backgroundColor: Colors.yellow },
  segT: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  note: { fontFamily: Font.body600, fontSize: 12, lineHeight: 18 },
});
