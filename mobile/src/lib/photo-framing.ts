/*
 * 올린 사진을 어떻게 맞췄는지 (사진 맞추기 틀 PhotoFrame · 보여 주기 FramedImage).
 * 사진 기준 값이라 틀 크기 · 비율이 달라도(미리 보기 ↔ 피드 · 전체 화면) 같은 곳이 가운데 와요.
 *   aspect: 사진 원본 가로 / 세로 · scale: 틀을 꽉 채운 크기의 몇 배(1 ~ 4) · x, y: 틀 가운데에 오는 사진 위 자리(0 ~ 1)
 * 업로드는 아직 기기 안 주소 그대로라, 잘라 내지 않고 이 값을 사진 옆에 같이 들고 다녀요.
 */
export type PhotoFraming = { aspect: number; scale: number; x: number; y: number };

export const MAX_PHOTO_ZOOM = 4;

/** 처음 모양: 틀을 꽉 채우고(cover) 가운데 */
export const plainFraming = (width?: number, height?: number): PhotoFraming => ({ aspect: width && height ? width / height : 1, scale: 1, x: 0.5, y: 0.5 });

/** 처음 모양 그대로인지 (그냥 cover 로 그려도 같아요) */
export const isPlainFraming = (f?: PhotoFraming) => !f || (f.scale <= 1.001 && Math.abs(f.x - 0.5) < 0.001 && Math.abs(f.y - 0.5) < 0.001);

/*
 * 게시물 사진 틀 비율 (가로 / 세로) — 인스타그램처럼 가로는 늘 칸 폭 그대로, 세로만 사진 따라 달라져요.
 * 가로로 긴 사진은 1.91:1 까지, 세로로 긴 사진은 3:4 까지 (2025년부터 인스타그램 앱 기준 · 예전 4:5) — 그 밖은 이 틀 안으로 잘라 보여요(맞추기로 고른 곳).
 * 여러 장이면 첫 장 비율 하나로 모든 장을 같은 틀에 담아요. 게시물에는 이 값이 ratio 로 남아요.
 */
export const POST_RATIO_MIN = 3 / 4;
export const POST_RATIO_MAX = 1.91;

/** 사진 비율 → 게시물 틀 비율 (한계 안으로). 값이 없거나 이상하면 1:1 */
export const clampPostRatio = (aspect?: number | null) => (aspect && Number.isFinite(aspect) && aspect > 0 ? Math.min(POST_RATIO_MAX, Math.max(POST_RATIO_MIN, aspect)) : 1);
