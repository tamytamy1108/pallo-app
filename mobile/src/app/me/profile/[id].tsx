import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

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

  const close = () => setOpen(false);
  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/my');
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }} />
      {!mine && <ProfileSheetHost name={name} open={open} onClose={close} onClosed={leave} onOpen={(n) => (n === getMe().name ? leave() : setName(n))} />}
    </View>
  );
}

/** 시트가 다 내려간 뒤에 화면을 닫아요 */
function ProfileSheetHost({ name, open, onClose, onClosed, onOpen }: { name: string; open: boolean; onClose: () => void; onClosed: () => void; onOpen: (n: string) => void }) {
  useEffect(() => {
    if (open) return;
    const t = setTimeout(onClosed, 460);
    return () => clearTimeout(t);
  }, [open, onClosed]);
  return <ProfileSheet key={name} name={name} open={open} onClose={onClose} onOpen={onOpen} />;
}
