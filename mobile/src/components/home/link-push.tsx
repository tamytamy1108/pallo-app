import type { Href } from 'expo-router';

import { showPushBanner } from '@/components/ui/push-banner';
import type { LinkResult } from '@/state/link-events';

const COPY: Record<LinkResult, { title: (b: string) => string; body: (note: string) => string; href: Href }> = {
  linked: { title: (b) => `${b} 연동이 끝났어요`, body: () => '이제 출석 · 내 팀 · 이용권을 쓸 수 있어요', href: '/my' },
  // 반려: 알림함 줄과 같은 말 · 사유를 그대로
  rejected: { title: (b) => `${b} 연동이 반려됐어요`, body: (note) => `사유: ${note}`, href: '/link-rejected' },
};

/**
 * 지점 연동 결과 푸시 배너 — 공통 푸시 배너(components/ui/push-banner)에 연동 결과 문구를 실어 띄워요.
 * 누르면 마이(연동됨) · 연동 안 됨 화면, 알림함의 같은 알림(notiId)도 읽음.
 */
export function showLinkPush(result: LinkResult, branch: string, notiId: string, note = '') {
  const copy = COPY[result];
  showPushBanner({ title: copy.title(branch), body: copy.body(note), href: copy.href, notiId, haptic: result === 'linked' ? 'success' : 'warning' });
}
