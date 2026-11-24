import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/meet/icons';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { CARD_COLORS, cardDark, cardWords, fitWordSize, newCard, type MadeCard } from '@/data/poster-colors';

/*
 * '카드 만들기' 칸: 카드 색 고르기 · 큰 글자 두 줄 · 미리보기.
 * 포스터 사진이 없으면 카드는 꼭 만들어요 (스위치 없이 늘 펼쳐져 있어요 · 안 만지면 기본 색 + 기본 글자).
 * 사진이 있으면 카드는 선택 (스위치) — 켜면 카드가 대표(메인)가 되고, 사진은 그 뒤에 보여요.
 * 올릴 때는 data/poster-colors 의 usedCard(card, 사진 있음) 로 같은 규칙을 써요.
 * 번개 · 동아리는 미리보기에 기본 포스터 모양을 그려 넣어요 (renderPreview).
 */

/** 단색 카드 + 큰 글자 (챌린지 네모 칸 · 이벤트 제안 썸네일 · 기본 미리보기). width 를 주면 긴 글자를 칸에 맞게 줄여요 */
export function ColorCard({ color, words, size: max, width, center = false, style }: { color: string; words: string[]; size: number; width?: number; center?: boolean; style?: StyleProp<ViewStyle> }) {
  const size = width ? fitWordSize(words, width, max) : max;
  return (
    <View style={[styles.card, { backgroundColor: color }, center ? styles.center : styles.corner, style]}>
      <PText style={[styles.words, { fontSize: size, lineHeight: size * 1.02, color: cardDark(color) ? Colors.yellow : Colors.ink, textAlign: center ? 'center' : 'left' }]}>{words.join('\n')}</PText>
    </View>
  );
}

type Props = {
  value: MadeCard | null;
  onChange: (v: MadeCard | null) => void;
  /** 포스터 사진을 넣었나요 — 없으면 카드가 꼭 필요해요 */
  hasPhoto: boolean;
  /** 글자 칸 비워 두면 들어가는 글자 (두 줄) */
  fallback: string[];
  /** 네모 카드 (챌린지) */
  square?: boolean;
  /** 미리보기 그리기 (번개 · 동아리: 기본 포스터 모양) — 없으면 단색 카드 */
  renderPreview?: (card: MadeCard, words: string[], w: number, h: number) => ReactNode;
  /** 글자 다듬기 (예: 챌린지는 영어 대문자만) */
  clean?: (t: string) => string;
  maxLength?: number;
  /** 처음 색 (챌린지는 카테고리 색) */
  defaultColor?: string;
  /** 사진이 있을 때 카드를 켜면 보이는 안내 */
  onNote?: string;
};

export function CardMaker({ value, onChange, hasPhoto, defaultColor, fallback, square = false, renderPreview, clean = (t) => t, maxLength = 12, onNote = '카드가 대표가 되고, 올린 사진은 그 뒤에 보여요.' }: Props) {
  const required = !hasPhoto;
  // 사진이 없으면 손대지 않아도 카드가 있어요 (기본 색 · 기본 글자)
  const card = value ?? (required ? newCard(defaultColor) : null);
  const toggle = () => {
    sfx('tap');
    haptic('select');
    onChange(value ? null : newCard(defaultColor));
  };
  const setWord = (i: number, t: string) => card && onChange({ ...card, words: card.words.map((w, k) => (k === i ? clean(t) : w)) });
  const pick = (color: string) => {
    if (!card || card.color === color) return;
    sfx('pick');
    haptic('select');
    onChange({ ...card, color });
  };
  const pw = square ? 96 : 108;
  const ph = square ? 96 : 135;
  const words = card ? cardWords(card.words, fallback) : fallback;
  return (
    <View style={styles.maker}>
      {required ? (
        <View style={styles.tHead}>
          <PText style={styles.tB}>대표 카드 만들기</PText>
          <PText style={styles.tS}>포스터 사진이 없으면 이 카드가 대표로 보여요. 색을 고르고 문구를 넣어 주세요.</PText>
        </View>
      ) : (
        <Pressable onPress={toggle} accessibilityRole="switch" accessibilityState={{ checked: !!value }} accessibilityLabel="카드도 만들기" style={styles.tRow}>
          <View style={styles.tTx}>
            <PText style={styles.tB}>카드도 만들기 · 선택</PText>
            <PText style={styles.tS}>{value ? onNote : '사진이 있어서 카드는 선택이에요. 켜면 카드가 대표가 돼요.'}</PText>
          </View>
          <View style={[styles.sw, !!value && styles.swOn]}>
            <View style={[styles.knob, !!value && styles.knobOn]} />
          </View>
        </Pressable>
      )}
      {card ? (
        <>
          <View style={styles.row}>
            <View style={[styles.pv, { width: pw, height: ph, borderRadius: square ? 16 : 14 }]}>
              {renderPreview ? renderPreview(card, words, pw, ph) : <ColorCard color={card.color} words={words} size={square ? 18 : 26} width={pw} center={square} style={StyleSheet.absoluteFill} />}
            </View>
            <View style={styles.ins}>
              {[0, 1].map((i) => (
                <TextInput
                  key={i}
                  value={card.words[i] ?? ''}
                  onChangeText={(t) => setWord(i, t)}
                  maxLength={maxLength}
                  autoCorrect={false}
                  placeholder={fallback[i] ?? ''}
                  placeholderTextColor="#9B94A6"
                  accessibilityLabel={`카드 문구 ${i ? '둘째' : '첫'} 줄`}
                  style={styles.in}
                />
              ))}
              <PText style={styles.hint}>비워 두면 &apos;{fallback.join(' ')}&apos;</PText>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colors}>
            {CARD_COLORS.map((c) => {
              const sel = c.hex === card.color;
              return (
                <Pressable key={c.hex} onPress={() => pick(c.hex)} accessibilityRole="button" accessibilityState={{ selected: sel }} accessibilityLabel={`카드 색 ${c.name}`} hitSlop={4} style={[styles.dot, { backgroundColor: c.hex }, sel && styles.dotOn]}>
                  {sel ? <Icon name="check" size={16} strokeWidth={3} color={c.dark ? '#fff' : Colors.ink} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  corner: { justifyContent: 'flex-end', paddingHorizontal: '9%', paddingBottom: '8%' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  words: { fontFamily: Font.display, letterSpacing: -0.6 },
  maker: { gap: 10, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: '#fff', padding: 12 },
  tRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tTx: { flex: 1, gap: 1 },
  tHead: { gap: 1 },
  tB: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  tS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  sw: { width: 46, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#EEE8DA', padding: 2 },
  swOn: { backgroundColor: Colors.yellow },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink },
  knobOn: { transform: [{ translateX: 18 }] },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  pv: { overflow: 'hidden', borderWidth: 2, borderColor: Colors.ink },
  ins: { flex: 1, gap: 6 },
  in: { height: 40, borderWidth: 2, borderColor: Colors.ink, borderRadius: 12, paddingHorizontal: 10, fontFamily: Font.body800, fontSize: 14, color: Colors.ink, backgroundColor: Colors.cream },
  hint: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  colors: { gap: 8, paddingVertical: 2, paddingRight: 4 },
  dot: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(30,26,43,0.25)', alignItems: 'center', justifyContent: 'center' },
  dotOn: { borderWidth: 2.5, borderColor: Colors.ink },
});
