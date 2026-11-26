import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useEffect } from 'react';

import { PushBannerHost, showPushBanner, type PushBannerMsg } from '@/components/ui/push-banner';

import { behindSheet } from './_overlay';

/**
 * 푸시 배너 — 앱을 보고 있을 때 온 푸시가 위에서 내려와요 (앱 아이콘 · PALLO · 지금 · 제목 · 한 줄).
 * 8초 뒤 저절로 올라가요(누르거나 위로 밀어도 닫힘). 다시 보려면 스토리를 다시 열어요.
 * 지점 연동 결과 문구는 Home/LinkPush.
 */
function ShowBanner(msg: PushBannerMsg) {
  useEffect(() => {
    showPushBanner(msg);
  }, [msg]);
  return <PushBannerHost />;
}

const meta = {
  title: 'UI/PushBanner',
  component: ShowBanner,
  args: { title: '오늘 20:00 수업이 곧 시작해요', body: '강남점 · 테이블 3 — 늦지 않게 와 주세요', href: '/' },
  decorators: [behindSheet],
} satisfies Meta<typeof ShowBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleAndBody: Story = {};
/** 한 줄 없이 제목만 */
export const TitleOnly: Story = { args: { title: '새 공지가 올라왔어요', body: undefined } };
/** 갈 화면이 없는 푸시 — 누르면 닫히기만 */
export const NoLink: Story = { args: { href: undefined } };
/** 긴 제목 · 한 줄 (두 줄에서 잘려요) */
export const LongText: Story = {
  args: {
    title: '경기광주오포신현역사거리점에서 다음 주 수업 시간 변경 안내를 보냈어요',
    body: '목요일 20:00 수업이 19:30 으로 30분 앞당겨져요. 바뀐 시간이 어려우면 지점에 미리 알려 주세요. 대타 신청도 할 수 있어요',
  },
};
