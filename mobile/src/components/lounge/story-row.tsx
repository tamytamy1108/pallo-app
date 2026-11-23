import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { useBlockedNames } from '@/components/common/report-sheet';
import { guardMember } from '@/components/common/trial-guide';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { branchOk, LG_SCAT, type Story, STORY_CATS, type StoryCat } from '@/data/lounge';
import { highlightCats, highlightList, type StoryGroup, useLounge, userGroups } from '@/data/lounge-store';
import { useMe } from '@/state/me';

import { Face } from './face';
import { LgIcon } from './icons';
import { go } from './nav';

/**
 * 스토리 줄 (프로토타입 #lgStories): 내 스토리 → 사람별(24시간 안 · 안 본 사람 먼저) → 세로 구분선 → 카테고리 하이라이트.
 * 동그라미 62px · 간격 10px · 테두리는 노랑 한 색, 스토리 개수만큼 칸이 나뉘어요(다 본 건 얇은 회색).
 */
export function StoryRow() {
  const me = useMe();
  const s = useLounge();
  const blocked = useBlockedNames();
  const ok = (x: Story) => branchOk(s.brs, x.br) && !blocked.includes(x.who);
  const UG = userGroups(s, ok);
  const mineG = UG.find((g) => g.mine);
  const cats = highlightCats(s, ok, STORY_CATS);
  const unseen = (g: StoryGroup) => g.list.some((x) => !s.seen[x.id]);
  const openGroup = (id: string) => go(`/story/${encodeURIComponent(id)}`);
  const newStory = () => guardMember(() => go('/story/new'), '스토리를 올리려면');
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <View style={styles.st}>
        <Pressable onPress={() => (mineG ? openGroup('u:__me') : newStory())} accessibilityRole="button" accessibilityLabel={mineG ? '내 스토리 보기' : '스토리 올리기'} style={styles.stIn}>
          {({ pressed }) => (
            <>
              <View style={[styles.r, pressed && styles.rPressed]}>
                {mineG ? <Ring n={mineG.list.length} seen={!unseen(mineG)} /> : null}
                <Face name={me.name} size={62} style={styles.face} />
              </View>
              <PText style={styles.nm} numberOfLines={1}>
                내 스토리
              </PText>
            </>
          )}
        </Pressable>
        {/* 오른쪽 아래 + = 올리기 (동그라미 버튼과 겹치지 않게 따로) */}
        <Pressable onPress={newStory} accessibilityRole="button" accessibilityLabel="스토리 올리기" hitSlop={8} style={styles.plus}>
          <PText style={styles.plusText}>+</PText>
        </Pressable>
      </View>
      {UG.filter((g) => !g.mine).map((g) => {
        const x = g.list[g.list.length - 1];
        const un = unseen(g);
        return (
          <Pressable key={g.id} onPress={() => openGroup(g.id)} accessibilityRole="button" accessibilityLabel={`${g.who} 스토리 ${g.list.length}개${un ? ' · 안 본 스토리 있음' : ''}`} style={styles.st}>
            {({ pressed }) => (
              <>
                <View style={[styles.r, pressed && styles.rPressed]}>
                  <Ring n={g.list.length} seen={!un} />
                  <Face name={x.who} size={62} style={styles.face} />
                </View>
                <PText style={styles.nm} numberOfLines={1}>
                  {g.who}
                </PText>
              </>
            )}
          </Pressable>
        );
      })}
      {UG.length ? (
        <View style={styles.sep}>
          <View style={styles.sepLine} />
        </View>
      ) : null}
      {cats.map((k) => (
        <HighlightCircle key={k} k={k} list={highlightList(s, k, ok)} seen={s.seen} onPress={() => openGroup(`c:${k}`)} />
      ))}
    </ScrollView>
  );
}

function HighlightCircle({ k, list, seen, onPress }: { k: StoryCat; list: Story[]; seen: Record<string, boolean>; onPress: () => void }) {
  const c = LG_SCAT[k];
  const un = list.filter((x) => !seen[x.id]);
  const pin = list.some((x) => x.pin);
  const nw = un.find((x) => !x.pin) ?? un[0];
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${c.name} 하이라이트 · ${un.length ? `안 본 글 ${un.length}개 · 최근 ${nw?.who}` : `${list.length}개`}`} style={styles.st}>
      {({ pressed }) => (
        <>
          <View style={[styles.r, pressed && styles.rPressed]}>
            <Ring n={Math.min(list.length, 8)} seen={!un.length} />
            <View style={[styles.b, { backgroundColor: c.tile }]}>
              <LgIcon name={c.icon} size={24} />
            </View>
            {pin ? (
              <View style={styles.pin}>
                <LgIcon name="tack" size={12} sw={2.6} />
              </View>
            ) : null}
            {nw ? <Face name={nw.who} size={24} style={styles.hlav} /> : null}
          </View>
          <PText style={styles.nm} numberOfLines={1}>
            {c.name}
          </PText>
        </>
      )}
    </Pressable>
  );
}

/** 스토리 수만큼 나뉜 노랑 테두리 (칸 사이 9도) · 다 봤으면 얇은 회색 — 프로토타입 .lg-hlring */
function Ring({ n, seen }: { n: number; seen: boolean }) {
  const size = 74;
  const sw = seen ? 2 : 3.5;
  const r = (size - sw) / 2;
  const C = 2 * Math.PI * r;
  const g = !seen && n > 1 ? 9 : 0;
  const seg = C / Math.max(1, n) - (C * g) / 360;
  return (
    <Svg width={size} height={size} style={styles.ring} pointerEvents="none">
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={seen ? '#CFC6B4' : Colors.yellow}
        strokeWidth={sw}
        strokeDasharray={g ? `${seg} ${(C * g) / 360}` : undefined}
        transform={`rotate(${-90 + g / 2} ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 4, gap: 10, alignItems: 'flex-start' },
  st: { width: 70, alignItems: 'center', gap: 6 },
  stIn: { alignItems: 'center', gap: 6 },
  r: { width: 62, height: 62, marginTop: 2 },
  rPressed: { transform: [{ scale: 0.95 }] },
  ring: { position: 'absolute', left: -6, top: -6 },
  b: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  plus: {
    position: 'absolute',
    left: 46,
    top: 43,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0px 0px 0px 2px ${Colors.cream}`,
  },
  plusText: { fontFamily: Font.body900, fontSize: 17, lineHeight: 19, marginTop: -1 },
  nm: { fontFamily: Font.body800, fontSize: 12, lineHeight: 15, maxWidth: 70 },
  sep: { width: 8, alignItems: 'center' },
  sepLine: { width: 2, height: 64, borderRadius: 1, backgroundColor: '#D9D2C3' },
  pin: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.yellow,
    borderWidth: 2,
    borderColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0px 0px 0px 2px ${Colors.cream}`,
  },
  hlav: { position: 'absolute', right: -4, bottom: -2, borderRadius: 12, boxShadow: `0px 0px 0px 2px ${Colors.cream}` },
  face: { zIndex: 1 },
});
