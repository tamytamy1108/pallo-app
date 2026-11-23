import type { ComponentProps, ReactNode } from 'react';
import { Pressable as RNPressable, type GestureResponderEvent, type PressableProps } from 'react-native';

import { tapSound, type Sfx } from '@/lib/feedback';

type Props = PressableProps & {
  /** 누를 때 소리. 안 정하면 프로토타입 tapKind 처럼 버튼 종류를 보고 골라요. false 면 소리 없음 */
  sound?: Sfx | false;
  ref?: ComponentProps<typeof RNPressable>['ref'];
};

/**
 * 앱의 모든 누르는 것 — react-native Pressable 과 똑같이 쓰면 돼요.
 * 누르면 '톡' 소리가 나요 (프로토타입: 누를 수 있는 건 다 소리). onPress 안에서 sfx(...) 로 다른 소리를 내면 그 소리 하나만 나요.
 */
export function Pressable({ sound, onPress, ...rest }: Props) {
  const press = (e: GestureResponderEvent) => {
    if (sound !== false) {
      const [name, key] = sound ? [sound, undefined] : soundFor(rest);
      tapSound(name, key);
    }
    onPress?.(e);
  };
  return <RNPressable {...rest} onPress={onPress || sound ? press : undefined} />;
}

/** 프로토타입 tapKind: 뒤로 · 닫기는 back, 보내기는 send, 탭은 tab, 켜고 끄기는 toggle, 그 밖은 버튼마다 다른 음 */
function soundFor({ accessibilityLabel: label = '', accessibilityRole: role, accessibilityState: state, children }: PressableProps): [Sfx, string | undefined] {
  if (/뒤로|닫기|그만|취소|Back|Close/i.test(label)) return ['back', undefined];
  if (/올리기|보내/.test(label)) return ['send', undefined];
  if (role === 'tab' || state?.selected !== undefined) return ['tab', undefined];
  if (role === 'switch' || role === 'checkbox' || state?.checked !== undefined) return ['toggle', undefined];
  const key = (typeof children === 'string' ? children : textOf(children)) + label;
  return ['tap', key || 'tap'];
}

function textOf(node: ReactNode | ((s: never) => ReactNode)): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim().slice(0, 12);
  return '';
}
