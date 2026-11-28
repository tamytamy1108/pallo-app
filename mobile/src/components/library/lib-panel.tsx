import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { lockedChapter } from '@/components/common/trial-guide';
import { Pressable } from '@/components/ui/pressable';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { STAGES, STAGE_COLOR, STAGE_KO, STUDY_STEPS, noLabel, sceneId, sceneOpen, unitId, type Book, type Lesson, type Scene, type SituationMap, type StudyLevel } from '@/data/library';
import { SCENE_STEPS, sceneStepKey } from '@/data/situation';
import { sfx } from '@/lib/feedback';
import { canUse, FREE_CHAPTER, isFreeChapter } from '@/state/access';
import { useMe } from '@/state/me';
import { isDone, stepKey, useDoneCount, useSavedPos } from '@/state/progress';

import { levelDoneCount, sceneDone } from './library-state';
import { openScene, openStep } from './open-step';
import { StepPopup } from './step-popup';

const LOCK_LINE = '#B9B2A3';
const LOCK_INK = '#8C8597';

/** 아래 카드 틀 (프로토타입 .card.st-lib) */
export function PanelCard({ children }: { children: ReactNode }) {
  return (
    <Raised radius={22}>
      <View style={styles.card}>{children}</View>
    </Raised>
  );
}

function PanelHead({ title, about }: { title: string; about: string }) {
  return (
    <View>
      <PText style={styles.ptitle}>{title}</PText>
      <PText style={styles.about}>{about}</PText>
    </View>
  );
}

/** 커리큘럼: 고른 레벨의 과 목록 (처음부터 전부 · 접기 없음) */
export function CurrPanel({ book }: { book: Book }) {
  const L = book.study;
  // 비회원은 교재마다 첫 과만 (state/access)
  const allOpen = useMe((m) => canUse(m, 'allChapters'));
  return (
    <PanelCard>
      <PanelHead title={`${book.lab ?? book.l} · ${book.jp ? book.n : book.s}`} about={L ? L.about : '예습 · 복습 커밍순'} />
      {book.mine && L && <ContinueCard L={L} />}
      {L ? (
        <View style={styles.lessons}>
          {L.lessons.map((ls) =>
            !ls.data ? (
              <LockRow key={ls.no} no={noLabel(L, ls.no)} title={ls.title} sub={ls.pats ? ls.pats.join(' · ') : ls.sub} />
            ) : !allOpen && !isFreeChapter(ls.no) ? (
              <MemberRow key={ls.no} no={noLabel(L, ls.no)} title={ls.title} sub={ls.pats ? ls.pats.join(' · ') : ls.sub} onPress={() => lockedChapter(`${ls.no}과`, levelFirstDone(L))} />
            ) : (
              <LessonRow key={ls.no} L={L} ls={ls} />
            ),
          )}
        </View>
      ) : (
        <EmptyBlock title="이 섬은 아직 구름에 가려 있어요" sub="교재 소개와 목차는 먼저 볼 수 있어요." button="교재 소개 보기" onPress={() => router.push(`/book/${book.id}` as Href)} />
      )}
    </PanelCard>
  );
}

/** 상황 맵: 장면 목록 */
export function SitPanel({ map }: { map: SituationMap }) {
  // 비회원은 맵마다 첫 장면만 (state/access)
  const allOpen = useMe((m) => canUse(m, 'allChapters'));
  const dn = map.scenes.filter((s) => sceneOpen(s) && sceneDone(map, s.no)).length;
  return (
    <PanelCard>
      <PanelHead title={`${map.title} 맵 · 장면 ${dn}/${map.scenes.length}`} about={map.about} />
      <View style={styles.lessons}>
        {map.scenes.map((s) =>
          !sceneOpen(s) ? (
            <LockRow key={s.no} no={String(s.no).padStart(2, '0')} title={s.title} sub={s.sub} />
          ) : !allOpen && !isFreeChapter(s.no) ? (
            <MemberRow key={s.no} no={String(s.no).padStart(2, '0')} title={s.title} sub={s.sub} onPress={() => lockedChapter(`장면 ${s.no}`, sceneDone(map, FREE_CHAPTER))} />
          ) : (
            <SceneRow key={s.no} map={map} s={s} />
          ),
        )}
      </View>
      <View style={styles.more}>
        <PText style={styles.moreText}>새 장면과 새 상황 맵은 계속 열려요</PText>
      </View>
    </PanelCard>
  );
}

/** 데이터가 없을 때 (프로토타입 .st-empty) */
export function EmptyBlock({ title, sub, button, onPress }: { title: string; sub: string; button?: string; onPress?: () => void }) {
  return (
    <View style={styles.empty}>
      <PText style={styles.emptyB}>{title}</PText>
      <PText style={styles.emptyS}>{sub}</PText>
      {button && (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={button}>
          {({ pressed }) => (
            <Raised radius={23} pressed={pressed}>
              <View style={styles.emptyBtn}>
                <PText style={styles.emptyBtnText}>{button}</PText>
              </View>
            </Raised>
          )}
        </Pressable>
      )}
    </View>
  );
}

