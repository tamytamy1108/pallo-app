/**
 * 로그인 화면 값 (가짜 서버 동작은 api/auth.ts 로 옮겼어요).
 * 맞는 API: docs/appendix/api-inventory.md — 1 `POST /auth/login/:provider` (카카오 · 애플 · 구글) · 2 `POST /auth/phone/verify`
 * 프로토타입에는 로그인 화면이 없어요 (설정 › 로그인 계정 LOGINS = 카카오 · 애플 · 구글 만 있어요) — 화면은 프로토타입에서 먼저 확정해야 해요.
 */
import { updateMe } from '@/state/me';

export type LoginProvider = 'kakao' | 'apple' | 'google';

export const PROVIDER_LABEL: Record<LoginProvider, string> = { kakao: '카카오', apple: 'Apple', google: 'Google' };

/** 인증번호 유효 시간 (프로토타입 토스트 '3분 안에 입력해 주세요') */
export const CODE_SECONDS = 180;
export const CODE_LENGTH = 6;

/** 로그인 없이 둘러보기 — 비회원(체험 전)으로 구경만 (서버 호출 없음) */
export function browseAsGuest() {
  updateMe({ role: 'guest' });
}
