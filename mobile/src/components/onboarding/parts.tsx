import { Children, createContext, isValidElement, useContext, useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { SafeAreaView } from '@/components/ui/safe-area';
import Svg, { Path } from 'react-native-svg';

import { BackButton } from '@/components/ui/back-button';
import { Appear } from '@/components/ui/appear';
import { Button } from '@/components/ui/button';
import { CARET_ROOM, KeepVisibleContext, keepInView, useFormScroll, type KeepVisible } from '@/components/ui/form-scroll';
import { GrowInput, useFocusRing } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { kf, kfc } from '@/lib/motion';

import { EntranceDelay, OUT, usePulse } from './fx-motion';
import { ProgressRail } from './fx-progress';

/** 들어올 때 차례 (ms): 제목 줄마다 · 설명 · 내용 칸마다 */
const LINE_STEP = 70;
const ITEM_STEP = 55;
const TITLE_START = 60;
const LINE_MS = 560;

/** 자기 안의 칸을 하나씩 따로 올리는 부품이면 true (OnbScreen 이 한 덩어리로 또 올리지 않아요) */
export type OwnsEntrance = { ownsEntrance?: true };
const ownsEntrance = (node: ReactNode) => isValidElement(node) && typeof node.type === 'function' && (node.type as OwnsEntrance).ownsEntrance === true;

/** 빠진 칸 · 틀린 칸을 알리는 빨강 */
export const ERROR_RED = '#D9364C';

type HostView = ComponentRef<typeof View>;
/** 꼭 채워야 하는 칸 하나: 이름 · 채웠는지 · 안 채웠을 때 아래에 보일 한 줄 */
export type RequiredCheck = { name: string; ok: boolean; message: string };
export type RequiredForm = ReturnType<typeof useRequired>;

/**
 * 꼭 채울 칸 확인 (가입 양식 공통). 아래 버튼은 늘 켜 두고, 누르면 submit 이 확인해요:
 * 다 채웠으면 그대로 넘어가고, 빠진 게 있으면 첫 번째 빠진 칸으로 스크롤해서 빨간 테두리 · 흔들기 · 한 줄 안내를 보여요.
 * 안내는 그 칸을 채우는 순간 사라져요. 칸은 <Field name> 으로 이어 주고, 이 값을 <OnbScreen form> 에 넘겨요.
 */
export function useRequired(checks: RequiredCheck[]) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const frameRef = useRef<HostView>(null);
  const scrollY = useRef(0);
  const fields = useRef(new Map<string, { node: HostView | null; fixed: boolean }>());
  const [flag, setFlag] = useState<{ name: string; n: number } | null>(null);
  const reducedMotion = useReducedMotion();
  const ready = checks.every((c) => c.ok);

  /** 지금 이 칸에 보일 안내 (눌러서 걸린 칸이 아직 안 채워졌을 때만) */
  const errorOf = (name: string) => {
    const c = checks.find((x) => x.name === name);
    return flag?.name === name && c && !c.ok ? c.message : undefined;
  };
  /** 이 칸을 흔들 차례 (걸릴 때마다 1 씩 늘어요, 안 걸렸으면 0) */
  const shakeOf = (name: string) => (flag?.name === name ? flag.n : 0);

  const register = (name: string, node: HostView | null, fixed: boolean) => {
    if (node) fields.current.set(name, { node, fixed });
    else fields.current.delete(name);
  };

  const submit = (proceed: () => void) => {
    const missing = checks.find((c) => !c.ok);
    if (!missing) return proceed();
    setFlag((f) => ({ name: missing.name, n: (f?.n ?? 0) + 1 }));
    const field = fields.current.get(missing.name);
    const frame = frameRef.current;
    if (!field?.node || field.fixed || !frame) return;
    // 칸 위쪽이 스크롤 창 맨 위에서 16 만큼 아래에 오게
    frame.measureInWindow((_fx, frameY) => {
      field.node?.measureInWindow((_x, y) => {
        scrollRef.current?.scrollTo({ y: Math.max(0, scrollY.current + y - frameY - 16), animated: true });
      });
    });
  };

  /**
   * 다음 칸 보여 주기: 한 칸을 마치면 부르세요. 이름 붙은 칸(들)이 아래 버튼 · 흐림 뒤로 가려져 있으면
   * 다 보일 만큼만 아래로 스크롤해요. 이미 다 보이면 그대로, 위로는 절대 안 올려요. 줄인 움직임이면 애니메이션 없이.
   * 칸 이름은 꼭 채울 칸이 아니어도 돼요 (<Field name> 이면 다 등록돼요). 고른 뒤 모양이 바뀔 틈을 한 프레임 기다려요.
   */
  const reveal = (...names: string[]) => {
    setTimeout(() => {
      const frame = frameRef.current;
      const nodes = names.flatMap((n) => {
        const f = fields.current.get(n);
        return f?.node && !f.fixed ? [f.node] : [];
      });
      if (!frame || nodes.length === 0) return;
      frame.measureInWindow((_fx, frameY, _fw, frameH) => {
        const boxes: { top: number; bottom: number }[] = [];
        nodes.forEach((node) =>
          node.measureInWindow((_x, y, _w, h) => {
            boxes.push({ top: y - frameY, bottom: y - frameY + h });
            if (boxes.length < nodes.length) return;
            const top = Math.min(...boxes.map((b) => b.top));
            const bottom = Math.max(...boxes.map((b) => b.bottom));
            const visibleBottom = frameH - REVEAL_HIDDEN;
            if (bottom <= visibleBottom) return;
            // 칸이 창보다 크면 칸 위쪽이 맨 위에서 16 아래에 오는 데까지만
            const by = Math.min(bottom - visibleBottom, top - 16);
            if (by <= 0) return;
            scrollRef.current?.scrollTo({ y: scrollY.current + by, animated: !reducedMotion });
          }),
        );
      });
    }, REVEAL_WAIT);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  };

  // 길게 쓰는 칸이 늘어나도 쓰는 줄이 버튼 위 흐림 · 키보드에 가리지 않게 (GrowInput 이 불러요)
  const keep: KeepVisible = (target) => keepInView(target, frameRef.current, scrollRef.current, scrollY, CARET_HIDDEN);

  return { ready, submit, errorOf, shakeOf, register, reveal, keep, scrollRef, frameRef, onScroll };
}

