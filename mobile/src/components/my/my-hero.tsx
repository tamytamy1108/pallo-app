import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AvatarStage } from '@/components/character/avatar';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors, Radius } from '@/constants/theme';
import { followLists } from '@/data/my';
import { sfx } from '@/lib/feedback';
import { useMyAvatar } from '@/state/avatar';
import { useMe } from '@/state/me';

import { DecoIcon, SparkIcon } from './icons';
import { Lift } from './lift';

const LANG_NAME = { en: '영어', ja: '일본어', zh: '중국어', es: '스페인어' } as const;

/**
 * 마이 맨 위 캐릭터 룸 카드 (프로토타입 .my-hero): 무대 + [꾸미기] 붓 · 스파크 잔액 + 이름 · 지점 줄 · 한 줄 소개 · 팔로잉/팔로워.
 * width = 카드 바깥 폭 (그림자 제외).
 */
export function MyHero({ width, onFollow }: { width: number; onFollow: (t: 'fing' | 'fer') => void }) {
  const me = useMe();
  const av = useMyAvatar();
  const lists = followLists(me.name, me, me.following);
  // 카드 테두리 2 · 안쪽 여백 10
  const stageW = width - 4 - 20;
  return (
    <Raised radius={Radius.card}>
      <View style={[styles.card, { width }]}>
        <AvatarStage av={av} width={stageW} border big />
        <Pressable
          onPress={() => {
            sfx('tap');
            router.push('/me/customize');
          }}
          accessibilityRole="button"
          accessibilityLabel="캐릭터 꾸미기"
          hitSlop={4}
          style={styles.deco}>
          {({ pressed }) => (
            <Lift radius={19} pressed={pressed}>
              <View style={styles.decoBtn}>
                <DecoIcon />
              </View>
            </Lift>
          )}
        </Pressable>
        <View style={styles.spark} accessibilityLabel={`스파크 ${me.sparks}개`}>
          <SparkIcon />
          <PText style={styles.sparkN}>{me.sparks.toLocaleString()}</PText>
        </View>
        <View style={styles.id}>
          <PText style={styles.name}>{me.name}</PText>
          <PText style={styles.sub}>
            {me.branch} · {LANG_NAME[me.lang]} {me.level} · 회원
          </PText>
          <PText style={styles.bio}>{me.bio || '한 줄 소개를 남겨 보세요'}</PText>
          <View style={styles.fol}>
            <Pressable onPress={() => onFollow('fing')} accessibilityRole="button" accessibilityLabel={`팔로잉 ${lists.fing.length}명`} hitSlop={10} style={styles.folBtn}>
              <PText style={styles.folN}>{lists.fing.length}</PText>
              <PText style={styles.folT}>팔로잉</PText>
            </Pressable>
            <Pressable onPress={() => onFollow('fer')} accessibilityRole="button" accessibilityLabel={`팔로워 ${lists.fer.length}명`} hitSlop={10} style={styles.folBtn}>
              <PText style={styles.folN}>{lists.fer.length}</PText>
              <PText style={styles.folT}>팔로워</PText>
            </Pressable>
          </View>
        </View>
      </View>
    </Raised>
  );
}

const styles = StyleSheet.create({
  card: { padding: 10, gap: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, backgroundColor: Colors.white },
  deco: { position: 'absolute', top: 22, right: 22, zIndex: 4 },
  decoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: { position: 'absolute', top: 28, left: 22, zIndex: 4, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 14, paddingVertical: 4, paddingHorizontal: 10 },
  sparkN: { fontFamily: Font.display, fontSize: 13, lineHeight: 17 },
  id: { paddingHorizontal: 6, paddingBottom: 6, gap: 2 },
  name: { fontFamily: Font.display, fontSize: 22, lineHeight: 28 },
  sub: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  bio: { marginTop: 4, fontFamily: Font.body600, fontSize: 14, lineHeight: 21 },
  fol: { flexDirection: 'row', gap: 16, marginTop: 8 },
  folBtn: { flexDirection: 'row', alignItems: 'baseline' },
  folN: { fontFamily: Font.display, fontSize: 15, lineHeight: 20, marginRight: 4 },
  folT: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
});
