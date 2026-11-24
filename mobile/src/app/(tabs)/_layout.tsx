import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { getTokens } from '@/api/token';
import TabBar from '@/components/tab-bar';
import { getOnboarding } from '@/state/onboarding';

/** 웹 미리보기: 주소 뒤에 개발용 값(?link= · ?plan= 등)을 붙였으면 바로 그 화면을 봐요 */
const hasDevParams = () => Platform.OS === 'web' && typeof window !== 'undefined' && window.location.search.length > 1;

export default function TabsLayout() {
  // 앱을 처음 받아 열면(로그인 토큰 없음 · 가입 안 끝냄) 첫 화면(YOUR FIRST STAGE)부터.
  // 웹 미리보기는 새로고침하면 토큰이 사라져서, 주소만 열면 늘 '처음 받은 앱'처럼 첫 화면부터 시작해요.
  // 확인하는 동안은 홈을 그리지 않아요 (홈이 잠깐 보였다 첫 화면으로 넘어가지 않게)
  const [checked, setChecked] = useState(() => hasDevParams() || getOnboarding().done);
  useEffect(() => {
    if (checked) return;
    getTokens().then((t) => {
      if (!t && !getOnboarding().done) router.replace('/welcome');
      else setChecked(true);
    });
  }, [checked]);
  return checked ? <TabBar /> : null;
}
