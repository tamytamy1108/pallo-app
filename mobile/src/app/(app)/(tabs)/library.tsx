import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';

import { apiErrorMessage } from '@/api/errors';
import { bookShelfQuery, situationMapsQuery } from '@/api/queries';
import { lockedChapter } from '@/components/common/trial-guide';
import { Pressable } from '@/components/ui/pressable';
import { EmptyIsland } from '@/components/library/empty-island';
import { LibHead, MapTabs, SitChips } from '@/components/library/lib-head';
import { CurrPanel, EmptyBlock, PanelCard, SitPanel, levelProgress } from '@/components/library/lib-panel';
import { LibraryWorld, noteLibTouch, type LibWorld } from '@/components/library/library-world';
import { islandFor, libStore, markMapSeen, nextSceneNo, pickIsland, sceneDone, setLib, useProgressVersion } from '@/components/library/library-state';
import { ToTop } from '@/components/library/to-top';
import { FLAT_MAPS } from '@/components/library/world/flat-maps';
import { MAP_PRESETS } from '@/components/library/world/presets';
import type { WorldSC } from '@/components/library/world/scenes';
import { Raised } from '@/components/ui/raised';
import { ErrorState } from '@/components/ui/state-view';
import { showToast } from '@/components/ui/toast';
import { Colors, Spacing, TabHeadTop, TabScrollEnd } from '@/constants/theme';
import { LANGS, bookTag, mapLang, sceneId, sceneOpen, type Book, type SituationMap } from '@/data/library';
import { canUse, FREE_CHAPTER, isFreeChapter } from '@/state/access';
import { useMe } from '@/state/me';
import { useLastStep } from '@/state/progress';
import { useTabScrollMemory } from '@/lib/tab-reselect';
import { usePullRefresh } from '@/components/ui/pull-refresh';

const LANG_INDEX = { en: 0, ja: 1, zh: 2, es: 3 } as const;
const NO_BOOKS: Book[] = [];
const NO_MAPS: SituationMap[] = [];

/**
 * 라이브러리 탭 (프로토타입 #page-library · renderStudyLib):
 * 제목 + 언어 → [스터디 맵 | 상황 맵] → (상황 맵 칩) → 3D 섬 지도 → 아래 카드(과 · 장면 목록).
 * 책장은 17 `/library/books`, 상황 맵은 16 `/library/maps` 로 받아요 (스플래시 동안 미리 받아 둬요).
 */
