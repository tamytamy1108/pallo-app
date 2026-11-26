/**
 * 신고 API — 백엔드 `MobileReportController` (`/app/api/v2/reports`).
 * - GET  /reports/reasons   신고 사유 선택지 [{ code, label }] (본사가 app-hub '데이터 관리 › 신고 사유' 에서 고쳐요)
 * - POST /reports           신고하기 { reasonCode, targetKind, targetId?, targetName, targetUserCode?, detail? } → 201 + 접수된 신고.
 *                           고를 수 없는 사유 · 나 자신 신고면 400, 없는 사용자 코드면 404
 * 확인은 본사가 app-hub '신고 접수 관리' 에서 해요.
 * 가짜 서버는 이 파일의 MOCK_REPORT_REASONS 를 읽어요 (서버 기본값과 같은 다섯 개).
 */
import { http } from './client';
import { apiConfig } from './config';
import { ApiError } from './errors';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

/** 백엔드 MobileReportReasonResponse */
export type ReportReason = { code: string; label: string };

/** 백엔드 ReportTargetKind — 앱 신고 시트의 target.kind 를 대문자로 */
export type ReportTargetKind = 'POST' | 'COMMENT' | 'STORY' | 'MEMBER' | 'MEET' | 'CLUB' | 'CHALLENGE' | 'EVENT';

export type ReportCreate = {
  reasonCode: string;
  targetKind: ReportTargetKind;
  /** 신고한 글 · 댓글 · 스토리 id (사람 신고면 없어도 돼요) */
  targetId?: string | null;
  /** 앱에 보이던 대상 이름 */
  targetName: string;
  /** 대상 사용자 코드를 알면 (라운지 피드는 아직 목업이라 모름) */
  targetUserCode?: string | null;
  detail?: string | null;
};

/** 백엔드 MobileReportResponse */
export type Report = {
  id: string;
  reasonCode: string;
  reasonLabel: string;
  targetKind: ReportTargetKind;
  targetId: string | null;
  targetName: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
};

/* ───────── 가짜 서버 ───────── */

export const MOCK_REPORT_REASONS: ReportReason[] = [
  { code: 'SPAM', label: '스팸 · 광고' },
  { code: 'ABUSE', label: '불쾌하거나 무례한 말' },
  { code: 'PRIVACY', label: '개인정보 노출' },
  { code: 'MEETUP_TROUBLE', label: '모임에서 불편한 일이 있었어요' },
  { code: 'ETC', label: '기타' },
];

let mockSeq = 0;

/* ───────── API ───────── */

/** GET /reports/reasons */
export function fetchReportReasons({ signal }: Opts = {}): Promise<ReportReason[]> {
  if (apiConfig.useMock) return mock('reportReasons', () => MOCK_REPORT_REASONS.map((r) => ({ ...r })));
  return http.get('/reports/reasons', { signal });
}

/** POST /reports */
export function createReport(body: ReportCreate): Promise<Report> {
  if (apiConfig.useMock)
    return mock('createReport', () => {
      const reason = MOCK_REPORT_REASONS.find((r) => r.code === body.reasonCode);
      if (!reason) throw new ApiError({ kind: 'client', status: 400, code: 'invalid_request', message: '고를 수 없는 신고 사유예요' });
      return {
        id: `mock-report-${++mockSeq}`,
        reasonCode: reason.code,
        reasonLabel: reason.label,
        targetKind: body.targetKind,
        targetId: body.targetId ?? null,
        targetName: body.targetName,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
    });
  return http.post('/reports', body);
}
