/**
 * 나(로그인한 회원) — 가짜 데이터. 맞는 API: 3 `/me`.
 * 담당: 마이 A. 다른 화면은 읽기만 해요 (useMe). 필드는 늘릴 수 있지만 이름 · 뜻은 바꾸지 않아요.
 */
import { ME } from '@/data/mock';
import { createStore } from '@/lib/store';

/** 회원 · 비회원(체험 전) · 리더 · 매니저. 실제 앱은 로그인 계정 역할 (프로토타입의 역할 토글은 만들지 않아요) */
export type Role = 'member' | 'guest' | 'leader' | 'manager';
export type StudyLang = 'en' | 'ja' | 'zh' | 'es';

export type Me = {
  id: string;
  name: string;
  /** 내 지점 (예시: 하남점) */
  branch: string;
  role: Role;
  level: string;
  lang: StudyLang;
  /** 스터디 회원 · 앱 구독자 */
  plan: 'study' | 'app';
  /** 꾸미기 상점 재화 */
  sparks: number;
  /** 이번 주 포인트 */
  weekPoints: number;
};

const meStore = createStore<Me>({
  id: 'me',
  name: ME.name,
  branch: '하남점',
  role: 'member',
  level: 'Lv.1',
  lang: 'en',
  plan: 'study',
  sparks: 1250,
  weekPoints: 0,
});

export const useMe = meStore.use;
export const getMe = meStore.get;
export const updateMe = (patch: Partial<Me>) => meStore.set((s) => ({ ...s, ...patch }));
