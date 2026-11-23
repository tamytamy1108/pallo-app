import { sendAttendance } from '@/components/home/attendance';
import { getMe, updateMe } from '@/state/me';
import { award, awardPoints, awardSparks, listRewards, resetLedger } from '@/state/ledger';
import { markDone, sceneKey, stepKey } from '@/state/progress';
import { DAILY_GOAL, dayKey, getTodayDone, recordToday, resetTodayGoal } from '@/state/today-goal';

beforeEach(() => {
  resetTodayGoal();
  resetLedger();
  updateMe({ weekPoints: 0, sparks: 1250 });
});

describe('today goal', () => {
  it('counts Lv.1·2, Lv.3·4 and scene steps in one place', () => {
    expect(markDone(stepKey(1, 1, 'pat'))).toBe(true);
    expect(markDone(stepKey(3, 1, 'kwl'))).toBe(true);
    expect(markDone('cafe:1:mis')).toBe(true);
    expect(getTodayDone()).toBe(3);
  });

  it('does not count the same step twice, nor the scene stamp', () => {
    markDone(stepKey(1, 2, 'dlg'));
    markDone(stepKey(1, 2, 'dlg'));
    markDone(sceneKey('cafe-2'));
    expect(getTodayDone()).toBe(1);
  });

  it('starts from 0 after midnight', () => {
    const night = new Date(2026, 10, 23, 23, 59).getTime();
    const morning = new Date(2026, 10, 24, 0, 1).getTime();
    expect(recordToday('a', night)).toBe(1);
    expect(recordToday('b', night)).toBe(2);
    expect(getTodayDone(morning)).toBe(0);
    expect(recordToday('c', morning)).toBe(1);
  });

  it('keys days as local YYYY-MM-DD', () => {
    expect(dayKey(new Date(2026, 0, 5, 12).getTime())).toBe('2026-01-05');
    expect(DAILY_GOAL).toBe(2);
  });
});

describe('ledger', () => {
  it('adds points and updates weekPoints', () => {
    expect(awardPoints('step:1:1:pat', 'step', 5)).toBe(true);
    expect(awardPoints('skip:1:1:dlg', 'skip', 10)).toBe(true);
    expect(getMe().weekPoints).toBe(15);
    expect(listRewards('points').map((e) => e.type)).toEqual(['step', 'skip']);
  });

  it('never awards the same event twice', () => {
    awardPoints('attend:2026-11-23:1', 'attend', 30);
    expect(awardPoints('attend:2026-11-23:1', 'attend', 30)).toBe(false);
    expect(getMe().weekPoints).toBe(30);
  });

  it('keeps points and sparks for the same event apart', () => {
    awardPoints('attend:2026-11-23:1', 'attend', 30);
    expect(awardSparks('attend:2026-11-23:1', 'attend', 50)).toBe(true);
    expect(getMe().sparks).toBe(1300);
    expect(awardSparks('attend:2026-11-23:1', 'attend', 50)).toBe(false);
  });

  it('records spending as a negative event with id, type, amount, at', () => {
    award({ id: 'shop:1', type: 'shop', currency: 'sparks', amount: -200, at: 1 });
    expect(getMe().sparks).toBe(1050);
    expect(listRewards('sparks')).toEqual([{ id: 'shop:1', type: 'shop', currency: 'sparks', amount: -200, at: 1 }]);
  });

  it('ignores zero amounts', () => {
    expect(awardPoints('speed:x:0', 'speed', 0)).toBe(false);
    expect(listRewards()).toHaveLength(0);
  });
});

describe('attendance rewards', () => {
  it('adds +30P and +50 sparks once per session', () => {
    expect(sendAttendance(1, 0, 'qr')).toBe(true);
    expect(sendAttendance(1, 0, 'qr')).toBe(false);
    expect(getMe().weekPoints).toBe(30);
    expect(getMe().sparks).toBe(1300);
  });
});