export default function LibraryScreen() {
  const pull = usePullRefresh();
  const st = libStore.useStore();
  const myLang = useMe((m) => m.lang);
  useProgressVersion();
  const lastStep = useLastStep();
  const shelfQ = useQuery(bookShelfQuery());
  const mapsQ = useQuery(situationMapsQuery());
  // 비회원은 맵마다 첫 챕터만 (state/access)
  const allOpen = useMe((m) => canUse(m, 'allChapters'));
  const scroll = useRef<ScrollViewInstance>(null);
  // 탭을 다시 누르면 맨 위로 · 다른 탭에 다녀오면 보던 자리 그대로 (lib/tab-reselect)
  const keepY = useTabScrollMemory('library', scroll);
  const [showTop, setShowTop] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  // 지도가 화면 위로 다 올라가면 3D 그리기를 멈춰요 (폰 배터리)
  const [worldBottom, setWorldBottom] = useState(Infinity);
  const [worldSeen, setWorldSeen] = useState(true);
  // 처음 열 때는 내가 공부하는 언어
  const inited = useRef(false);
  useEffect(() => {
    if (inited.current) return;
    inited.current = true;
    if (LANG_INDEX[myLang] !== st.lang) setLib({ lang: LANG_INDEX[myLang] });
  }, [myLang, st.lang]);

  const allSits = mapsQ.data?.maps ?? NO_MAPS;
  const sits = allSits.filter((m) => mapLang(m) === st.lang);
  const soons = (mapsQ.data?.soon ?? []).filter((m) => mapLang(m) === st.lang);
  const books = shelfQ.data?.[st.lang] ?? NO_BOOKS;
  // 지금 보는 쪽(스터디 맵 = 책장 · 상황 맵 = 맵 목록)만 기다려요
  const q = st.sitMode ? mapsQ : shelfQ;
  const isNew = (m: SituationMap) => !!m.isNew && !st.seen[m.id];
  const sitMap = st.sitMode ? (sits.find((m) => m.id === st.map) ?? sits[0]) : undefined;
  // 상황 맵을 한 번 열면 NEW 가 꺼져요
  useEffect(() => {
    if (sitMap?.isNew) markMapSeen(sitMap.id);
  }, [sitMap]);

  const bi = islandFor(books, st, lastStep);
  const book = books[bi];

  // 3D 지도에 넘길 섬 · 장면 상태
  // React Compiler 가 알아서 기억해 둬요 (진도가 바뀌면 다시 계산)
  const sitWorld = (m: SituationMap): LibWorld => {
    const nx = nextSceneNo(m);
    // 비회원이 못 여는 장면(둘째부터)은 흐린 섬으로 (state/access)
    const sc: WorldSC = m.scenes.map((s) => [s.title, s.icon, !sceneOpen(s) || (!allOpen && !isFreeChapter(s.no)) ? 'soon' : sceneDone(m, s.no) ? 'done' : s.no === nx ? 'cur' : 'open']);
    return { slot: `sit:${m.id}`, id: MAP_PRESETS[m.preset].build, sc, order: allSits.indexOf(m) };
  };
  const studyWorld = ((): LibWorld | null => {
    if (!books.length) return null;
    const sc: WorldSC = books.map((b) => [bookTag(b), b.study ? levelProgress(b.study) : '커밍순', !b.study ? 'soon' : b.mine ? 'cur' : 'open']);
    sc.sel = bi;
    return { slot: 'study', id: MAP_PRESETS['island-study'].build, sc, order: -1 };
  })();
  const world = sitMap ? sitWorld(sitMap) : !st.sitMode ? studyWorld : null;
  // 한 번에 갈 수 있는 지도를 미리 만들어 둬요 (바로 바뀌게) — 다음에 누를 것 같은 지도부터:
  // 스터디 맵에서는 상황 맵 탭을 누르면 뜰 맵 → 다른 상황 맵 · 상황 맵에서는 옆 상황 맵 → 스터디 맵 → 나머지
  const tabSit = sits.find((m) => m.id === st.map) ?? sits[0];
  const here = sitMap ? allSits.indexOf(sitMap) : tabSit ? allSits.indexOf(tabSit) : -1;
  const near = sits.map(sitWorld).sort((a, b) => Math.abs(a.order - here) - Math.abs(b.order - here));
  const warm: LibWorld[] = sitMap
    ? [...near.slice(1, 2), ...(studyWorld ? [studyWorld] : []), ...near.slice(2)]
    : near;

  const onOpen = (no: number) => {
    if (sitMap) {
      const s = sitMap.scenes.find((x) => x.no === no);
      if (!s || !sceneOpen(s)) {
        showToast(`${s ? s.title : ''} 장면은 곧 열려요`);
        return;
      }
      if (!allOpen && !isFreeChapter(no)) {
        lockedChapter(`장면 ${no}`, sceneDone(sitMap, FREE_CHAPTER));
        return;
      }
      router.push(`/scene/${sceneId(sitMap.id, no)}` as Href);
      return;
    }
    pickIsland(no - 1);
  };

  const langLabel = LANGS[st.lang].ko;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 만지거나 스크롤하는 동안은 지도 미리 만들기(화면이 잠깐 멈춤)를 미뤄요 */}
      <ScrollView refreshControl={pull.refreshControl} onScrollBeginDrag={pull.onScrollBeginDrag} onScrollEndDrag={pull.onScrollEndDrag} ref={scroll} contentContainerStyle={styles.body} onTouchStart={noteLibTouch} onScroll={(e) => {
          pull.onScroll(e);
          keepY(e.nativeEvent.contentOffset.y);
          noteLibTouch();
          const y = e.nativeEvent.contentOffset.y;
          setShowTop(y > 360);
          setWorldSeen(y < worldBottom);
        }} scrollEventThrottle={64}>
        {/* 언어 메뉴 밖을 누르면 닫혀요 (위 줄만 이 판보다 위에 있어요) */}
        {langOpen && <Pressable style={styles.menuBack} onPress={() => setLangOpen(false)} accessibilityLabel="닫기" />}
        <LibHead open={langOpen} setOpen={setLangOpen} lang={st.lang} onLang={(i) => pickIsland(null, { lang: i })} />
        <MapTabs sitMode={st.sitMode} sitNew={sits.some(isNew)} onMode={(sit) => setLib({ sitMode: sit })} />
        {st.sitMode && (sits.length > 0 || soons.length > 0) && (
          <SitChips maps={sits} soons={soons} current={sitMap?.id ?? ''} isNew={isNew} onPick={(id) => setLib({ map: id })} onSoon={() => showToast('다음 상황 맵을 준비하고 있어요 · 열리면 알려드릴게요')} />
        )}

        {q.isPending ? (
          // 맵 목록을 아직 못 받았어요 (보통은 스플래시 동안 받아 둬요): 도는 표시 대신 같은 자리 · 같은 크기의 지도 판을 먼저
          <Raised radius={26}>
            <View style={styles.flat}>{!st.sitMode && <Image source={FLAT_MAPS.study2.img} style={StyleSheet.absoluteFill} contentFit="fill" cachePolicy="memory-disk" transition={0} accessible={false} />}</View>
          </Raised>
        ) : q.isError ? (
          <ErrorState message={apiErrorMessage(q.error)} onRetry={() => q.refetch()} />
        ) : world ? (
          <View onLayout={(e) => setWorldBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
            <LibraryWorld world={world} warm={warm} onOpen={onOpen} visible={worldSeen} />
          </View>
        ) : (
          <Raised radius={26}>
            <View style={styles.flat}>
              <EmptyIsland tag={st.sitMode ? '커밍순' : `${langLabel} 섬 · 커밍순`} />
            </View>
          </Raised>
        )}

        {q.isPending || q.isError ? null : sitMap ? (
          <SitPanel map={sitMap} />
        ) : st.sitMode ? (
          <PanelCard>
            <EmptyBlock title={`${langLabel} 상황 맵 · 커밍순`} sub="여행 · 카페 맵부터 열려요." />
          </PanelCard>
        ) : book ? (
          <CurrPanel book={book} />
        ) : (
          <PanelCard>
            <EmptyBlock title={`${langLabel} 교재 · 커밍순`} sub="섬이 열리면 여기서 바로 예습 · 본학습 · 복습할 수 있어요." button="열리면 알림 받기" onPress={() => showToast(`${langLabel} 교재가 나오면 알려드릴게요`)} />
          </PanelCard>
        )}
      </ScrollView>
      <ToTop show={showTop} onPress={() => scroll.current?.scrollTo({ y: 0, animated: true })} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  body: { paddingHorizontal: Spacing.gutter, paddingTop: TabHeadTop, paddingBottom: TabScrollEnd, gap: Spacing.stack },
  menuBack: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 5 },
  flat: { aspectRatio: 340 / 430, borderWidth: 2, borderColor: Colors.ink, borderRadius: 26, overflow: 'hidden', backgroundColor: '#BFE4EC' },
});
