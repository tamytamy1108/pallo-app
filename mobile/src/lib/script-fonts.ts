import { Font } from '@/constants/fonts';

/*
 * 글자 종류별 글꼴 (홈 인사말 닉네임과 같은 규칙).
 * 영문 · 숫자는 그 자리 글꼴 그대로, 한글은 Black Han Sans, 일본어 · 중국어(가나 · 한자)는 Dela Gothic One.
 */
export const HANGUL = /[ㄱ-ㆎ가-힣]/;
export const JAPANESE = /[぀-ヿ㐀-鿿ｦ-ﾟ]/;
/** 한글 덩어리 · 일본어 · 중국어 덩어리로 나눠요 (split 하면 나머지는 영문 · 숫자 덩어리) */
export const SCRIPT_RUNS = /([ㄱ-ㆎ가-힣]+|[぀-ヿ㐀-鿿ｦ-ﾟ]+)/;

/** 한 덩어리의 글꼴: 한글 · 일본어 · 중국어면 닉네임 글꼴, 아니면 latin */
export const runFont = (part: string, latin: string) => (HANGUL.test(part) ? Font.nameKo : JAPANESE.test(part) ? Font.nameJa : latin);

/** 글자 하나 폭 (글자 크기 1 기준 · 대략) — 한글 · 일본어 · 중국어는 거의 정사각형 */
export const glyphWidth = (ch: string, latin: number) => (HANGUL.test(ch) || JAPANESE.test(ch) ? 0.98 : latin);
