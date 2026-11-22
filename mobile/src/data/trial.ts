/**
 * 체험 신청 가짜 데이터 (프로토타입 TR_BR · TR_TIMES · trDays · trFull 그대로).
 * 맞는 API: docs/appendix/api-inventory.md — 47 `POST /trial-bookings` · 48 `GET /trial-slots?branch=&date=`
 * 체험 시간표 · 예약 확정 방식은 Q-B1 · Q-T2 (백엔드와 정해요).
 */

export type TrialBranch = { name: string; addr: string };

/** 체험 지점: 이름 · 주소 · 가까운 역 */
export const TRIAL_BRANCHES: TrialBranch[] = [
  { name: '영등포점', addr: '서울 영등포구 · 영등포역 3번 출구 2분' },
  { name: '잠실점', addr: '서울 송파구 · 잠실역 8번 출구 4분' },
  { name: '연신내점', addr: '서울 은평구 · 연신내역 5번 출구 1분' },
  { name: '대전 둔산점', addr: '대전 서구 · 시청역 4번 출구 6분' },
  { name: '대구 달서점', addr: '대구 달서구 · 상인역 2번 출구 3분' },
  { name: '부산 수영점', addr: '부산 수영구 · 수영역 9번 출구 2분' },
];

export const TRIAL_TIMES = ['10:30', '14:00', '19:30', '20:30'] as const;
export const TRIAL_LANGS = ['영어', '일본어', '중국어', '스페인어'] as const;
export const TRIAL_LEVELS = ['처음이에요', '기초', '중급', '고급'] as const;
export type TrialLang = (typeof TRIAL_LANGS)[number];
export type TrialLevel = (typeof TRIAL_LEVELS)[number];

/** 앱 학습 언어 코드 → 체험 언어 (교재 소개 · 다른 언어 배우기에서 미리 고를 때) */
export const TRIAL_LANG_BY_CODE: Record<'en' | 'ja' | 'zh' | 'es', TrialLang> = { en: '영어', ja: '일본어', zh: '중국어', es: '스페인어' };

export type TrialDay = { key: string; week: string; off: boolean };

/** 내일부터 7일 (일요일 휴무) — key 는 '11.23' */
export function trialDays(now = new Date()): TrialDay[] {
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + i + 1);
    return { key: `${d.getMonth() + 1}.${d.getDate()}`, week: '일월화수목금토'[d.getDay()], off: d.getDay() === 0 };
  });
}

/** 예시: 몇 자리는 마감 (프로토타입 lgH(지점 + 날짜 + 시간) % 5 === 0) */
export function trialFull(branch: string, day: string, time: string) {
  const h = [...(branch + day + time)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return h % 5 === 0;
}

export type TrialBooking = { branch: string; day: string; week: string; time: string; lang: TrialLang; level: TrialLevel; name: string; phone: string };

/** 휴대폰 번호 확인 · 꾸미기 (01012345678 → 010-1234-5678) */
export const phoneDigits = (v: string) => v.replace(/[^0-9]/g, '');
export const isPhone = (v: string) => /^01\d{8,9}$/.test(phoneDigits(v));
export const formatPhone = (v: string) => phoneDigits(v).replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3');

/** 체험 신청 보내기 (가짜) — 실제로는 POST /trial-bookings */
export async function submitTrial(b: TrialBooking) {
  return { ok: true as const, booking: b };
}