/** '스터디 맵 이어서': 홈 스터디 맵과 같은 지금 과(1과) · 하던 단계 팝업 (프로토타입 resumeStudy) */
function ContinueCard({ L }: { L: StudyLevel }) {
  const ls = L.lessons[0];
  const steps = STAGES.flatMap((k) => STUDY_STEPS[L.kind][k].map((s, i) => ({ ...s, stage: k, i })));
  const count = useDoneCount(`${L.lv}:${ls.no}:`);
  const cur = steps.find((s) => !isDone(stepKey(L.lv, ls.no, s.id))) ?? steps[0];
  const pos = useSavedPos(stepKey(L.lv, ls.no, cur.id));
  const [pop, setPop] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => {
          sfx('tap');
          setPop(true);
        }}
        accessibilityRole="button"
        style={({ pressed }) => [styles.cont, pressed && styles.pressedLite]}>
        <View style={styles.contT}>
          <PText style={styles.contSmall}>스터디 맵 이어서</PText>
          <PText style={styles.contB} numberOfLines={1}>
            {ls.no}과 {ls.title} · {count}/{steps.length}
          </PText>
        </View>
        <Chevron color={Colors.ink} />
      </Pressable>
      <StepPopup
        info={pop ? { kick: `${STAGE_KO[cur.stage]} · ${STAGES.indexOf(cur.stage) + 1}-${cur.i + 1}`, title: cur.t, xp: cur.xp, done: isDone(stepKey(L.lv, ls.no, cur.id)), pos } : null}
        onClose={() => setPop(false)}
        onGo={(mode) => {
          setPop(false);
          openStep(L.lv, ls.no, cur.id, mode);
        }}
      />
    </>
  );
}

/** 열린 과 한 줄: 번호 · 제목 · 패턴 · 예습/본학습/복습 진도 점 */
function LessonRow({ L, ls }: { L: StudyLevel; ls: Lesson }) {
  useDoneCount(`${L.lv}:${ls.no}:`);
  return (
    <Pressable onPress={() => router.push(`/unit/${unitId(L.lv, ls.no)}` as Href)} accessibilityRole="button" accessibilityLabel={`${ls.no} ${ls.title}`}>
      {({ pressed }) => (
        <View style={[styles.row, pressed && styles.rowPressed]}>
          <View style={styles.no}>
            <PText style={styles.noText}>{noLabel(L, ls.no)}</PText>
          </View>
          <View style={styles.rt}>
            <PText style={styles.rtB}>{ls.title}</PText>
            <PText style={styles.rtS} numberOfLines={1}>
              {ls.pats ? ls.pats.join(' · ') : ls.sub}
            </PText>
            <View style={styles.prog}>
              {STAGES.filter((k) => STUDY_STEPS[L.kind][k].length).map((k) => (
                <View key={k} style={styles.progItem}>
                  <PText style={styles.progText}>{STAGE_KO[k]}</PText>
                  {STUDY_STEPS[L.kind][k].map((s) => (
                    <View key={s.id} style={[styles.dot, isDone(stepKey(L.lv, ls.no, s.id)) && { backgroundColor: STAGE_COLOR[k] }]} />
                  ))}
                </View>
              ))}
            </View>
          </View>
          <Chevron />
        </View>
      )}
    </Pressable>
  );
}

/** 상황 장면 한 줄: '연습' 점 5개 = 장면 단계 (미션 · 롤플레이 · 단어 · 퀴즈 · AI 대화) */
function SceneRow({ map, s }: { map: SituationMap; s: Scene }) {
  const id = sceneId(map.id, s.no);
  useDoneCount(`${map.id}:${s.no}:`);
  return (
    <Pressable onPress={() => openScene(id)} accessibilityRole="button" accessibilityLabel={`${s.no} ${s.title}`}>
      {({ pressed }) => (
        <View style={[styles.row, pressed && styles.rowPressed]}>
          <View style={styles.no}>
            <PText style={styles.noText}>{String(s.no).padStart(2, '0')}</PText>
          </View>
          <View style={styles.rt}>
            <PText style={styles.rtB}>{s.title}</PText>
            <PText style={styles.rtS} numberOfLines={1}>
              {s.sub}
            </PText>
            <View style={styles.prog}>
              <View style={styles.progItem}>
                <PText style={styles.progText}>연습</PText>
                {SCENE_STEPS.map((st) => (
                  <View key={st.id} style={[styles.dot, isDone(sceneStepKey(id, st.id)) && { backgroundColor: Colors.rosePink }]} />
                ))}
              </View>
            </View>
          </View>
          <Chevron />
        </View>
      )}
    </Pressable>
  );
}

