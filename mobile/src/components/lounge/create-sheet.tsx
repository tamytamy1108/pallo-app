import { Pressable, StyleSheet, View } from 'react-native';

import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { LG_C, type LoungeTab } from '@/data/lounge';

import { LgIcon, type LgIconName } from './icons';

export type CreateKind = 'chal' | 'photo' | 'story' | 'bolt' | 'club' | 'plane' | 'abroad';

/** 만들기 칸: 이름 · 설명 · 바탕 · 아이콘 (프로토타입 lgWrite 의 W) */
const W: Record<CreateKind, [string, string, string, LgIconName]> = {
  chal: ['챌린지 열기', '내 표현함 표현으로 함께 도전', LG_C.lpu, 'flame'],
  photo: ['커뮤니티 글쓰기', '사진 · 일상 · 스터디 · 여행', LG_C.y, 'cam'],
  story: ['스토리 올리기', '24시간 뒤 하이라이트로', '#fff', 'plus'],
  bolt: ['번개 열기', '날짜 · 장소 · 인원만 정하면 지도에', LG_C.pk, 'bolt'],
  club: ['동아리 만들기', '매주 모임 · 매니저 승인 후 열려요', LG_C.lpu, 'flag'],
  plane: ['동행 구하기', '해외여행 같이 갈 사람', LG_C.lsky, 'plane'],
  abroad: ['나도 해외에 있어요', '내 해외 카드 올리기', '#fff', 'globe'],
};

/** 지금 보는 탭에 맞는 걸 앞에 */
const ORDER: Partial<Record<LoungeTab, CreateKind[]>> = {
  meet: ['bolt', 'club', 'photo', 'story', 'plane', 'abroad'],
  trip: ['plane', 'abroad', 'photo', 'story', 'bolt', 'club'],
  chal: ['chal', 'story', 'photo', 'bolt', 'club', 'plane', 'abroad'],
};
const DEFAULT: CreateKind[] = ['photo', 'story', 'bolt', 'club', 'plane', 'abroad'];

/** 오른쪽 아래 + 를 누르면 '무엇을 만들까요?' (프로토타입 lgWrite) */
export function CreateSheet({ open, tab, onClose, onPick }: { open: boolean; tab: LoungeTab; onClose: () => void; onPick: (k: CreateKind) => void }) {
  const order = ORDER[tab] ?? DEFAULT;
  return (
    <Sheet open={open} onClose={onClose} title="무엇을 만들까요?">
      <View style={styles.grid}>
        {order.map((k) => {
          const [l, sub, bg, ic] = W[k];
          const fg = bg === LG_C.pk ? '#fff' : Colors.ink;
          return (
            <Pressable key={k} onPress={() => onPick(k)} accessibilityRole="button" accessibilityLabel={`${l} · ${sub}`} style={styles.cell}>
              {({ pressed }) => (
                <View style={[styles.tileWrap, pressed && styles.pressed]}>
                  {pressed ? null : <View style={styles.plate} />}
                  <View style={[styles.tile, { backgroundColor: bg }]}>
                    <LgIcon name={ic} size={24} color={fg} />
                    <PText style={[styles.b, { color: fg }]}>{l}</PText>
                    <PText style={[styles.small, { color: fg }]}>{sub}</PText>
                  </View>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 3 },
  cell: { width: '48.3%' },
  tileWrap: { marginRight: 3, marginBottom: 3 },
  pressed: { transform: [{ translateX: 3 }, { translateY: 3 }] },
  plate: { position: 'absolute', left: 3, top: 3, right: -3, bottom: -3, borderRadius: 18, backgroundColor: Colors.ink },
  tile: { minHeight: 119, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, padding: 14, gap: 6 },
  b: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: Font.body600, fontSize: 12, lineHeight: 16.8 },
});
