import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Desc, DSec, InfoRow, InfoRows, MainBtn, SaveBtn } from '@/components/meet/detail/detail-parts';
import { DetailFrame } from '@/components/meet/detail/detail-frame';
import { Bolt } from '@/components/meet/icons';
import { PText } from '@/components/ui/text';

import { PHOTO, PHOTO2 } from './_fixtures';

const BODY = (
  <>
    <InfoRows>
      <InfoRow first icon="cal" main="11월 28일 금 20:00" sub="D-3 남았어요" />
      <InfoRow icon="pin" main="영등포 근처 수제맥주집" />
    </InfoRows>
    <DSec>소개</DSec>
    <Desc text={'영등포 수제맥주집에서 만나요. 영어로 먼저 인사하고, 그다음은 편하게 이야기해요.\n\n'.repeat(6)} />
  </>
);

/**
 * 상세 화면 공통 틀 — 포스터(4:5, 2장 이상이면 넘어감) · 제목 · 본문 · 아래 고정 바(찜 + 주 버튼).
 * 동아리는 제목 아래 메타 · 탭 · 고정 바 위 한 줄이 더 붙는다.
 */
const meta = {
  title: 'Meet/DetailFrame',
  component: DetailFrame,
  args: {
    id: 'm1',
    title: '퇴근 후 영어 맥주 번개',
    heading: '퇴근 후 영어 맥주 번개',
    kicker: (
      <>
        <Bolt />
        <PText variant="label">번개 · 한 번 만나요</PText>
      </>
    ),
    children: BODY,
    cta: (
      <>
        <SaveBtn on={false} onPress={fn()} />
        <MainBtn label="참여하기 · 남은 자리 3" onPress={fn()} />
      </>
    ),
  },
} satisfies Meta<typeof DetailFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 예시 포스터 여러 장 (m1) */
export const Default: Story = {};
/** 포스터 한 장 (기본 NEW MEET) */
export const SinglePoster: Story = { args: { id: 'zz-one' } };
/** 올린 포스터 사진 2장 */
export const UploadedPosters: Story = { args: { id: 'u-photo', posters: [PHOTO, PHOTO2] } };
/** 동아리 — 메타 · 탭 · 고정 바 위 한 줄 */
export const ClubLayout: Story = {
  args: {
    id: 'cl1',
    club: true,
    title: '원서 북클럽',
    heading: '원서 북클럽',
    kicker: <PText variant="label">동아리 · 북클럽</PText>,
    sub: <PText variant="small">영등포 · 서울 · 멤버 7명 · 방금 대화</PText>,
    tabs: <PText variant="bodyStrong">홈 · 게시판 · 사진첩 · 채팅 (탭 자리)</PText>,
    tabKey: 'home',
    tabBody: BODY,
    ctaNote: <PText variant="small">최근 30일 동안 3명이 가입했어요</PText>,
    children: null,
  },
};
/** 아주 긴 제목 */
export const LongTitle: Story = { args: { title: '퇴근 후 영어로 수다 떨면서 수제맥주 마시고 보드게임까지 하는 아주 긴 번개', heading: '퇴근 후 영어로 수다 떨면서 수제맥주 마시고 보드게임까지 하는 아주 긴 번개' } };