/** 스크롤 창 아래쪽에서 가려지는 높이: 버튼 위 흐림 20 + 숨 쉴 틈 8 */
const REVEAL_HIDDEN = 28;
/** 쓰는 줄 아래로 비워 둘 높이: 버튼 위 흐림 20 + 숨 쉴 틈 */
const CARET_HIDDEN = 20 + CARET_ROOM;
/** 고른 뒤 칸이 펼쳐지고 자리 잡을 때까지 (지점 시트가 닫히는 것도 포함) */
const REVEAL_WAIT = 120;

const FormContext = createContext<RequiredForm | null>(null);
/** 칸 안의 입력이 빨간 테두리를 그릴지 (Field 가 알려 줘요) */
const InvalidContext = createContext(false);
export const useFieldInvalid = () => useContext(InvalidContext);

/**
 * 가입 단계 공통 틀 (프로토타입 onboarding-options.html 의 .tb · .ttl · .dsc · .lf · .li · .chip · .btn).
 * 위: ‹ 뒤로 + 보라 진행 바 + n/N · 가운데: 제목 · 설명 · 내용(스크롤) · 아래: 고정 버튼.
 */
export function OnbScreen({
  step,
  total,
  title,
  desc,
  children,
  footer,
  onBack,
  scroll = true,
  form,
}: {
  /** 진행 바 칸. 없으면 진행 바를 안 그려요 (약관 · 확인 중 · 예약 확정) */
  step?: number;
  total?: number;
  title?: ReactNode;
  desc?: ReactNode;
  children?: ReactNode;
  /** 아래 고정 칸 (버튼 · 동의 줄) */
  footer?: ReactNode;
  onBack?: () => void;
  scroll?: boolean;
  /** 꼭 채울 칸 확인 (useRequired). 빠진 칸으로 스크롤해요 */
  form?: RequiredForm;
}) {
  // 양식 확인(form)이 없는 화면도 길게 쓰는 칸이 늘면 쓰는 줄을 따라 내려가요
  const own = useFormScroll(CARET_HIDDEN);
  // 제목 줄 → 설명 → 내용 칸 차례로 올라와요 (처음 나타날 때 한 번)
  const lines = typeof title === 'string' ? title.split('\n') : title ? [title] : [];
  const descAt = TITLE_START + lines.length * LINE_STEP;
  const bodyAt = descAt + (desc ? ITEM_STEP : 0);
  const head = (
    <>
      {title ? <RiseTitle lines={lines} label={typeof title === 'string' ? title.replace(/\n/g, ' ') : undefined} /> : null}
      {desc ? (
        <Appear kind="rise" delay={descAt}>
          <PText style={styles.desc}>{desc}</PText>
        </Appear>
      ) : null}
    </>
  );
  const items = Children.toArray(children).map((child, i) => {
    const at = bodyAt + i * ITEM_STEP;
    const key = isValidElement(child) && child.key != null ? child.key : i;
    return ownsEntrance(child) ? (
      <EntranceDelay.Provider key={key} value={at}>
        {child}
      </EntranceDelay.Provider>
    ) : (
      <Appear key={key} kind="rise" delay={at}>
        {child}
      </Appear>
    );
  });
  return (
    <FormContext.Provider value={form ?? null}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <BackButton onPress={onBack} fallback="/onboarding/terms" style={styles.back} />
          {step && total ? (
            <>
              <ProgressRail step={step} total={total} />
              <PText style={styles.count}>
                {step}/{total}
              </PText>
            </>
          ) : null}
        </View>
        {scroll ? (
          <View ref={form?.frameRef ?? own[1]} style={styles.flex}>
            <ScrollView
              ref={form?.scrollRef ?? own[0]}
              style={styles.flex}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={32}
              onScroll={form?.onScroll ?? own[2]}>
              <KeepVisibleContext.Provider value={form?.keep ?? own[4]}>
                {head}
                {items}
              </KeepVisibleContext.Provider>
            </ScrollView>
          </View>
        ) : (
          <View style={[styles.flex, styles.body]}>
            {head}
            {items}
          </View>
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </SafeAreaView>
    </FormContext.Provider>
  );
}

/**
 * 제목: 줄마다 아래에서 쑥 올라와요 (첫 화면 포스터 글씨처럼 · 줄 사이 0.07초).
 * 화면 읽기에는 한 덩어리 제목으로 읽혀요.
 */
function RiseTitle({ lines, label }: { lines: ReactNode[]; label?: string }) {
  const still = useReducedMotion();
  const t = useSharedValue(still ? 1 : 0);
  const total = TITLE_START + lines.length * LINE_STEP + LINE_MS;
  useEffect(() => {
    if (!still) t.set(withTiming(1, { duration: total, easing: Easing.linear }));
  }, [still, t, total]);
  return (
    <View style={styles.titleBox} accessible accessibilityRole="header" accessibilityLabel={label}>
      {lines.map((line, i) => (
        <View key={i} style={styles.titleLine}>
          <TitleLine t={t} from={(TITLE_START + i * LINE_STEP) / total} span={LINE_MS / total}>
            {line}
          </TitleLine>
        </View>
      ))}
    </View>
  );
}

function TitleLine({ t, from, span, children }: { t: SharedValue<number>; from: number; span: number; children: ReactNode }) {
  const anim = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, (t.get() - from) / span));
    return { opacity: kf(p, [0, 35, 100], [0, 1, 1]), transform: [{ translateY: kfc(p, [0, 100], [30, 0], OUT) }] };
  });
  return (
    <Animated.View style={anim}>
      <PText style={styles.title}>{children}</PText>
    </Animated.View>
  );
}

