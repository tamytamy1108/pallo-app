import type { BranchSession, BranchToday } from '@/data/branch-today';

import { groupByStudy, phaseOf, toBranchTodayView } from '../branch-today-view';

const at = (h: number, m: number) => {
  const d = new Date(2026, 10, 26, h, m);
  return d.toISOString();
};

const session = (id: string, h: number, m: number, lang: string, checkedIn: number, by: BranchSession['proCheckedInBy']): BranchSession => ({
  sessionId: id,
  startsAt: at(h, m),
  studyName: `${lang} ${h}:${m}`,
  teamName: '1팀',
  lang,
  level: 'Lv.1',
  room: null,
  proName: 'Lily',
  proCheckedInAt: by ? at(h, m - 20) : null,
  proCheckedInBy: by,
  proCheckedInName: by === 'STAFF' ? '김하남' : by ? 'Lily' : null,
  staffJoinedName: null,
  checkedIn,
  tables: [],
});

const data: BranchToday = {
  branch: { code: 'hanam', name: '하남점' },
  date: '2026-11-26',
  sessions: [
    session('a', 11, 0, 'en', 8, 'PRO'),
    session('b', 18, 0, 'en', 7, 'PRO'),
    session('c', 19, 30, 'ja', 5, 'STAFF'),
    session('d', 19, 30, 'en', 10, 'PRO'),
    session('e', 21, 0, 'en', 0, null),
  ],
};

describe('오늘 지점 현황', () => {
  it('QR 은 시작 30분 전부터 20분 뒤까지 열려요', () => {
    expect(phaseOf(19 * 60 + 30, 18 * 60 + 59, 30, 20)).toBe('soon');
    expect(phaseOf(19 * 60 + 30, 19 * 60, 30, 20)).toBe('open');
    expect(phaseOf(19 * 60 + 30, 19 * 60 + 50, 30, 20)).toBe('open');
    expect(phaseOf(19 * 60 + 30, 19 * 60 + 51, 30, 20)).toBe('done');
  });

  it('열린 세션이 위, 끝난 수업은 최근 것부터 아래', () => {
    const v = toBranchTodayView(data, 19 * 60 + 12, 30, 20);
    expect(v.open.map((r) => r.sessionId)).toEqual(['d', 'c']);
    expect(v.soon.map((r) => r.sessionId)).toEqual(['e']);
    expect(v.done.map((r) => r.sessionId)).toEqual(['b', 'a']);
    expect(v.next?.phase).toBe('open');
    expect(v.next?.rows).toHaveLength(2);
  });

  it('프로 출석은 몇 명인지만 — 스텝이 대신한 것도 셈하고 따로 나눠요', () => {
    const v = toBranchTodayView(data, 19 * 60 + 12, 30, 20);
    expect(v.proCount).toBe(4);
    expect(v.proByPro).toBe(3);
    expect(v.proByStaff).toBe(1);
    expect(v.staffCount).toBe(1);
    expect(v.proPlanned).toBe(5);
    expect(v.members).toBe(30);
    expect(v.sessions).toBe(5);
    expect(v.studies).toBe(5);
  });

  it('마지막 세션까지 끝나면 다음 세션이 없어요', () => {
    const v = toBranchTodayView(data, 22 * 60, 30, 20);
    expect(v.next).toBeNull();
    expect(v.done).toHaveLength(5);
  });

  it('스터디 안에 팀이 여럿 — 오늘 스터디는 스터디 수, 팀은 따로 세요', () => {
    const study = (id: string, team: string) => ({ ...session(id, 19, 30, 'en', 3, 'PRO'), studyName: '영어 화목 7시 30분', teamName: team });
    const v = toBranchTodayView({ ...data, sessions: [study('x', '2-1 영어'), study('y', '2-2 영어'), study('z', '3-1 영어'), session('j', 19, 30, 'ja', 2, null)] }, 19 * 60 + 12, 30, 20);
    expect(v.studies).toBe(2);
    expect(v.sessions).toBe(4);
    const groups = groupByStudy(v.open);
    expect(groups.map((g) => [g.studyName, g.rows.length])).toEqual([
      ['영어 화목 7시 30분', 3],
      ['ja 19:30', 1],
    ]);
  });
});
