/**
 * Storybook 용 expo-router 대역 (main.ts 가 'expo-router' · 'expo-router/js-stack' 을 이 파일로 바꾼다).
 * 화면 하나를 내비게이터 없이 그리려고 — 이동(router.push 등)은 일어나지 않고 Actions 패널에 기록만 남는다.
 * 주소 값은 스토리의 `parameters.route: { params: { id: '1' }, pathname: '/notice/1' }` 로 준다 (preview.tsx 가 넣음).
 * 타입은 진짜 expo-router 것을 그대로 쓴다(tsc 는 이 파일을 보지 않음) — 앱이 새 export 를 쓰기 시작하면 여기에 더한다.
 */
import React, { useEffect, type ReactNode } from 'react';
import { Pressable } from 'react-native';
import { action } from 'storybook/actions';

type Params = Record<string, string | string[] | undefined>;

let currentParams: Params = {};
let currentPathname = '/';

/** preview.tsx 가 스토리를 그리기 전에 부른다. */
export function __setStoryRoute(route: { params?: Params; pathname?: string } | undefined) {
  currentParams = route?.params ?? {};
  currentPathname = route?.pathname ?? '/';
}

export const router = {
  push: action('router.push'),
  replace: action('router.replace'),
  navigate: action('router.navigate'),
  back: action('router.back'),
  dismiss: action('router.dismiss'),
  dismissAll: action('router.dismissAll'),
  dismissTo: action('router.dismissTo'),
  setParams: action('router.setParams'),
  prefetch: action('router.prefetch'),
  canGoBack: () => true,
  canDismiss: () => true,
};

export const useRouter = () => router;
export const useLocalSearchParams = () => currentParams;
export const useGlobalSearchParams = () => currentParams;
export const usePathname = () => currentPathname;
export const useSegments = () => currentPathname.split('/').filter(Boolean);
export const useIsFocused = () => true;
// 나갈 때 확인(꾸미기 등): 스토리에선 화면을 떠나지 않으니 아무것도 안 해요
export const usePreventRemove = (_prevent: boolean, _cb: (e: { data: { action: unknown } }) => void) => {};
export const useNavigation = () => ({ setOptions: action('navigation.setOptions'), addListener: () => () => {}, goBack: router.back, canGoBack: () => true });

/** 화면에 들어올 때 한 번 (진짜는 포커스될 때마다). 앱은 useCallback 으로 감싸 넘긴다. */
export function useFocusEffect(effect: () => void | (() => void)) {
  useEffect(effect, [effect]);
}

export function Redirect({ href }: { href: unknown }) {
  useEffect(() => action('Redirect')(href), [href]);
  return null;
}

export function Link({ href, asChild, children, ...rest }: { href: unknown; asChild?: boolean; children?: ReactNode; [k: string]: unknown }) {
  const onPress = () => action('Link')(href);
  if (asChild && React.isValidElement(children)) return React.cloneElement(children as React.ReactElement<{ onPress?: () => void }>, { onPress });
  return (
    <Pressable onPress={onPress} {...rest}>
      {children}
    </Pressable>
  );
}

/** 화면 파일 안 <Stack.Screen options={...} /> 은 그리지 않는다 (위 줄 제목 등은 화면이 직접 그림). */
function Screen() {
  return null;
}
function Protected({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
function StackNavigator() {
  return null;
}
export const Stack = Object.assign(StackNavigator, { Screen, Protected });
export const Tabs = Object.assign(StackNavigator, { Screen });
