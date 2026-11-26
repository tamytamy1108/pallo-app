import { StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';

/** 모든 달력의 '오늘' 표시 — 연보라 바탕 · 보라 테두리 · 보라 글자. 고른 날(꽉 찬 색)과 헷갈리지 않아요 */
export const todayMark = StyleSheet.create({
  cell: { backgroundColor: Colors.lavender, borderWidth: 2, borderColor: Colors.purple },
  text: { color: Colors.purple },
});

export const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
