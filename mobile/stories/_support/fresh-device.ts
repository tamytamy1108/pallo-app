import { clearSavedData } from '@/lib/store';
import { updateMe } from '@/state/me';

import { personaOf, USER_KIND_PATCH } from '../../.storybook/user-kinds';

type Ctx = { globals: Record<string, unknown> };
type Cleanup = () => void;

/**
 * 기기에 남는 가게(진도 · 라이브러리 · 번개/이벤트 내 기록 등)를 모두 처음 값으로 돌린 뒤 setup 을 돌리는 beforeEach.
 * 처음 값으로 돌리면 나(state/me)도 돌아가서, 툴바 '회원 유형'을 다시 넣는다 — 앞 스토리에서 한 일이 남지 않게.
 * `beforeEach: freshDevice(() => { markDone(...) })`. setup 이 정리 함수를 돌려주면 스토리가 끝날 때 부른다.
 */
export const freshDevice =
  (setup?: () => void | Cleanup) =>
  ({ globals }: Ctx): void | Cleanup => {
    clearSavedData();
    updateMe(USER_KIND_PATCH[personaOf(globals)]);
    return setup?.();
  };
