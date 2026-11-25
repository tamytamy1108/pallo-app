/**
 * 시트 위에 시트 (아이폰).
 * 아이폰은 떠 있는 창(Modal) 위에 다른 창을 띄우려면, 새 창이 떠 있는 창 '안'에 있어야 해요.
 * 밖(옆)에 두면 아무 말 없이 안 뜨고, 그 뒤로 그 버튼을 다시 눌러도 반응이 없어요.
 * 그래서 시트가 열릴 때 이미 열린 시트가 있으면, 그 시트 안의 자리(NestedSheets)에 그려요.
 * 안드로이드 · 웹은 이런 제약이 없어서 그 자리에 그대로 그려요.
 */
import { Fragment, useEffect, useId, useLayoutEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Modal, Platform, type ModalProps } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { dismissKeyboardBehind } from '@/lib/keyboard';

const NEST = Platform.OS === 'ios';

/** 열린 시트 순서 (마지막이 맨 위) */
const open: string[] = [];
/** 부모 시트 id → (자식 시트 id → 그릴 것) */
const nested = new Map<string, Map<string, ReactNode>>();
const listeners = new Set<() => void>();
const emit = () => {
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/**
 * 이 시트를 어디에 그릴지. mounted 동안 열린 시트 목록에 올리고, 열릴 때 맨 위였던 시트를 부모로 기억해요.
 * 반환: 부모 시트 안에 그려야 하면 place(그릴 것) 를 부르고 null 을 그려요.
 */
export function useSheetLayer(id: string, mounted: boolean, isOpen: boolean, node: ReactNode) {
  // '' = 맨 아래 시트(그 자리에 그려요), null = 닫혀 있음
  const [parent, setParent] = useState<string | null>(null);
  if (mounted && parent === null) setParent(NEST ? (open.filter((x) => x !== id).at(-1) ?? '') : '');
  if (!mounted && parent !== null) setParent(null);

  // 부모가 될 수 있는 건 '열려 있는' 시트만 (닫히는 중인 시트 안에 그리면 같이 사라져요)
  useLayoutEffect(() => {
    if (!isOpen) return;
    open.push(id);
    return () => {
      const i = open.lastIndexOf(id);
      if (i >= 0) open.splice(i, 1);
    };
  }, [id, isOpen]);

  const host = parent || null;
  // 그릴 것은 그릴 때마다 새로 넘겨요 (부모 시트 안에서 최신 내용으로 보이게).
  // 목록은 고칠 때마다 새 Map 으로 바꿔요 — NestedSheets 가 '목록 자체'를 구독해야
  // React Compiler 가 옛 결과(빈 자리)를 다시 쓰지 않아요 (같은 Map 을 고치면 아이폰에서 위 시트가 안 떠요)
  useLayoutEffect(() => {
    if (!host) return;
    const m = new Map(nested.get(host));
    m.set(id, node);
    nested.set(host, m);
    emit();
  });
  useEffect(() => {
    if (!host) return;
    return () => {
      const prev = nested.get(host);
      if (!prev?.has(id)) return;
      const m = new Map(prev);
      m.delete(id);
      nested.set(host, m);
      emit();
    };
  }, [host, id]);
  return host != null;
}

/** 시트 안에 두는 자리: 이 시트가 떠 있는 동안 열린 시트들이 여기 그려져요 */
export function NestedSheets({ id }: { id: string }) {
  const m = useSyncExternalStore(
    subscribe,
    () => nested.get(id),
    () => nested.get(id),
  );
  if (!m?.size) return null;
  return (
    <>
      {[...m.entries()].map(([k, n]) => (
        <Fragment key={k}>{n}</Fragment>
      ))}
    </>
  );
}

/**
 * 앱의 모든 떠 있는 창(팝업 · 사진 크게 보기 · 확인 창 등)은 RN Modal 대신 이걸 써요.
 * - 아이폰: 다른 창이 떠 있을 때 열리면 그 창 안에 그려서 안 뜨는 일이 없어요 (위 설명).
 * - 창 안의 안전 영역(홈 바 · 내비게이션 바)을 창 기준으로 다시 재요 → 안의 useSafeAreaInsets 가 맞는 값을 줘요.
 * - 열릴 때 뒤 화면 키보드를 내려요 (창 아래 버튼이 키보드에 가리지 않게).
 */
export function LayerModal({ visible = true, children, ...rest }: ModalProps) {
  const id = useId();
  // 뒤 화면 키보드가 남아 창 아래 버튼을 덮지 않게 (ui/sheet 와 같은 이유)
  useEffect(() => {
    if (visible) dismissKeyboardBehind();
  }, [visible]);
  const node = (
    <Modal visible={visible} {...rest}>
      <SafeAreaProvider>
        {children}
        <NestedSheets id={id} />
      </SafeAreaProvider>
    </Modal>
  );
  const inParent = useSheetLayer(id, visible, visible, node);
  return inParent ? null : node;
}
