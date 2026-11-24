import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { guardMember } from '@/components/common/trial-guide';
import { GrowInput } from '@/components/ui/grow-input';
import { LgIcon } from '@/components/lounge/icons';
import { LgButton } from '@/components/lounge/lg-button';
import { RouteSheetScreen, useRouteSheet } from '@/components/lounge/route-sheet';
import { CheckBoxList, CheckRow } from '@/components/lounge/trip';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { LG_CC, LG_SAFE, monthDay } from '@/data/lounge';
import { getLounge, setTripState, useItem } from '@/data/lounge-store';

/**
 * 여행 동행 신청 (프로토타입 lgTripApply): 안전 수칙 4개를 모두 체크해야 신청 → 수락 대기 → 오픈채팅.
 * 카드의 [동행 신청]이 비회원이면 체험 안내가 먼저 떠요 (여기까지 오지 않아요).
 */
export default function TripApplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = useItem(String(id));
  const { sheetProps, close } = useRouteSheet();
  const [ok, setOk] = useState<boolean[]>(LG_SAFE.map(() => false));
  const [msg, setMsg] = useState('');
  const all = ok.every(Boolean);
  if (!p || p.k !== 'trip') return <RouteSheetScreen />;
  // 주소로 바로 들어와도 비회원은 보내기 전에 체험 안내 (trial-guide guardMember)
  const apply = () => guardMember(() => send(p.id, p.who), '동행을 신청하려면');
  const send = (id: string, who: string) => {
    setTripState(id, 'wait');
    close();
    showToast(`${who}에게 동행 신청을 보냈어요`);
    // 예시: 잠시 뒤 수락 (실제로는 호스트가 수락하면 알림)
    setTimeout(() => {
      if (getLounge().trip[id] !== 'wait') return;
      setTripState(id, 'ok');
      showToast(`${who}님이 수락했어요 · 오픈채팅 링크가 왔어요`);
    }, 2600);
  };
  return (
    <>
      <RouteSheetScreen />
      <Sheet {...sheetProps} title={p.title} footer={<LgButton label={all ? '동행 신청하기' : '네 가지 모두 확인하면 신청할 수 있어요'} wide height={50} disabled={!all} onPress={apply} />}>
        <PText style={styles.ds}>
          {p.who} · {p.br} · {LG_CC[p.cc][0]} {p.city}
          {'\n'}
          {monthDay(p.from)} ~ {monthDay(p.to)} · {p.type} · {p.age}
          {p.intro ? `\n“${p.intro}”` : ''}
        </PText>
        <View style={styles.fl}>
          <View style={styles.lbRow}>
            <LgIcon name="shield" size={15} />
            <PText style={styles.lb}>신청 전에 꼭 확인해요</PText>
          </View>
          <CheckBoxList>
            {LG_SAFE.map((t, i) => (
              <CheckRow key={t} first={i === 0} text={t} on={ok[i]} onPress={() => setOk((L) => L.map((v, k) => (k === i ? !v : v)))} />
            ))}
          </CheckBoxList>
        </View>
        <GrowInput value={msg} onChangeText={setMsg} multiline placeholder="간단한 자기소개와 함께 가고 싶은 이유를 적어 주세요" placeholderTextColor="#8C8597" style={styles.ta} accessibilityLabel="신청 메시지" />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  ds: { fontFamily: Font.body600, fontSize: 14, lineHeight: 22.4, color: Colors.inkSub },
  fl: { gap: 6 },
  lbRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lb: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 17 },
  ta: {
    minHeight: 110,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: Font.body600,
    fontSize: 14,
    lineHeight: 22.4,
    color: Colors.ink,
    textAlignVertical: 'top',
  },
});
