import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/meet/icons';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { CARD_COLORS, CARD_DESIGNS, cardDark, fitWordSize, newCard, type CardDesign, type MadeCard } from '@/data/poster-colors';

import { CardArt } from './card-art';

/*
 * '카드 만들기' 칸: 카드 색 고르기 · 큰 글자 두 줄 · 미리보기.
 * 포스터 사진이 없으면 카드는 꼭 만들어요 (스위치 없이 늘 펼쳐져 있어요 · 안 만지면 기본 색 + 기본 글자).
 * 사진이 있으면 카드는 선택 (스위치) — 켜면 카드가 대표(메인)가 되고, 사진은 그 뒤에 보여요.
 * 올릴 때는 data/poster-colors 의 usedCard(card, 사진 있음) 로 같은 규칙을 써요.
 * 번개 · 동아리는 미리보기에 기본 포스터 모양을 그려 넣어요 (renderPreview).
 */

/** 단색 카드 + 큰 글자 (디자인을 주면 그 디자인으로 그려요 — 이벤트 제안 썸네일 · 기본 미리보기). width 를 주면 긴 글자를 칸에 맞게 줄여요 */
export function ColorCard({ color, words, size: max, width, center = false, style, design }: { color: string; words: string[]; size: number; width?: number; center?: boolean; style?: StyleProp<ViewStyle>; design?: CardDesign }) {
  const size = width ? fitWordSize(words, width, max) : max;
  if (design)
    return (
      <View style={[styles.card, style]}>
        <CardArt design={design} color={color} words={words} />
      </View>
    );
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
  /** 문구 예시 (두 줄 · 칸 안 흐린 글자) — 문구는 필수라 예시가 그대로 올라가지는 않아요 */
  example: string[];
  /** 네모 카드 (챌린지) */
  square?: boolean;
  /** 미리보기 그리기 (번개 · 동아리: 기본 포스터 모양) — 없으면 단색 카드 */
  renderPreview?: (card: MadeCard, words: string[], w: number, h: number) => ReactNode;
  /** 글자 다듬기 (예: 챌린지는 영어 대문자만) */
  clean?: (t: string) => string;
  maxLength?: number;
  /** 목록에서 보이는 모양 미리보기 (번개 목록 카드 · 동아리 썸네일) — width: 칸 안쪽 폭 */
  listPreview?: { label: string; render: (card: MadeCard, words: string[], width: number) => ReactNode };
  /** 처음 색 (챌린지는 카테고리 색) */
  defaultColor?: string;
  /** 사진이 있을 때 카드를 켜면 보이는 안내 */
  onNote?: string;
};