/** 데이터 없는 과 · 장면: 점선 · 자물쇠 '커밍순' (눌러도 열리지 않아요) */
function LockRow({ no, title, sub }: { no: string; title: string; sub: string }) {
  return (
    <Pressable onPress={() => showToast('교재 데이터가 들어오면 열려요')} accessibilityRole="button" accessibilityLabel={`${title} 커밍순`}>
      <View style={[styles.row, styles.rowLock]}>
        <View style={[styles.no, styles.noLock]}>
          <PText style={[styles.noText, { color: LOCK_INK }]}>{no}</PText>
        </View>
        <View style={styles.rt}>
          <PText style={[styles.rtB, { color: '#6F6880' }]}>{title}</PText>
          <PText style={styles.rtS} numberOfLines={1}>
            {sub}
          </PText>
        </View>
        <View style={styles.soon}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={LOCK_INK} strokeWidth={2.4} strokeLinecap="round">
            <Path d="M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4" />
          </Svg>
          <PText style={styles.soonText}>커밍순</PText>
        </View>
      </View>
    </Pressable>
  );
}

/** 비회원 잠김 (둘째 챕터부터): 흐린 줄 · 자물쇠 '회원 전용'. 누르면 잠김 1번 · 첫 챕터를 끝냈으면 권유 시트 */
function MemberRow({ no, title, sub, onPress }: { no: string; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} sound={false} accessibilityRole="button" accessibilityLabel={`${title}, 지점 회원 전용`}>
      <View style={[styles.row, styles.rowMember]}>
        <View style={[styles.no, styles.noLock]}>
          <PText style={[styles.noText, { color: LOCK_INK }]}>{no}</PText>
        </View>
        <View style={styles.rt}>
          <PText style={[styles.rtB, { color: '#6F6880' }]}>{title}</PText>
          <PText style={styles.rtS} numberOfLines={1}>
            {sub}
          </PText>
        </View>
        <View style={styles.soon}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={Colors.purple} strokeWidth={2.4} strokeLinecap="round">
            <Path d="M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4" />
          </Svg>
          <PText style={[styles.soonText, { color: Colors.purple }]}>회원 전용</PText>
        </View>
      </View>
    </Pressable>
  );
}

/** 교재 첫 과를 다 끝냈는지 (비회원 '다음 챕터' 권유) */
const levelFirstDone = (L: StudyLevel) => {
  const first = L.lessons[0];
  return !!first && STAGES.flatMap((k) => STUDY_STEPS[L.kind][k]).every((st) => isDone(stepKey(L.lv, first.no, st.id)));
};

export function Chevron({ color = Colors.inkSub, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m9 6 6 6-6 6" />
    </Svg>
  );
}

/** 레벨 진도 '0/20과' (3D 이름표) */
export const levelProgress = (L: StudyLevel) => `${levelDoneCount(L)}/${L.total ?? L.lessons.length}${L.kind === 'pattern' || L.kind === 'basic' ? '과' : '회'}`;

const styles = StyleSheet.create({
  card: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, padding: 14, gap: 12 },
  ptitle: { fontFamily: Font.body900, fontSize: 16, lineHeight: 23, letterSpacing: -0.3 },
  about: { marginTop: 3, marginHorizontal: 0, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18.75, color: Colors.inkSub },
  cont: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#F1EBDC' },
  contT: { flex: 1, minWidth: 0 },
  contSmall: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  contB: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  lessons: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 10, paddingRight: 10, paddingLeft: 12, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  rowPressed: { transform: [{ scale: 0.98 }] },
  rowLock: { borderStyle: 'dashed', borderColor: LOCK_LINE, backgroundColor: 'transparent' },
  rowMember: { borderColor: LOCK_LINE, backgroundColor: '#F4F0E6', opacity: 0.85 },
  no: { width: 44, height: 44, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  noLock: { backgroundColor: 'transparent', borderColor: LOCK_LINE },
  noText: { fontFamily: Font.display, fontSize: 12, lineHeight: 15 },
  rt: { flex: 1, minWidth: 0, gap: 2 },
  rtB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 19.5, letterSpacing: -0.2 },
  rtS: { fontFamily: Font.body600, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  prog: { marginTop: 5, flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4 },
  progItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  progText: { fontFamily: Font.body800, fontSize: 11, lineHeight: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.ink, backgroundColor: Colors.white },
  soon: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  soonText: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: LOCK_INK },
  more: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: '#C9C2B3' },
  moreText: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18.75, color: Colors.inkSub, textAlign: 'center' },
  empty: { paddingTop: 18, paddingHorizontal: 8, paddingBottom: 8, alignItems: 'center', gap: 8 },
  emptyB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  emptyS: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19.5, color: Colors.inkSub, textAlign: 'center' },
  emptyBtn: { height: 46, paddingHorizontal: 22, borderRadius: 23, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  emptyBtnText: { fontFamily: Font.body900, fontSize: 14, lineHeight: 19 },
  pressedLite: { transform: [{ scale: 0.98 }] },
});
