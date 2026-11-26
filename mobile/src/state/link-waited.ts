/**
 * 지점 연동 대기를 거친 적 있는지 — 승인된 뒤 처음 홈에 오면 '회원이 됐어요' 팝업(components/home/link-welcome-popup)을 한 번 띄우는 표시.
 * 연동 요청을 보내거나 홈에서 연동 대기를 보면 켜고, 팝업을 닫으면 꺼요. 앱을 껐다 켜도 남아요.
 */
import { createStore } from '@/lib/store';

const store = createStore(false, { persist: { key: 'link-waited' } });

export const useLinkWaited = store.useStore;
export const markLinkWaited = () => store.set(true);
export const clearLinkWaited = () => store.set(false);
