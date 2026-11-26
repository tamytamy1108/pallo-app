import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { trialApplicationsQuery } from '@/api/queries';
import { setMockTrialApplications, type TrialApplication } from '@/api/trial-applications';
import ConsultationsScreen from '@/app/(app)/me/consultations';

import { LOADING_FOREVER } from '../../_support/api';
import { fresh } from '../../my/_state';

const KEY = trialApplicationsQuery().queryKey;

/** 오늘에서 n일 뒤 'YYYY-MM-DD' (스토리를 언제 열어도 다가오는 · 지난 칸이 그대로 보이게) */
const inDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const row = (over: Partial<TrialApplication>): TrialApplication => ({
  id: 't1',
  branchCode: 'HANAM',
  branchName: '하남점',
  branchPhone: null,
  languageCode: 'en',
  languageLabel: '영어',
  date: inDays(2),
  time: '19:00',
  realName: '김서현',
  phone: '010-1234-5678',
  note: null,
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  ...over,
});

const SAMPLE: TrialApplication[] = [
  row({ id: 't3', branchName: '강남점', branchCode: 'GANGNAM', languageCode: 'ja', languageLabel: '일본어', date: inDays(0), time: '23:30', note: '저녁에만 통화돼요' }),
  row({ id: 't2', date: inDays(5), time: '11:00' }),
  row({ id: 't1', branchName: '홍대점', branchCode: 'HONGDAE', date: inDays(-12), time: '14:00', createdAt: new Date(Date.now() - 20 * 86400000).toISOString() }),
];

const withRows = (rows: TrialApplication[]): Pick<Story, 'parameters' | 'beforeEach'> => ({
  parameters: { queries: [[KEY, rows]] },
  beforeEach: fresh({}, () => {
    setMockTrialApplications(rows);
    return () => setMockTrialApplications([]);
  }),
});

/**
 * 상담 신청 내역 (/me/consultations) — 마이 > 상담 신청 내역. 다가오는 상담(가까운 순 · 오늘/내일/D-n) · 지난 신청(최근 순, 흐리게).
 * 줄을 누르면 신청 내용 시트. 데이터는 GET /trial-applications (지금은 가짜 서버) — 다가오는/지난 구분은 기기 시각 기준.
 */
const meta = {
  title: 'Pages/Me/Consultations',
  component: ConsultationsScreen,
  parameters: { route: { pathname: '/me/consultations' } },
} satisfies Meta<typeof ConsultationsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { ...withRows(SAMPLE) };
/** 지난 신청만 — '다가오는 상담' 칸이 없다 */
export const OnlyPast: Story = { ...withRows([SAMPLE[2]]) };
export const Empty: Story = { ...withRows([]) };
/** 긴 지점 이름 · 긴 전달 사항 — 시트를 연 채로 */
export const LongCopy: Story = {
  ...withRows([
    row({
      branchName: '경기 남양주 다산신도시 현대프리미어캠퍼스점',
      note: '퇴근이 늦어서 평일엔 저녁 8시 이후에만 통화가 돼요. 주말은 오전이 편해요. 영어 회화는 처음이라 기초부터 하고 싶어요.',
    }),
  ]),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: /상담 신청 내용/ }));
  },
};
/** 지점 전화번호가 생기면 — 시트 아래 [지점에 전화하기] */
export const WithBranchPhone: Story = {
  ...withRows([row({ branchPhone: '031-123-4567' })]),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: /상담 신청 내용/ }));
  },
};
export const Loading: Story = { beforeEach: fresh(), parameters: { api: { delayMs: LOADING_FOREVER } } };
export const Error: Story = { beforeEach: fresh(), parameters: { api: { fail: ['trialApplications'] } } };
