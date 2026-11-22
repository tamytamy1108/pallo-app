import { Image } from "expo-image";
import * as Tts from "expo-speech";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { MicIcon } from "@/components/lesson/icons";
import { PText } from "@/components/ui/text";
import { showToast } from "@/components/ui/toast";
import { Font } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { STEPS34, type Lv3Unit } from "@/data/lessons34";
import { sfx } from "@/lib/feedback";
import { useSpeech } from "@/lib/speech";
import { useLearnPrefs } from "@/state/learn-prefs";
import { isDone, stepKey } from "@/state/progress";

import { leave34, type StepCtx } from "../finish";
import { answers, setAns } from "../store";
import { capFirst, nrm, sentN, wordRe, words } from "../text";
import {
  ChkRow,
  GoBtn,
  IMG,
  MarkBtn,
  ModeTabs,
  Spk,
  SUB,
  UsedList,
  sayEn,
} from "../ui";
import { PCard, PFoot, Stats } from "./common";
import type { PageApi } from "./study-shell";

type Msg = {
  me?: boolean;
  en: string;
  ko?: string;
  fixed?: string;
  why?: string;
  kw?: Record<string, 1>;
};
type Mode = "voice" | "write";
const L3_REACT = [
  "Oh, interesting!",
  "I see.",
  "Nice!",
  "That makes sense.",
  "Ha, I totally get that.",
  "Good point.",
];

/**
 * 본학습 AI 대화 · DAILY TOPIC (프로토타입 STEP_VIEW.dtalk — 대본 규칙. 실제 앱은 `/ai/talk`).
 * 질문 6개를 차례로 · 질문마다 꼬리 질문 · 짧으면 더 말해 달라고 · 주제 밖이면 다시 데려와요.
 * 예습(별표)이 있으면 그 순서로 바로, 없으면 질문 3개 고르기. 내 답은 저장 → 복습 Before / After.
 */
