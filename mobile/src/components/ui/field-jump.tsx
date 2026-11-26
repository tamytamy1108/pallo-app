/**
 * 빠진 칸으로 데려가기 (폼 공통).
 * 꼭 채울 칸이 비었는데 보내기를 누르면: 느낌표 토스트로 알리고, 그 칸이 스크롤 창 맨 위 가까이 오게 스크롤해요.
 * - 폼: const jump = useFieldJump();  if (!title.trim()) return jump.to('title', '제목을 적어 주세요');
 * - 칸: <JumpField name="title" jump={jump}> … </JumpField> 로 감싸요.
 * - 스크롤을 가진 쪽(Sheet · SheetPage 등)은 <ScrollHostContext.Provider> 로 스크롤 · 보이는 칸 · 지금 위치를 알려 줘요.
 *   스크롤 창 밖이면 토스트만 보여요.
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Keyboard, View, type ScrollViewInstance, type StyleProp, type ViewInstance, type ViewStyle } from 'react-native';

import { showWarnToast } from './toast';

/** 칸 위쪽이 스크롤 창 맨 위에서 이만큼 아래에 오게 (칸 제목까지 보이게) */
const TOP_ROOM = 16;

export type ScrollHost = { scroll: RefObject<ScrollViewInstance | null>; box: RefObject<ViewInstance | null>; y: RefObject<number> };
export const ScrollHostContext = createContext<ScrollHost | null>(null);

type Go = () => void;
export type FieldJump = { to: (name: string, message: string) => void; fields: Map<string, Go> };

export function useFieldJump(): FieldJump {
  const [fields] = useState(() => new Map<string, Go>());
  const to = (name: string, message: string) => {
    showWarnToast(message);
    Keyboard.dismiss();
    fields.get(name)?.();
  };
  return { to, fields };
}

/** 꼭 채울 칸 하나를 감싸요. 칸이 스크롤 창 안에 있으면 jump.to(name) 때 이 칸으로 스크롤해요 */
export function JumpField({ name, jump, children, style }: { name: string; jump: FieldJump; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const host = useContext(ScrollHostContext);
  const node = useRef<ViewInstance>(null);
  useEffect(() => {
    const go = () => {
      const box = host?.box.current;
      const scroll = host?.scroll.current;
      if (!host || !box || !scroll || !node.current) return;
      box.measureInWindow((_bx, by) => {
        node.current?.measureInWindow((_x, y) => {
          scroll.scrollTo({ y: Math.max(0, host.y.current + y - by - TOP_ROOM), animated: true });
        });
      });
    };
    jump.fields.set(name, go);
    return () => {
      if (jump.fields.get(name) === go) jump.fields.delete(name);
    };
  }, [host, jump.fields, name]);
  return (
    <View ref={node} collapsable={false} style={style}>
      {children}
    </View>
  );
}
