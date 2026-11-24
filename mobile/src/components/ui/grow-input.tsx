import { forwardRef, useCallback, useLayoutEffect, useRef, useState, type ComponentProps, type ComponentRef } from 'react';
import { Platform, StyleSheet, TextInput, useWindowDimensions } from 'react-native';

import { Colors } from '@/constants/theme';

import { CARET_ROOM, useKeepVisible } from './form-scroll';

type Props = ComponentProps<typeof TextInput> & {
  /**
   * 아래에 붙은 입력 띠(댓글 · 답글 · 채팅)처럼 화면을 다 덮으면 안 되는 곳: 이 줄 수까지만(화면 높이 40% 넘지 않게) 늘고,
   * 넘으면 칸 안에서 스크롤해요 (스크롤 막대는 안 보여요). 없으면 끝없이 늘어요 (양식 칸 — 화면이 스크롤해요).
   */
  maxLines?: number;
  /** 포커스 때 보라 테두리 링 (웹 · 새 구조 네이티브). 칸이 따로 포커스 모양을 그리면 false */
  ring?: boolean;
};

const isWeb = Platform.OS === 'web';

type FocusEvents = Pick<ComponentProps<typeof TextInput>, 'onFocus' | 'onBlur'>;

/**
 * 입력칸 포커스 링: 브라우저 기본 포커스 테두리 대신 앱의 보라 링 (닉네임 칸과 같은 색).
 * 한 줄 칸(TextField · OnbInput)도 같이 써요. ring 이 false 면 링 없이 (칸이 따로 포커스 모양을 그릴 때).
 */
export function useFocusRing({ onFocus, onBlur }: FocusEvents, ring = true) {
  const [focused, setFocused] = useState(false);
  return {
    onFocus: ((e) => {
      setFocused(true);
      onFocus?.(e);
    }) satisfies FocusEvents['onFocus'],
    onBlur: ((e) => {
      setFocused(false);
      onBlur?.(e);
    }) satisfies FocusEvents['onBlur'],
    ringStyle: ring && focused ? styles.ring : styles.noRing,
    focused,
  };
}

// 웹: 최대 줄 수를 넘겨 칸 안에서 스크롤할 때도 스크롤 막대는 안 보이게 (RN style 로는 못 정해서 한 번만 규칙을 넣어요)
if (isWeb && typeof document !== 'undefined' && !document.getElementById('grow-input-css')) {
  const css = document.createElement('style');
  css.id = 'grow-input-css';
  css.textContent = 'textarea{scrollbar-width:none}textarea::-webkit-scrollbar{display:none}';
  document.head.appendChild(css);
}

/**
 * 웹 · 스크롤을 가진 쪽(Context)이 없을 때: 가장 가까운 스크롤 칸을 찾아 칸 아래 끝이 보이게 내려요 (위로는 안 올려요).
 */
function keepInViewWeb(el: HTMLElement | null, room: number) {
  let box = el?.parentElement ?? null;
  while (box && !(box.scrollHeight > box.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(box).overflowY))) box = box.parentElement;
  if (!el || !box) return;
  const over = el.getBoundingClientRect().bottom + room - box.getBoundingClientRect().bottom;
  if (over > 1) box.scrollTop += over;
}

/** 웹: RN-web TextInput 의 바탕은 <textarea> 예요 */
const textareaOf = (node: unknown) => (typeof HTMLTextAreaElement !== 'undefined' && node instanceof HTMLTextAreaElement ? node : null);

const num = (v: unknown) => (typeof v === 'number' ? v : undefined);
/** 웹 키 이벤트의 shiftKey (RN 타입에는 없어요) */
const shiftKeyOf = (ev: object) => 'shiftKey' in ev && ev.shiftKey === true;

/**
 * 여러 줄 입력칸 (레슨 '내 답' 칸 모양 그대로 · 앱의 모든 긴 글 칸이 이걸 써요): 길게 쓰면 줄이 바뀌고 칸이 한 줄씩 저절로 늘어나요.
 * 안에 스크롤 막대가 생기거나 옆으로 이어지지 않아요. style 의 minHeight 아래로는 줄지 않고, 지우면 다시 줄어요.
 * 네이티브는 onContentSizeChange, 웹은 글이 바뀔 때마다 <textarea> 의 scrollHeight 를 재요 (RN-web 은 스스로 늘지 않아요).
 * 모양(테두리 · 둥글기 · 안쪽 여백)은 각 자리 style 그대로 — 댓글 알약은 알약대로, 양식 칸은 네모대로.
 */
