import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Appear } from '@/components/ui/appear';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import { markParts, type Split } from './text';
import type { Ask, CardBlock, Head, SayExtra } from './types';
import { AskBubble, BgText, CardHead, ChkRow, CmpBox, IMG, MarkBtn, PINK_INK, Spk, SUB, TkHead, UsedList } from './ui';

/** 문제 윗부분 (프로토타입 tkHead): 머리 · 묻는 말풍선 · 카드 */
export function TopPart({ head, ask, card, soundOff }: { head?: Head; ask?: Ask; card?: CardBlock; soundOff: boolean }) {
  return (
    <>
      {head ? <TkHead head={head} /> : null}
      {ask ? <AskBubble ask={ask} soundOff={soundOff} /> : null}
      {card ? <CardView card={card} soundOff={soundOff} /> : null}
    </>
  );
}

export function CardView({ card, soundOff }: { card: CardBlock; soundOff: boolean }) {
  switch (card.kind) {
    case 'kw2':
      // .tk-kw2: 키워드 두 장 (두 번째는 연분홍) · ★ 다음 회차 복습 단어
      return (
        <View style={styles.kw2}>
          {card.items.map((x, i) => (
            <View key={x.w} style={StyleSheet.flatten([styles.kwCard, i === 1 && styles.kwCard2])}>
              <PText style={styles.kwW}>
                {x.w}
                {x.star ? <PText style={styles.kwW} color="#C9A800">{' ★'}</PText> : null}
              </PText>
              <PText style={styles.kwM} color={SUB}>
                {x.m}
              </PText>
            </View>
          ))}
        </View>
      );
    case 'chips':
      return <ChkRow center label={card.label} items={card.items.map((t) => ({ t, on: card.on }))} />;
    case 'bg':
      return <BgText text={card.text} />;
    case 'before':
      return <CmpBox label={card.label} text={card.text} />;
    case 'plain':
      return (
        <View style={styles.card}>
          <CardHead label={card.label}>
            <Spk text={card.en} soundOff={soundOff} />
          </CardHead>
          <PText style={styles.plain}>{card.en}</PText>
        </View>
      );
    case 'useful':
      return (
        <View style={styles.ex}>
          <PText style={styles.exKo} color={SUB}>
            {card.label}
          </PText>
          <PText style={styles.exEn}>{card.en}</PText>
        </View>
      );
  }
}

/** 형광펜 글 (키워드 · 표현 부분) */
export function Marked({ text, marks, style }: { text: string; marks?: RegExp[]; style?: object }) {
  return (
    <PText style={StyleSheet.flatten([styles.mine, style])}>
      {markParts(text, marks).map((p, i) =>
        p.on ? (
          <PText key={i} style={StyleSheet.flatten([styles.mine, style, styles.hl])}>
            {p.t}
          </PText>
        ) : (
          p.t
        ),
      )}
    </PText>
  );
}

/** 칸 나누기 결과 .tk-split — 빈 칸은 분홍 점선 */
const SPLIT_BG = [Colors.yellow, '#F6CBD6', '#D9CDF3', '#C9D6F2'];
export function SplitView({ split }: { split: Split }) {
  return (
    <View style={styles.split}>
      {split.slots.map((x, i) => (
        <Appear key={x.key} kind="tkRise" delay={i * 90}>
          <View style={StyleSheet.flatten([styles.slot, x.text ? { backgroundColor: SPLIT_BG[i], boxShadow: `3px 3px 0px ${Colors.ink}` } : styles.slotOff])}>
            <PText style={styles.slotK}>{`문장 ${i + 1} · ${x.label}`}</PText>
            {x.text ? (
              <PText style={styles.slotT}>{x.text}</PText>
            ) : (
              <>
                <PText style={styles.slotEm} color={PINK_INK}>
                  이 문장이 비어 있어요
                </PText>
                {x.ex ? <PText style={styles.slotEx}>{`예) ${x.ex}`}</PText> : null}
              </>
            )}
          </View>
        </Appear>
      ))}
    </View>
  );
}

