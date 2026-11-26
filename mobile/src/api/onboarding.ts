/**
 * 가입 단계 API — 백엔드 `MobileOnboardingController` · `MobileBranchOptionController` · `MobileAssetCatalogController` (`/app/api/v2`).
 * - GET  /onboarding           가입 화면 준비: 약관(현행 버전) · 미리 채울 값 · 닉네임 규칙 · 학습 언어 · 배우고 싶은 이유
 * - POST /onboarding           가입 완료 — 약관 · 닉네임 · 팔로로 · 길(MEMBER 연동 요청 / TRIAL 체험 신청 / APP 언어 · 이유)을 한 번에
 * - GET  /branches             지점 시트 (폐점 제외 · 운영 상태 · 이 계정의 연동 상태 · 지역)
 * - GET  /trial-slots          체험 상담 희망 시간표 (오늘부터 5일)
 * - GET  /asset-catalog        고를 수 있는 팔로로
 * 지점 · 시간표는 가입 뒤 체험 예약(/trial) · 연동 요청도 같이 써요.
 *
 * 가짜 서버(mock)는 앱 안 데이터(지점 목록 · 언어 4개 · 이유 8개 · 몸 색 7개)로 같은 모양을 흉내 내요 — code 가 곧 앱 안 키예요.
 */
import { BRANCHES } from '@/data/account';

import { mockAddPendingLinkRequest } from './branch-link';
import { http } from './client';
import { apiConfig } from './config';
import { mock, mockNotFound } from './mock';
import { mockAddTrialApplication } from './trial-applications';

type Opts = { signal?: AbortSignal };

/** 백엔드 PublicConsentResponse — 동의는 versionId 로 보내요 */
export type ConsentDoc = { versionId: string; code: string; title: string; body: string; required: boolean; version: number; effectiveFrom: string; sortOrder: number };
/** 마스터데이터 한 칸 — 보낼 때는 code, 보여 줄 때는 label */
export type Option = { code: string; label: string };

export type OnboardingInfo = {
  needsOnboarding: boolean;
  consents: ConsentDoc[];
  /** 카카오에서 받은 값 (없으면 null — 빈칸으로 시작) */
  prefill: { nickname: string | null; realName: string | null; phone: string | null };
  nickname: { min: number; max: number };
  languages: Option[];
  reasons: Option[];
};

/** 지점 시트 한 줄 — ACTIVE 만 체험 신청, linkStatus 가 null 인 곳만 연동 요청을 받아요 (막아서 이유를 보여 줘요) */
/** 8방위 (북에서 시계 방향) */
export type Compass = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
/** 위경도 한 점 */
export type LatLng = { lat: number; lng: number };

/**
 * 지점 시트 한 줄. distanceMeters · direction 은 내 위치(near)를 보냈을 때만 — 내 위치에서 지점까지 거리 · 방위.
 * 위치를 안 보냈거나 지점 좌표가 없으면 null 이고, 위치를 보내면 서버가 가까운 순으로 줘요 (좌표 없는 지점은 맨 뒤).
 */
export type BranchOption = {
  code: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED';
  linkStatus: 'linked' | 'pending' | null;
  region: string | null;
  distanceMeters: number | null;
  direction: Compass | null;
};

const COMPASS_LABEL: Record<Compass, string> = { N: '북쪽', NE: '북동쪽', E: '동쪽', SE: '남동쪽', S: '남쪽', SW: '남서쪽', W: '서쪽', NW: '북서쪽' };

