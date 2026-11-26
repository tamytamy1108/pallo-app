import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { QrScanner } from '@/components/home/qr-scanner';

import { behindSheet } from './_home';

/**
 * QR 출석 스캐너 — 웹(이 카탈로그)은 카메라 없이 흐린 바탕으로 그리고, 1.8초 뒤 'QR 인식 완료!' → 0.8초 뒤 onScanned 를 부른다.
 * 폰 카메라 화면 · 카메라 권한 거부('카메라 권한이 필요해요' + [설정 열기])는 웹에선 볼 수 없다.
 */
const meta = {
  title: 'Home/QrScanner',
  component: QrScanner,
  args: { open: true, summaryText: '20:00 · 영어', onClose: fn(), onChange: fn(), onScanned: fn() },
  decorators: [behindSheet],
} satisfies Meta<typeof QrScanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 열림 — '입구의 PALLO QR을 비춰주세요' → 1.8초 뒤 인식 완료 */
export const Open: Story = {};
/** 다른 시간 · 언어 요약 */
export const OtherSlot: Story = { args: { summaryText: '18:00 · 스페인어' } };
