/**
 * 지도 사진 — 3D 지도를 만드는 동안(폰에서 1~7초) 도는 표시 대신 바로 보여 줄 그림이에요.
 * 지도 칸은 어느 폰이든 340:430 이라 구도가 같아요. 3D 가 그려지면 사진은 서서히 사라지고, 3D 는 인트로 없이 같은 구도에서 시작해요.
 * 진도(지난 · 지금 섬 색) · 시계는 사진과 조금 다를 수 있어요 — 금방 3D 로 바뀌어요.
 *
 * ⚠ 3D 지도 모습 · 구도가 바뀌면 사진을 다시 찍어요:
 *   에뮬레이터(Android, 1080×2400)에서 지도를 열고 제자리에 선 뒤 GLView.takeSnapshotAsync(gl, { format: 'jpeg', compress: 0.82 })
 *   → assets/images/world/<지도 id>.jpg (975×1236). 이름표 · 캐릭터는 화면(RN)이 그려서 사진에 넣지 않아요.
 */
export type MapShot = number;

const SHOTS: Record<string, MapShot> = {
  study2: require('@/assets/images/world/study2.jpg'),
  travel: require('@/assets/images/world/travel.jpg'),
  biz: require('@/assets/images/world/biz.jpg'),
  cafe: require('@/assets/images/world/cafe.jpg'),
  campus: require('@/assets/images/world/campus.jpg'),
};

/** 지도 사진 (없는 지도면 null → 도는 표시) */
export const mapShot = (id: string): MapShot | null => SHOTS[id] ?? null;
