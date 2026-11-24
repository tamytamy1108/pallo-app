/**
 * 퀘스트 성공 → 팔로워에게 알리기 (docs/frontend/api-additions.md · 퀘스트 성공 이벤트).
 * 레슨 단계를 처음 끝냈을 때 · 상황 장면 다섯 단계를 다 끝냈을 때(도장) 부르면, 서버에 이벤트 하나만 보내고 잊어요.
 * 팔로워에게 몇 명 · 언제 보낼지(묶기 · 횟수 제한)는 서버가 정해요. 앱은 세 가지만 지켜요:
 * - 회원만 (비회원은 보내지 않아요) · 설정 '내 퀘스트 성공을 팔로워에게 알리기'(shareProgress)가 켜져 있을 때만
 * - 같은 단계는 한 번만 (기기에 남겨요 — 다시 풀어도 또 보내지 않게)
 * 실패해도 화면에는 아무것도 안 띄워요 (축하 화면을 방해하지 않게).
 */
import { sendQuestDone } from '@/api/home';
import { getSettings } from '@/components/account/store';
import { STAGE_KO, type Stage } from '@/data/lessons';
import { MY_BOOK } from '@/data/mock';
import { getMaps, toSituationMaps } from '@/data/maps';
import { findScene } from '@/data/situation';
import { createStore } from '@/lib/store';
import { isMember } from '@/state/access';
import { getMe } from '@/state/me';

/** 이미 알린 단계 키 → 보낸 시각 */
const sent = createStore<Record<string, number>>({}, { persist: { key: 'quest-shared' } });

/** 보낼 수 있으면 보내요. @returns 보냈으면 true */
export function shareQuest({ key, title, href }: { key: string; title: string; href: string }) {
  if (!isMember(getMe())) return false;
  if (getSettings().shareProgress === false) return false;
  if (sent.get()[key]) return false;
  sent.set((s) => ({ ...s, [key]: Date.now() }));
  sendQuestDone({ key, title, href }).catch(() => {
    // 못 보냈으면 다음에 다시 보낼 수 있게 지워요
    sent.set((s) => {
      const next = { ...s };
      delete next[key];
      return next;
    });
  });
  return true;
}

/** 레슨 단계 이름: '1과 Cafe Complaint · 본학습' (Lv.1 은 교재 제목, 나머지는 'Lv.3 2과 · 예습') */
export function lessonQuestTitle(lv: number, unit: number, stage: Stage) {
  const name = lv === 1 && MY_BOOK.titles[unit] ? `${unit}과 ${MY_BOOK.titles[unit]}` : `Lv.${lv} ${unit}과`;
  return `${name} · ${STAGE_KO[stage]}`;
}

/** 상황 장면 이름: '여행 맵 · 공항 체크인' (못 찾으면 장면 id) */
export function sceneQuestTitle(sceneId: string) {
  const found = findScene(toSituationMaps(getMaps()).maps, sceneId);
  return found ? `${found.map.title} 맵 · ${found.scene.title}` : sceneId;
}
