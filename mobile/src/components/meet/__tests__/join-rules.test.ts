import { askClosed, askDeadline, deadlineText, meetStart, rejectPhrase, REJECT_REASONS } from '../join-rules';

describe('번개 승인제 규칙', () => {
  const start = meetStart({ mon: 'DEC', day: '5', wd: '토 20:00' });

  it('시작 시각은 wd 의 시간을 날짜에 붙여요', () => {
    expect(start.getMonth()).toBe(11);
    expect(start.getDate()).toBe(5);
    expect(start.getHours()).toBe(20);
  });

  it('신청은 24시간 · 시작 3시간 전 중 이른 때 끝나요', () => {
    const early = new Date(2026, 11, 1, 10, 0).getTime();
    expect(askDeadline(early, start)).toBe(new Date(2026, 11, 2, 10, 0).getTime());
    const late = new Date(2026, 11, 5, 9, 0).getTime();
    expect(askDeadline(late, start)).toBe(new Date(2026, 11, 5, 17, 0).getTime());
  });

  it('시작 3시간 전부터는 신청을 닫아요', () => {
    expect(askClosed(start, new Date(2026, 11, 5, 16, 59).getTime())).toBe(false);
    expect(askClosed(start, new Date(2026, 11, 5, 17, 0).getTime())).toBe(true);
  });

  it('신청자에게는 정해진 문구만 보여요 (기타도 정해진 문구)', () => {
    expect(rejectPhrase('OTHER')).toBe(REJECT_REASONS[2].phrase);
    for (const r of REJECT_REASONS) expect(r.phrase).toMatch(/어려워요$/);
  });

  it('마감 시각 글자', () => {
    const now = new Date(2026, 11, 1, 10, 0).getTime();
    expect(deadlineText(new Date(2026, 11, 1, 21, 0).getTime(), now)).toBe('오늘 21:00');
    expect(deadlineText(new Date(2026, 11, 2, 9, 30).getTime(), now)).toBe('내일 09:30');
    expect(deadlineText(new Date(2026, 11, 4, 21, 0).getTime(), now)).toBe('12월 4일 21:00');
  });
});
