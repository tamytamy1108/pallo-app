import { speak, stopSpeaking } from './tts';

/**
 * 표현 카드의 듣기 버튼이 읽을 글 — 예문이 있으면 예문 전체, 없으면 표현만.
 * 같은 표현이면 어느 카드(라운지 추천 · 챌린지 탭 · 내 표현함)에서 눌러도 똑같이 읽어요.
 */
export const expressionSpeech = (x: { q?: string; hl?: string }) => (x.q || x.hl || '').trim();

/**
 * 영어 한 줄 읽기. 읽던 게 있으면 먼저 멈춰요 (멈추지 않으면 앞 문장 뒤에 줄을 서요).
 * iOS 는 멈추자마자 새로 읽으면 앞부분이 잘려 표현만 들릴 때가 있어요 — 멈춤 · 잠깐 쉬기는 lib/tts 가 해요 (읽는 중일 때만).
 * 둥근 따옴표(’)는 곧은 따옴표로 바꿔요 (기기마다 읽는 법이 달라서 · lib/tts).
 */
export function sayExpression(text: string, { language = 'en-US', rate = 0.95 }: { language?: string; rate?: number } = {}) {
  const t = text.trim();
  if (!t) {
    stopSpeaking();
    return;
  }
  speak(t, { language, rate });
}
