import { StyleSheet } from 'react-native';

/** 모든 달력의 '오늘' 표시 — 칸 색은 그대로 두고 숫자에 밑줄만 그어요. 고른 날(꽉 찬 보라)과 헷갈리지 않아요 */
export const todayMark = StyleSheet.create({
  cell: {},
  text: { textDecorationLine: 'underline', textDecorationStyle: 'solid' },
});

export const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