/** 모범 답 · 예문 카드 .tk-model (듣기 + 표현 저장) */
export function ModelCard({ label, en, ko, soundOff, source }: { label: string; en: string; ko?: string; soundOff: boolean; source: string }) {
  return (
    <View style={styles.card}>
      <CardHead label={label}>
        <Spk text={en} soundOff={soundOff} />
        <MarkBtn en={en} ko={ko ?? label} source={source} />
      </CardHead>
      <PText style={styles.sent}>{en}</PText>
      {ko ? (
        <PText style={styles.ko} color={SUB}>
          {ko}
        </PText>
      ) : null}
    </View>
  );
}

/** 문장 업그레이드 .tk-upg */
export function UpgradeCard({ from, to, ko, soundOff, source }: { from: string; to: string; ko: string; soundOff: boolean; source: string }) {
  return (
    <View style={styles.card}>
      <CardHead label="문장 업그레이드">
        <Spk text={to} soundOff={soundOff} />
        <MarkBtn en={to} ko={ko} source={source} />
      </CardHead>
      <PText style={styles.upFrom} color={SUB}>
        {from}
      </PText>
      <PText style={styles.upTo} color={Colors.purple}>
        {to}
      </PText>
      <PText style={styles.upKo} color={SUB}>
        {ko}
      </PText>
    </View>
  );
}

/** 팔로의 꼬리 질문 .tk-fq */
export function FollowBubble({ en, ko }: { en: string; ko: string }) {
  return (
    <View style={styles.fq}>
      <Image source={IMG.purple} style={styles.fqImg} contentFit="contain" />
      <View style={styles.fqBub}>
        <PText style={styles.fqK} color={Colors.purple}>
          팔로의 꼬리 질문
        </PText>
        <PText style={styles.fqB}>{en}</PText>
        <PText style={styles.fqS} color={SUB}>
          {ko}
        </PText>
        <View style={styles.fqTail} />
      </View>
    </View>
  );
}

/** 정답 카드 .st-anscards: 정답 문장이 단어 카드로 하나씩 날아와요 */
export function AnsCards({ sentence, label = '정답 · 카드로 맞춰 볼게요', soundOff }: { sentence: string; label?: string; soundOff: boolean }) {
  const ws = sentence.trim().split(/\s+/).filter(Boolean);
  return (
    <View style={styles.ans} accessibilityLabel={`정답 ${sentence}`}>
      <PText style={styles.ansK} color={SUB}>
        {label}
      </PText>
      <View style={styles.ansLine}>
        {ws.map((w, i) => (
          <Appear key={i} kind="linkUp" delay={i * 110}>
            <View style={styles.wc}>
              <PText style={styles.wcT}>{w}</PText>
            </View>
          </Appear>
        ))}
      </View>
      <View style={styles.ansSpk}>
        <Spk text={sentence} soundOff={soundOff} label="정답 듣기" />
      </View>
    </View>
  );
}

/** 말한 뒤 결과 아래 더 보여 줄 것: AI가 정리한 저널 · 질문 날카로움 */
export function ExtraView({ extra, soundOff }: { extra: SayExtra; soundOff: boolean }) {
  if (extra.kind === 'journal')
    return (
      <>
        <View style={styles.card}>
          <CardHead label={`AI가 정리한 저널 · ${extra.date}`}>
            <Spk text={extra.text} soundOff={soundOff} />
          </CardHead>
          <Marked text={extra.text} marks={extra.marks} />
          <ChkRow label="오늘 단어" items={extra.use.map((w) => ({ t: w, on: extra.used.includes(w) }))} />
        </View>
        <UsedList
          title={`고칠 문장 ${Math.min(2, extra.fixes.length)}개`}
          items={
            extra.fixes.length
              ? extra.fixes.slice(0, 2).map(([a, b]) => ({ l: '', on: true, sub: <FixLine a={a} b={b} /> }))
              : [{ l: '고칠 곳이 없어요! 키워드를 하나 더 넣어 볼까요?', on: true }]
          }
        />
      </>
    );
  return (
    <>
      <View style={styles.score}>
        <PText style={styles.scoreK} color={SUB}>
          질문 날카로움
        </PText>
        <PText style={styles.scoreN}>
          {extra.n}
          <PText style={styles.scoreOf} color={SUB}>
            {' / 5'}
          </PText>
        </PText>
        <PText style={styles.ko} color={SUB}>
          {extra.n >= 4 ? '상대가 쉽게 피할 수 없는 질문이에요' : '상대 주장의 단어를 짚고 If로 조건을 걸면 더 날카로워요'}
        </PText>
      </View>
      <AskBubble ask={{ who: extra.who, c: extra.c, en: extra.en, ko: extra.ko }} soundOff={soundOff} />
    </>
  );
}
const FixLine = ({ a, b }: { a: string; b: string }) => (
  <PText style={styles.fix}>
    <PText style={StyleSheet.flatten([styles.fix, styles.strike])} color={SUB}>
      {a}
    </PText>
    {' → '}
    <PText style={StyleSheet.flatten([styles.fix, styles.bold])}>{b}</PText>
  </PText>
);

