/**
 * 리스닝 룸 설정 (프로토타입 LRP) — 앱을 켜 둔 동안 다음에 열어도 그대로예요.
 * 실서비스는 30 `/me/settings` 의 listenPrefs 로 저장 (기기 간에 같이 쓸지는 백엔드와 정해요).
 */
import { createStore } from '@/lib/store';

export type ListenOrder = 'en-ko' | 'en' | 'ko-en';
export type ListenPrefs = { auto: boolean; order: ListenOrder; gap: 0 | 2 | 4; rep: 1 | 2 | 3; rate: number; blind: boolean; shuf: boolean };

export const LR_ORD: Record<ListenOrder, string> = { 'en-ko': '영어→뜻', en: '영어만', 'ko-en': '뜻→영어' };
export const LR_SPD: Record<string, string> = { '0.7': '천천히', '0.92': '보통', '1.15': '빠르게' };

export const listenPrefs = createStore<ListenPrefs>({ auto: true, order: 'en-ko', gap: 2, rep: 1, rate: 0.92, blind: false, shuf: false });
export const setListenPrefs = (patch: Partial<ListenPrefs>) => listenPrefs.set((s) => ({ ...s, ...patch }));

/** 칩을 누를 때마다 다음 값으로 (프로토타입 data-lrc) */
export const NEXT = {
  order: (o: ListenOrder): ListenOrder => ({ 'en-ko': 'en', en: 'ko-en', 'ko-en': 'en-ko' } as const)[o],
  gap: (g: 0 | 2 | 4): 0 | 2 | 4 => ({ 0: 2, 2: 4, 4: 0 } as const)[g],
  rep: (r: 1 | 2 | 3): 1 | 2 | 3 => ((r % 3) + 1) as 1 | 2 | 3,
  rate: (r: number) => (r === 0.92 ? 1.15 : r === 1.15 ? 0.7 : 0.92),
};
