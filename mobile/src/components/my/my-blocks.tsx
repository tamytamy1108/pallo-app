import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { MemberFace } from '@/components/character/avatar';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors, Radius } from '@/constants/theme';
import { BADGE_PATH, type Badge, type BadgeIcon, type RankRow } from '@/data/my';

import { Lift } from './lift';

/** 숫자 칸 · 배지 아이콘 (프로토타입 myIc: 굵기 2.2 선) */
export function BadgeIc({ ic, size = 22, color = Colors.ink }: { ic: BadgeIcon; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d={BADGE_PATH[ic]} />
    </Svg>
  );
}

/** 섹션 제목 줄 (프로토타입 .sec-title.my-h: 제목 + 오른쪽 '전체 보기 ›') */
export function SecHead({ title, more, onMore }: { title: string; more?: string; onMore?: () => void }) {
  return (
    <View style={styles.secHead}>
      <PText style={styles.secTitle} accessibilityRole="header">
        {title}
      </PText>
      {more && (
        <Pressable onPress={onMore} accessibilityRole="button" accessibilityLabel={`${title} ${more}`} hitSlop={10}>
          <PText style={styles.secMore}>{more}</PText>
        </Pressable>
      )}
    </View>
  );
}

/** 숫자 4칸 (프로토타입 .my-stats .tile: 흰 칸 · 잉크 2px · 작은 그림자) */
export function MyStats({ items }: { items: { ic: BadgeIcon; v: string; l: string; onPress: () => void }[] }) {
  return (
    <View style={styles.stats}>
      {items.map((x) => (
        <Pressable key={x.l} onPress={x.onPress} accessibilityRole="button" accessibilityLabel={`${x.l} ${x.v}`} style={styles.statWrap}>
          {({ pressed }) => (
            <Lift radius={16} pressed={pressed}>
              <View style={styles.stat}>
                <BadgeIc ic={x.ic} size={18} color={Colors.purple} />
                <PText style={styles.statV}>{x.v}</PText>
                <PText style={styles.statL} numberOfLines={1}>
                  {x.l}
                </PText>
              </View>
            </Lift>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const POD_H = [44, 32, 24];
const POD_BG = [Colors.yellow, Colors.rosePink, Colors.sky];

/**
 * 랭킹 요약 카드 (프로토타입 .my-rank: 시상대 2 · 1 · 3 + 내 순위 줄 + 한 줄).
 * podium = 1~3위 (3명보다 적으면 빈 자리), myRank = 내 순위 (이번 주 포인트가 없으면 null → '–').
 */
export function RankSummary({ podium, myRank, myPoints, branch, onPress }: { podium: RankRow[]; myRank: number | null; myPoints: number; branch: string; onPress: () => void }) {
  const rankText = myRank ? `${myRank}위` : '–';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={myRank ? `랭킹 · 내 순위 ${myRank}위` : '랭킹 · 아직 이번 주 순위가 없어요'}>
      <Raised radius={Radius.card}>
        <View style={styles.rankCard}>
          <View style={styles.pods}>
            {[1, 0, 2].map((i) => {
              const p = podium[i];
              if (!p) return <View key={i} style={styles.pd} />;
              return (
                <View key={i} style={styles.pd}>
                  <MemberFace name={p.n} size={40} bg={p.c} />
                  <PText style={styles.pdName} numberOfLines={1}>
                    {p.n}
                  </PText>
                  <View style={[styles.pdBlock, { height: POD_H[i], backgroundColor: POD_BG[i] }]}>
                    <PText style={styles.pdNo}>{i + 1}</PText>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.meRow}>
            <PText style={styles.meT}>내 순위</PText>
            <PText style={styles.meB}>{rankText}</PText>
            <PText style={styles.meT}>
              {myPoints.toLocaleString()}P{branch ? ` · ${branch}` : ''}
            </PText>
          </View>
          <PText style={styles.hint}>퀘스트를 하면 포인트가 쌓여요 · 지점 대항전도 여기서</PText>
        </View>
      </Raised>
    </Pressable>
  );
}

const BADGE_BG = [Colors.yellow, Colors.rosePink, Colors.sky, '#CDEBD0'];

/**
 * 배지 칸 (프로토타입 .my-badges: 4칸 · 동그라미 색은 차례로 노랑 · 분홍 · 하늘 · 민트 · 못 받은 건 흐리게).
 * 서버 배지는 그림(256×256 투명 PNG)을 동그라미 안에 채워 그리고, 그림이 없는 예시 배지는 아이콘으로 그려요.
 */
export function BadgeGrid({ list, desc = false, iconSize = 22 }: { list: Badge[]; desc?: boolean; iconSize?: number }) {
  return (
    <View style={[styles.badges, desc && styles.badgesAll]}>
      {list.map((b, i) => (
        <View key={b.code} style={styles.bd} accessible accessibilityLabel={`${b.name}${b.on ? '' : ' · 아직 못 받았어요'}`}>
          <View style={[styles.bdIc, { backgroundColor: BADGE_BG[i % 4] }, !b.on && styles.bdOff]}>
            {b.imageUrl ? (
              <Image source={b.imageUrl} style={[styles.bdImg, !b.on && styles.bdImgOff]} contentFit="contain" accessible={false} />
            ) : (
              <BadgeIc ic={b.ic} size={iconSize} color={b.on ? Colors.ink : '#A39C8E'} />
            )}
          </View>
          <PText style={[styles.bdName, !b.on && styles.bdNameOff]}>{b.name}</PText>
          {desc && <PText style={styles.bdDesc}>{b.desc}</PText>}
        </View>
      ))}
    </View>
  );
}

/** 목록 카드 (프로토타입 .card.my-list: 줄마다 위 선 · 연보라 아이콘 칸 · 오른쪽 개수 ›) */
export function MyList({ rows }: { rows: { label: string; icon?: ReactNode; value?: string; onPress: () => void }[] }) {
  return (
    <Raised radius={Radius.card}>
      <View style={styles.list}>
        {rows.map((r, i) => (
          <Pressable key={r.label} onPress={r.onPress} accessibilityRole="button" accessibilityLabel={r.value ? `${r.label} ${r.value}` : r.label} style={({ pressed }) => [styles.row, i > 0 && styles.rowLine, pressed && styles.rowPressed]}>
            {r.icon && <View style={styles.rowIc}>{r.icon}</View>}
            <PText style={styles.rowLabel}>{r.label}</PText>
            <View style={styles.sp} />
            {!!r.value && <PText style={styles.rowVal}>{r.value}</PText>}
            <PText style={styles.chev}>›</PText>
          </Pressable>
        ))}
      </View>
    </Raised>
  );
}

const styles = StyleSheet.create({
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginHorizontal: 2 },
  secTitle: { fontFamily: Font.display, fontSize: 17, lineHeight: 24 },
  secMore: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.inkSub, paddingVertical: 6, paddingHorizontal: 2 },
  stats: { flexDirection: 'row', gap: 8, marginRight: 2 },
  statWrap: { flex: 1, minWidth: 0 },
  stat: { alignItems: 'center', gap: 2, paddingVertical: 10, paddingHorizontal: 2, borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white },
  statV: { fontFamily: Font.display, fontSize: 16, lineHeight: 22 },
  statL: { fontFamily: Font.body800, fontSize: 11, lineHeight: 16, color: Colors.inkSub },
  rankCard: { padding: 16, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, backgroundColor: Colors.white },
  pods: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 10 },
  pd: { width: 70, alignItems: 'center', gap: 3 },
  pdName: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, maxWidth: '100%' },
  pdBlock: { width: '100%', alignItems: 'center', borderWidth: 2, borderBottomWidth: 0, borderColor: Colors.ink, borderTopLeftRadius: 10, borderTopRightRadius: 10, justifyContent: 'center' },
  pdNo: { fontFamily: Font.display, fontSize: 16, lineHeight: 20 },
  meRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1.5, borderColor: Colors.line },
  meT: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  meB: { fontFamily: Font.display, fontSize: 20, lineHeight: 26 },
  hint: { marginTop: 6, fontFamily: Font.body700, fontSize: 12, lineHeight: 18, color: Colors.inkSub },
  badges: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  badgesAll: { rowGap: 14 },
  bd: { width: '25%', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  bdIc: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  bdOff: { backgroundColor: '#EDE7DA', borderColor: '#C9C1B1' },
  bdImg: { width: 44, height: 44 },
  bdImgOff: { opacity: 0.35 },
  bdName: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16, textAlign: 'center' },
  bdNameOff: { color: '#A39C8E' },
  bdDesc: { fontFamily: Font.body700, fontSize: 10.5, lineHeight: 14, color: Colors.inkSub, textAlign: 'center' },
  list: { paddingVertical: 4, paddingHorizontal: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, backgroundColor: Colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50 },
  rowLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  rowPressed: { opacity: 0.6 },
  rowIc: { width: 30, height: 30, borderRadius: 10, backgroundColor: Colors.lavender, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: Font.body800, fontSize: 14.5, lineHeight: 21 },
  sp: { flex: 1 },
  rowVal: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  chev: { fontFamily: Font.body800, fontSize: 14.5, lineHeight: 21 },
});