export function CardMaker({ value, onChange, hasPhoto, listPreview, defaultColor, example, square = false, renderPreview, clean = (t) => t, maxLength = 12, onNote = '카드가 대표가 되고, 올린 사진은 그 뒤에 보여요.' }: Props) {
  const required = !hasPhoto;
  // 사진이 없으면 손대지 않아도 카드가 있어요 (기본 색 · 기본 글자)
  const card = value ?? (required ? newCard(defaultColor) : null);
  const toggle = () => {
    sfx('tap');
    haptic('select');
    onChange(value ? null : newCard(defaultColor));
  };
  const setWord = (i: number, t: string) => card && onChange({ ...card, words: card.words.map((w, k) => (k === i ? clean(t) : w)) });
  const pickDesign = (design: CardDesign) => {
    if (!card || (card.design ?? 'circle') === design) return;
    sfx('pick');
    haptic('select');
    onChange({ ...card, design });
  };
  const pick = (color: string) => {
    if (!card || card.color === color) return;
    sfx('pick');
    haptic('select');
    onChange({ ...card, color });
  };
  const [inW, setInW] = useState(0);
  const pw = square ? 96 : 108;
  const ph = square ? 96 : 135;
  // 아직 안 적었으면 예시 글자 — 그대로 올라가요 (data/poster-colors fillWords)
  const typed = card ? card.words.map((w) => w.trim()).filter(Boolean) : [];
  const words = typed.length ? typed : example;
  return (
    <View style={styles.maker} onLayout={(e) => setInW(e.nativeEvent.layout.width - 28)}>
      {required ? (
        <View style={styles.tHead}>
          <PText style={styles.tB}>대표 카드 만들기</PText>
          <PText style={styles.tS}>포스터 사진이 없으면 이 카드가 대표로 보여요. 색을 고르고 문구를 적어 주세요.</PText>
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
              {renderPreview ? renderPreview(card, words, pw, ph) : <CardArt design={card.design ?? 'circle'} color={card.color} words={words} />}
            </View>
            <View style={[styles.ins, { height: ph }]}>
              {[0, 1].map((i) => (
                <TextInput
                  key={i}
                  value={card.words[i] ?? ''}
                  onChangeText={(t) => setWord(i, t)}
                  maxLength={maxLength}
                  autoCorrect={false}
                  placeholder={i ? `${example[i] ?? ''} (선택)` : `${example[i] ?? ''} (필수)`}
                  placeholderTextColor="#9B94A6"
                  accessibilityLabel={`카드 문구 ${i ? '둘째' : '첫'} 줄`}
                  style={styles.in}
                />
              ))}
            </View>
          </View>
          <PText style={styles.sub}>디자인</PText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.designs}>
            {CARD_DESIGNS.map((d) => {
              const sel = d.key === (card.design ?? 'circle');
              return (
                <Pressable key={d.key} onPress={() => pickDesign(d.key)} accessibilityRole="button" accessibilityState={{ selected: sel }} accessibilityLabel={`카드 디자인 ${d.name}`} style={styles.des}>
                  <View style={[styles.desCard, sel && styles.desOn]}>
                    <CardArt design={d.key} color={card.color} words={words} />
                  </View>
                  <PText style={[styles.desT, sel && styles.desTOn]}>{d.name}</PText>
                </Pressable>
              );
            })}
          </ScrollView>
          <PText style={styles.sub}>색</PText>
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
          <PText style={styles.hint}>안 적으면 미리보기 글자 그대로 올라가요 · 첫 줄만 적어도 돼요.</PText>
          {listPreview && inW > 0 ? (
            <View style={styles.list}>
              <PText style={styles.listL}>{listPreview.label}</PText>
              {listPreview.render(card, words, inW)}
            </View>
          ) : null}
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
  // 문구 칸 두 개를 미리보기 카드 높이 안에서 가운데로 (카드와 위아래가 맞게)
  ins: { flex: 1, gap: 8, justifyContent: 'center' },
  // Android: 기본 위아래 여백 · 글꼴 여백 때문에 40 칸 안에서 글자가 위로 잘려 보여서 0 으로 · 가운데 정렬 (TextField 와 같게)
  in: { height: 40, paddingVertical: 0, includeFontPadding: false, textAlignVertical: 'center', borderWidth: 2, borderColor: Colors.ink, borderRadius: 12, paddingHorizontal: 10, fontFamily: Font.body800, fontSize: 14, color: Colors.ink, backgroundColor: Colors.cream },
  list: { gap: 6, paddingTop: 10, borderTopWidth: 1.5, borderColor: Colors.line },
  listL: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  hint: { marginTop: -2, fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  colors: { gap: 8, paddingVertical: 2, paddingRight: 4 },
  sub: { marginBottom: -4, fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  designs: { gap: 8, paddingVertical: 3, paddingRight: 4 },
  des: { alignItems: 'center', gap: 4 },
  desCard: { width: 56, height: 70, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(30,26,43,0.35)', overflow: 'hidden' },
  desOn: { borderWidth: 3, borderColor: Colors.ink },
  desT: { fontFamily: Font.body700, fontSize: 10.5, lineHeight: 14, color: Colors.inkSub },
  desTOn: { fontFamily: Font.body900, color: Colors.ink },
  dot: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(30,26,43,0.25)', alignItems: 'center', justifyContent: 'center' },
  dotOn: { borderWidth: 2.5, borderColor: Colors.ink },
});
