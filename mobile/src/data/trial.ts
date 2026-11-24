/**
 * 휴대폰 번호 확인 · 꾸미기 (체험 예약 · 지점 연동 요청 · 휴대폰 로그인).
 * 체험 지점 · 시간표는 components/onboarding/branch-sheet · trial-slots 에 있어요.
 * 맞는 API: docs/appendix/api-inventory.md — 47 `POST /trial-bookings` · 48 `GET /trial-slots?branch=&date=`
 */

/** 01012345678 → 010-1234-5678 */
export const phoneDigits = (v: string) => v.replace(/[^0-9]/g, '');
export const isPhone = (v: string) => /^01\d{8,9}$/.test(phoneDigits(v));
export const formatPhone = (v: string) => phoneDigits(v).replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3');
