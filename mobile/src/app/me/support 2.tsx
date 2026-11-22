import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AccountPage, Box, ChoiceChip, Head, Icon, TextLink, UnderTabs, type IconName } from '@/components/account/parts';
import { addAsk, useAsks } from '@/components/account/store';
import { Button } from '@/components/ui/button';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { ASK_TYPES, BRANCH_PHONE, FAQ, FAQ_CATS, type Ask } from '@/data/account';
import { sfx } from '@/lib/feedback';
import { useMe } from '@/state/me';

/**
 * 고객센터 (프로토타입 helpHTML · askHTML).
 * - 기본: 자주 묻는 질문(찾기 · 분류 칩 · 펼치는 답 · 도움이 됐어요 / 문의하기) + 1:1 문의 · 카카오톡 상담 · 내 지점 전화
 * - ?view=faq: 자주 묻는 질문만 · ?view=ask(&type=): 1:1 문의 (문의하기 · 내 문의)
 * 맞는 API: 93 `/faq` · 94 `/me/inquiries`
 */
export default function SupportScreen() {
  const { view, type } = useLocalSearchParams<{ view?: string; type?: string }>();
  if (view === 'ask') return <AskView type={type} />;
  return <HelpView faqOnly={view === 'faq'} />;
}

function HelpView({ faqOnly }: { faqOnly: boolean }) {
  const me = useMe();
  const asks = useAsks();
  const [cat, setCat] = useState('전체');
  const [q, setQ] = useState('');
  const [openQ, setOpenQ] = useState<string | null>(null);
  const qy = q.trim();
  const L = FAQ.filter((x) => (cat === '전체' || x[0] === cat) && (!qy || (x[1] + x[2]).includes(qy)));
  const ask = () => {
    sfx('tap');
    router.push({ pathname: '/me/support', params: { view: 'ask' } });
  };
  const ways: [IconName, string, string, () => void][] = [
    ['edit', '1:1 문의하기', `보통 하루 안에 답해요 · 내 문의 ${asks.length}건`, ask],
    ['cmt', '카카오톡 상담', '평일 10:00 ~ 19:00', () => showToast('카카오톡 PALLO 채널로 이어져요')],
    ['phone', '내 지점 전화', `${me.branch} · ${BRANCH_PHONE}`, () => showToast(`${me.branch}에 전화를 걸어요`)],
  ];

  return (
    <AccountPage title={faqOnly ? '자주 묻는 질문' : '고객센터'} bodyStyle={styles.body}>
      <View style={styles.find}>
        <Icon name="search" size={16} />
        <TextInput value={q} onChangeText={setQ} placeholder="궁금한 걸 찾아요 · 예) 환불, 연기" placeholderTextColor="#9B94A6" autoComplete="off" accessibilityLabel="자주 묻는 질문 찾기" style={styles.findIn} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsWrap} contentContainerStyle={styles.chips}>
        {FAQ_CATS.map((k) => {
          const on = cat === k;
          return (
            <Pressable
              key={k}
              onPress={() => {
                sfx('tap');
                setCat(k);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.chip, on && styles.chipOn]}>
              <PText style={styles.chipText} color={on ? Colors.white : Colors.ink}>
                {k}
              </PText>
            </Pressable>
          );
        })}
      </ScrollView>
      {L.length ? (
        L.map(([c, t, a]) => {
          const on = openQ === t;
          return (
            <View key={t} style={styles.q}>
              <Pressable
                onPress={() => {
                  sfx('tap');
                  setOpenQ(on ? null : t);
                }}
                accessibilityRole="button"
                accessibilityState={{ expanded: on }}>
                <PText style={styles.tg}>{c}</PText>
                <PText style={styles.qB}>{t}</PText>
              </Pressable>
              {on ? (
                <>
                  <PText style={styles.a}>{a}</PText>
                  <View style={styles.ft}>
                    <TextLink label="도움이 됐어요" onPress={() => showToast('알려 줘서 고마워요')} />
                    <TextLink label="문의하기 ›" onPress={ask} />
                  </View>
                </>
              ) : null}
            </View>
          );
        })
      ) : (
        <PText style={styles.empty}>{`‘${qy}’에 맞는 답이 없어요.\n1:1 문의로 물어봐 주세요.`}</PText>
      )}
      {faqOnly ? null : (
        <>
          <Head>더 도움이 필요하면</Head>
          <Box style={styles.go}>
            {ways.map(([ic, b, s, on], i) => (
              <Pressable key={b} onPress={on} accessibilityRole="button" style={({ pressed }) => [styles.goRow, i > 0 && styles.line, pressed && styles.pressed]}>
                <Icon name={ic} size={18} color={Colors.inkSub} />
                <View style={styles.flex}>
                  <PText style={styles.goB}>{b}</PText>
                  <PText style={styles.goS}>{s}</PText>
                </View>
                <PText style={styles.chev}>›</PText>
              </Pressable>
            ))}
          </Box>
        </>
      )}
    </AccountPage>
  );
}

