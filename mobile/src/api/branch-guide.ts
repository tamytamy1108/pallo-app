/**
 * 마이 › 지점 안내 — `GET /app/api/v2/me/branch-guides`. 내 앱 계정과 연동된 지점마다 한 줄 (지점 이름 순).
 * 지점이 콘솔 설정 > 지점 > 지점 안내 · 지점 부대시설에 적은 값이에요. 적지 않은 칸은 null 이고, 앱은 null 인 칸을 그리지 않아요.
 * 협업 업체 · 사물함은 아직 서버에 없어서 화면이 앱 안 예시(data/my BR_PARTNERS)를 그대로 써요.
 */
import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

export type BranchGuide = {
  branchCode: string;
  branchName: string;
  /** 도로명 주소 (지도 검색에 써요) */
  address: string;
  /** 층 · 호 */
  addressDetail: string | null;
  latitude: number | null;
  longitude: number | null;
  /** 지점 문의 전화번호 (숫자 · 하이픈) */
  phone: string | null;
  /** 통화 가능 시간 (지점이 적은 그대로) */
  phoneHours: string | null;
  /** 운영 시간 (지점이 적은 그대로) */
  openHours: string | null;
  /** 주차 안내 */
  parking: string | null;
  bankAccount: { bankName: string; accountNumber: string; holder: string; note: string | null } | null;
  /** 비밀번호 없는 와이파이면 password 가 null */
  wifi: { ssid: string; password: string | null } | null;
  /** 매니저 주의사항 — authorName 은 직원 닉네임, updatedAt 은 ISO 시각 */
  managerNotice: { content: string; authorName: string | null; updatedAt: string } | null;
};

/** 가짜 서버: 프로토타입 하남점 · 잠실점 */
export const MOCK_BRANCH_GUIDES: BranchGuide[] = [
  {
    branchCode: 'HANAM',
    branchName: '하남점',
    address: '하남시 [주소]',
    addressDetail: '3층',
    latitude: null,
    longitude: null,
    phone: '0507-0000-0000',
    phoneHours: '평일 10~19시',
    openHours: '평일 10~23시 · 주말 10~18시',
    parking: '건물 지하 2층 · 스터디 시간 2시간 무료 · 데스크에 차량 번호를 말해 주세요',
    bankAccount: { bankName: '[은행]', accountNumber: '000-00-000000', holder: '[이름]', note: '주차 추가 · 이벤트 참가비' },
    wifi: { ssid: 'PALLO_HANAM', password: 'pallo2026!' },
    managerNotice: { content: '11/22(토) 건물 점검으로 주차장 이용이 어려워요', authorName: 'Jay', updatedAt: '2026-11-18T01:00:00Z' },
  },
  {
    branchCode: 'JAMSIL',
    branchName: '잠실점',
    address: '서울 송파구 [주소]',
    addressDetail: '5층 · 잠실역 8번 출구 도보 3분',
    latitude: null,
    longitude: null,
    phone: '0507-1111-1111',
    phoneHours: '평일 10~19시',
    openHours: '평일 10~22시 · 주말 10~18시',
    parking: '롯데월드몰 주차장 · 데스크에서 3시간 할인 도장',
    bankAccount: { bankName: '[은행]', accountNumber: '111-11-111111', holder: '[이름]', note: '이벤트 참가비' },
    wifi: { ssid: 'PALLO_JAMSIL', password: 'jamsil2026!' },
    managerNotice: null,
  },
];

/** GET /me/branch-guides */
export function fetchBranchGuides({ signal }: Opts = {}): Promise<BranchGuide[]> {
  if (apiConfig.useMock) return mock('branchGuides', () => MOCK_BRANCH_GUIDES);
  return http.get('/me/branch-guides', { signal });
}

/** 고객센터 '내 지점 전화' — 연동된 지점 중 내 지점(이름이 같은 곳)을 먼저, 없으면 전화번호를 적은 첫 지점. 전화번호가 없으면 null */
export function myBranchContact(rows: BranchGuide[], myBranchName: string): { branchName: string; phone: string } | null {
  const withPhone = rows.filter((r): r is BranchGuide & { phone: string } => !!r.phone);
  const row = withPhone.find((r) => r.branchName === myBranchName) ?? withPhone[0];
  return row ? { branchName: row.branchName, phone: row.phone } : null;
}
