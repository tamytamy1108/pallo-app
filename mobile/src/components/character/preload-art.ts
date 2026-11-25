/**
 * 캐릭터 그림 미리 읽기 — 캐릭터 한 명은 PNG 여러 장(몸 · 눈 · 옷 · 모자 · 헤어 …)을 겹쳐 그려요.
 * 처음 보일 때 장마다 따로 읽으면 눈 → 몸 → 팔 → 아이템 순으로 조각조각 늦게 떠서(프로필 · 꾸미기 랜덤),
 * 앱을 켤 때 한 번 읽어 메모리에 올려 둬요 (avatar.tsx 의 그림은 모두 cachePolicy 'memory-disk' 라 바로 꺼내 써요).
 * 1) 내 캐릭터 그림 → 스플래시 동안 (preloadMyAvatar: 다 읽거나 시간이 다 되면 끝나요)
 * 2) 나머지 아이템 · 몸 · 헤어 (다른 사람 프사 · 꾸미기 랜덤) → 바로 이어서
 * 3) 무대 배경 (크고 꾸미기 · 마이 카드에서만) → 마지막에
 */
import type { Avatar } from '@/data/my';
import { prefetchImages } from '@/lib/prefetch-images';

import { AV_ART, AV_BG_ART, AV_BODY, AV_HAIR_FILL, AV_HAIR_FRONT, AV_TINT } from './av-assets';

/** 이 캐릭터를 그리는 데 쓰는 그림 (몸 · 입은 것 · 헤어 색칠 · 앞머리 · 배경) */
function avatarModules(a: Avatar): (number | undefined)[] {
  const body = a.color[0] === '#' ? Object.values(AV_TINT) : [AV_BODY[a.color] ?? AV_BODY.yellow];
  const worn = Object.values(a.eq).filter((x): x is string => !!x);
  const hair = worn.flatMap((id) => [AV_HAIR_FILL[id], AV_HAIR_FRONT[id]?.base, AV_HAIR_FRONT[id]?.fill]);
  const bg = a.bg[0] === '#' ? undefined : AV_BG_ART[a.bg];
  return [...body, ...worn.map((id) => AV_ART[id]), ...hair, bg];
}

/** 내 캐릭터 그림(+ also: 첫 화면에 바로 보여야 하는 다른 그림)을 읽어요. ms 안에 안 끝나도 기다리지 않아요 (스플래시를 오래 잡지 않게) */
export function preloadMyAvatar(a: Avatar, ms = 1500, also: number[] = []): Promise<void> {
  const done = prefetchImages([...avatarModules(a), ...also]).then(() => undefined);
  return Promise.race([done, new Promise<void>((r) => setTimeout(r, ms))]);
}

let started = false;
/** 나머지 캐릭터 그림을 뒤에서 읽어요 (한 번만) */
export function preloadAllAvatarArt() {
  if (started) return;
  started = true;
  const parts = [
    ...Object.values(AV_BODY),
    ...Object.values(AV_TINT),
    ...Object.values(AV_HAIR_FILL),
    ...Object.values(AV_HAIR_FRONT).flatMap((p) => [p.base, p.fill]),
    ...Object.values(AV_ART),
  ];
  void prefetchImages(parts).then(() => prefetchImages(Object.values(AV_BG_ART)));
}
