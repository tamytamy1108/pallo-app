import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { setMarketing, toggleLogin, updateSettings } from '@/components/account/store';
import SettingsScreen from '@/app/(app)/me/settings/index';
import { setSfxOn } from '@/lib/feedback';
import { setNoListen, setNoSpeak } from '@/state/learn-prefs';

import { fresh } from '../../../my/_state';

/**
 * 설정 (/me/settings) — 계정 · 알림 · 학습 · 공개 범위 · 이용권 · 도움 · 로그아웃/탈퇴. 켜고 끄기는 기기에 남는 설정 값.
 * ?section=noti 면 알림 칸까지 내려간다.
 */
const meta = {
  title: 'Pages/Me/Settings/Index',
  component: SettingsScreen,
  parameters: { route: { pathname: '/me/settings' } },
  beforeEach: fresh(),
} satisfies Meta<typeof SettingsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 값 */
export const Default: Story = {};
/** 알림 모두 끔 · 효과음 끔 · 랭킹 이름 숨김 */
export const AllOff: Story = {
  beforeEach: fresh({}, () => {
    updateSettings({ nSession: false, nSession1h: false, nMeet: false, nClubChat: false, nFriend: false, nCmt: false, nRank: false, rankName: false, showBr: false });
    setSfxOn(false);
  }),
};
/** 알림 모두 켬 · 광고 수신 동의(날짜) · 말하기 어려워요 · 소리 끄기 켬 */
export const AllOn: Story = {
  beforeEach: fresh({}, () => {
    updateSettings({ nSession: true, nSession1h: true, nMeet: true, nClubChat: true, nFriend: true, nCmt: true, nRank: true });
    setMarketing(true);
    setNoSpeak(true);
    setNoListen(true);
    setSfxOn(true);
    // 스토리가 끝나면 15분 타이머 값을 되돌린다
    return () => {
      setNoSpeak(false);
      setNoListen(false);
    };
  }),
};
/** 지점 두 곳 · 공개 범위 바꿈 · 하루 목표 · 다른 언어 · 애플 로그인 */
export const Customized: Story = {
  beforeEach: fresh({ name: '긴닉네임을쓰는멤버', level: 'Lv.3' }, () => {
    updateSettings({ branches: ['하남점', '잠실점'], profile: '같은 지점만', goal: 5, lang: '일본어', bio: '한 줄 소개' });
    toggleLogin('애플');
    toggleLogin('카카오');
  }),
};
/** 알림 칸으로 (?section=noti) */
export const SectionNoti: Story = { parameters: { route: { pathname: '/me/settings', params: { section: 'noti' } } } };
/** 로그아웃 확인 시트 */
export const LogoutSheet: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText('로그아웃'));
  },
};
/** 닉네임 · 한 줄 소개 시트 */
export const NickSheet: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText('닉네임 · 한 줄 소개'));
  },
};
/** 내 지점 시트 */
export const BranchSheet: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText('내 지점'));
  },
};
/** 앱 구독자 — 설정은 회원만이라 잠겨요 */
export const AppOnly: Story = { globals: { userKind: 'app' } };
