/**
 * 지점 안내 화면 값 — 고른 지점 안내(GET /branches/{code}/guide)를 화면 줄로 바꾸는 규칙과,
 * 고객센터 '내 지점 전화'를 연동된 지점 안내(GET /me/branch-guides)에서 고르는 규칙.
 */
import { MOCK_BRANCH_GUIDES, myBranchContact, type BranchGuide } from '../branch-guide';
import { branchGuideView, type BranchPublicGuide } from '../onboarding';

jest.mock('../config', () => ({
  apiConfig: { env: 'dev', baseUrl: '', useMock: true, mockDelayMs: 0, timeoutMs: 15000 },
}));

const EMPTY: BranchPublicGuide = {
  branchCode: 'GIMPO',
  branchName: '김포점',
  address: null,
  addressDetail: null,
  latitude: null,
  longitude: null,
  intro: null,
  photoPaths: [],
  phone: null,
  phoneHours: null,
  openHours: null,
  parking: null,
  languages: [],
};

describe('branchGuideView', () => {
  it('지점이 아무것도 적지 않았으면 이름만 있고 나머지 줄은 null · 사진은 빈 목록', () => {
    expect(branchGuideView(EMPTY)).toEqual({ name: '김포점', photos: [], intro: null, address: null, openHours: null, study: null, phone: null });
  });

  it('주소는 층 · 호를 뒤에 붙이고, 층 · 호만 있으면 주소 줄을 그리지 않아요', () => {
    expect(branchGuideView({ ...EMPTY, address: '하남시 미사대로 1', addressDetail: '3층' }).address).toBe('하남시 미사대로 1 3층');
    expect(branchGuideView({ ...EMPTY, address: '하남시 미사대로 1' }).address).toBe('하남시 미사대로 1');
    expect(branchGuideView({ ...EMPTY, addressDetail: '3층' }).address).toBeNull();
  });

  it('스터디 줄은 서버가 준 언어 순서 그대로 · 수업 수는 모두 더해요', () => {
    const g = { ...EMPTY, languages: [{ code: 'en', label: '영어', courseCount: 5 }, { code: 'ja', label: '일본어', courseCount: 2 }] };
    expect(branchGuideView(g).study).toBe('영어 · 일본어 · 7팀');
  });

  it('사진 · 소개 · 전화는 받은 그대로', () => {
    const g = { ...EMPTY, photoPaths: ['https://cdn/b.jpg', 'https://cdn/a.jpg'], intro: '미사역 앞\n라운지', phone: '0507-0000-0000' };
    expect(branchGuideView(g)).toMatchObject({ photos: ['https://cdn/b.jpg', 'https://cdn/a.jpg'], intro: '미사역 앞\n라운지', phone: '0507-0000-0000' });
  });
});

describe('myBranchContact', () => {
  const [hanam, jamsil] = MOCK_BRANCH_GUIDES as [BranchGuide, BranchGuide];

  it('연동된 지점이 없으면 null', () => {
    expect(myBranchContact([], '하남점')).toBeNull();
  });

  it('내 지점(이름이 같은 곳)을 먼저 골라요', () => {
    expect(myBranchContact([hanam, jamsil], '잠실점')).toEqual({ branchName: '잠실점', phone: '0507-1111-1111' });
  });

  it('내 지점이 번호를 안 적었거나 목록에 없으면 번호를 적은 첫 지점', () => {
    expect(myBranchContact([hanam, { ...jamsil, phone: null }], '잠실점')).toEqual({ branchName: '하남점', phone: '0507-0000-0000' });
    expect(myBranchContact([jamsil], '하남점')).toEqual({ branchName: '잠실점', phone: '0507-1111-1111' });
  });

  it('어느 지점도 번호를 안 적었으면 null', () => {
    expect(myBranchContact([{ ...hanam, phone: null }], '하남점')).toBeNull();
  });
});
