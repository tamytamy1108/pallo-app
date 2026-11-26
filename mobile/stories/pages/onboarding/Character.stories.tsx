import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import { assetCatalogQuery } from '@/api/queries';
import CharacterScreen from '@/app/(onboarding)/onboarding/character';

import { LOADING_FOREVER } from '../../_support/api';
import { withOnboarding } from '../../onboarding/_onb';

/** 가입 2단계 · 캐릭터 몸 색 (/onboarding/character) — 무대 카드에서 에셋 카탈로그(GET /asset-catalog · 가짜 서버 7가지) 중 하나를 골라 봐요 */
const meta = {
  title: 'Pages/Onboarding/Character',
  component: CharacterScreen,
  parameters: { route: { pathname: '/onboarding/character' } },
  beforeEach: withOnboarding({ nickname: '서현' }),
} satisfies Meta<typeof CharacterScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본 — 보라 속눈썹 */
export const Default: Story = {};
export const Yellow: Story = { beforeEach: withOnboarding({ nickname: '서현', palloloCode: 'yellow' }) };
export const Purple: Story = { beforeEach: withOnboarding({ nickname: '서현', palloloCode: 'purple' }) };
export const Pink: Story = { beforeEach: withOnboarding({ nickname: '서현', palloloCode: 'pink' }) };
export const Sky: Story = { beforeEach: withOnboarding({ nickname: '서현', palloloCode: 'sky' }) };
export const Green: Story = { beforeEach: withOnboarding({ nickname: '서현', palloloCode: 'green' }) };
export const Coral: Story = { beforeEach: withOnboarding({ nickname: '서현', palloloCode: 'coral' }) };
/** 긴 닉네임 — 제목 · 무대 두 줄 */
export const LongNickname: Story = { beforeEach: withOnboarding({ nickname: '가나다라마바사아자차' }) };
/** 앱 구경 길로 돌아왔을 때 — 2/5 */
export const AppPath: Story = { beforeEach: withOnboarding({ nickname: '서현', path: 'app' }) };
/** 다른 색을 누름 — 링 · 팔로로가 통 뛰어요 */
export const PickCoral: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('radio', { name: '코랄 팔로로' }));
  },
};
/** 앱에 그림이 없는 새 팔로로 — 서버 그림 주소로 그려요 (가짜 그림 주소라 칸은 비어 보여요) */
export const ServerOnlyPallolo: Story = {
  parameters: {
    queries: [
      [
        assetCatalogQuery().queryKey,
        {
          formatVersion: 1,
          canvas: { width: 680, height: 580 },
          bodyBox: { x: 35, y: 214, width: 520, height: 332 },
          pallolos: [
            { code: 'purple-lash', name: '보라 속눈썹', tint: '#A88BEA', isDefault: true, version: 1, imageUrl: '' },
            { code: 'mint', name: '민트', tint: '#7FD8C6', isDefault: false, version: 1, imageUrl: 'https://example.invalid/mint.png' },
          ],
        },
      ],
    ],
  },
};
export const Loading: Story = { parameters: { api: { delayMs: LOADING_FOREVER } } };
export const Error: Story = { parameters: { api: { fail: ['assetCatalog'] } } };
