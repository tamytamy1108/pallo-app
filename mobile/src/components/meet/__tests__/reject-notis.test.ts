import { localNotificationItem } from '@/api/notifications';
import { getArrivedNotis } from '@/components/home/noti-state';
import { CLUBS } from '@/data/meet';

import { rejectPhrase } from '../join-rules';
import { addMyClub, decideMyClub, getMeetStore, rejectMyAsk } from '../meet-store';

describe('거절되면 알림함에도 한 줄', () => {
  it('동아리 만들기 신청이 거절되면 이유와 함께 알림이 와요', () => {
    addMyClub({ ...CLUBS[0]!, id: 'my-club-x', name: '테스트 동아리', mine: true, wait: true });
    decideMyClub('my-club-x', false, '같은 지점에 비슷한 동아리가 이미 있어요');

    const n = getArrivedNotis()[0]!;
    expect(n.text).toBe('‘테스트 동아리’ 동아리 신청이 거절됐어요. 사유: 같은 지점에 비슷한 동아리가 이미 있어요');
    expect(n.href).toBe('/club/my-club-x');
    expect(n.read).toBe(false);
    expect(getMeetStore().myClubs.find((c) => c.id === 'my-club-x')?.rejected?.reason).toBe('같은 지점에 비슷한 동아리가 이미 있어요');
  });

  it('동아리가 승인되면 거절 알림은 오지 않아요', () => {
    addMyClub({ ...CLUBS[0]!, id: 'my-club-y', name: '승인 동아리', mine: true, wait: true });
    const before = getArrivedNotis().length;
    decideMyClub('my-club-y', true);
    expect(getArrivedNotis()).toHaveLength(before);
  });

  it('번개 참여 신청이 거절되면 신청자가 보는 문구로 알림이 와요', () => {
    rejectMyAsk('m-x', 'CONDITION', '퇴근 후 영어 맥주 번개');

    const n = getArrivedNotis()[0]!;
    expect(n.text).toBe(`‘퇴근 후 영어 맥주 번개’ 번개 참여 신청이 거절됐어요. 사유: ${rejectPhrase('CONDITION')}`);
    expect(n.href).toBe('/meet/m-x');
  });

  it('생긴 때를 남겨서 시간이 지나면 \'N분 전\'으로 보여요', () => {
    const n = getArrivedNotis()[0]!;
    expect(n.at).toEqual(expect.any(Number));
    expect(localNotificationItem(n, false).extras?.time).toBe('방금');
    const later = jest.spyOn(Date, 'now').mockReturnValue(n.at! + 5 * 60_000);
    expect(localNotificationItem(n, false).extras?.time).toBe('5분 전');
    later.mockRestore();
  });
});