export function DailyTalk({
  ctx,
  D,
  api,
}: {
  ctx: StepCtx;
  D: Lv3Unit;
  api: PageApi;
}) {
  const Q = D.daily;
  const { noSpeak } = useLearnPrefs();
  const [prep] = useState(() =>
    STEPS34[3].pre.every((s) => isDone(stepKey(ctx.lv, ctx.unit, s.id))),
  );
  const [stars] = useState(() =>
    (
      (answers().ans[stepKey(ctx.lv, ctx.unit, "pick6")]?.[0] as
        number[] | undefined) ?? []
    ).filter((i) => i != null),
  );
  const [sel, setSel] = useState<number[]>([]);
  // 예습에서 별표한 질문이 있으면 그 순서로 바로 시작
  const [order, setOrder] = useState<number[] | null>(() =>
    stars.length
      ? [...stars, ...Q.map((_, i) => i).filter((i) => !stars.includes(i))]
      : null,
  );
  const [p, setP] = useState(0);
  const [fu, setFu] = useState(0);
  const [nudged, setNudged] = useState<Record<number, 1>>({});
  const [steer, setSteer] = useState<Record<number, 1>>({});
  const opener = (q: { en: string; ko: string }): Msg => ({
    en: `Hi! Let’s talk about your life right now. First question: ${q.en}`,
    ko: `첫 질문 · ${q.ko}`,
  });
  const [log, setLog] = useState<Msg[]>(() =>
    order ? [opener(Q[order[0]])] : [],
  );
  const [used, setUsed] = useState<Record<string, 1>>({});
  const [fixes, setFixes] = useState<[string, string, string][]>([]);
  const [ans, setAnsLocal] = useState<Record<number, string[]>>({});
  const [all, setAll] = useState(false);
  const [extra, setExtra] = useState(false);
  const [done, setDone] = useState(false);
  const [cm, setCm] = useState<Mode>(noSpeak ? "write" : "voice");
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const speech = useSpeech({ onText: (text) => setDraft(text) });

  useEffect(() => () => void Tts.stop(), []);

  const ai = (en: string, ko: string) => {
    setLog((l) => [...l, { en, ko }]);
    setTimeout(() => sayEn(en, api.soundOff, 0.95), 250);
  };
  const begin = (o: number[]) => {
    setOrder(o);
    const m = opener(Q[o[0]]);
    ai(m.en, m.ko ?? "");
  };
  useEffect(() => {
    if (log[0]) {
      const tm = setTimeout(() => sayEn(log[0].en, api.soundOff, 0.95), 250);
      return () => clearTimeout(tm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noPre = !prep ? (
    <View style={st.nopre}>
      <PText style={st.nopreT} color="#B4233A">
        {order
          ? "예습을 안 했어요 · 키워드를 눌러 뜻을 봐요"
          : "예습을 안 했어요 · 키워드를 미리 보면 더 쉬워요"}
      </PText>
      {!order ? (
        <Pressable onPress={leave34} accessibilityRole="link" hitSlop={8}>
          <PText style={st.nopreA} color={Colors.purple}>
            예습 하기
          </PText>
        </Pressable>
      ) : null}
    </View>
  ) : null;

  // ---- 시작 전: 질문 3개 고르기 ----
  if (!order) {
    const tap = (i: number) => {
      if (sel.includes(i)) setSel(sel.filter((x) => x !== i));
      else if (sel.length >= 3) {
        showToast("3개까지 골라요");
        return;
      } else setSel([...sel, i]);
      sfx("tap");
    };
    return (
      <>
        <ScrollView
          style={st.flex}
          contentContainerStyle={st.body}
          showsVerticalScrollIndicator={false}
        >
          {noPre}
          <PText style={st.intro} color={SUB}>
            AI와 오늘의 DAILY TOPIC 질문으로 이야기해요. 끌리는 질문 3개를
            고르면 그 순서로 시작해요.
          </PText>
          {Q.map((q, i) => {
            const on = sel.includes(i);
            return (
              <Pressable
                key={i}
                onPress={() => tap(i)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={q.en}
              >
                <PCard style={StyleSheet.flatten([st.q, on && st.qOn])}>
                  <View style={StyleSheet.flatten([st.star, on && st.starOn])}>
                    <PText style={st.starT}>
                      {on ? String(sel.indexOf(i) + 1) : ""}
                    </PText>
                  </View>
                  <View style={st.flex}>
                    <PText style={st.qn} color={SUB}>{`Q${i + 1}`}</PText>
                    <PText style={st.qb}>{q.en}</PText>
                    <PText style={st.qe} color={SUB}>
                      {q.ko}
                    </PText>
                  </View>
                </PCard>
              </Pressable>
            );
          })}
        </ScrollView>
        <PFoot>
          <View style={st.row2}>
            <Pressable
              onPress={() => begin(Q.map((_, i) => i))}
              accessibilityRole="button"
              style={st.any}
            >
              <PText style={st.anyT}>그냥 시작</PText>
            </Pressable>
            <View style={st.flex2}>
              <GoBtn
                label={
                  sel.length ? `고른 ${sel.length}개로 시작` : "질문을 골라요"
                }
                disabled={!sel.length}
                onPress={() =>
                  begin([
                    ...sel,
                    ...Q.map((_, i) => i).filter((i) => !sel.includes(i)),
                  ])
                }
              />
            </View>
          </View>
        </PFoot>
      </>
    );
  }

  const qi = order[Math.min(p, order.length - 1)];
  const q = Q[qi];
  const answered = Object.keys(ans).length;
  const usedN = Object.keys(used).length;
  const rev = log.slice().reverse();

  // ---- 대화 끝 · 정리 ----
  if (done) {
    const mine = log.filter((m) => m.me);
    const best = mine
      .slice()
      .sort(
        (a, b) =>
          Object.keys(b.kw ?? {}).length - Object.keys(a.kw ?? {}).length ||
          words(b.en) - words(a.en),
      )[0];
    const bestEn = best ? best.fixed || best.en : "";
    return (
      <>
        <ScrollView
          style={st.flex}
          contentContainerStyle={st.body}
          showsVerticalScrollIndicator={false}
        >
          <Stats
            items={[
              [`${answered}/6`, "질문"],
              [String(mine.length), "내 발화"],
              [`${usedN}/12`, "키워드"],
            ]}
          />
          <UsedList
            title="질문별 내 답"
            items={Q.flatMap((qq, i) =>
              ans[i]
                ? [
                    {
                      l: "",
                      on: true,
                      sub: <QAns ko={`Q${i + 1} · ${qq.ko}`} en={ans[i][0]} />,
                    },
                  ]
                : [],
            )}
          />
          <ChkRow
            label="키워드"
            items={D.keywords.map(([w]) => ({ t: w, on: !!used[w] }))}
          />
          {fixes.length ? (
            <UsedList
              title={`AI가 고쳐 준 문장 ${fixes.length}개`}
              items={fixes.map(([a, b, why]) => ({
                l: "",
                on: true,
                sub: <FixAns a={a} b={b} why={why} />,
              }))}
            />
          ) : null}
          {best ? (
            <View style={st.best}>
              <View style={st.flex}>
                <PText style={st.bestK} color={SUB}>
                  오늘의 내 문장
                </PText>
                <PText style={st.bestB}>{bestEn}</PText>
              </View>
              <Spk text={bestEn} soundOff={api.soundOff} />
              <MarkBtn en={bestEn} ko="" source={ctx.source} />
            </View>
          ) : null}
        </ScrollView>
        <PFoot>
          <GoBtn label="대화 완료" onPress={() => api.finish()} />
        </PFoot>
      </>
    );
  }

  const send = () => {
    speech.stop();
    const v = draft.trim();
    if (!v) {
      showToast(
        cm === "voice" ? "마이크를 누르고 말해 보세요" : "영어로 적어 주세요",
      );
      return;
    }
    const x = nrm(v);
    const msg: Msg = { me: true, en: v, kw: {} };
    const nextUsed = { ...used };
    D.keywords.forEach(([w]) => {
      if (wordRe(w).test(x)) {
        nextUsed[w] = 1;
        msg.kw = { ...msg.kw, [w]: 1 };
      }
    });
    for (const [re, fx, why] of D.live)
      if (re.test(x)) {
        msg.fixed = capFirst(fx(x));
        msg.why = why;
        setFixes((f) => [...f, [v, msg.fixed ?? "", why]]);
        break;
      }
    setUsed(nextUsed);
    setLog((l) => [...l, msg]);
    setAnsLocal((a) => ({ ...a, [qi]: [...(a[qi] ?? []), v] }));
    setDraft("");
    sfx("send");
    const shortA = sentN(v) < 3 && words(v) < 20;
    const offT =
      !q.tw.test(v) && !Object.keys(msg.kw ?? {}).length && words(v) >= 5;
    const R = L3_REACT[(log.length + 1 + qi) % L3_REACT.length];
    if (offT && !steer[qi]) {
      setSteer({ ...steer, [qi]: 1 });
      ai(
        `Ha, that sounds fun! But back to the question — ${q.en}`,
        "재밌네요! 그런데 다시 질문으로 돌아가 볼게요",
      );
    } else if (shortA && !nudged[qi]) {
      setNudged({ ...nudged, [qi]: 1 });
      const [w, , ex] = D.keywords[q.kw[0]];
      if (prep)
        ai(
          "Tell me more — why? Can you give me an example?",
          "조금 더 말해 줄래요? 왜요? 예를 들어 줄래요?",
        );
      else
        ai(
          `Tell me more! For example: “${ex}” Now your turn — try using “${w}”.`,
          `예시를 보고 ‘${w}’를 넣어 3문장으로 말해 봐요`,
        );
    } else if (extra) {
      ai(
        `${R} Thanks for sharing more. Pick another question below, or finish the chat.`,
        "좋아요! 아래에서 다른 질문을 고르거나 대화를 마쳐요",
      );
      setExtra(false);
    } else if (fu < q.fq.length) {
      const [en, ko] = q.fq[fu];
      setFu(fu + 1);
      ai(`${R} ${en}`, ko);
    } else if (p < order.length - 1 && p < 5) {
      setP(p + 1);
      setFu(0);
      const nq = Q[order[p + 1]];
      ai(`${R} Okay, next one — ${nq.en}`, `다음 질문 · ${nq.ko}`);
    } else {
      setAll(true);
      ai(
        `${R} That’s all six questions! Want to keep talking about any of them? Pick one below, or finish the chat.`,
        "6개를 다 했어요! 더 이야기할 질문을 고르거나 대화를 마쳐요",
      );
    }
  };
  const more = (i: number) => {
    setExtra(true);
    setOrder([...order, i]);
    setP(order.length);
    setFu(0);
    ai(`Let’s go back to this one. ${Q[i].more[0]}`, Q[i].more[1]);
    sfx("tap");
  };
  const finishTalk = () => {
    speech.stop();
    setAns(
      stepKey(ctx.lv, ctx.unit, "dtalk"),
      Q.map((_, i) => (ans[i] ?? []).join(" ")),
    );
    setDone(true);
    sfx("correct");
  };

  return (
    <>
      <View style={st.pinned}>
        {noPre}
        <View style={st.stickyWrap}>
          <PCard style={st.qc}>
            <View style={st.hd}>
              <PText
                style={st.hdT}
                color={SUB}
              >{`${extra ? "더 이야기하기" : `질문 ${Math.min(p + 1, 6)}/6`} · DAILY TOPIC`}</PText>
              <PText
                style={st.hdT}
                color={Colors.purple}
              >{`키워드 ${usedN}/12`}</PText>
            </View>
            <PText style={st.qcB}>{q.en}</PText>
            <PText style={st.qe} color={SUB}>
              {q.ko}
            </PText>
            {q.kw.map((k) => {
              const [w, m, ex] = D.keywords[k];
              const on = !!used[w];
              const isOpen = open === w;
              return (
                <Pressable
                  key={w}
                  onPress={() => setOpen(isOpen ? null : w)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  style={st.kw}
                >
                  <View style={st.kwRow}>
                    <PText style={st.kwB} color={Colors.purple}>
                      {on ? `✓ ${w}` : w}
                    </PText>
                    {!prep ? (
                      <PText style={st.kwM}>{m}</PText>
                    ) : (
                      <View style={st.flex} />
                    )}
                    <PText style={st.kwI} color={SUB}>
                      예문
                    </PText>
                  </View>
                  {isOpen ? (
                    <>
                      {prep ? <PText style={st.kwM}>{m}</PText> : null}
                      <PText style={st.kwEx}>{ex}</PText>
                    </>
                  ) : null}
                </Pressable>
              );
            })}
          </PCard>
        </View>
      </View>
      {/* 대화는 아래에서부터 쌓여요 (뒤집은 목록 — 새 말이 늘 보이게) */}
      <FlatList
        inverted
        data={rev}
        keyExtractor={(_m, k) => String(log.length - k)}
        style={st.flex}
        contentContainerStyle={st.chatBody}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          all && !extra ? (
            <View style={st.more}>
              <PText style={st.moreK} color={SUB}>
                더 이야기하고 싶은 질문
              </PText>
              <View style={st.moreRow}>
                {Q.map((_, i) => (
                  <Pressable
                    key={i}
                    onPress={() => more(i)}
                    accessibilityRole="button"
                    style={st.moreBtn}
                  >
                    <PText style={st.moreT}>{`Q${i + 1}`}</PText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : undefined
        }
        ItemSeparatorComponent={Gap}
        renderItem={({ item: m }) =>
          m.me ? (
            <View style={st.meCol}>
              <View style={st.meB}>
                <PText style={st.msgT} color={Colors.white}>
                  {m.en}
                </PText>
              </View>
              {m.fixed ? (
                <View style={st.fix}>
                  <PText style={st.fixB}>{m.fixed}</PText>
                  <PText style={st.fixS} color={SUB}>
                    {m.why}
                  </PText>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={st.aiRow}>
              <View style={st.av}>
                <Image
                  source={IMG.yellow}
                  style={st.avImg}
                  contentFit="contain"
                />
              </View>
              <View style={st.flex}>
                <PText style={st.who} color={SUB}>
                  PALLO AI
                </PText>
                <View style={st.aiB}>
                  <PText style={st.msgT}>{m.en}</PText>
                  {m.ko ? (
                    <PText style={st.msgK} color={SUB}>
                      {m.ko}
                    </PText>
                  ) : null}
                </View>
              </View>
            </View>
          )
        }
      />
      <PFoot>
        <ModeTabs<Mode>
          list={[
            ["voice", "말하기"],
            ["write", "쓰기"],
          ]}
          cur={cm}
          onPick={(k) => {
            speech.stop();
            setCm(k);
          }}
        />
        <View style={st.compose}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            editable={cm === "write"}
            multiline
            placeholder={
              cm === "voice"
                ? "마이크를 누르고 말하면 여기에 적혀요"
                : "3문장 이상 영어로 적어요"
            }
            placeholderTextColor="#B9B2A3"
            style={st.ta}
            accessibilityLabel="내 답"
          />
          {cm === "voice" ? (
            <Pressable
              onPress={() =>
                speech.listening
                  ? speech.stop()
                  : void speech.start(D.keywords.map((k) => k[0]))
              }
              accessibilityRole="button"
              accessibilityLabel="말하기"
              accessibilityState={{ selected: speech.listening }}
              style={StyleSheet.flatten([st.mic, speech.listening && st.micOn])}
            >
              <MicIcon size={20} color={Colors.white} />
            </Pressable>
          ) : null}
          <View style={st.send}>
            <GoBtn label="보내기" compact onPress={send} />
          </View>
        </View>
        <Pressable
          onPress={finishTalk}
          disabled={answered < 3}
          accessibilityRole="button"
          accessibilityState={{ disabled: answered < 3 }}
          style={StyleSheet.flatten([st.end, answered >= 3 && st.endOn])}
        >
          <PText style={st.endT} color={answered >= 3 ? Colors.ink : SUB}>
            {answered >= 3
              ? "대화 마치기"
              : `질문 3개 답하면 마칠 수 있어요 · ${answered}/3`}
          </PText>
        </Pressable>
      </PFoot>
    </>
  );
}

const Gap = () => <View style={st.gap} />;
const QAns = ({ ko, en }: { ko: string; en: string }) => (
  <>
    <PText style={st.sumK} color={SUB}>
      {ko}
    </PText>
    <PText style={st.sumB}>{en}</PText>
  </>
);
const FixAns = ({ a, b, why }: { a: string; b: string; why: string }) => (
  <>
    <PText style={StyleSheet.flatten([st.sumB, st.strike])} color={SUB}>
      {a}
    </PText>
    <PText style={st.sumB}>{b}</PText>
    <PText style={st.sumK} color={SUB}>
      {why}
    </PText>
  </>
);

const st = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  flex2: { flex: 2 },
  body: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 20, gap: 10 },
  intro: {
    fontFamily: Font.body700,
    fontSize: 13.5,
    lineHeight: 21.6,
    marginHorizontal: 2,
  },
  nopre: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FFF1F3",
  },
  nopreT: { flex: 1, fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18 },
  nopreA: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18 },
  q: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  qOn: { backgroundColor: "#FFF6BF" },
  star: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  starOn: { backgroundColor: Colors.yellow },
  starT: { fontFamily: Font.display, fontSize: 13, lineHeight: 18 },
  qn: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16 },
  qb: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21.75 },
  qe: {
    fontFamily: Font.body700,
    fontSize: 12.5,
    lineHeight: 18.75,
    marginTop: 3,
  },
  row2: { flexDirection: "row", gap: 10 },
  any: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0px 5px 0px ${Colors.ink}`,
  },
  anyT: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  stickyWrap: { backgroundColor: Colors.cream },
  pinned: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4, gap: 10 },
  chatBody: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  gap: { height: 10 },
  qc: { paddingVertical: 12, paddingHorizontal: 14, gap: 4 },
  hd: { flexDirection: "row", justifyContent: "space-between" },
  hdT: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16 },
  qcB: { fontFamily: Font.body900, fontSize: 15.5, lineHeight: 22.5 },
  kw: { paddingTop: 4 },
  kwRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  kwB: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  kwM: { flex: 1, fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
  kwI: { fontFamily: Font.body800, fontSize: 11, lineHeight: 16 },
  kwEx: {
    fontFamily: Font.body700,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  chat: { gap: 10 },
  aiRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    paddingRight: 35,
  },
  av: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: "#FFF6BF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avImg: { width: 26, height: 24 },
  who: {
    fontFamily: Font.body800,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 2,
  },
  aiB: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 6,
  },
  msgT: { fontFamily: Font.body700, fontSize: 15, lineHeight: 21.75 },
  msgK: {
    fontFamily: Font.body600,
    fontSize: 12,
    lineHeight: 17.4,
    marginTop: 3,
  },
  meCol: { alignItems: "flex-end", paddingLeft: 38, gap: 4 },
  meB: {
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.ink,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
  },
  fix: {
    maxWidth: "100%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#DDF3E2",
  },
  fixB: {
    fontFamily: Font.body900,
    fontSize: 13.5,
    lineHeight: 19,
    color: "#1D6B3B",
  },
  fixS: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16 },
  more: { gap: 6 },
  moreK: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  moreRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  moreBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    justifyContent: "center",
  },
  moreT: { fontFamily: Font.display, fontSize: 11, lineHeight: 15 },
  compose: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  ta: {
    flex: 1,
    minHeight: 73,
    maxHeight: 120,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 16,
    backgroundColor: Colors.cream,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Font.body500,
    fontSize: 15,
    lineHeight: 22.5,
    color: Colors.ink,
    textAlignVertical: "top",
  },
  mic: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  micOn: { backgroundColor: Colors.rosePink },
  send: { width: 84 },
  end: {
    height: 46,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  endOn: { borderColor: Colors.ink },
  endT: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
  sumK: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16 },
  sumB: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  strike: { textDecorationLine: "line-through" },
  best: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 18,
    backgroundColor: Colors.yellow,
    boxShadow: `3px 3px 0px ${Colors.ink}`,
  },
  bestK: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16 },
  bestB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
});
