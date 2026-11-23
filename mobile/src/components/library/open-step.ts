/**
 * 단계 · 장면 열기 (주소 규칙 한 곳에).
 * Lv.1 · 2 → /lesson/[단계]?lv=&unit= (레슨 A) · Lv.3 · 4 → /lesson34/[단계]?lv=&unit= (레슨 B) · 상황 장면 → /scene/[장면 id] (상황 담당)
 */
import { router, type Href } from 'expo-router';

import { clearPos, stepKey } from '@/state/progress';

export function openStep(lv: number, unit: number, step: string, mode: 'start' | 'resume' | 'restart' = 'start') {
  if (mode === 'restart') clearPos(stepKey(lv, unit, step));
  const base = lv >= 3 ? '/lesson34' : '/lesson';
  // 팝업에서 이미 이어서 / 처음부터를 골랐으면 레슨이 다시 묻지 않게 넘겨요
  const resume = mode === 'start' ? '' : `&resume=${mode}`;
  router.push(`${base}/${step}?lv=${lv}&unit=${unit}${resume}` as Href);
}

export const openScene = (id: string) => router.push(`/scene/${id}` as Href);
