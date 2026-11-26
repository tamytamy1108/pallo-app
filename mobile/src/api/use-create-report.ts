/**
 * 신고하기 (POST /reports). 다시 받을 목록은 없어요 — 내 신고 내역은 아직 기기에만 남겨요 (report-sheet 의 useMyReports).
 */
import { useMutation } from '@tanstack/react-query';

import { createReport } from './reports';

export function useCreateReport() {
  return useMutation({ mutationFn: createReport });
}
