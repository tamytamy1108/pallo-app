import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';

import { Body, Foot, useRunner } from '../frame';
import { TopPart } from '../parts';
import { aiFix, phraseRe, upgradeOf, words } from '../text';
import type { ExprsTask } from '../types';
import { EndMsg, EndNote, FootRow, GoBtn, Msg, Spk, SUB } from '../ui';
import { Appear } from '@/components/ui/appear';

/**
 * 표현마다 칸 하나 · 그 표현을 넣어 내 예문 만들기 (프로토타입 TKV.exprs · v503).
 * 칸에 표현이 들어가고 4단어 이상이면 노랗게 (두 줄일 필요는 없어요). need 개 이상이면 아래 버튼이 켜져요.
 */
export function ExprsBlock({ task: t }: { task: ExprsTask }) {
  const rt = useRunner();
  const [v, setV] = useState<Record<number, string>>({});
  const [open, setOpen] = useState<number | null>(null);
  // 다 쓰면 검수 화면: 칸마다 교정 · 더 좋은 문장 · 지문 예문
  const [review, setReview] = useState(false);
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
    setReview(true);
  };
  if (review) {
    const rows = t.items.map(([w, m, ex], i) => ({ w, m, ex, mine: (v[i] ?? '').trim() })).filter((r) => r.mine);
    const fixN = rows.filter((r) => aiFix(r.mine, []).changed).length;
    return (
      <>
        <Body>
          <TopPart soundOff={rt.soundOff} />
          <Msg text="AI가 내 예문을 검수했어요" />
          {rows.map((r, k) => {
            const F = aiFix(r.mine, []);
            const up = upgradeOf(F.text);
            const used = phraseRe(r.w).test(r.mine);
            return (
              <Appear key={r.w} kind="tkRise" delay={k * 90}>
                <View style={styles.rv}>
                  <View style={styles.head}>
                    <PText style={styles.w}>{r.w}</PText>
                    <PText style={styles.m} color={SUB}>
                      {r.m}
                    </PText>
                  </View>
                  <PText style={styles.mine} color={SUB}>
                    {r.mine}
                  </PText>
                  {!used ? <Note k="표현 넣기" color="#C2416B" bg="#FBE1E8" text={`‘${r.w}’가 들어가야 해요`} /> : null}
                  {F.changed ? <Note k={`교정 · ${F.why.join(' / ') || '문장 다듬기'}`} color="#2F6B2A" bg="#EAF6E7" text={F.text} soundOff={rt.soundOff} /> : used ? <Note k="좋아요" color="#2F6B2A" bg="#EAF6E7" text="고칠 곳이 없어요" /> : null}
                  {up ? <Note k={`더 자연스럽게 · ${up.ko}`} color={Colors.purple} bg="#F1ECFB" text={up.to} soundOff={rt.soundOff} /> : null}
                  {r.ex ? <Note k="지문에서는" color={SUB} bg={Colors.cream} text={r.ex} soundOff={rt.soundOff} /> : null}
                </View>
              </Appear>
            );
          })}
        </Body>
        <Foot>
          <EndNote good={fixN === 0}>
            <EndMsg rest={fixN === 0 ? `완벽해요! 예문 ${rows.length}개 모두 바르게 썼어요` : `좋아요! 고친 문장 ${fixN}개를 소리 내어 읽어 봐요`} good={fixN === 0} />
          </EndNote>
          <FootRow>
            <GoBtn label={rt.goLabel} onPress={rt.next} />
          </FootRow>
        </Foot>
      </>
    );
  }
  return (
    <>
      <Body>
        <TopPart soundOff={rt.soundOff} />
        <Msg text={`표현을 넣어 내 예문을 만들어요 · ${t.need}개 이상`} />
        <View style={styles.grid}>
          {t.items.map(([w, m, ex], i) => (
            <View key={w} style={StyleSheet.flatten([styles.box, ok(i) && styles.boxOn])}>
              <View style={styles.head}>
                <PText style={styles.w}>{w}</PText>
                <PText style={styles.m} color={SUB}>
                  {m}
                </PText>
              </View>
              <GrowInput
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

/** 검수 한 줄 (이름 · 문장 · 듣기) */
function Note({ k, text, color, bg, soundOff }: { k: string; text: string; color: string; bg: string; soundOff?: boolean }) {
  return (
    <View style={StyleSheet.flatten([styles.note, { backgroundColor: bg }])}>
      <View style={styles.noteT}>
        <PText style={styles.noteK} color={color}>
          {k}
        </PText>
        <PText style={styles.noteB}>{text}</PText>
      </View>
      {soundOff !== undefined ? <Spk text={text} soundOff={soundOff} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 12 },
  box: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, paddingVertical: 12, paddingHorizontal: 14, gap: 8, boxShadow: `3px 3px 0 ${Colors.ink}` },
  boxOn: { backgroundColor: '#FFF6BF' },
  head: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  w: { fontSize: 16, lineHeight: 22, fontWeight: '900' },
  m: { fontSize: 12.5, lineHeight: 18, fontWeight: '700' },
  input: { minHeight: 52, borderWidth: 1.5, borderColor: Colors.line, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 11, fontSize: 14.5, lineHeight: 21, fontWeight: '600', color: Colors.ink, backgroundColor: Colors.cream, textAlignVertical: 'top' },
  exBtn: { fontSize: 12, lineHeight: 17, fontWeight: '800' },
  ex: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  rv: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, padding: 14, gap: 8, boxShadow: `3px 3px 0 ${Colors.ink}`, marginBottom: 4 },
  mine: { fontSize: 14.5, lineHeight: 21, fontWeight: '700' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12 },
  noteT: { flex: 1, gap: 2 },
  noteK: { fontSize: 11.5, lineHeight: 16, fontWeight: '900' },
  noteB: { fontSize: 14.5, lineHeight: 21, fontWeight: '800' },
});
