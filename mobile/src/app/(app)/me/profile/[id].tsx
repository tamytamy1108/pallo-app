import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { SCREEN } from '@/lib/transitions';
import { ProfileSheet } from '@/components/my/profile-sheet';
import { meQuery } from '@/api/queries';
import { queryClient } from '@/api/query-client';
import { getMe } from '@/state/me';

/**
 * 멤버 프로필 (프로토타입 openProfile 시트). id = 회원 code (가짜 서버 · 예시 화면은 멤버 이름 — api/member-profile.ts).
 * 뒤 화면이 보이게 투명하게 띄우고 그 위에 키 큰 시트를 올려요. 시트를 닫으면 이 화면도 닫혀요.
 * 내 code · 내 이름이면 마이로 (프로토타입: 내 프로필 = 마이).
 */
export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [target, setTarget] = useState(() => decodeURIComponent(String(id ?? '')));
  const [open, setOpen] = useState(true);
  const mine = isMine(target);

  useEffect(() => {
    if (mine) router.replace('/my');
  }, [mine]);

  // 시트 안 모임 줄을 누르면: 시트가 내려가길 기다리지 않고 이 화면 자리에 바로 그 상세를 열어요
  // (시트 두 장이 차례로 닫히고 뒤 화면이 비친 뒤 넘어가면 여러 화면을 거치는 것처럼 보여요). 뒤로 가면 원래 화면.
  const close = () => setOpen(false);
  // 시트를 바로 치우고(닫는 움직임 없이) 그 상세로 — 새 화면이 시트 위로 겹쳐 지나가지 않게
  const [gone, setGone] = useState(false);
  const go = (href: Href) => {
    setGone(true);
    router.replace(href);
  };
  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/my');
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={SCREEN.overlay} />
      {!mine && !gone && <ProfileSheetHost id={target} open={open} onClose={close} onGo={go} onClosed={leave} onOpen={(n) => (isMine(n) ? leave() : setTarget(n))} />}
    </View>
  );
}

/** 시트가 다 내려간 뒤에 화면을 닫아요 */
function ProfileSheetHost({ id, open, onClose, onGo, onClosed, onOpen }: { id: string; open: boolean; onClose: () => void; onGo: (href: Href) => void; onClosed: () => void; onOpen: (n: string) => void }) {
  useEffect(() => {
    if (open) return;
    const t = setTimeout(onClosed, 460);
    return () => clearTimeout(t);
  }, [open, onClosed]);
  return <ProfileSheet key={id} id={id} open={open} onClose={onClose} onGo={onGo} onOpen={onOpen} />;
}

/** 내 회원 code(GET /me) 이거나 내 이름(예시 화면) */
function isMine(id: string) {
  return id === getMe().name || id === queryClient.getQueryData(meQuery().queryKey)?.code;
}
