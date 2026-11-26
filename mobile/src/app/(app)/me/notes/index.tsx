import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type ScrollViewInstance, type ViewInstance } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { AccountPage, Box, Icon, Lift } from '@/components/account/parts';
import { DiaryList } from '@/components/account/diary-list';
import { NoteRow, noteExpression, savedNoteItems } from '@/components/account/pro-note-parts';
import { markNoteRead, useNoteState } from '@/components/account/store';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors, TAB_ROW_H } from '@/constants/theme';
import { DIARY_EXAMPLES, MY_TEAMS, PN_TAG_COLOR, PN_WAIT, PRO_NOTES, PRO_SENT_NOTES, teamLabel, teamNameByNo } from '@/data/account';
import { sfx } from '@/lib/feedback';
import { toggleExpression, useSavedExpressions } from '@/state/expressions';
import { isProLike, useMe } from '@/state/me';
import { MemberOnly } from '@/components/common/member-lock';
import { ChipScroll } from '@/components/ui/chip-scroll';

/**
 * PRO'S NOTE 모아 보기 (프로토타입 pnListHTML): 오늘 준비 중 · 나의 스터디 일기 · 저장한 표현 · 전체 / 팀별 / 저장한 표현 탭.
 * ?view=diary 면 나의 스터디 일기 모아 보기 (프로토타입 내 활동 › 일기 diaryHTML).
 * 맞는 API: 44 `/me/pro-notes`
 */
function ProNotesScreen() {
  const { view, box: box0 } = useLocalSearchParams<{ view?: string; box?: string }>();
  const me = useMe();
  // 프로: 보낸 노트 · 받은 노트로 나눠요 (프로도 멤버로 참여하면 노트를 받아요)
  const [box, setBox] = useState<'sent' | 'got'>(box0 === 'got' ? 'got' : 'sent');
  if (view === 'diary') return <DiaryList />;
  if (!isProLike(me.role)) return <NotesList />;
  const sw = <BoxSwitch box={box} onBox={setBox} />;
  return box === 'sent' ? <SentList head={sw} /> : <NotesList head={sw} />;
}

