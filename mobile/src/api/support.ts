/**
 * 고객센터 API (api-inventory 93 · 94) — 백엔드 `MobileFaqController` · `MobileUserInquiryController` (`/app/api/v2`).
 * - GET  /faq            자주 묻는 질문 (노출 중인 분류 칩 + FAQ 전부) — 찾기 · 분류 거르기는 앱이 해요 (수십 건이라 한 번에)
 * - GET  /me/inquiries   내 1:1 문의 (최신 순)
 * - POST /me/inquiries   1:1 문의 보내기 { categoryCode | null(기타), content 5~2000자 } → 201 + 만든 문의. 고를 수 없는 분류면 400
 * 답변은 본사가 app-hub 'FAQ 관리 › 사용자 문의 확인' 에서 달아요.
 * 가짜 서버는 data/account 의 MOCK_FAQ · 이 파일의 mockInquiries 를 읽고 써요.
 */
import { MOCK_FAQ, MOCK_FAQ_CATEGORIES } from '@/data/account';

import { http } from './client';
import { apiConfig } from './config';
import { ApiError } from './errors';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

/** 백엔드 MobileFaqCategoryResponse — FAQ 분류 칩 · 1:1 문의 분류 선택지 */
export type FaqCategory = { code: string; label: string };

/** 백엔드 MobileFaqItemResponse. 칩이 숨겨진 분류의 FAQ 도 올 수 있어 라벨을 같이 받아요 */
export type FaqItem = { id: string; categoryCode: string; categoryLabel: string; question: string; answer: string };

/** 백엔드 MobileFaqResponse — 분류는 노출 순서, FAQ 는 분류 순서 → FAQ 순서 */
export type Faq = { categories: FaqCategory[]; items: FaqItem[] };

export type InquiryStatus = 'PENDING' | 'ANSWERED';

/** 백엔드 MobileUserInquiryResponse. 분류가 없으면(기타) categoryCode · categoryLabel 이 null, 답변 전이면 answer · answeredAt 이 null */
export type Inquiry = {
  id: string;
  categoryCode: string | null;
  categoryLabel: string | null;
  /** 서버가 내용 첫 줄(40자)로 만든 제목 */
  title: string;
  content: string;
  status: InquiryStatus;
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
};

export type InquiryCreate = { categoryCode: string | null; content: string };

/* ───────── 가짜 서버 ───────── */

const mockFaq = (): Faq => ({
  categories: MOCK_FAQ_CATEGORIES.map((c) => ({ ...c })),
  items: MOCK_FAQ.map(([label, question, answer], i) => {
    const c = MOCK_FAQ_CATEGORIES.find((x) => x.label === label) ?? MOCK_FAQ_CATEGORIES[0];
    return { id: `mock-faq-${i + 1}`, categoryCode: c.code, categoryLabel: c.label, question, answer };
  }),
});

const MOCK_INQUIRIES_DEFAULT: Inquiry[] = [
  {
    id: 'mock-inquiry-1',
    categoryCode: 'APP_ERROR',
    categoryLabel: '앱 오류',
    title: '출석체크 버튼이 안 눌려요',
    content: '출석체크 버튼이 안 눌려요',
    status: 'ANSWERED',
    answer: '불편을 드려 죄송해요. 앱을 최신 버전으로 업데이트하면 해결돼요.',
    createdAt: '2026-11-02T03:00:00Z',
    answeredAt: '2026-11-02T06:00:00Z',
  },
];

let mockInquiries: Inquiry[] = MOCK_INQUIRIES_DEFAULT.map((r) => ({ ...r }));
let mockSeq = 0;

/** 스토리 · 테스트용: 가짜 서버의 내 문의 목록을 통째로 바꿔요 (인자가 없으면 처음 상태로) */
export function setMockInquiries(rows: Inquiry[] = MOCK_INQUIRIES_DEFAULT) {
  mockInquiries = rows.map((r) => ({ ...r }));
}

/** 서버와 같은 규칙: 내용 첫 줄(빈 줄은 건너뜀)을 40자까지, 넘으면 '…' */
function titleOf(content: string) {
  const first = content.split('\n').map((l) => l.trim()).find(Boolean) ?? content;
  const chars = Array.from(first);
  return chars.length <= 40 ? first : `${chars.slice(0, 40).join('').trim()}…`;
}

const mockBadRequest = (message: string) => new ApiError({ kind: 'client', status: 400, code: 'invalid_request', message });

/* ───────── 화면이 같이 쓰는 계산 ───────── */

/** 분류 칩 '전체' 값 */
export const FAQ_ALL = 'ALL';

/** 분류(FAQ_ALL 이면 전부) · 찾는 말(질문 · 답에 들어 있으면)로 거른 FAQ */
export function filterFaqItems(items: FaqItem[], category: string, query: string): FaqItem[] {
  const q = query.trim();
  return items.filter((x) => (category === FAQ_ALL || x.categoryCode === category) && (!q || (x.question + x.answer).includes(q)));
}

/** 1:1 문의 분류 선택지: 서버 분류 + 맨 뒤 '기타'(code null) */
export const inquiryChoices = (categories: FaqCategory[]): { code: string | null; label: string }[] => [...categories, { code: null, label: '기타' }];

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = { PENDING: '답변 대기', ANSWERED: '답변 완료' };

/** 문의 날짜 '11.02' (한국 시각) */
export function inquiryDate(iso: string): string {
  const d = new Date(Date.parse(iso) + 9 * 60 * 60 * 1000);
  return `${d.getUTCMonth() + 1}.${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** 보낼 수 있는 내용인지 (서버와 같은 5~2000자) */
export const INQUIRY_MIN = 5;
export const INQUIRY_MAX = 2000;
export const inquiryContentOk = (text: string) => Array.from(text.trim()).length >= INQUIRY_MIN;

/* ───────── API ───────── */

/** 93 GET /faq */
export function fetchFaq({ signal }: Opts = {}): Promise<Faq> {
  if (apiConfig.useMock) return mock('faq', mockFaq);
  return http.get('/faq', { signal });
}

/** 94 GET /me/inquiries — 내 문의 (최신 순) */
export function fetchMyInquiries({ signal }: Opts = {}): Promise<Inquiry[]> {
  if (apiConfig.useMock) return mock('inquiries', () => mockInquiries.map((r) => ({ ...r })));
  return http.get('/me/inquiries', { signal });
}

/** 94 POST /me/inquiries — 문의 보내기 */
export function createInquiry(body: InquiryCreate): Promise<Inquiry> {
  if (apiConfig.useMock)
    return mock('createInquiry', () => {
      const content = body.content.trim();
      if (!inquiryContentOk(content)) throw mockBadRequest('내용은 5~2000자로 적어 주세요.');
      const c = body.categoryCode ? MOCK_FAQ_CATEGORIES.find((x) => x.code === body.categoryCode) : null;
      if (body.categoryCode && !c) throw mockBadRequest('고를 수 없는 문의 분류예요');
      const row: Inquiry = {
        id: `mock-inquiry-new-${++mockSeq}`,
        categoryCode: c?.code ?? null,
        categoryLabel: c?.label ?? null,
        title: titleOf(content),
        content,
        status: 'PENDING',
        answer: null,
        createdAt: new Date().toISOString(),
        answeredAt: null,
      };
      mockInquiries = [row, ...mockInquiries];
      return { ...row };
    });
  return http.post('/me/inquiries', body);
}
