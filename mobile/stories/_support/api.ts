/** 가짜 API 를 끝없이 늦춰 '불러오는 중' 상태를 고정한다 — `parameters: { api: { delayMs: LOADING_FOREVER } }`. setTimeout 한도(2^31-1ms) 안. */
export const LOADING_FOREVER = 2_000_000_000;
