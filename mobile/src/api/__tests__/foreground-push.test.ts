/**
 * 앱을 보고 있을 때 온 FCM → 푸시 배너 (api/push-to-banner.ts).
 * 제목 · 한 줄은 notification 에서, 갈 화면은 data.type(백엔드 PushNotificationType) · data.referenceId 로 정해요.
 */
import { pushToBanner } from '../push-to-banner';

describe('푸시 → 배너', () => {
  it('제목 · 한 줄을 싣고, PRO\'S NOTE 는 그 노트 화면으로', () => {
    expect(pushToBanner({ notification: { title: '새 PRO\'S NOTE 가 왔어요', body: '강남점 20:00 수업' }, data: { type: 'PROS_NOTE', referenceId: 'a1b2' } })).toEqual({
      title: '새 PRO\'S NOTE 가 왔어요',
      body: '강남점 20:00 수업',
      href: '/me/notes/a1b2',
    });
  });

  it.each([
    ['USER_INQUIRY', 'q1', '/me/support'],
    ['EVENT_PROPOSAL', 'p1', '/event'],
    ['DEFERRAL_REQUEST', 'd1', '/notifications'],
    ['BRANCH_TRANSFER_REQUEST', 't1', '/notifications'],
    ['PROS_NOTE', undefined, '/me/notes'],
    ['BADGE', 'first-hangout', '/my'],
  ])('종류 %s → %s', (type, referenceId, href) => {
    const data: Record<string, string> = { type };
    if (referenceId) data.referenceId = referenceId;
    expect(pushToBanner({ notification: { title: '알림' }, data })?.href).toBe(href);
  });

  it('종류가 없거나 모르는 종류면 갈 화면 없음 — 누르면 닫히기만', () => {
    expect(pushToBanner({ notification: { title: '모임이 취소되었어요' } })?.href).toBeUndefined();
    expect(pushToBanner({ notification: { title: '알림' }, data: { type: 'SOMETHING_NEW' } })?.href).toBeUndefined();
  });

  it('제목이 없으면(데이터만 온 푸시 · 빈 제목) 배너를 띄우지 않아요', () => {
    expect(pushToBanner({ data: { type: 'PROS_NOTE' } })).toBeNull();
    expect(pushToBanner({ notification: { title: '   ', body: '본문' } })).toBeNull();
  });

  it('한 줄이 비어 있으면 제목만', () => {
    expect(pushToBanner({ notification: { title: '새 공지', body: '  ' } })).toEqual({ title: '새 공지', body: undefined, href: undefined });
  });
});
