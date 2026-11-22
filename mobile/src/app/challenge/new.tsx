import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';

import { NewChallengeSheet } from '@/components/challenge/new-challenge';
import type { Challenge } from '@/data/challenge';

/**
 * 챌린지 열기 (`/challenge/new`, ?expr=<id,id> 이면 내 표현함에서 고른 표현을 골라 둔 채로).
 * 프로토타입처럼 앞 화면 위에 키 큰 시트로 떠요. 닫으면 앞 화면으로, 같은 표현 챌린지로 가면 그 챌린지 창으로.
 */
export default function NewChallengeScreen() {
  const { expr } = useLocalSearchParams<{ expr?: string }>();
  const [open, setOpen] = useState(true);
  const next = useRef<Challenge | null>(null);
  const preset = String(expr ?? '')
    .split(',')
    .map((x) => decodeURIComponent(x.trim()))
    .filter(Boolean);
  const leave = () => {
    const p = next.current;
    if (p) router.replace({ pathname: '/challenge/[id]', params: { id: p.id, write: '1' } });
    else if (router.canGoBack()) router.back();
    else router.replace('/lounge');
  };
  return (
    <>
      <Stack.Screen options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }} />
      <NewChallengeSheet
        open={open}
        preset={preset}
        onClose={() => setOpen(false)}
        onClosed={leave}
        onGoChallenge={(p) => {
          next.current = p;
          setOpen(false);
        }}
      />
    </>
  );
}
