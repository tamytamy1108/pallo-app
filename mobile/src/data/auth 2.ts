/**
 * 로그인 · 휴대폰 확인 (가짜). 지금은 무엇을 눌러도 성공하고 역할만 바꿔요.
 * 맞는 API: docs/appendix/api-inventory.md — 1 `POST /auth/login/:provider` (카카오 · 애플 · 구글) · 2 `POST /auth/phone/verify`
 * 프로토타입에는 로그인 화면이 없어요 (설정 › 로그인 계정 LOGINS = 카카오 · 애플 · 구글 만 있어요) — 화면은 프로토타입에서 먼저 확정해야 해요.
 */
import { updateMe, type Role } from '@/state/me';

export type LoginProvider = 'kakao' | 'apple' | 'google';

export const PROVIDER_LABEL: Record<LoginProvider, string> = { kakao: '카카오', apple: 'Apple', google: 'Google' };

/** 인증번호 유효 시간 (프로토타입 토스트 '3분 안에 입력해 주세요') */
export const CODE_SECONDS = 180;
export const CODE_LENGTH = 6;

/** 소셜 로그인 (가짜) — 토큰 대신 역할만 정해요 */
export async function loginWith(provider: LoginProvider): Promise<{ ok: true; role: Role }> {
  void provider;
  updateMe({ role: 'member' });
  return { ok: true, role: 'member' };
}

/** 인증번호 보내기 (가짜) */
export async function sendPhoneCode(phone: string) {
  void phone;
  return { ok: true as const, seconds: CODE_SECONDS };
}

/** 인증번호 확인 (가짜) — 숫자 6자리면 통과 */
export async function verifyPhoneCode(phone: string, code: string) {
  void phone;
  const ok = new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code);
  if (ok) updateMe({ role: 'member' });
  return { ok };
}

/** 로그인 없이 둘러보기 — 비회원(체험 전)으로 구경만 */
export function browseAsGuest() {
  updateMe({ role: 'guest' });
}
