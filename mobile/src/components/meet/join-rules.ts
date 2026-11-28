/**
 * 번개 참여 승인제 규칙 (호스트가 막 거절하지 못하게 · 신청이 묵히지 않게). 서버도 같은 규칙이에요
 * (backend HangoutService · HangoutRejectReason). 화면은 여기 값만 써요.
 *
 * - 거절은 사유를 꼭 골라요. 신청자에게는 정해진 문구만 보이고, '기타'에 적은 말은 운영진(app-hub)만 봐요.
 * - 신청은 24시간 안에, 또 모임 시작 3시간 전까지 답이 없으면 자동으로 끝나요. 시작 3시간 전부터는 신청할 수 없어요.
 * - 같은 번개에 거절되면 다시 신청은 1번만 (두 번 거절되면 더 신청할 수 없어요).
 */
import { MONTHS } from '@/data/meet';

export type RejectCode = 'SCHEDULE' | 'CONDITION' | 'OTHER';

/** 호스트가 고르는 거절 사유 — label: 호스트 · 운영진이 보는 이름, phrase: 신청자가 보는 문구 */
export const REJECT_REASONS: { key: RejectCode; label: string; phrase: string }[] = [
  { key: 'SCHEDULE', label: '정원 · 일정 사정', phrase: '호스트 사정(정원·일정)으로 이번엔 함께하기 어려워요' },
  { key: 'CONDITION', label: '모임 조건과 안 맞음', phrase: '모임 조건과 맞지 않아 이번엔 함께하기 어려워요' },
  { key: 'OTHER', label: '기타 · 직접 적기', phrase: '호스트 사정으로 이번엔 함께하기 어려워요' },
];
export const rejectPhrase = (code: RejectCode) => REJECT_REASONS.find((r) => r.key === code)?.phrase ?? REJECT_REASONS[2].phrase;

const HOUR = 36e5;
/** 호스트가 답할 시간 */
export const ASK_HOURS = 24;
/** 모임 시작 몇 시간 전에 신청을 닫을지 */
export const CLOSE_BEFORE_HOURS = 3;
/** 같은 번개에서 거절될 수 있는 횟수 (이만큼 거절되면 더 신청할 수 없어요) */
export const MAX_REJECTS = 2;

/** 번개 시작 시각 — wd '금 20:00' 의 시간을 날짜에 붙여요 (시간이 없으면 그날 0시) */
export function meetStart(m: { mon: string; day: string; wd: string; year?: number }): Date {
  const [, hm] = m.wd.split(' ');
  const [h, mi] = (hm ?? '0:0').split(':').map(Number);
  return new Date(m.year ?? 2026, MONTHS.indexOf(m.mon), Number(m.day), h || 0, mi || 0);
}

/** 신청이 끝나는 때 (ms) = 신청 + 24시간 · 시작 3시간 전 중 이른 쪽 */
export const askDeadline = (askedAt: number, start: Date) => Math.min(askedAt + ASK_HOURS * HOUR, start.getTime() - CLOSE_BEFORE_HOURS * HOUR);
/** 시작 3시간 전부터는 신청을 받지 않아요 */
export const askClosed = (start: Date, now: number) => now >= start.getTime() - CLOSE_BEFORE_HOURS * HOUR;

/** '오늘 21:00' · '내일 09:30' · '11월 28일 21:00' */
export function deadlineText(at: number, now = Date.now()): string {
  const d = new Date(at);
  const t = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const day0 = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day0(d) - day0(new Date(now))) / 864e5);
  if (diff === 0) return `오늘 ${t}`;
  if (diff === 1) return `내일 ${t}`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${t}`;
}
