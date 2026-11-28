/**
 * 꾸미기 카탈로그 동기화 — GET /asset-catalog 을 받아 state/av-catalog 에 넣어요(아이템 · 배경 · 배경 효과).
 * 로그인 · 가입을 마친 뒤 루트 레이아웃(AvatarCatalogSync)이 한 번 부르고, 꾸미기 화면이 열릴 때 오래됐으면 다시 받아요.
 * 가짜 서버는 꾸미기 목록을 안 보내서 앱 번들을 그대로 써요.
 */
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { applyAvatarCatalog } from '@/state/av-catalog';

import { assetCatalogQuery } from './queries';

export function useSyncAvatarCatalog() {
  const { data } = useQuery(assetCatalogQuery());
  useEffect(() => {
    if (data) applyAvatarCatalog(data);
  }, [data]);
}

/** 루트 레이아웃에 두는 빈 칸 — 화면 없이 카탈로그만 맞춰요 */
export function AvatarCatalogSync() {
  useSyncAvatarCatalog();
  return null;
}