/** 거리 글자 — 1km 안은 10m 단위('350m'), 10km 안은 소수 한 자리('8.8km'), 그 밖은 정수('21km') */
export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)}m`;
  if (m < 10000) return `${(Math.round(m / 100) / 10).toFixed(1)}km`;
  return `${Math.round(m / 1000)}km`;
}

/** 내 위치에서 본 지점 자리 — '남동쪽 8.8km' (방위가 없으면 거리만). 거리를 모르면 null */
export function relativePlace(b: Pick<BranchOption, 'distanceMeters' | 'direction'>): string | null {
  if (b.distanceMeters == null) return null;
  const d = formatDistance(b.distanceMeters);
  return b.direction ? `${COMPASS_LABEL[b.direction]} ${d}` : d;
}

/** 거리를 하나라도 받았으면 서버가 가까운 순으로 준 목록 그대로, 아니면 null (지역 묶음으로 보여요) */
export const nearestBranches = (rows: BranchOption[]): BranchOption[] | null => (rows.some((b) => b.distanceMeters != null) ? rows : null);

/** 서버에 보내는 위치는 소수 셋째 자리(약 100m)까지만 — 정확한 위치를 넘기지 않고, 조금 움직여도 같은 목록을 다시 써요 */
export const roundLatLng = (p: LatLng): LatLng => ({ lat: Math.round(p.lat * 1000) / 1000, lng: Math.round(p.lng * 1000) / 1000 });

/** 날짜(YYYY-MM-DD, KST)마다 상담 희망 시각(HH:mm) — 상담 시간이 없는 날은 빈 목록, 오늘은 지난 시각을 빼요 */
export type TrialSlotDays = { days: { date: string; times: string[] }[] };

/**
 * 고른 지점 안내 (GET /branches/{code}/guide) — 아직 연동 안 된 사람도 보는 공개 칸만. 지점이 콘솔 설정 > 지점 > 지점 안내에 적은 값이고,
 * 적지 않은 칸은 null · 사진 · 언어는 빈 목록이에요. 입금 계좌 · 와이파이 · 매니저 주의사항은 연동된 회원용(api/branch-guide)에만 있어요.
 */
export type BranchPublicGuide = {
  branchCode: string;
  branchName: string;
  address: string | null;
  /** 층 · 호 */
  addressDetail: string | null;
  latitude: number | null;
  longitude: number | null;
  /** 지점 소개 글 (줄바꿈 그대로) */
  intro: string | null;
  /** 지점 사진 주소 — 순서 = 넘겨 보는 순서 */
  photoPaths: string[];
  /** 지점 문의 전화번호 (숫자 · 하이픈) */
  phone: string | null;
  phoneHours: string | null;
  openHours: string | null;
  parking: string | null;
  /** 이 지점에 열린 수업의 언어 (언어 정렬 순) · 그 언어 수업 수 */
  languages: { code: string; label: string; courseCount: number }[];
};

export type Pallolo = { code: string; name: string; tint: string; isDefault: boolean; version: number; imageUrl: string };
export type AssetCatalog = { formatVersion: number; canvas: { width: number; height: number }; bodyBox: { x: number; y: number; width: number; height: number }; pallolos: Pallolo[] };

export type OnboardingBody = {
  consents: { versionId: string; agreed: boolean }[];
  nickname: string;
  palloloCode: string;
  path: 'MEMBER' | 'TRIAL' | 'APP';
  member?: { branchCode: string; realName: string; phone: string };
  trial?: { branchCode: string; realName: string; phone: string; languageCode: string; date: string; time: string; reasons: string[]; note: string | null };
  app?: { languageCodes: string[]; reasons: string[] };
};

/** 고른 길의 결과만 들어 있어요 — 연동 대기 · 체험 확인 화면을 다시 조회하지 않고 그려요 */
export type OnboardingResult = {
  needsOnboarding: boolean;
  path: OnboardingBody['path'];
  linkRequest?: { id: string; branchCode: string; branchName: string; status: string };
  trial?: { branchCode: string; branchName: string; languageCode: string; date: string; time: string; realName: string };
};

/** 지점 안내 화면이 그대로 그리는 값 — 비어 있는 줄은 null (화면은 null 인 줄을 그리지 않아요) */
export type BranchGuideView = {
  name: string;
  photos: string[];
  intro: string | null;
  /** 주소 + 층 · 호 */
  address: string | null;
  openHours: string | null;
  /** '영어 · 일본어 · 7팀' — 열린 수업이 없으면 null */
  study: string | null;
  phone: string | null;
};

export function branchGuideView(g: BranchPublicGuide): BranchGuideView {
  const total = g.languages.reduce((n, l) => n + l.courseCount, 0);
  return {
    name: g.branchName,
    photos: g.photoPaths,
    intro: g.intro,
    address: g.address ? [g.address, g.addressDetail].filter(Boolean).join(' ') : null,
    openHours: g.openHours,
    study: total > 0 ? `${g.languages.map((l) => l.label).join(' · ')} · ${total}팀` : null,
    phone: g.phone,
  };
}

/* ───────── 가짜 서버 ───────── */

const MOCK_LANGS: Option[] = [
  { code: 'en', label: '영어' },
  { code: 'ja', label: '일본어' },
  { code: 'zh', label: '중국어' },
  { code: 'es', label: '스페인어' },
];

/** 가짜 서버 '배우고 싶은 이유' (code = 이름) */
const MOCK_REASONS = ['여행 가서 말하기', '일 · 이직', '유학 · 워홀 · 이민', '시험 · 자격증', '외국인 친구', '새 취미', '말하기 자신감', '기타'];

const MOCK_CONSENTS: ConsentDoc[] = [
  { code: 'AGE_14', title: '만 14세 이상이에요', required: true },
  { code: 'TERMS', title: '서비스 이용약관', required: true },
  { code: 'PRIVACY', title: '개인정보 수집 · 이용', required: true },
  { code: 'MARKETING', title: '이벤트 · 번개 소식 받기', required: false },
].map((c, i) => ({ ...c, versionId: `mock-consent-${c.code.toLowerCase()}`, body: `${c.title} 전문 (가짜)`, version: 1, effectiveFrom: '2026-01-01', sortOrder: i + 1 }));

const withJeom = (n: string) => (n.endsWith('점') ? n : `${n}점`);
const MOCK_BRANCHES: BranchOption[] = BRANCHES.map(([n, r]) => ({ code: withJeom(n), name: withJeom(n), status: 'ACTIVE', linkStatus: null, region: r, distanceMeters: null, direction: null }));

/** 가짜 서버의 지점 좌표: 이름으로 정한 수도권 안 한 점 (열 곳 중 한 곳은 좌표 없음 — 맨 뒤로 가요) */
function mockBranchPoint(code: string): LatLng | null {
  const h = hash(code);
  if (h % 10 === 0) return null;
  return { lat: 37.3 + (h % 400) / 1000, lng: 126.75 + ((h * 7) % 550) / 1000 };
}

/** 가짜 서버의 거리 · 방위 (서버 GeoPoint 와 같은 하버사인 · 8방위) */
function mockDistance(from: LatLng, to: LatLng): { distanceMeters: number; direction: Compass | null } {
  const rad = (d: number) => (d * Math.PI) / 180;
  const p1 = rad(from.lat);
  const p2 = rad(to.lat);
  const dl = rad(to.lng - from.lng);
  const a = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  const distanceMeters = Math.round(2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(a))));
  if (from.lat === to.lat && from.lng === to.lng) return { distanceMeters, direction: null };
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const order: Compass[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return { distanceMeters, direction: order[Math.round(bearing / 45) % 8] ?? null };
}

/** 가짜 GET /branches — near 를 주면 거리 · 방위를 붙여 가까운 순 (좌표 없는 지점은 맨 뒤, 그 안은 이름순) */
export function mockBranchOptions(near?: LatLng | null): BranchOption[] {
  const rows = MOCK_BRANCHES.map((b) => ({ ...b }));
  if (!near) return rows;
  return rows
    .map((b) => {
      const at = mockBranchPoint(b.code);
      return at ? { ...b, ...mockDistance(near, at) } : b;
    })
    .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
}

const MOCK_PALLOLOS: Pallolo[] = [
  ['yellow', '노랑', '#E0D121'],
  ['purple', '보라', '#A88BEA'],
  ['purple-lash', '보라 속눈썹', '#A88BEA'],
  ['pink', '핑크', '#F49BBE'],
  ['sky', '하늘', '#8DB6F2'],
  ['green', '초록', '#93D67E'],
  ['coral', '코랄', '#FF9E80'],
].map(([code, name, tint]) => ({ code, name, tint, isDefault: code === 'purple-lash', version: 1, imageUrl: '' }));

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
const MOCK_TIMES = ['10:00', '11:00', '14:00', '15:00', '19:00', '20:00'];

/** 가짜 시간표: 오늘부터 5일, 금요일은 정기휴일이라 비어요, 지점 · 날짜마다 몇 칸은 없어요, 오늘은 지난 시각 빼기 (스토리도 써요) */
export function mockTrialSlots(branchCode: string): TrialSlotDays {
  const now = new Date();
  const nowHm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return {
    days: Array.from({ length: 5 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const date = ymd(d);
      const times = d.getDay() === 5 ? [] : MOCK_TIMES.filter((t) => hash(branchCode + date + t) % 3 !== 0).filter((t) => i > 0 || t > nowHm);
      return { date, times };
    }),
  };
}

const mockBranchName = (code: string) => MOCK_BRANCHES.find((b) => b.code === code)?.name ?? code;

/** 가짜 지점 안내: 하남점 · 잠실점은 다 적은 지점, 나머지는 주소만 적은 지점 (사진은 없어요 — 스토리가 따로 채워요) */
export function mockBranchPublicGuide(code: string): BranchPublicGuide {
  const base: BranchPublicGuide = {
    branchCode: code,
    branchName: mockBranchName(code),
    address: `${mockBranchName(code)} [주소]`,
    addressDetail: null,
    latitude: null,
    longitude: null,
    intro: null,
    photoPaths: [],
    phone: null,
    phoneHours: null,
    openHours: null,
    parking: null,
    languages: [{ code: 'en', label: '영어', courseCount: 3 }],
  };
  if (code === '하남점')
    return {
      ...base,
      address: '하남시 [주소]',
      addressDetail: '3층',
      intro: '미사역 바로 앞, 통창 라운지가 있는 지점이에요. 평일 저녁 스터디가 가장 많고, 스터디 끝나고 라운지에서 프리토킹을 이어 가는 분이 많아요.',
      phone: '0507-0000-0000',
      phoneHours: '평일 10~19시',
      openHours: '평일 10~23시 · 주말 10~18시',
      parking: '건물 지하 2층 · 스터디 시간 2시간 무료',
      languages: [
        { code: 'en', label: '영어', courseCount: 5 },
        { code: 'ja', label: '일본어', courseCount: 2 },
        { code: 'zh', label: '중국어', courseCount: 2 },
        { code: 'es', label: '스페인어', courseCount: 1 },
      ],
    };
  if (code === '잠실점')
    return {
      ...base,
      address: '서울 송파구 [주소]',
      addressDetail: '5층',
      intro: '잠실역 8번 출구에서 3분, 스터디룸 6개가 있는 지점이에요. 직장인 저녁 스터디와 주말 오전 스터디가 많아요.',
      phone: '0507-1111-1111',
      openHours: '평일 10~22시 · 주말 10~18시',
      languages: [
        { code: 'en', label: '영어', courseCount: 4 },
        { code: 'ja', label: '일본어', courseCount: 2 },
      ],
    };
  return base;
}

function mockSubmit(body: OnboardingBody): OnboardingResult {
  if (body.path === 'MEMBER' && body.member) {
    const m = body.member;
    const row = mockAddPendingLinkRequest(m.branchCode, mockBranchName(m.branchCode), m.realName, m.phone);
    return { needsOnboarding: false, path: 'MEMBER', linkRequest: { id: row.id, branchCode: row.branchCode, branchName: row.branchName, status: 'PENDING' } };
  }
  if (body.path === 'TRIAL' && body.trial) {
    const t = body.trial;
    const branchName = mockBranchName(t.branchCode);
    const languageLabel = MOCK_LANGS.find((l) => l.code === t.languageCode)?.label ?? t.languageCode;
    mockAddTrialApplication({ branchCode: t.branchCode, branchName, languageCode: t.languageCode, languageLabel, date: t.date, time: t.time, realName: t.realName, phone: t.phone, note: t.note });
    return { needsOnboarding: false, path: 'TRIAL', trial: { branchCode: t.branchCode, branchName, languageCode: t.languageCode, date: t.date, time: t.time, realName: t.realName } };
  }
  return { needsOnboarding: false, path: 'APP' };
}

/* ───────── API ───────── */

/** GET /onboarding — 가입 화면 준비 */
export function fetchOnboardingInfo({ signal }: Opts = {}): Promise<OnboardingInfo> {
  if (apiConfig.useMock)
    return mock('onboardingInfo', () => ({
      needsOnboarding: true,
      consents: MOCK_CONSENTS,
      prefill: { nickname: '서현', realName: '김서현', phone: '010-1234-5678' },
      nickname: { min: 2, max: 10 },
      languages: MOCK_LANGS,
      reasons: MOCK_REASONS.map((r) => ({ code: r, label: r })),
    }));
  return http.get('/onboarding', { signal });
}

/** POST /onboarding — 가입 완료 (한 트랜잭션: 하나라도 틀리면 아무것도 남지 않아요) */
export function submitOnboarding(body: OnboardingBody): Promise<OnboardingResult> {
  if (apiConfig.useMock) return mock('submitOnboarding', () => mockSubmit(body));
  return http.post('/onboarding', body);
}

/** GET /branches — 지점 시트 */
export function fetchBranchOptions({ near, signal }: Opts & { near?: LatLng | null } = {}): Promise<BranchOption[]> {
  const p = near ? roundLatLng(near) : null;
  if (apiConfig.useMock) return mock('branchOptions', () => mockBranchOptions(p));
  return http.get('/branches', { signal, ...(p ? { query: { lat: p.lat, lng: p.lng } } : {}) });
}

/** GET /branches/{code}/guide — 고른 지점 안내 (운영 중인 지점만, 아니면 404) */
export function fetchBranchPublicGuide(branchCode: string, { signal }: Opts = {}): Promise<BranchPublicGuide> {
  if (apiConfig.useMock)
    return mock('branchPublicGuide', () => {
      if (!MOCK_BRANCHES.some((b) => b.code === branchCode)) throw mockNotFound();
      return mockBranchPublicGuide(branchCode);
    });
  return http.get(`/branches/${encodeURIComponent(branchCode)}/guide`, { signal });
}

/** GET /trial-slots?branchCode= — 운영 중인 지점만 (아니면 404) */
export function fetchTrialSlots(branchCode: string, { signal }: Opts = {}): Promise<TrialSlotDays> {
  if (apiConfig.useMock)
    return mock('trialSlots', () => {
      if (!MOCK_BRANCHES.some((b) => b.code === branchCode)) throw mockNotFound();
      return mockTrialSlots(branchCode);
    });
  return http.get('/trial-slots', { signal, query: { branchCode } });
}

/** GET /asset-catalog — 고를 수 있는 팔로로 (화면 순서, 기본 하나) */
export function fetchAssetCatalog({ signal }: Opts = {}): Promise<AssetCatalog> {
  if (apiConfig.useMock)
    return mock('assetCatalog', () => ({ formatVersion: 1, canvas: { width: 680, height: 580 }, bodyBox: { x: 35, y: 214, width: 520, height: 332 }, pallolos: MOCK_PALLOLOS.map((p) => ({ ...p })) }));
  return http.get('/asset-catalog', { signal });
}
