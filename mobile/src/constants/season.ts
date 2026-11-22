/**
 * 홈 스터디 맵의 계절 (프로토타입 seasonOf 와 같아요).
 * 11월 22일 ~ 12월 31일은 크리스마스 맵이 기본이에요. 그 뒤 1 · 2월은 겨울.
 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'xmas';

export function seasonOf(d: Date = new Date()): Season {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (m === 12 || (m === 11 && day >= 22)) return 'xmas';
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

/** 크리스마스 맵 색 */
export const XMAS = {
  bg: '#1B4A3A',
  top: '#143A2F',
  mid: '#1D5440',
  bottom: '#236048',
  cream: '#FFF8E8',
  paper: '#FFFDF7',
  red: '#E5414B',
  green: '#3FA65A',
  gold: '#FFD23F',
};
