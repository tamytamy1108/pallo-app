import type { ReactNode } from 'react';

import { TopBar } from '@/components/ui/top-bar';

/**
 * 마이에서 겹쳐 뜨는 화면의 위 줄 (프로토타입 mpTop · .lg-det.mp .dtop) — 공통 TopBar 에 맨 위 안전 영역만 더해요.
 */
export function PageTop({ title, right, onBack }: { title: string; right?: ReactNode; onBack?: () => void }) {
  return <TopBar title={title} right={right} onBack={onBack} fallback="/my" safeTop />;
}
