/**
 * '함께 가자고 할까요?' 띄울지 (state/invite-prompt) · 퀘스트 성공 알리기 (state/quest-share) 테스트. 실행: npm test
 */
import { updateSettings } from '@/components/account/store';

import { INVITE_SNOOZE_MS, shouldAskInvite, snoozeInvite } from '../invite-prompt';
import { updateMe } from '../me';
import { lessonQuestTitle, shareQuest } from '../quest-share';

const mockSend = jest.fn((_a: unknown) => Promise.resolve());
jest.mock('@/api/home', () => ({ sendQuestDone: (a: unknown) => mockSend(a) }));

const member = { role: 'member' as const, link: 'linked' as const, trial: null, plan: 'study' as const };

describe('shouldAskInvite', () => {
  it('회원 · 팔로우한 멤버가 있을 때만, 2주간 보지 않기 뒤엔 14일 동안 안 물어요', () => {
    updateMe({ ...member, following: {} });
    expect(shouldAskInvite()).toBe(false);
    updateMe({ following: { 민준: true } });
    expect(shouldAskInvite()).toBe(true);
    const now = Date.now();
    snoozeInvite(now);
    expect(shouldAskInvite(now + 1000)).toBe(false);
    expect(shouldAskInvite(now + INVITE_SNOOZE_MS + 1)).toBe(true);
    updateMe({ role: 'guest', link: 'none' });
    expect(shouldAskInvite(now + INVITE_SNOOZE_MS + 1)).toBe(false);
  });
});

describe('shareQuest', () => {
  beforeEach(() => mockSend.mockClear());
  const q = { key: '1:1:sit', title: lessonQuestTitle(1, 1, 'main'), href: '/lesson/sit?lv=1&unit=1' };

  it('제목은 과 이름 · 단계', () => {
    expect(q.title).toBe('1과 Cafe Complaint · 본학습');
  });
  it('회원 · 설정 켜짐일 때 같은 단계는 한 번만', () => {
    updateMe(member);
    updateSettings({ shareProgress: true });
    expect(shareQuest(q)).toBe(true);
    expect(shareQuest(q)).toBe(false);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
  it('설정을 끄거나 비회원이면 보내지 않아요', () => {
    updateMe(member);
    updateSettings({ shareProgress: false });
    expect(shareQuest({ ...q, key: '1:1:story' })).toBe(false);
    updateSettings({ shareProgress: true });
    updateMe({ role: 'guest', link: 'none' });
    expect(shareQuest({ ...q, key: '1:1:talk' })).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });
});
