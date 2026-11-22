import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { CheckIcon } from '@/components/lesson/icons';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';

import { Body, Foot, useRunner } from '../frame';
import { TopPart } from '../parts';
import { phraseRe, words } from '../text';
import type { ExprsTask } from '../types';
import { FootRow, GoBtn, Msg, SUB } from '../ui';

/**
 * 표현마다 칸 하나 · 그 표현을 넣어 내 예문 만들기 (프로토타입 TKV.exprs · v503).
 * 칸에 표현이 들어가고 4단어 이상이면 노랗게 · 체크. need 개 이상이면 아래 버튼이 켜져요.
 */
export function ExprsBlock({ task: t }: { task: ExprsTask }) {
  const rt = useRunner();
  const [v, setV] = useState<Record<number, string>>({});
  const [open, setOpen] = useState<number | null>(null);
  const ok = (i: number) => phraseRe(t.items[i][0]).test(v[i] ?? '') && words(v[i] ?? '') >= 4;
  const n = t.items.filter((_, i) => ok(i)).length;
  const type = (i: number, text: string) => {
    const was = ok(i);
    const next = { ...v, [i]: text };
    setV(next);
    if (!was && phraseRe(t.items[i][0]).test(text) && words(text) >= 4) sfx('pick');
  };
  const done = () => {
    rt.mark(true);
    rt.log({ k: t.kick, v: Object.values(v).join(' '), ok: true });
    sfx('correct');
    rt.next();
  };
  return (
    <>
      <Body>
        <TopPart soundOff={rt.soundOff} />
        <Msg text={`표현을 넣어 내 예문을 만들어요 · ${t.need}개 이상`} />
        <View style={styles.grid}>
          {t.items.map(([w, m, ex], i) => (
            <View key={w} style={StyleSheet.flatten([styles.box, ok(i) && styles.boxOn])}>
              <View style={styles.head}>
                <View style={StyleSheet.flatten([styles.ok, ok(i) && styles.okOn])}>{ok(i) ? <CheckIcon size={12} /> : null}</View>
                <PText style={styles.w}>{w}</PText>
                <PText style={styles.m} color={SUB}>
                  {m}
                </PText>
              </View>
              <TextInput
                value={v[i] ?? ''}
                onChangeText={(x) => type(i, x)}
                placeholder={`${w} 를 넣어 한 문장`}
                placeholderTextColor="#A39C8E"
                multiline
                autoCapitalize="sentences"
                style={styles.input}
                accessibilityLabel={`${w} 예문`}
              />
              {ex ? (
                <Pressable onPress={() => setOpen(open === i ? null : i)} accessibilityRole="button" accessibilityState={{ expanded: open === i }} hitSlop={6}>
                  <PText style={styles.exBtn} color={Colors.purple}>
                    지문 예문
                  </PText>
                </Pressable>
              ) : null}
              {ex && open === i ? (
                <PText style={styles.ex} color={SUB}>
                  {ex}
                </PText>
              ) : null}
            </View>
          ))}
        </View>
      </Body>
      <Foot>
        <FootRow>
          <GoBtn label={n >= t.need ? `예문 ${n}개 완성` : `예문 ${n}/${t.need}`} disabled={n < t.need} onPress={done} />
        </FootRow>
      </Foot>
    </>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 12 },
  box: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, paddingVertical: 12, paddingHorizontal: 14, gap: 8, boxShadow: `3px 3px 0 ${Colors.ink}` },
  boxOn: { backgroundColor: '#FFF6BF' },
  head: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  ok: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#C9C2B3', alignItems: 'center', justifyContent: 'center' },
  okOn: { backgroundColor: Colors.yellow, borderColor: Colors.ink },
  w: { fontSize: 16, lineHeight: 22, fontWeight: '900' },
  m: { fontSize: 12.5, lineHeight: 18, fontWeight: '700' },
  input: { minHeight: 52, borderWidth: 1.5, borderColor: Colors.line, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 11, fontSize: 14.5, lineHeight: 21, fontWeight: '600', color: Colors.ink, backgroundColor: Colors.cream, textAlignVertical: 'top' },
  exBtn: { fontSize: 12, lineHeight: 17, fontWeight: '800' },
  ex: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
});
