import { BadgeCelebrateHost } from '@/components/my/badge-celebrate';
import TabBar from '@/components/tab-bar';

/**
 * 아래 탭 5개. 로그인 · 가입을 마친 사람만 여기에 와요 — 판정과 화면 이동은 app/_layout.tsx (Stack.Protected) 가 해요.
 * 새 배지 축하 시트는 탭 화면 위에서만 떠요 (레슨 · 글쓰기 같은 겹친 화면 도중에는 끼어들지 않게).
 */
export default function TabsLayout() {
  return (
    <>
      <TabBar />
      <BadgeCelebrateHost />
    </>
  );
}