export const GrowInput = forwardRef<ComponentRef<typeof TextInput>, Props>(function GrowInput({ style, onContentSizeChange, onChangeText, onLayout, onFocus, onBlur, onKeyPress, maxLines, ring = true, ...rest }, ref) {
  const inner = useRef<ComponentRef<typeof TextInput>>(null);
  const setRef = (node: ComponentRef<typeof TextInput> | null) => {
    inner.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };
  const { height: screenH } = useWindowDimensions();
  const focus = useFocusRing({ onFocus, onBlur }, ring);
  const keep = useKeepVisible();
  const [contentH, setContentH] = useState(0);

  const flat = StyleSheet.flatten(style) ?? {};
  const minH = num(flat.minHeight) ?? 0;
  // 테두리는 글 높이(contentSize · scrollHeight)에 안 들어가서 따로 더해요
  const border = (num(flat.borderTopWidth) ?? num(flat.borderWidth) ?? 0) + (num(flat.borderBottomWidth) ?? num(flat.borderWidth) ?? 0);
  const padV = (num(flat.paddingTop) ?? num(flat.paddingVertical) ?? num(flat.padding) ?? 0) + (num(flat.paddingBottom) ?? num(flat.paddingVertical) ?? num(flat.padding) ?? 0);
  const lineH = num(flat.lineHeight) ?? Math.round((num(flat.fontSize) ?? 16) * 1.4);
  const cap = Math.min(num(flat.maxHeight) ?? Infinity, maxLines ? Math.min(maxLines * lineH + padV + border, Math.round(screenH * 0.4)) : Infinity);
  const want = contentH ? contentH + border : minH;
  const height = Math.min(Math.max(minH, want), cap);
  const capped = want > cap;

  // 웹: 잠깐 height:auto 로 두고 글 높이를 잰 뒤 바로 되돌려요 (그려지기 전이라 깜빡이지 않아요)
  const measureWeb = useCallback(() => {
    const el = textareaOf(inner.current);
    if (!el) return;
    const prev = el.style.height;
    el.style.height = 'auto';
    const h = el.scrollHeight;
    el.style.height = prev;
    setContentH((p) => (p === h ? p : h));
  }, []);

  /**
   * 쓰는 줄 따라가기: 포커스 중인 칸이 아래 버튼 · 흐림 · 키보드 뒤로 내려가면 스크롤을 그만큼 내려요.
   * 아래에 붙은 입력 띠(maxLines)는 스크롤 칸 밖이라 빼요.
   */
  const keepCaret = useCallback(() => {
    if (maxLines) return;
    if (keep) return keep(inner.current);
    if (isWeb) keepInViewWeb(textareaOf(inner.current), CARET_ROOM);
  }, [keep, maxLines]);

  // 칸이 늘어난 순간 (줄이 하나 더 생겼을 때)
  const prevHeight = useRef(height);
  useLayoutEffect(() => {
    const grew = height > prevHeight.current;
    prevHeight.current = height;
    if (grew && focus.focused) keepCaret();
  }, [height, focus.focused, keepCaret]);

  // 값이 밖에서 바뀌어도(보내고 비우기 · 미리 채우기) 다시 재요
  useLayoutEffect(() => {
    if (isWeb) measureWeb();
  }, [rest.value, measureWeb]);

  return (
    <TextInput
      {...rest}
      ref={setRef}
      multiline
      // 웹 <textarea> 기본 2줄 대신 1줄부터 (높이는 글에 맞춰 늘어요)
      rows={1}
      scrollEnabled={capped}
      onChangeText={(t) => {
        onChangeText?.(t);
        if (isWeb) {
          measureWeb();
          // 끝에서 쓰는 중이면 (위로 올려 봤다가 이어 쓸 때도) 쓰는 줄이 보이게
          const el = textareaOf(inner.current);
          if (el && el.selectionEnd === el.value.length) keepCaret();
        }
      }}
      onContentSizeChange={(e) => {
        if (!isWeb) setContentH(Math.ceil(e.nativeEvent.contentSize.height));
        onContentSizeChange?.(e);
      }}
      // 폭이 바뀌면 줄 바뀜도 바뀌어요
      onLayout={(e) => {
        if (isWeb) measureWeb();
        onLayout?.(e);
      }}
      // 보내기 칸(submitBehavior 'submit'): 웹에서도 Enter 는 보내기, Shift+Enter 는 줄 바꿈 (RN-web 여러 줄 칸은 Enter 가 줄 바꿈이라)
      onKeyPress={(e) => {
        onKeyPress?.(e);
        if (isWeb && rest.submitBehavior && rest.submitBehavior !== 'newline' && e.nativeEvent.key === 'Enter' && !shiftKeyOf(e.nativeEvent)) {
          e.preventDefault();
          rest.onSubmitEditing?.({ ...e, nativeEvent: { text: textareaOf(inner.current)?.value ?? '', target: e.nativeEvent.target ?? 0, eventCount: 0 } });
        }
      }}
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
      style={[style, { height, textAlignVertical: 'top' }, focus.ringStyle]}
    />
  );
});

const styles = StyleSheet.create({
  // 브라우저 기본 포커스 테두리 대신 앱의 보라 링 (닉네임 칸과 같은 색)
  ring: { outlineStyle: 'solid', outlineWidth: 2, outlineColor: Colors.purple, outlineOffset: 2 },
  // 'auto' 외곽선은 굵기 0 이어도 브라우저가 주황 링을 그려서 solid · 투명으로 덮어요
  noRing: { outlineStyle: 'solid', outlineWidth: 0, outlineColor: 'transparent' },
});
