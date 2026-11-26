/**
 * toBranchBoard — 서버 지점 안내(GET /me/branch-guides) 한 줄을 마이 보드 칸으로 바꾸는 규칙.
 * 적지 않은 칸은 만들지 않고, 오시는 길 칸만 늘 있어요. 협업 업체는 지점 이름으로 앱 안 예시를 붙여요.
 */
import { MOCK_BRANCH_GUIDES, type BranchGuide } from '@/api/branch-guide';
import { BR_PARTNERS, toBranchBoard } from '@/data/my';

const [HANAM] = MOCK_BRANCH_GUIDES;
const BARE: BranchGuide = {
  ...HANAM,
  branchName: '판교점',
  addressDetail: null,
  phone: null,
  phoneHours: null,
  openHours: null,
  parking: null,
  bankAccount: null,
  wifi: null,
  managerNotice: null,
};

describe('toBranchBoard', () => {
  it('다 적은 지점 — 주차 · 계좌 → 와이파이 → 오시는 길 → 문의 순, 고정 글엔 매니저 이름 · 한국 날짜', () => {
    const b = toBranchBoard(HANAM);
    expect(b.items.map((x) => x.ic)).toEqual(['park', 'wifi', 'loc', 'tel']);
    expect(b.addr).toBe('하남시 [주소] · 3층');
    expect(b.hrs).toBe('평일 10~23시 · 주말 10~18시');
    expect(b.pin).toEqual({ t: '11/22(토) 건물 점검으로 주차장 이용이 어려워요', by: '매니저 Jay', at: '11.18' });
    expect(b.partners).toBe(BR_PARTNERS['하남점']);

    const park = b.items[0];
    expect(park.t).toBe('주차 · 입금 계좌');
    expect(park.cp).toEqual([['입금 계좌 · 예금주 [이름] · 주차 추가 · 이벤트 참가비', '[은행] 000-00-000000']]);
    expect(b.items[2].act).toEqual(['map', '하남시 [주소]']);
    expect(b.items[3]).toMatchObject({ d: '0507-0000-0000 · 평일 10~19시', act: ['tel', '0507-0000-0000'] });
  });

  it('아무것도 안 적은 지점 — 오시는 길 칸만, 고정 글 · 협업 업체 없음', () => {
    const b = toBranchBoard(BARE);
    expect(b.items.map((x) => x.ic)).toEqual(['loc']);
    expect(b.items[0].d).toBe('하남시 [주소]');
    expect(b.hrs).toBe('');
    expect(b.pin).toBeNull();
    expect(b.partners).toEqual([]);
  });

  it('주차만 · 계좌만이면 칸 제목이 하나로, 비밀번호 없는 와이파이는 이름만 복사', () => {
    expect(toBranchBoard({ ...BARE, parking: '지하 2층' }).items[0]).toMatchObject({ t: '주차', d: '지하 2층', cp: undefined });
    const acc = toBranchBoard({ ...BARE, bankAccount: { bankName: '국민', accountNumber: '1-2', holder: '홍', note: null } }).items[0];
    expect(acc).toMatchObject({ t: '입금 계좌', d: '', cp: [['입금 계좌 · 예금주 홍', '국민 1-2']] });
    const wifi = toBranchBoard({ ...BARE, wifi: { ssid: 'OPEN', password: null } }).items[0];
    expect(wifi.cp).toEqual([['이름', 'OPEN']]);
  });

  it('통화 가능 시간만 있으면 전화 버튼 없이 문의 칸, 작성자 없는 고정 글은 이름을 빼요', () => {
    const tel = toBranchBoard({ ...BARE, phoneHours: '평일 10~19시' }).items.find((x) => x.ic === 'tel');
    expect(tel).toMatchObject({ d: '평일 10~19시', act: undefined });
    const pin = toBranchBoard({ ...BARE, managerNotice: { content: '점검', authorName: null, updatedAt: '2026-11-18T15:30:00Z' } }).pin;
    // 15:30Z = 한국 11/19 00:30
    expect(pin).toEqual({ t: '점검', by: null, at: '11.19' });
  });
});
