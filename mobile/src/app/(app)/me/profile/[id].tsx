import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { SCREEN } from '@/lib/transitions';
import { ProfileSheet } from '@/components/my/profile-sheet';
import { getMe } from '@/state/me';

/**
 * 멤버 프로필 (프로토타입 openProfile 시트). id = 멤버 이름 (예: /me/profile/Hyun · /me/profile/지우).
 * 뒤 화면이 보이게 투명하게 띄우고 그 위에 키 큰 시트를 올려요. 시트를 닫으면 이 화면도 닫혀요.
 * 내 이름이면 마이로 (프로토타입: 내 프로필 = 마이).
 */
export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState(() => decodeURIComponent(String(id ?? '')));
  const [open, setOpen] = useState(true);
  const mine = name === getMe().name;

  useEffect(() => {
    if (mine) router.replace('/my');
  }, [mine]);

  // 시트 안 모임 줄을 누르면: 시트를 닫고, 다 내려가면 이 화면 자리에 그 상세를 열어요 (뒤로 가면 원래 화면)
  const goTo = useRef<Href | null>(null);
  const close = () => setOpen(false);
  const go = (href: Href) => {
    goTo.current = href;
    setOpen(false);
  };
  const leave = () => {
    if (goTo.current) router.replace(goTo.current);
    else if (router.canGoBack()) router.back();
    else router.replace('/my');
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={SCREEN.overlay} />
      {!mine && <ProfileSheetHost name={name} open={open} onClose={close} onGo={go} onClosed={leave} onOpen={(n) => (n === getMe().name ? leave() : setName(n))} />}
    </View>
  );
}

/** 시트가 다 내려간 뒤에 화면을 닫아요 */
function ProfileSheetHost({ name, open, onClose, onGo, onClosed, onOpen }: { name: string; open: boolean; onClose: () => void; onGo: (href: Href) => void; onClosed: () => void; onOpen: (n: string) => void }) {
  useEffect(() => {
    if (open) return;
    const t = setTimeout(onClosed, 460);
    return () => clearTimeout(t);
  }, [open, onClosed]);
  return <ProfileSheet key={name} name={name} open={open} onClose={onClose} onGo={onGo} onOpen={onOpen} />;
}