/** 프로: [보낸 노트 n] [받은 노트 n] — 위 줄 바로 아래 붙은 밑줄 탭 (챌린지 상세 탭 줄과 같은 높이 · 선) */
function BoxSwitch({ box, onBox }: { box: 'sent' | 'got'; onBox: (b: 'sent' | 'got') => void }) {
  return (
    <View style={styles.box} accessibilityRole="tablist">
      {(
        [
          ['sent', '보낸 노트', PRO_SENT_NOTES.length],
          ['got', '받은 노트', PRO_NOTES.length],
        ] as const
      ).map(([k, l, n]) => {
        const on = box === k;
        return (
          <Pressable
            key={k}
            onPress={() => {
              sfx('tab');
              onBox(k);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.boxTab, on && styles.boxTabOn]}>
            <PText style={[styles.boxT, on && styles.boxTOn]}>
              {l} <PText style={styles.boxN}>{n}</PText>
            </PText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 프로가 보낸 노트 목록: 날짜 · 팀 · 정리한 것 · n/m명 읽음 · 고마워요 */
function SentList({ head }: { head: ReactNode }) {
  const open = (id: string) => {
    sfx('tap');
    router.push({ pathname: '/me/notes/[id]', params: { id, from: 'list' } });
  };
  return (
    <AccountPage title="PRO'S NOTE" bodyStyle={styles.body} head={head}>
      <PText style={styles.intro}>내가 반에 보낸 노트예요. 몇 명이 읽었는지 · 고마워요를 볼 수 있어요.</PText>
      <PText style={styles.ym}>2026년 11월</PText>
      <Box style={styles.list}>
        {PRO_SENT_NOTES.map((n, i) => (
          <Pressable key={n.id} onPress={() => open(n.id)} accessibilityRole="button" accessibilityLabel={`${n.m}월 ${n.d}일 ${teamNameByNo(n.team)} 보낸 노트`} style={({ pressed }) => [styles.sRow, i > 0 && styles.sLine, pressed && styles.sPressed]}>
            <View style={styles.sDt}>
              <PText style={styles.sDtS}>{`${n.m}월`}</PText>
              <PText style={styles.sDtB}>{n.d}</PText>
              <PText style={styles.sDtS}>{n.wd}</PText>
            </View>
            <View style={styles.sTx}>
              <PText style={styles.sH} numberOfLines={1}>
                {`${teamNameByNo(n.team)} · ${n.readN}/${n.total}명 읽음 · 고마워요 ${n.thanksN}`}
              </PText>
              <PText style={styles.sP} numberOfLines={1}>
                {n.items.map((x) => x[1]).join(' · ')}
              </PText>
            </View>
            <PText style={styles.sChev}>›</PText>
          </Pressable>
        ))}
      </Box>
    </AccountPage>
  );
}

function NotesList({ head }: { head?: ReactNode }) {
  const { read, diary } = useNoteState();
  const saved = savedNoteItems(useSavedExpressions());
  // 토스트 [보러가기] → /me/notes?tab=saved 로 오면 저장한 표현 탭부터
  const { tab: firstTab } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<string>(firstTab === 'saved' ? 'saved' : 'all');
  const L = PRO_NOTES.filter((n) => tab === 'all' || n.team === tab);
  const diaries = PRO_NOTES.filter((n) => (diary[n.id] ?? DIARY_EXAMPLES[n.id])?.at);
  const last = diaries[0];
  const lastD = last ? (diary[last.id] ?? DIARY_EXAMPLES[last.id]) : null;
  const sv = saved[saved.length - 1];
  const tabs: [string, string][] = [['all', '전체'], ...MY_TEAMS.map((t): [string, string] => [t.no, teamLabel(t)]), ['saved', `저장한 표현 ${saved.length}`]];

  const open = (id: string) => {
    sfx('tap');
    markNoteRead(id);
    router.push({ pathname: '/me/notes/[id]', params: { id, from: 'list' } });
  };

  // 탭을 바꿨을 때 탭 줄 아래로 내려 보고 있었으면, 탭 줄이 위 줄 바로 아래 오게 올려 새 목록을 처음부터 보여요 (새 목록 머리가 위 줄 밑에 잘려 보이지 않게)
  const scroll = useRef<ScrollViewInstance>(null);
  const chips = useRef<ViewInstance>(null);
  const lastTab = useRef(tab);
  useEffect(() => {
    if (lastTab.current === tab) return;
    lastTab.current = tab;
    const sv = scroll.current;
    const inner = sv?.getInnerViewRef();
    const row = chips.current;
    if (!sv || !inner || !row) return;
    row.measureLayout(inner, (_x, ry) => {
      row.measureInWindow((_wx, wy) => {
        sv.measureInWindow((_sx, sy) => {
          // 지금 스크롤 자리 = 탭 줄의 본문 안 자리 - 화면에서 스크롤 칸 맨 위부터 탭 줄까지
          const now = ry - (wy - sy);
          const want = Math.max(0, ry - 8);
          if (now > want + 1) sv.scrollTo({ y: want, animated: false });
        });
      });
    });
  }, [tab]);

  return (
    <AccountPage title="PRO'S NOTE" bodyStyle={styles.body} head={head} scrollRef={scroll}>
      <PText style={styles.intro}>수업이 끝나면 프로님이 그날 배운 표현 · 바로잡은 문장 · 질문을 정리해서 보내 줘요. 마음에 드는 건 저장해 두고 다시 봐요.</PText>
      <Box color={Colors.yellow} style={styles.wait}>
        <PText style={styles.waitB}>{`오늘 ${teamNameByNo(PN_WAIT.team)} 노트 준비 중`}</PText>
        <PText style={styles.waitS}>{`${PN_WAIT.end}에 수업이 끝나면 ${PN_WAIT.pro} 프로님이 보내 줘요 · 도착하면 알림을 드려요`}</PText>
      </Box>
      <View style={styles.two}>
        <Tile
          icon={<Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.tileImg} contentFit="contain" />}
          title="나의 스터디 일기"
          n={diaries.length}
          unit="편"
          preview={last && lastD ? `${last.m}.${last.d} · ${(lastD.t || '').slice(0, 18)}…` : '노트 맨 아래에서 써요'}
          onPress={() => {
            sfx('tap');
            router.push({ pathname: '/me/notes', params: { view: 'diary' } });
          }}
        />
        <Tile
          sv
          icon={<Icon name="save" size={20} fill={Colors.purple} color={Colors.ink} strokeWidth={2} />}
          title="저장한 표현"
          n={saved.length}
          unit="개"
          preview={sv ? sv.n.items[sv.i][1].slice(0, 22) : '노트에서 책갈피를 눌러 모아요'}
          onPress={() => {
            sfx('tap');
            setTab('saved');
          }}
        />
      </View>
      <View ref={chips} collapsable={false}>
        <ChipScroll horizontal showsHorizontalScrollIndicator={false} style={styles.tabsWrap} contentContainerStyle={styles.tabs} accessibilityRole="tablist">
          {tabs.map(([k, l]) => {
            const on = tab === k;
            return (
              <Pressable
                key={k}
                onPress={() => {
                  sfx('tab');
                  setTab(k);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[styles.tab, on && styles.tabOn]}>
                <PText style={styles.tabText} color={on ? Colors.white : Colors.ink}>
                  {l}
                </PText>
              </Pressable>
            );
          })}
        </ChipScroll>
      </View>
      {tab === 'saved' ? (
        saved.length ? (
          saved.map(({ n, i }) => {
            const [tg, t, b] = n.items[i];
            return (
              <View key={`${n.id}:${i}`} style={styles.it}>
                <View style={styles.itB}>
                  <PText style={[styles.itTag, { color: PN_TAG_COLOR[tg] }]}>{`${tg} · ${n.m}/${n.d} ${teamNameByNo(n.team)}`}</PText>
                  <PText style={styles.itTitle}>{t}</PText>
                  <PText style={styles.itP}>{b}</PText>
                </View>
                <Pressable
                  onPress={() => {
                    toggleExpression(noteExpression(n, i));
                    showToast('저장을 취소했어요');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="저장 취소"
                  accessibilityState={{ selected: true }}
                  style={[styles.mk, styles.mkOn]}>
                  <Icon name="save" size={18} color={Colors.white} />
                </Pressable>
              </View>
            );
          })
        ) : (
          <NotesEmpty sub="노트에서 저장 버튼을 누르면 여기 모여요." />
        )
      ) : L.length ? (
        <>
          <PText style={styles.ym}>2026년 11월</PText>
          <Box style={styles.list}>
            {L.map((n, i) => (
              <NoteRow key={n.id} n={n} first={i === 0} fresh={!!n.isNew && !read[n.id]} onPress={() => open(n.id)} />
            ))}
          </Box>
        </>
      ) : (
        // 이 반에서 받은 노트가 아직 없을 때: 빈 흰 칸 대신 '아직 없어요' (2026-11-26)
        <NotesEmpty sub={'이 반 수업이 끝나면 프로님이 노트를 보내 줘요.\n도착하면 알림을 드려요.'} />
      )}
    </AccountPage>
  );
}

/** 목록이 비었을 때: 팔로로 · '아직 없어요' · 한 줄 안내 */
function NotesEmpty({ sub }: { sub: string }) {
  return (
    <View style={styles.none} accessible accessibilityLabel={`아직 없어요. ${sub.replace('\n', ' ')}`}>
      <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.noneImg} contentFit="contain" />
      <PText style={styles.noneT}>아직 없어요</PText>
      <PText style={styles.noneS}>{sub}</PText>
    </View>
  );
}

function Tile({ icon, title, n, unit, preview, sv, onPress }: { icon: ReactNode; title: string; n: number; unit: string; preview: string; sv?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title} ${n}${unit}`} style={styles.tileWrap}>
      {({ pressed }) => (
        <Lift radius={20} pressed={pressed}>
          <View style={[styles.tile, sv && styles.tileSv]}>
            <View style={[styles.tileIc, sv && styles.tileIcSv]}>{icon}</View>
            <PText style={styles.tileB}>{title}</PText>
            <PText style={styles.tileN}>
              {n}
              <PText style={styles.tileUnit}>{unit}</PText>
            </PText>
            <PText style={styles.tilePv} numberOfLines={1}>
              {preview}
            </PText>
          </View>
        </Lift>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 8, paddingBottom: 110, gap: 12 },
  intro: { fontFamily: Font.body700, fontSize: 13, lineHeight: 20, color: Colors.inkSub },
  wait: { paddingVertical: 14, paddingHorizontal: 16, gap: 2 },
  waitB: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  waitS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  two: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 2 },
  tileWrap: { flex: 1, minWidth: 0 },
  tile: { gap: 2, padding: 12, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  tileSv: { backgroundColor: '#F3EEFB' },
  tileIc: { width: 38, height: 38, marginBottom: 6, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tileIcSv: { backgroundColor: Colors.yellow },
  tileImg: { width: 30, height: 19 },
  tileB: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  tileN: { fontFamily: Font.display, fontSize: 24, lineHeight: 27 },
  tileUnit: { fontFamily: Font.body900, fontSize: 12 },
  tilePv: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  tabsWrap: { flexGrow: 0 },
  tabs: { gap: 6 },
  tab: { height: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center' },
  tabOn: { backgroundColor: Colors.ink },
  tabText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  ym: { marginTop: 4, marginHorizontal: 2, marginBottom: -2, fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  list: { paddingVertical: 4, paddingHorizontal: 14 },
  it: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 14, paddingLeft: 14, paddingRight: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: 20, backgroundColor: Colors.white },
  itB: { flex: 1, minWidth: 0, gap: 3 },
  itTag: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  itTitle: { fontFamily: Font.body900, fontSize: 16, lineHeight: 21.6 },
  itP: { fontFamily: Font.body600, fontSize: 13.5, lineHeight: 21 },
  mk: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  mkOn: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  // 프로: 보낸 · 받은 노트 탭 — 위 줄 바로 아래 붙어요 (챌린지 상세 .lg-dtabs 와 같은 TAB_ROW_H 높이 · 좌우 끝까지 아래 선 1.5)
  box: { flexDirection: 'row', paddingHorizontal: 18, backgroundColor: Colors.cream, borderBottomWidth: 1.5, borderColor: Colors.line },
  boxTab: { flex: 1, height: TAB_ROW_H, alignItems: 'center', justifyContent: 'center', marginBottom: -1.5, borderBottomWidth: 3, borderColor: 'transparent' },
  boxTabOn: { borderColor: Colors.ink },
  boxT: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20, color: Colors.inkSub },
  boxTOn: { color: Colors.ink },
  boxN: { fontFamily: Font.body800, fontSize: 12, color: Colors.inkSub },
  // 보낸 노트 줄 (받은 노트 줄 NoteRow 와 같은 모양)
  sRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  sLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  sPressed: { opacity: 0.6 },
  sDt: { width: 40, alignItems: 'center' },
  sDtS: { fontFamily: Font.body800, fontSize: 11, lineHeight: 14, color: Colors.inkSub },
  sDtB: { fontFamily: Font.display, fontSize: 18, lineHeight: 22 },
  sTx: { flex: 1, minWidth: 0, gap: 2 },
  sH: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  sP: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  sChev: { fontFamily: Font.body900, fontSize: 18, lineHeight: 22, color: Colors.inkSub },
  none: { alignItems: 'center', gap: 4, marginTop: 4, paddingTop: 26, paddingBottom: 28, paddingHorizontal: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.line, borderRadius: 20 },
  noneImg: { width: 64, height: 41, marginBottom: 8 },
  noneT: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  noneS: { textAlign: 'center', fontFamily: Font.body700, fontSize: 13, lineHeight: 19.5, color: Colors.inkSub },
});

/** 회원 전용 화면 (state/access 'proNote'): 비회원이 알림 · 주소로 바로 들어와도 '지점 회원이 되면 열려요' 칸만 보여요 */
export default function ProNotesScreenGate() {
  return (
    <MemberOnly feature="proNote" title="PRO'S NOTE">
      <ProNotesScreen />
    </MemberOnly>
  );
}
