/**
 * 내 캐릭터 동기화 — GET /me/avatar 를 받아 state/avatar 에 넣어요(저장한 모습 · 가진 것).
 * 로그인 · 가입을 마친 뒤 루트 레이아웃(MyAvatarSync)이 부르고, 앱으로 돌아올 때 다시 받아요.
 * 홈 맵 · 마이 · 프로필 · 꾸미기는 state/avatar 를 그대로 읽어요. 저장(PUT)한 응답도 같은 곳에 넣어요(api/avatar.ts).
 */
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { applyServer } from './avatar';
import { myAvatarQuery } from './queries';

export function useSyncMyAvatar() {
  const { data } = useQuery(myAvatarQuery());
  useEffect(() => {
    if (data) applyServer(data);
  }, [data]);
}

/** 루트 레이아웃에 두는 빈 칸 — 화면 없이 내 캐릭터만 맞춰요 */
export function MyAvatarSync() {
  useSyncMyAvatar();
  return null;
}
