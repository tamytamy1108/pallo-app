/**
 * 카카오 로그인 훅 — 화면은 `start()` 만 불러요. 폰은 카카오 SDK, 웹 미리보기는 카카오 웹 로그인(콜백 화면에서 마무리).
 * 로그인되면 토큰이 저장되고, 이동은 로그인 상태(api/session.tsx)가 해요. 실패하면 토스트, 사용자가 닫으면 조용히.
 */
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { showToast } from '@/components/ui/toast';

import { loginWithKakaoCode, referralFromState } from './auth';
import { apiErrorMessage } from './errors';
import { startKakaoLogin } from './kakao-login';

export function useKakaoLogin() {
  const m = useMutation({
    mutationFn: () => startKakaoLogin(),
    onError: (e) => showToast(apiErrorMessage(e)),
  });
  // 웹은 카카오 페이지로 넘어가는 동안에도 '들어가는 중' 으로 둬요
  return { start: () => m.mutate(), isPending: m.isPending || m.data === 'redirected' };
}

/** 카카오 웹 로그인 콜백에서 돌아온 값 — 실패 문구 (null 이면 처리 중 · 성공하면 로그인 상태가 화면을 바꿔요) */
export function useKakaoCallback(): { error: string | null } {
  const { code, state, error: kakaoError, error_description: kakaoErrorText } = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  }>();
  const [serverError, setServerError] = useState<string | null>(null);
  const sent = useRef(false);
  // 카카오가 오류로 돌려보냈거나 코드가 없으면 서버에 보낼 것도 없어요
  const paramError = kakaoError
    ? kakaoError === 'access_denied'
      ? '카카오 로그인을 취소했어요.'
      : kakaoErrorText || '카카오 로그인에 실패했어요.'
    : !code
      ? '카카오에서 인증 코드를 받지 못했어요.'
      : null;

  useEffect(() => {
    if (paramError || !code || sent.current) return; // 인가 코드는 한 번만 쓸 수 있어요 (두 번 보내면 두 번째는 실패)
    sent.current = true;
    loginWithKakaoCode(code, referralFromState(state)).catch((e: unknown) => setServerError(apiErrorMessage(e)));
  }, [paramError, code, state]);

  return { error: paramError ?? serverError };
}