/**
 * 아래 노란 버튼 (화면 폭 가득). 꺼져 있다가 켜지는 순간 톡 튀고 노란 빛 고리가 퍼져요.
 */
export function NextButton({
  label = '다음',
  onPress,
  disabled,
  ready,
}: {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  /** 늘 켜 둔 버튼(양식)에서 '다 채웠어요' 상태. 이 값이 켜지는 순간 톡 튀어요 (없으면 disabled 가 꺼질 때) */
  ready?: boolean;
}) {
  const enabled = ready ?? !disabled;
  const p = usePulse(enabled, { duration: 620, fire: enabled });
  const pop = useAnimatedStyle(() => ({ transform: [{ scale: kfc(p.get(), [0, 30, 65, 100], [1, 1.045, 0.99, 1], OUT) }] }));
  const ring = useAnimatedStyle(() => {
    const v = p.get();
    return { opacity: v >= 1 ? 0 : kf(v, [0, 15, 100], [0, 0.85, 0]), transform: [{ scaleX: kfc(v, [0, 100], [0.96, 1.07], OUT) }, { scaleY: kfc(v, [0, 100], [0.9, 1.35], OUT) }] };
  });
  return (
    <Animated.View style={pop}>
      <Animated.View pointerEvents="none" style={[styles.ring, ring]} />
      <Button label={label} onPress={onPress} disabled={disabled} wide />
    </Animated.View>
  );
}

