/**
 * 내 체험 상담 신청 API — 백엔드 `MobileTrialApplicationController` (`/app/api/v2/trial-applications`).
 * - GET  /trial-applications   내 상담 신청 전부 (최근 신청 순) → 상담 신청 내역 화면 (/me/consultations)
 * - POST /trial-applications   앱 안 체험 신청 (가입을 마친 계정만 — 가입 단계 체험은 POST /onboarding 이 받아요)
 * 홈 체험 카드는 이 목록이 아니라 요약(api/branch-summary 의 upcomingTrials)을 봐요.
 *
 * 가짜 서버는 이 파일의 목록(mockRows)을 읽고 써요 (EXPO_PUBLIC_API_MOCK=1). 앱 안 체험 예약(/trial)을 하면 한 건이 쌓여요.
 * mock 을 끄면 실제 서버를 불러요.
 */
import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

/** 백엔드 TrialApplicationResponse — date 는 KST 달력 날짜(YYYY-MM-DD), time 은 KST 벽시계(HH:mm) */
export type TrialApplication = {
  id: string;
  branchCode: string;
  branchName: string;
  /** 지점 전화번호 — 지점 정보에 칸이 아직 없어 늘 null */
  branchPhone: string | null;
  /** 학습 언어 마스터데이터 code */
  languageCode: string;
  /** 언어 이름 (서버가 마스터데이터에서 붙여요 — 화면은 이걸 그대로 보여 줘요) */
  languageLabel: string;
  date: string;
  time: string;
  realName: string;
  phone: string;
  note: string | null;
  createdAt: string;
};

let mockRows: TrialApplication[] = [];
let mockSeq = 0;

/** 가짜 서버: 체험 신청 한 건을 쌓아요 (맨 앞 = 최근 신청) — 앱 안 신청 · 가입 단계 체험이 같이 써요 */
export function mockAddTrialApplication(row: Omit<TrialApplication, 'id' | 'createdAt' | 'branchPhone'>): TrialApplication {
  const saved: TrialApplication = { ...row, id: `mock-trial-${++mockSeq}`, branchPhone: null, createdAt: new Date().toISOString() };
  mockRows = [saved, ...mockRows];
  return { ...saved };
}

/** POST /trial-applications 본문 — 가입 단계 체험 블록과 같은 칸. reasons 는 '배우고 싶은 이유' code */
export type TrialApplicationBody = {
  branchCode: string;
  realName: string;
  phone: string;
  languageCode: string;
  date: string;
  time: string;
  reasons: string[];
  note: string | null;
};

/** 스토리 · 테스트용: 가짜 목록을 통째로 바꿔요 */
export function setMockTrialApplications(rows: TrialApplication[]) {
  mockRows = [...rows];
}

/** 가짜 서버의 내 상담 신청 (가짜 요약 api/branch-summary 가 읽어요) */
export const getMockTrialApplications = (): TrialApplication[] => mockRows.map((r) => ({ ...r }));

/**
 * POST /trial-applications — 앱 안 체험 신청. 가짜 서버는 화면이 아는 지점 · 언어 이름을 받아 그대로 남겨요 (진짜 서버는 스스로 붙여요).
 * 실패: 지난 날짜 · 번호 형식 400, 운영 중 아닌 지점 · 꺼진 언어 404, 가입을 안 마쳤으면 409.
 */
export function createTrialApplication(body: TrialApplicationBody, names: { branchName: string; languageLabel: string }): Promise<TrialApplication> {
  if (apiConfig.useMock)
    return mock('createTrialApplication', () =>
      mockAddTrialApplication({
        branchCode: body.branchCode,
        branchName: names.branchName,
        languageCode: body.languageCode,
        languageLabel: names.languageLabel,
        date: body.date,
        time: body.time,
        realName: body.realName,
        phone: body.phone,
        note: body.note,
      }),
    );
  return http.post('/trial-applications', body);
}

/** GET /trial-applications */
export function fetchMyTrialApplications({ signal }: Opts = {}): Promise<TrialApplication[]> {
  if (apiConfig.useMock) return mock('trialApplications', () => [...mockRows]);
  return http.get('/trial-applications', { signal });
}
