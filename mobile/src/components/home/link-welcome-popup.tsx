import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { useBranchProgress } from '@/api/use-branch-progress';
import { ConfirmDialog } from '@/components/ui/dialog';
import { createStore } from '@/lib/store';
import { isMember } from '@/state/access';
import { useLinkEvents } from '@/state/link-events';
import { clearLinkWaited, markLinkWaited, useLinkWaited } from '@/state/link-waited';
import { useMe } from '@/state/me';

/*
 * 지점 연동이 승인된 뒤 처음 홈에 들어오면 뜨는 팝업 — '○○점 회원이 됐어요!' · [나의 팔로 꾸미러 가기](→ 마이) · [나중에].
 * 승인은 보통 앱이 꺼져 있을 때 와요(지점 매니저가 관리자 웹에서 처리). 그래서 '연동 대기를 본 적 있음'을 기기에 남겨 두고,
 * 다음에 /me 가 회원 등급을 주면 한 번 띄운 뒤 지워요. 처음부터 회원이던 사람에게는 안 떠요.
 * 앱을 켜 둔 채 승인되면(개발용 '지점 처리 흉내') 홈 카드가 풀리는 순간(link-unlock)이 끝난 뒤에 떠요.
 */

/** 홈에 들어오고 이만큼 뒤에 떠요 (화면이 올라오는 움직임이 끝난 뒤 · 반려 팝업과 같은 박자) */
const OPEN_DELAY_MS = 500;

// 떠 있는 동안: 시작 팝업(launch-popup)이 그 위에 겹쳐 뜨지 않게 기다려요
const openStore = createStore(false);
export const useWelcomePopupOpen = openStore.useStore;

const JUMP = require('@/assets/characters/c-purple-jump-3d.png');

export function LinkWelcomePopup() {
  const member = useMe(isMember);
  const branch = useMe((m) => m.branch);
  const { pending } = useBranchProgress();
  const waited = useLinkWaited();
  // 홈 카드가 풀리는 순간을 보는 중이면 그게 끝날 때까지 기다려요
  const moment = useLinkEvents((s) => s.homeMoment);
  const [ready, setReady] = useState(false);

  // 비회원인데 연동 대기가 보이면 기억해 둬요
  useEffect(() => {
    if (!member && pending) markLinkWaited();
  }, [member, pending]);

  const due = member && waited && !moment;
  useEffect(() => {
    if (!due || ready) return;
    const t = setTimeout(() => setReady(true), OPEN_DELAY_MS);
    return () => clearTimeout(t);
  }, [due, ready]);

  const open = due && ready;
  useEffect(() => {
    openStore.set(open);
    return () => openStore.set(false);
  }, [open]);

  const close = () => {
    clearLinkWaited();
    setReady(false);
  };

  return (
    <ConfirmDialog
      variant="card"
      open={open}
      image={JUMP}
      title={`${branch} 회원이 됐어요!`}
      message="이제 출석 · 스터디 · 라운지를 모두 쓸 수 있어요"
      confirmLabel="나의 팔로 꾸미러 가기"
      cancelLabel="나중에"
      onConfirm={() => {
        close();
        router.navigate('/my');
      }}
      onCancel={close}
    />
  );
}