/** 입력 칸 이름 + 필수면 빨간 * (앱 전체 입력칸 이름과 같아요 · ui/field TextField '이름 *') */
export function FieldLabel({ children, required, hint }: { children: string; required?: boolean; hint?: string }) {
  return (
    <View style={styles.labelRow}>
      <PText style={styles.label} accessibilityLabel={required ? `${children}, 필수` : children}>
        {children}
        {required ? <PText style={styles.req}> *</PText> : null}
      </PText>
      {hint ? <PText style={styles.hint}>{hint}</PText> : null}
    </View>
  );
}

/**
 * 글 입력 칸 (.li: 잉크 테두리 2 · 둥글기 14). 빠진 칸으로 걸리면 빨간 테두리.
 * multiline 이면 길게 쓰는 만큼 칸이 저절로 늘어나요 (GrowInput · 96 부터, 안에 스크롤 막대 없이 — 화면이 스크롤해요).
 */
export function OnbInput({ ring = true, ...props }: Omit<TextInputProps, 'style'> & { ring?: boolean }) {
  const invalid = useFieldInvalid();
  // 포커스 때 보라 링 (브라우저 기본 테두리 대신). 닉네임처럼 바깥에 링을 따로 그리면 ring={false}
  const focus = useFocusRing(props, ring);
  if (props.multiline) return <GrowInput placeholderTextColor="#A79F8F" {...props} ring={ring} style={[styles.input, styles.inputMulti, invalid && styles.invalid]} />;
  return <TextInput placeholderTextColor="#A79F8F" {...props} {...focus} style={[styles.input, styles.inputOne, invalid && styles.invalid, focus.ringStyle]} />;
}

