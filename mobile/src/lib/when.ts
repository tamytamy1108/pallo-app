/**
 * 글 · 스토리의 '올린 때' 표시 — 한 곳에서만 정해요.
 * 7일 안이면 '방금' · 'N분 전' · 'N시간 전' · '어제' · 'N일 전', 그보다 오래되면 날짜('11.18', 올해가 아니면 '2025.11.18').
 * 날짜 · 하루 경계는 한국 시간(KST) 기준이에요.
 */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const KST = 9 * HOUR;
/** 이 날수까지는 'N일 전', 넘으면 날짜로 보여요 */
const REL_DAYS = 7;

/** KST 기준 몇 번째 날인지 (하루 경계 비교용) */
const kstDay = (t: number) => Math.floor((t + KST) / DAY);

/** KST 날짜: 올해면 '11.18', 아니면 '2025.11.18' */
export function dateLabel(at: number, now = Date.now()): string {
  const d = new Date(at + KST);
  const y = d.getUTCFullYear();
  const md = `${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
  return y === new Date(now + KST).getUTCFullYear() ? md : `${y}.${md}`;
}

/** 올린 때(ms) → 보이는 글. 미래 시각은 '방금'으로 쳐요 */
export function agoLabel(at: number, now = Date.now()): string {
  const d = Math.max(0, now - at);
  if (d < MIN) return '방금';
  if (d < HOUR) return `${Math.floor(d / MIN)}분 전`;
  if (d < DAY) return `${Math.floor(d / HOUR)}시간 전`;
  const days = kstDay(now) - kstDay(at);
  if (days <= 1) return '어제';
  if (days <= REL_DAYS) return `${days}일 전`;
  return dateLabel(at, now);
}

/** 예시 데이터의 '10분 전' · '어제' · '6일 전' 같은 글을 지난 시간(ms)으로 — 못 읽으면 null */
function parseAgo(time: string): number | null {
  if (time === '방금') return 0;
  if (time === '어제') return DAY;
  const m = /^(\d+)\s*(분|시간|일|주)\s*전$/.exec(time.trim());
  if (!m) return null;
  const n = Number(m[1]);
  return n * (m[2] === '분' ? MIN : m[2] === '시간' ? HOUR : m[2] === '일' ? DAY : 7 * DAY);
}

/**
 * 카드에 보일 '올린 때'.
 * 앱에서 올린 글(time '방금' + at)은 at 으로 매번 다시 계산해요. 예시 글은 적힌 글(time)을 지난 시간으로 읽어 같은 규칙으로 맞춰요.
 * 읽을 수 없는 글('11.18' 처럼 이미 날짜 등)은 그대로 보여요.
 */
export function whenLabel(time: string, at?: number, now = Date.now()): string {
  if (time === '방금' && at) return agoLabel(at, now);
  const ago = parseAgo(time);
  return ago === null ? time : agoLabel(now - ago, now);
}
