import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/errors';
import { faqQuery, myInquiriesQuery } from '@/api/queries';
import { INQUIRY_MAX, INQUIRY_STATUS_LABEL, inquiryChoices, inquiryContentOk, inquiryDate } from '@/api/support';
import { useMyBranchContact } from '@/api/use-branch-guide';
import { useCreateInquiry } from '@/api/use-create-inquiry';
import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { AccountPage, Box, ChoiceChip, Head, Icon, TextLink, UnderTabs, type IconName } from '@/components/account/parts';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { showToast, showWarnToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { openTel } from '@/lib/open-out';

/**
 * 자주 묻는 질문 (프로토타입 helpHTML · askHTML). 설정 › 자주 묻는 질문으로 들어와요.
 * - 기본: 자주 묻는 질문(펼치는 답 · 도움이 됐어요 / 문의하기) + 1:1 문의 · 카카오톡 상담 · 내 지점 전화
 *   (2026-11-26: 질문이 몇 개뿐이라 찾기 · 분류 칩은 뺐어요. 질문 내용은 app-hub FAQ 관리에서 본사가 정해요)
 *   (내 지점 전화는 연동된 지점이 콘솔 지점 안내에 적은 번호 — GET /me/branch-guides. 연동 전이거나 번호가 없으면 줄을 빼요)
 * - ?view=faq: 자주 묻는 질문만 · ?view=ask(&type=분류 코드): 1:1 문의 (문의하기 · 내 문의)
 * - ?view=ask&tab=list: 내 문의 탭부터 — 답변 알림(USER_INQUIRY)을 누르면 여기로 와요
 * - ?view=bug: 버그 보고 (마이 › 버그 보고) — 1:1 문의와 같은 화면, 분류는 '앱 오류'로 정해져 있어요
 * 데이터: 93 GET `/faq` · 94 GET · POST `/me/inquiries` (api/support — FAQ 내용 · 분류는 app-hub FAQ 관리에서 본사가 정해요)
 */
/** 버그 보고가 보내는 문의 분류 (app-hub FAQ 분류 '앱 오류') */
const BUG_CATEGORY = 'APP_ERROR';

export default function SupportScreen() {
  const { view, type, tab } = useLocalSearchParams<{ view?: string; type?: string; tab?: string }>();
  if (view === 'ask') return <AskView type={type} startOnList={tab === 'list'} />;
  if (view === 'bug') return <AskView type={BUG_CATEGORY} startOnList={false} bug />;
  return <HelpView faqOnly={view === 'faq'} />;
}

function HelpView({ faqOnly }: { faqOnly: boolean }) {
  const contact = useMyBranchContact().data ?? null;
  const faq = useQuery(faqQuery());
  // 문의 건수는 '더 도움이 필요하면' 칸에만 보여요
  const inquiries = useQuery({ ...myInquiriesQuery(), enabled: !faqOnly });
  const [openQ, setOpenQ] = useState<string | null>(null);
  const L = faq.data?.items ?? [];
  const ask = () => {
    sfx('tap');
    router.push({ pathname: '/me/support', params: { view: 'ask' } });
  };
  const askSub = inquiries.data ? `보통 하루 안에 답해요 · 내 문의 ${inquiries.data.length}건` : '보통 하루 안에 답해요';
  const ways: [IconName, string, string, () => void][] = [
    ['edit', '1:1 문의하기', askSub, ask],
    ['cmt', '카카오톡 상담', '평일 10:00 ~ 19:00', () => showToast('카카오톡 PALLO 채널로 이어져요')],
    ...(contact ? [['phone', '내 지점 전화', `${contact.branchName} · ${contact.phone}`, () => openTel(contact.phone)] as [IconName, string, string, () => void]] : []),
  ];

  return (
    <AccountPage title="자주 묻는 질문" bodyStyle={styles.body}>
      {faq.isPending ? (
        <LoadingState />
      ) : faq.isError ? (
        <ErrorState message={apiErrorMessage(faq.error)} onRetry={() => faq.refetch()} />
      ) : L.length ? (
        L.map((x) => {
          const on = openQ === x.id;
          return (
            <View key={x.id} style={styles.q}>
              <Pressable
                onPress={() => {
                  sfx('tap');
                  setOpenQ(on ? null : x.id);
                }}
                accessibilityRole="button"
                accessibilityState={{ expanded: on }}>
                <PText style={styles.qB}>{x.question}</PText>
              </Pressable>
              {on ? (
                <>
                  <PText style={styles.a}>{x.answer}</PText>
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
        <PText style={styles.empty}>{'아직 올라온 질문이 없어요.\n1:1 문의로 물어봐 주세요.'}</PText>
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

/**
 * 1:1 문의 (프로토타입 askHTML): 문의하기(분류 · 내용) / 내 문의(답변 대기 · 답변 완료, 펼쳐서 내용 · 답 보기).
 * bug: 버그 보고 — 제목 · 탭 이름만 바꾸고 분류 고르기는 숨겨요 (type 의 '앱 오류'로 보내요)
 */
function AskView({ type, startOnList, bug = false }: { type?: string; startOnList: boolean; bug?: boolean }) {
  const faq = useQuery(faqQuery());
  const inquiries = useQuery(myInquiriesQuery());
  const create = useCreateInquiry();
  const [tab, setTab] = useState<'new' | 'list'>(startOnList ? 'list' : 'new');
  // 아직 안 골랐으면(undefined) ?type= 의 분류 → 없으면 첫 분류
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const [text, setText] = useState('');
  const [openA, setOpenA] = useState<string | null>(null);
  const choices = inquiryChoices(faq.data?.categories ?? []);
  // 버그 보고는 '앱 오류' 분류가 없으면 기타(null)로
  const aty = picked !== undefined ? picked : (choices.find((c) => c.code === type) ?? (bug ? { code: null } : choices[0])).code;
  const send = () => {
    if (create.isPending) return;
    if (!inquiryContentOk(text)) {
      showWarnToast('내용을 조금 더 적어 주세요');
      return;
    }
    create.mutate(
      { categoryCode: aty, content: text.trim() },
      {
        onSuccess: () => {
          setText('');
          setTab('list');
          sfx('save');
          showToast(bug ? '알려 줘서 고마워요 · 고치면 알림으로 알려 드려요' : '문의를 보냈어요 · 답이 오면 알림으로 알려 드려요');
        },
        onError: (e) => showToast(apiErrorMessage(e)),
      },
    );
  };
  const count = inquiries.data?.length;

  return (
    <AccountPage title={bug ? '버그 보고' : '1:1 문의'} bodyStyle={styles.askBody} footer={tab === 'new' ? <Button label={create.isPending ? '보내는 중…' : '보내기'} wide disabled={create.isPending} onPress={send} /> : undefined}>
      <View style={styles.tabsBleed}>
        <UnderTabs
          tabs={[
            ['new', bug ? '보고하기' : '문의하기'],
            ['list', count === undefined ? '내 문의' : `내 문의 ${count}`],
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      {tab === 'new' ? (
        <>
          {bug ? null : (
            <>
              <PText style={styles.lb}>어떤 문의인가요?</PText>
              <View style={styles.pills}>
                {choices.map((c) => (
                  <ChoiceChip key={c.code ?? 'etc'} label={c.label} on={aty === c.code} onPress={() => setPicked(c.code)} />
                ))}
              </View>
            </>
          )}
          <PText style={[styles.lb, !bug && styles.lb2]}>{bug ? '어떤 문제가 있었나요?' : '내용'}</PText>
          <GrowInput value={text} onChangeText={setText} multiline maxLength={INQUIRY_MAX} placeholder="언제, 어떤 화면에서, 무엇이 문제였는지 적어 주세요" placeholderTextColor="#9B94A6" accessibilityLabel="내용" style={styles.ta} />
        </>
      ) : inquiries.isPending ? (
        <LoadingState />
      ) : inquiries.isError ? (
        <ErrorState message={apiErrorMessage(inquiries.error)} onRetry={() => inquiries.refetch()} />
      ) : inquiries.data.length === 0 ? (
        <EmptyState title="아직 보낸 문의가 없어요." />
      ) : (
        inquiries.data.map((x) => {
          const on = openA === x.id;
          return (
            <View key={x.id} style={styles.q}>
              <Pressable
                onPress={() => {
                  sfx('tap');
                  setOpenA(on ? null : x.id);
                }}
                accessibilityRole="button"
                accessibilityState={{ expanded: on }}>
                <PText style={styles.tg}>{`${x.categoryLabel ?? '기타'} · ${inquiryDate(x.createdAt)}`}</PText>
                <PText style={styles.qB}>{x.title}</PText>
                <PText style={[styles.st, x.status === 'ANSWERED' ? styles.stOk : null]}>{INQUIRY_STATUS_LABEL[x.status]}</PText>
              </Pressable>
              {on ? (
                <>
                  <PText style={styles.mine}>{x.content}</PText>
                  <PText style={styles.a}>{x.answer ?? '답변을 기다리고 있어요. 답이 오면 알림으로 알려 드려요.'}</PText>
                </>
              ) : null}
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
  body: { paddingTop: 14 },
  q: { paddingVertical: 16, borderBottomWidth: 1.5, borderColor: Colors.line },
  tg: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.purple },
  qB: { marginTop: 3, fontFamily: Font.body900, fontSize: 15.5, lineHeight: 22 },
  a: { marginTop: 12, fontFamily: Font.body600, fontSize: 14.5, lineHeight: 23 },
  mine: { marginTop: 12, fontFamily: Font.body600, fontSize: 14.5, lineHeight: 23, color: Colors.inkSub },
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
  askBody: { paddingTop: 0 },
  tabsBleed: { marginHorizontal: -16, marginBottom: 8 },
  lb: { marginTop: 10, marginBottom: 8, fontFamily: Font.body900, fontSize: 13, lineHeight: 19 },
  lb2: { marginTop: 0 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 6 },
  ta: { minHeight: 76, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, fontFamily: Font.body600, fontSize: 14, color: Colors.ink, textAlignVertical: 'top' },
});
