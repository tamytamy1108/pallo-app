import { type Href, router } from 'expo-router';

/** 다른 담당 화면(번개 · 챌린지 · 이벤트)은 만들어지는 중일 수 있어서 글자 주소로 넘겨요 */
export const go = (path: string) => router.push(path as Href);