/** 눌러서 고르는 칸 (지점 선택하기 ▾). 고르면 라벤더 · 보라 테두리 (.pickf.got) */
export function PickField({ value, placeholder, onPress }: { value: string; placeholder: string; onPress: () => void }) {
  const invalid = useFieldInvalid();
  return (
    <Pressable
      onPress={() => {
        sfx('tap');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={value || placeholder}>
      {({ pressed }) => (
        <View style={[styles.input, styles.pick, !!value && styles.pickGot, invalid && styles.invalid, pressed && styles.pressed]}>
          <PText style={value ? styles.pickValue : styles.pickPh}>{value || placeholder}</PText>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M6 9l6 6 6-6" fill="none" stroke={Colors.inkSub} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      )}
    </Pressable>
  );
}

/** 알약 고르기 칸 (.chip · .chip.on) */
export function Chip({ label, on, onPress, disabled }: { label: string; on: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={() => {
        sfx('tap');
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on, disabled }}>
      {({ pressed }) => (
        <View style={[styles.chip, on && styles.chipOn, disabled && styles.chipOff, pressed && styles.pressed]}>
          <PText style={[styles.chipText, on && styles.chipTextOn, disabled && styles.chipTextOff]}>{label}</PText>
        </View>
      )}
    </Pressable>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <View style={styles.chips}>{children}</View>;
}

/**
 * 칸 하나 (.lf · 위 간격 18). name 을 주면 useRequired 와 이어져요: 빠진 칸으로 걸리면 흔들리고 빨간 테두리 · 아래 한 줄 안내.
 * error: 따로 보일 안내 (칸을 떠난 뒤 틀린 값 등). fixed: 스크롤 밖(아래 고정 칸)에 있어 스크롤하지 않아요.
 * quiet: 아래 안내 줄을 안 그려요 (화면이 따로 알려 줄 때).
 */
export function Field({ children, name, error, fixed, quiet, style }: { children: ReactNode; name?: string; error?: string; fixed?: boolean; quiet?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <FieldShell name={name} error={error} fixed={fixed} quiet={quiet} style={[styles.field, style]}>
      {children}
    </FieldShell>
  );
}

/** Field 의 알맹이 (위 간격 없이): 자리 등록 · 흔들기 · 빨간 테두리 알림 · 안내 줄. 카드 격자처럼 간격을 따로 정하는 곳에서 써요 */
export function FieldShell({ children, name, error, fixed = false, quiet, style }: { children: ReactNode; name?: string; error?: string; fixed?: boolean; quiet?: boolean; style?: StyleProp<ViewStyle> }) {
  const form = useContext(FormContext);
  const message = (name && form?.errorOf(name)) || error;
  const n = name && form ? form.shakeOf(name) : 0;
  const p = usePulse(n, { duration: 420, fire: n > 0 });
  const shake = useAnimatedStyle(() => ({ transform: [{ translateX: kf(p.get(), [0, 15, 32, 50, 68, 84, 100], [0, -9, 8, -6, 4, -2, 0]) }] }));
  return (
    <View ref={name && form ? (node) => form.register(name, node, fixed) : undefined} style={style}>
      <InvalidContext.Provider value={!!message}>
        <Animated.View style={shake}>{children}</Animated.View>
      </InvalidContext.Provider>
      {message && !quiet ? (
        <PText style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
          {message}
        </PText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  flex: { flex: 1 },
  top: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingRight: 20 },
  back: { marginRight: -2 },
  count: { fontFamily: Font.display, fontSize: 12, lineHeight: 16, color: Colors.inkSub },
  body: { paddingHorizontal: 22, paddingBottom: 24, flexGrow: 1 },
  titleBox: { marginTop: 12 },
  titleLine: { overflow: 'hidden' },
  ring: { position: 'absolute', top: 0, left: 0, right: 4, bottom: 4, borderRadius: 30, borderWidth: 4, borderColor: Colors.yellow },
  title: { fontFamily: Font.body900, fontSize: 26, lineHeight: 34, letterSpacing: -0.8 },
  desc: { marginTop: 6, fontFamily: Font.body600, fontSize: 14, lineHeight: 21, color: Colors.inkSub },
  footer: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12, gap: 10 },
  field: { marginTop: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 7 },
  label: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 18 },
  req: { fontFamily: Font.body900, color: '#E5484D' },
  hint: { marginLeft: 2, fontFamily: Font.body700, fontSize: 12, lineHeight: 18, color: Colors.inkSub },
  input: { height: 52, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, backgroundColor: Colors.white, paddingHorizontal: 14, fontFamily: Font.body800, fontSize: 16, color: Colors.ink },
  // 한 줄 칸: Android 기본 위아래 여백 · 글꼴 여백 때문에 글자가 위로 붙어 보여서 0 · 가운데로 (ui/field TextField 와 같게)
  inputOne: { paddingVertical: 0, includeFontPadding: false, textAlignVertical: 'center' },
  inputMulti: { height: undefined, minHeight: 96, paddingTop: 12, paddingBottom: 12, fontSize: 15, lineHeight: 22, textAlignVertical: 'top' },
  invalid: { borderColor: ERROR_RED },
  error: { marginTop: 6, marginLeft: 4, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 17, color: ERROR_RED },
  pick: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickGot: { borderColor: Colors.purple, backgroundColor: Colors.lavender },
  pickPh: { fontFamily: Font.body700, fontSize: 16, lineHeight: 22, color: '#A79F8F' },
  pickValue: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  pressed: { opacity: 0.85 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white, justifyContent: 'center' },
  chipOn: { backgroundColor: Colors.lavender, borderColor: Colors.purple },
  chipOff: { backgroundColor: '#F4EFE3', borderColor: Colors.line },
  chipText: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20, color: Colors.inkSub },
  chipTextOn: { fontFamily: Font.body900, color: Colors.purple },
  chipTextOff: { color: '#B4AC9B', textDecorationLine: 'line-through' },
});