/** 11.22 처럼 오늘 날짜 */
function todayMD() {
  const now = new Date();
  return `${now.getMonth() + 1}.${String(now.getDate()).padStart(2, '0')}`;
}

/** 1:1 문의 (프로토타입 askHTML): 문의하기(유형 · 내용) / 내 문의(답변 대기 · 답변 완료, 펼쳐서 답 보기) */
function AskView({ type }: { type?: string }) {
  const asks = useAsks();
  const [tab, setTab] = useState<'new' | 'list'>('new');
  const [aty, setAty] = useState(type && ASK_TYPES.includes(type) ? type : ASK_TYPES[0]);
  const [text, setText] = useState('');
  const [openA, setOpenA] = useState<number | null>(null);
  const send = () => {
    const t = text.trim();
    if (t.length < 5) {
      showToast('내용을 조금 더 적어 주세요');
      return;
    }
    const a: Ask = { t: aty, q: t.slice(0, 40), d: todayMD(), st: '답변 대기' };
    addAsk(a);
    setText('');
    setTab('list');
    sfx('save');
    showToast('문의를 보냈어요 · 답이 오면 알림으로 알려 드려요');
  };

  return (
    <AccountPage title="1:1 문의" bodyStyle={styles.askBody} footer={tab === 'new' ? <Button label="보내기" wide onPress={send} /> : undefined}>
      <View style={styles.tabsBleed}>
        <UnderTabs
          tabs={[
            ['new', '문의하기'],
            ['list', `내 문의 ${asks.length}`],
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      {tab === 'new' ? (
        <>
          <PText style={styles.lb}>어떤 문의인가요?</PText>
          <View style={styles.pills}>
            {ASK_TYPES.map((k) => (
              <ChoiceChip key={k} label={k} on={aty === k} onPress={() => setAty(k)} />
            ))}
          </View>
          <PText style={[styles.lb, styles.lb2]}>내용</PText>
          <TextInput value={text} onChangeText={setText} multiline placeholder="언제, 어떤 화면에서, 무엇이 문제였는지 적어 주세요" placeholderTextColor="#9B94A6" accessibilityLabel="내용" style={styles.ta} />
        </>
      ) : (
        asks.map((x, i) => {
          const on = openA === i;
          return (
            <View key={`${x.d}${x.q}${i}`} style={styles.q}>
              <Pressable
                onPress={() => {
                  sfx('tap');
                  setOpenA(on ? null : i);
                }}
                accessibilityRole="button"
                accessibilityState={{ expanded: on }}>
                <PText style={styles.tg}>{`${x.t} · ${x.d}`}</PText>
                <PText style={styles.qB}>{x.q}</PText>
                <PText style={[styles.st, x.st === '답변 완료' ? styles.stOk : null]}>{x.st}</PText>
              </Pressable>
              {on ? <PText style={styles.a}>{x.a ?? '답변을 기다리고 있어요. 답이 오면 알림으로 알려 드려요.'}</PText> : null}
            </View>
          );
        })
      )}
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.7 },
  body: { paddingTop: 14, paddingBottom: 40 },
  find: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 16, borderRadius: 24, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  findIn: { flex: 1, height: 44, fontFamily: Font.body700, fontSize: 14, color: Colors.ink },
  chipsWrap: { marginTop: 8, flexGrow: 0 },
  chips: { gap: 6 },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white, justifyContent: 'center' },
  chipOn: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  chipText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  q: { paddingVertical: 16, borderBottomWidth: 1.5, borderColor: Colors.line },
  tg: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.purple },
  qB: { marginTop: 3, fontFamily: Font.body900, fontSize: 15.5, lineHeight: 22 },
  a: { marginTop: 12, fontFamily: Font.body600, fontSize: 14.5, lineHeight: 23 },
  ft: { flexDirection: 'row', gap: 18, marginTop: 6 },
  st: { marginTop: 3, fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  stOk: { color: Colors.purple },
  empty: { paddingVertical: 30, textAlign: 'center', fontFamily: Font.body700, fontSize: 14, lineHeight: 21, color: Colors.inkSub },
  go: { paddingVertical: 2, paddingHorizontal: 14 },
  goRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 66, paddingVertical: 10 },
  line: { borderTopWidth: 1.5, borderColor: Colors.line },
  goB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  goS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  chev: { fontFamily: Font.body900, fontSize: 15, color: Colors.inkSub },
  askBody: { paddingTop: 0, paddingBottom: 40 },
  tabsBleed: { marginHorizontal: -16, marginBottom: 8 },
  lb: { marginTop: 10, marginBottom: 8, fontFamily: Font.body900, fontSize: 13, lineHeight: 19 },
  lb2: { marginTop: 0 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 6 },
  ta: { minHeight: 76, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, fontFamily: Font.body600, fontSize: 14, color: Colors.ink, textAlignVertical: 'top' },
});
