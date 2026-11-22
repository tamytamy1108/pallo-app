import { router, Stack } from 'expo-router';
import { useState } from 'react';

/*
 * 주소가 있는 시트 화면 (/compose · /story/new · /trip/[id]).
 * 프로토타입에선 라운지 위에 뜨는 시트라서, 뒤 화면이 비쳐 보이는 투명 화면 위에 공용 Sheet 를 띄워요.
 */

/** 투명 화면 옵션 (라운지가 뒤에 그대로 보여요) */
export function RouteSheetScreen() {
  return <Stack.Screen options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }} />;
}

/** close() 를 부르면 시트가 내려가고, 움직임이 끝나면 뒤로 가요 */
export function useRouteSheet() {
  const [open, setOpen] = useState(true);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/lounge'));
  return { sheetProps: { open, onClose: () => setOpen(false), onClosed: back }, close: () => setOpen(false) };
}
