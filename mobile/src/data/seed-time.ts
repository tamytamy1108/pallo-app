/**
 * 라운지 '새 글' 배지의 예시 기준 시각.
 * 앱을 처음 열면 탭마다 '마지막으로 본 때'가 SEED_SEEN_AT 이라고 쳐요 → 예시 글은 다 본 것,
 * `at: SEED_NEW_AT` 을 단 예시 몇 개만 새 글로 보여요 (배지 · '새 글 N개' 버튼을 바로 볼 수 있게).
 * 탭을 한 번 열면 그 탭은 지금 시각으로 바뀌어서 예시 새 글도 본 것이 돼요.
 */
export const SEED_SEEN_AT = Date.UTC(2026, 10, 1);
export const SEED_NEW_AT = SEED_SEEN_AT + 60_000;
