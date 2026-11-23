import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';
import { EmptyIsland } from '@/components/library/empty-island';
import { LibHead, MapTabs, SitChips } from '@/components/library/lib-head';
import { CurrPanel, EmptyBlock, PanelCard, SitPanel, levelProgress } from '@/components/library/lib-panel';
import { LibraryWorld } from '@/components/library/library-world';
import { libStore, markMapSeen, nextSceneNo, sceneDone, setLib, useProgressVersion } from '@/components/library/library-state';
import { ToTop } from '@/components/library/to-top';
import type { WorldSC } from '@/components/library/world/scenes';
import { Raised } from '@/components/ui/raised';
import { showToast } from '@/components/ui/toast';
import { Colors, Spacing, TabBarSpace } from '@/constants/theme';
import { BOOKS, LANGS, SITUATION_MAPS, SOON_MAPS, bookTag, mapLang, sceneId, sceneOpen, type SituationMap } from '@/data/library';
import { useMe } from '@/state/me';

const LANG_INDEX = { en: 0, ja: 1, zh: 2, es: 3 } as const;

/**
 * 라이브러리 탭 (프로토타입 #page-library · renderStudyLib):
 * 제목 + 언어 → [스터디 맵 | 상황 맵] → (상황 맵 칩) → 3D 섬 지도 → 아래 카드(과 · 장면 목록).
 */
export default function LibraryScreen() {
  const st = libStore.useStore();
  const myLang = useMe((m) => m.lang);
  useProgressVersion();
  const scroll = useRef<ScrollViewInstance>(null);
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

  const sits = SITUATION_MAPS.filter((m) => mapLang(m) === st.lang);
  const soons = SOON_MAPS.filter((m) => mapLang(m) === st.lang);
  const books = BOOKS[st.lang];
  const isNew = (m: SituationMap) => !!m.isNew && !st.seen[m.id];
  const sitMap = st.sitMode ? (sits.find((m) => m.id === st.map) ?? sits[0]) : undefined;
  // 상황 맵을 한 번 열면 NEW 가 꺼져요
  useEffect(() => {
    if (sitMap?.isNew) markMapSeen(sitMap.id);
  }, [sitMap]);

  const bi = st.bi < books.length ? st.bi : Math.max(0, books.findIndex((b) => b.mine));
  const book = books[bi];

  // 3D 지도에 넘길 섬 · 장면 상태
  // React Compiler 가 알아서 기억해 둬요 (진도가 바뀌면 다시 계산)
  const world = (() => {
    if (sitMap) {
      const nx = nextSceneNo(sitMap);
      const sc: WorldSC = sitMap.scenes.map((s) => [s.title, s.icon, !sceneOpen(s) ? 'soon' : sceneDone(sitMap, s.no) ? 'done' : s.no === nx ? 'cur' : 'open']);
      return { id: sitMap.id, sc, order: SITUATION_MAPS.indexOf(sitMap) };
    }
    if (!st.sitMode && books.length) {
      const sc: WorldSC = books.map((b) => [bookTag(b), b.study ? levelProgress(b.study) : '커밍순', !b.study ? 'soon' : b.mine ? 'cur' : 'open']);
      sc.sel = bi;
      return { id: 'study2', sc, order: -1 };
    }
    return null;
  })();

  const onOpen = (no: number) => {
    if (sitMap) {
      const s = sitMap.scenes.find((x) => x.no === no);
      if (!s || !sceneOpen(s)) {
        showToast(`${s ? s.title : ''} 장면은 곧 열려요`);
        return;
      }
      router.push(`/scene/${sceneId(sitMap.id, no)}` as Href);
      return;
    }
    setLib({ bi: no - 1 });
  };

  const langLabel = LANGS[st.lang].ko;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scroll} contentContainerStyle={styles.body} onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          setShowTop(y > 360);
          setWorldSeen(y < worldBottom);
        }} scrollEventThrottle={64}>
        {/* 언어 메뉴 밖을 누르면 닫혀요 (위 줄만 이 판보다 위에 있어요) */}
        {langOpen && <Pressable style={styles.menuBack} onPress={() => setLangOpen(false)} accessibilityLabel="닫기" />}
        <LibHead open={langOpen} setOpen={setLangOpen} lang={st.lang} onLang={(i) => setLib({ lang: i, bi: Math.max(0, BOOKS[i].findIndex((b) => b.mine)) })} />
        <MapTabs sitMode={st.sitMode} sitNew={sits.some(isNew)} onMode={(sit) => setLib({ sitMode: sit })} />
        {st.sitMode && (sits.length > 0 || soons.length > 0) && (
          <SitChips maps={sits} soons={soons} current={sitMap?.id ?? ''} isNew={isNew} onPick={(id) => setLib({ map: id })} onSoon={() => showToast('다음 상황 맵을 준비하고 있어요 · 열리면 알려드릴게요')} />
        )}

        {world ? (
          <View onLayout={(e) => setWorldBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
            <LibraryWorld id={world.id} sc={world.sc} order={world.order} onOpen={onOpen} visible={worldSeen} />
          </View>
        ) : (
          <Raised radius={26}>
            <View style={styles.flat}>
              <EmptyIsland tag={st.sitMode ? '커밍순' : `${langLabel} 섬 · 커밍순`} />
            </View>
          </Raised>
        )}

        {sitMap ? (
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
  body: { paddingHorizontal: Spacing.gutter, paddingTop: 12, paddingBottom: TabBarSpace + 54, gap: Spacing.stack },
  menuBack: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 5 },
  flat: { aspectRatio: 340 / 430, borderWidth: 2, borderColor: Colors.ink, borderRadius: 26, overflow: 'hidden', backgroundColor: '#BFE4EC' },
});