const styles = StyleSheet.create({
  card: { gap: 10 },
  kw2: { flexDirection: 'row', gap: 10 },
  kwCard: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, boxShadow: `3px 3px 0px ${Colors.ink}`, gap: 4 },
  kwCard2: { backgroundColor: '#FBE1E8' },
  kwW: { fontFamily: Font.body900, fontSize: 19, lineHeight: 25, letterSpacing: -0.3 },
  kwM: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 17.5 },
  plain: { fontFamily: Font.display, fontSize: 22, lineHeight: 31.9, letterSpacing: -0.3, color: SUB, textDecorationLine: 'line-through' },
  ex: { backgroundColor: '#F6F1E4', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, gap: 3 },
  exKo: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  exEn: { fontFamily: Font.body800, fontSize: 14.5, lineHeight: 21.75 },
  mine: { fontFamily: Font.body800, fontSize: 16, lineHeight: 24.8 },
  hl: { backgroundColor: '#FFF1A8' },
  split: { gap: 8 },
  slot: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink },
  slotOff: { borderStyle: 'dashed', borderColor: PINK_INK, backgroundColor: Colors.white },
  slotK: { fontFamily: Font.display, fontSize: 10, lineHeight: 14, letterSpacing: 0.3, marginBottom: 2 },
  slotT: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20.3 },
  slotEm: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19 },
  slotEx: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 19.5, marginTop: 4 },
  sent: { fontFamily: Font.display, fontSize: 17, lineHeight: 24.65, letterSpacing: -0.3 },
  ko: { fontFamily: Font.body700, fontSize: 13, lineHeight: 18.85 },
  upFrom: { fontFamily: Font.body700, fontSize: 13.5, lineHeight: 19, textDecorationLine: 'line-through', textDecorationColor: 'rgba(194,65,107,0.6)' },
  upTo: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  upKo: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
  fq: { flexDirection: 'row', alignItems: 'flex-end', gap: 18, marginTop: 4 },
  fqImg: { width: 72, height: 62 },
  fqBub: { flex: 1, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, boxShadow: `3px 3px 0px ${Colors.ink}` },
  fqTail: { position: 'absolute', left: -8, bottom: 14, width: 14, height: 14, backgroundColor: Colors.white, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: Colors.ink, transform: [{ rotate: '45deg' }] },
  fqK: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 },
  fqB: { fontFamily: Font.body900, fontSize: 16, lineHeight: 20.8 },
  fqS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 17.5, marginTop: 2 },
  ans: { padding: 14, borderRadius: 18, backgroundColor: '#F1ECFB', gap: 8 },
  ansK: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, paddingRight: 40 },
  ansLine: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ansSpk: { position: 'absolute', top: 10, right: 10 },
  wc: { paddingVertical: 7, paddingHorizontal: 11, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow },
  wcT: { fontFamily: Font.body800, fontSize: 15, lineHeight: 20 },
  score: { padding: 16, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, boxShadow: `4px 4px 0px ${Colors.ink}`, gap: 4 },
  scoreK: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  scoreN: { fontFamily: Font.display, fontSize: 30, lineHeight: 36 },
  scoreOf: { fontFamily: Font.display, fontSize: 15, lineHeight: 20 },
  fix: { fontFamily: Font.body700, fontSize: 14, lineHeight: 20 },
  strike: { textDecorationLine: 'line-through' },
  bold: { fontFamily: Font.body900 },
});
