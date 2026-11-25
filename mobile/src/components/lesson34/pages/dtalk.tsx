import { Image } from "expo-image";
import Animated, { css, useReducedMotion } from "react-native-reanimated";
import { useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { GrowInput } from "@/components/ui/grow-input";
import { CheckIcon } from "@/components/lesson/icons";
import { Pressable } from "@/components/ui/pressable";
import { PText } from "@/components/ui/text";
import { showToast } from "@/components/ui/toast";
import { Font } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { STEPS34, type Lv3Unit } from "@/data/lessons34";
import { sfx } from "@/lib/feedback";
import { useKeyboardHeight } from "@/lib/keyboard";
import { SPEECH_PROBLEM_TEXT, useSpeech } from "@/lib/speech";
import { useLearnPrefs } from "@/state/learn-prefs";
import { isDone, stepKey } from "@/state/progress";

import { leave34, type StepCtx } from "../finish";
import { answers, setAns } from "../store";
import { aiFix, bitOf, notEnglish, nrm, NUDGE, sentN, wordRe, words } from "../text";
import {
  FootRow,
  GoBtn,
  IMG,
  MicKey,
  ModeTabs,
  SkipBtn,
  Spk,
  SUB,
  sayEn,
} from "../ui";
import { PCard, PFoot, Stats } from "./common";
import type { PageApi } from "./study-shell";
import { stopSpeaking } from '@/lib/tts';

type Msg = {
  me?: boolean;
  en: string;
  ko?: string;
  fixed?: string;
  why?: string;
  kw?: Record<string, 1>;
};
type Mode = "voice" | "write";
/**
 * 눈을 깜빡이는 노랑 팔로 (원본 그림 그대로 · 눈 흰자 위에 잉크색 눈꺼풀이 내려왔다 올라가요).
 * 눈 자리는 c-upright-yellow.png(480×306)에서 잰 비율이에요.
 */
const blink = css.keyframes({ '0%': { transform: [{ scaleY: 0 }] }, '90%': { transform: [{ scaleY: 0 }] }, '94%': { transform: [{ scaleY: 1 }] }, '98%': { transform: [{ scaleY: 0 }] }, '100%': { transform: [{ scaleY: 0 }] } });
// 검은 테 안쪽(흰자 + 눈동자)에 맞춰 잰 값 (원본 픽셀 → 비율)
const EYES = [
  { l: 0.4483, w: 0.0971, t: 0.0552, h: 0.2745 },
  { l: 0.604, w: 0.0975, t: 0.0608, h: 0.2739 },
];
function BlinkChar({ width }: { width: number }) {
  const still = useReducedMotion();
  const h = (width * 306) / 480;
  return (
    <View style={{ width, height: h, marginBottom: -16, marginRight: -6 }}>
      <Image source={IMG.yellow} style={{ width, height: h }} contentFit="contain" />
      {!still
        ? EYES.map((e, i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={{
                position: "absolute",
                left: e.l * width,
                top: e.t * h,
                width: e.w * width,
                height: e.h * h,
                borderRadius: 999,
                backgroundColor: "#181B21",
                transformOrigin: "top",
                animationName: blink,
                animationDuration: "4200ms",
                animationIterationCount: "infinite",
                animationTimingFunction: "ease-in-out",
              }}
            />
          ))
        : null}
    </View>
  );
}

/** AI 피드백 한 칸 (왼쪽 색 줄 + 이름 + 문장들) */
function FbPart({ label, color, bar, items }: { label: string; color: string; bar: string; items: string[] }) {
  return (
    <View style={StyleSheet.flatten([st.fbPart, { borderColor: bar }])}>
      <PText style={st.fbK} color={color}>
        {label}
      </PText>
      {items.map((x) => (
        <PText key={x} style={st.fbP}>
          {x}
        </PText>
      ))}
    </View>
  );
}

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
  // 질문별 교정한 답 (AI 교정 · 대화 끝 정리에 써요)
  const [fxAns, setFxAns] = useState<Record<number, string[]>>({});
  const [nk, setNk] = useState(0);
  const [all, setAll] = useState(false);
  const [extra, setExtra] = useState(false);
  const [done, setDone] = useState(false);
  const [cm, setCm] = useState<Mode>(noSpeak ? "write" : "voice");
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const speech = useSpeech({ onText: (text) => setDraft(text), onProblem: (p) => showToast(SPEECH_PROBLEM_TEXT[p]) });
  // 키보드가 올라오면 아래 입력 줄을 키보드 바로 위로 올려요 (아이폰만 · 안드로이드는 화면이 줄어요)
  const kbH = useKeyboardHeight();

  useEffect(() => () => stopSpeaking(), []);

  const ai = (en: string, ko: string) => {
    setLog((l) => [...l, { en, ko }]);
    setTimeout(() => sayEn(en, api.soundOff, 0.95), 250);
  };
  const begin = (o: number[]) => {
    setOrder(o);
    const m = opener(Q[o[0]]);
    setLog((l) => [...l, m]);
    // 누른 순간 바로 읽어요 (사파리는 누른 뒤 바로 불러야 소리가 나요)
    sayEn(m.en, api.soundOff, 0.95);
  };
  // 예습 별표로 바로 시작했으면 들어오자마자 첫 인사를 읽어요
  useEffect(() => {
    const first = log[0];
    if (order && log.length === 1 && first && !first.me) {
      const tm = setTimeout(() => sayEn(first.en, api.soundOff, 0.95), 300);
      return () => clearTimeout(tm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 처음 들어올 때 한 번만
  }, []);
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
    const usedW = D.keywords.filter(([w]) => used[w]).map(([w]) => w);
    const tip = D.keywords.find(([w]) => !used[w]);
    const qa = Q.map((qq, i) => ({ qq, i, raw: (ans[i] ?? []).join(" "), fixed: (fxAns[i] ?? []).join(" ") })).filter((x) => x.raw);
    const shortN = qa.filter((x) => sentN(x.raw) < 3).length;
    const longest = Math.max(0, ...qa.map((x) => words(x.raw)));
    const whys = [...new Set(fixes.flatMap(([, , w]) => w.split(" / ")))].slice(0, 3);
    const good = [`질문 ${answered}개에 끝까지 답했어요`, usedW.length ? `키워드 ${usedW.length}개를 자연스럽게 넣었어요 · ${usedW.slice(0, 3).join(", ")}` : "", longest >= 25 ? `가장 긴 답이 ${longest}단어예요 · 생각을 길게 이어 갔어요` : ""].filter(Boolean);
    const weak = [shortN ? `짧게 끝난 답이 ${shortN}개 · 이유나 예시가 빠졌어요` : "", whys.length ? `자주 틀린 곳 · ${whys.join(" / ")}` : "", usedW.length < 2 ? "키워드를 거의 안 썼어요" : ""].filter(Boolean);
    return (
      <>
        <ScrollView style={st.flex} contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
          <Stats
            items={[
              [`${answered}/6`, "질문"],
              [String(mine.length), "내 발화"],
              [String(fixes.length), "교정"],
            ]}
          />
          {/* AI 피드백: 잘했어요 · 아쉬워요 · 이렇게 해 봐요 (프로토타입 v503 · 실제 앱은 AI 가 써요) */}
          <PCard style={st.fb}>
            {/* 머리: 보라 띠 · 팔로 · 제목 · 오늘 대화 요약 숫자 */}
            <View style={st.fbHead}>
              <View style={st.fbHeadT}>
                <PText style={st.fbKick} color="#D9CCF5">
                  {`TODAY’S REPORT · ${new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}`}
                </PText>
                <PText style={st.fbT} color={Colors.white}>
                  AI 피드백
                </PText>
                <View style={st.fbChips}>
                  {[`질문 ${answered}/6`, `키워드 ${usedW.length}`, `교정 ${fixes.length}`].map((c) => (
                    <View key={c} style={st.fbChip}>
                      <PText style={st.fbChipT} color={Colors.white}>
                        {c}
                      </PText>
                    </View>
                  ))}
                </View>
              </View>
              <BlinkChar width={118} />
            </View>
            <FbPart label="잘했어요" color="#2F6B2A" bar="#6BBF59" items={good} />
            {weak.length ? <FbPart label="아쉬워요" color="#C2416B" bar="#E59AAE" items={weak} /> : null}
            <FbPart
              label="이렇게 해 봐요"
              color={Colors.purple}
              bar={Colors.purple}
              items={["선택 → 이유(Because) → 예시(For example), 3문장으로 답해요", ...(tip ? [`안 쓴 키워드 ${tip[0]} 넣어 보기 · ${tip[2]}`] : [])]}
            />
          </PCard>
          <PText style={st.qaH} color={SUB}>
            질문별 내 답
          </PText>
          {qa.map((x) => (
            <PCard key={x.i} style={st.qa}>
              <View style={st.qaHead}>
                <View style={st.qPill}>
                  <PText style={st.qPillT} color={Colors.white}>{`Q${x.i + 1}`}</PText>
                </View>
                <PText style={st.qaKo} color={SUB}>
                  {x.qq.ko}
                </PText>
              </View>
              <PText style={st.qaMine} color={SUB}>
                {x.raw}
              </PText>
              {x.fixed && x.fixed !== x.raw ? (
                <View style={st.qaFix}>
                  <PText style={st.qaFixK} color="#2F6B2A">
                    AI 교정
                  </PText>
                  <PText style={st.qaFixB}>{x.fixed}</PText>
                </View>
              ) : null}
            </PCard>
          ))}
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
    // 한국어로 답했거나 알아볼 수 없는 말이면 답으로 치지 않고 다시 물어요
    const bad = notEnglish(v);
    if (bad) {
      setLog((l) => [...l, { me: true, en: v }]);
      setDraft("");
      sfx("send");
      if (bad === "ko") ai(`Could you try that in English? Even one short sentence is okay! ${q.en}`, "영어로 다시 말해 볼까요? 짧아도 괜찮아요");
      else ai(`Sorry, I didn’t quite get that. Could you say it again? ${q.en}`, "잘 못 알아들었어요. 다시 말해 줄래요?");
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
    // 답 교정 (오타 · 문법 · 대문자 — 실제 앱은 AI)
    const F = aiFix(v, D.live);
    if (F.changed) {
      msg.fixed = F.text;
      msg.why = F.why.join(" / ") || "문장 다듬기";
      setFixes((f) => [...f, [v, F.text, msg.why ?? ""]]);
    }
    setUsed(nextUsed);
    setLog((l) => [...l, msg]);
    setAnsLocal((a) => ({ ...a, [qi]: [...(a[qi] ?? []), v] }));
    setFxAns((a) => ({ ...a, [qi]: [...(a[qi] ?? []), msg.fixed ?? v] }));
    setDraft("");
    sfx("send");
    const shortA = sentN(v) < 3 && words(v) < 20;
    const offT =
      !q.tw.test(v) && !Object.keys(msg.kw ?? {}).length && words(v) >= 5;
    const kwHit = Object.keys(msg.kw ?? {})[0];
    const R = kwHit ? `Nice use of “${kwHit}”!` : L3_REACT[(log.length + 1 + qi) % L3_REACT.length];
    if (offT && !steer[qi]) {
      setSteer({ ...steer, [qi]: 1 });
      ai(
        `Ha, that sounds fun! But back to the question — ${q.en}`,
        "재밌네요! 그런데 다시 질문으로 돌아가 볼게요",
      );
    } else if (shortA && !nudged[qi]) {
      setNudged({ ...nudged, [qi]: 1 });
      // 방금 한 말을 짚어서 묻고, 질문마다 다른 말로 (같은 문장 반복 없이)
      const [w, , ex] = D.keywords[q.kw[0]];
      const [en, ko] = NUDGE[nk % NUDGE.length](bitOf(msg.fixed ?? v));
      setNk(nk + 1);
      if (prep) ai(en, ko);
      else ai(`${en} Try using “${w}” — like: “${ex}”`, `${ko} · ‘${w}’를 넣어 봐요`);
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
              <View style={st.qPill}>
                <PText style={st.qPillT} color={Colors.white}>
                  {extra ? "MORE" : `Q${Math.min(p + 1, 6)}`}
                </PText>
              </View>
              <PText style={st.hdT} color={SUB}>{`DAILY TOPIC · ${extra ? "더 이야기하기" : `${Math.min(p + 1, 6)}/6`}`}</PText>
              <PText style={st.hdK} color={Colors.purple}>{`키워드 ${usedN}/12`}</PText>
            </View>
            <View style={st.qt}>
              <PText style={st.qcB}>{q.en}</PText>
              <Spk text={q.en} soundOff={api.soundOff} />
            </View>
            <PText style={st.qe} color={SUB}>
              {q.ko}
            </PText>
            {/* 키워드 알약: 누르면 뜻 · 예문이 상자 안에 펼쳐져요 */}
            <View style={st.kws}>
              {q.kw.map((k) => {
                const [w] = D.keywords[k];
                const on = !!used[w];
                const isOpen = open === w;
                return (
                  <Pressable
                    key={w}
                    onPress={() => setOpen(isOpen ? null : w)}
                    sound="pick"
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}
                    style={StyleSheet.flatten([st.kc, on && st.kcOn, isOpen && st.kcOpen])}
                  >
                    {on ? <CheckIcon size={11} color="#2F6B2A" /> : null}
                    <PText style={st.kcT} color={isOpen ? Colors.white : on ? "#2F6B2A" : Colors.purple}>
                      {w}
                    </PText>
                  </Pressable>
                );
              })}
            </View>
            {q.kw.map((k) => {
              const [w, m, ex] = D.keywords[k];
              return open === w ? (
                <View key={w} style={st.kx}>
                  <PText style={st.kxB}>{w}</PText>
                  <PText style={st.kxM} color={SUB}>
                    {m}
                  </PText>
                  <PText style={st.kxE}>{ex}</PText>
                </View>
              ) : null;
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
      <PFoot lift={kbH}>
        <ModeTabs<Mode>
          list={[
            ["voice", "말하기"],
            ["write", "쓰기"],
          ]}
          cur={cm}
          onPick={(k) => {
            speech.stop();
            // 말하기로 바꾸면 떠 있던 키보드도 내려요
            if (k === "voice") Keyboard.dismiss();
            setCm(k);
          }}
        />
        {/* 다른 학습 화면(말하기 · 쓰기 단계)과 같은 아래 칸:
            말하기 = 받아 적은 말 + 넓은 마이크 키 → 다 말하면 [다시 말하기 | 보내기]
            쓰기 = 입력칸 + 넓은 노랑 보내기 */}
        {cm === "voice" ? (
          <>
            {speech.listening || draft ? (
              <PText style={st.said} color={draft ? Colors.ink : SUB}>
                {draft || "듣고 있어요…"}
              </PText>
            ) : null}
            {draft && !speech.listening ? (
              <FootRow>
                <SkipBtn label="다시 말하기" onPress={() => { setDraft(""); void speech.start(D.keywords.map((k) => k[0])); }} />
                <GoBtn label="보내기" onPress={send} />
              </FootRow>
            ) : (
              <MicKey
                label="눌러서 말하기"
                live="다 말했어요"
                on={speech.listening}
                onPress={() =>
                  speech.listening
                    ? speech.stop()
                    : void speech.start(D.keywords.map((k) => k[0]))
                }
              />
            )}
          </>
        ) : (
          <>
            <GrowInput
              value={draft}
              onChangeText={setDraft}
              multiline
              placeholder="3문장 이상 영어로 적어요"
              placeholderTextColor="#B9B2A3"
              style={st.ta}
              accessibilityLabel="내 답"
            />
            <FootRow>
              <GoBtn label="보내기" disabled={!draft.trim()} onPress={send} />
            </FootRow>
          </>
        )}
        {/* 키보드가 떠 있을 땐 입력 줄만 남겨요 (자리가 좁아요) */}
        {kbH > 0 ? null : answered >= 3 ? (
          <SkipBtn label="대화 마치기" onPress={finishTalk} />
        ) : (
          <PText style={st.endT} color={SUB}>
            질문 3개 답하면 마칠 수 있어요 · {answered}/3
          </PText>
        )}
      </PFoot>
    </>
  );
}

const Gap = () => <View style={st.gap} />;
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
  qc: { paddingVertical: 14, paddingHorizontal: 16, gap: 6, borderRadius: 22 },
  hd: { flexDirection: "row", alignItems: "center", gap: 8 },
  qPill: { borderRadius: 999, backgroundColor: Colors.purple, paddingHorizontal: 9, paddingVertical: 3 },
  qPillT: { fontFamily: Font.display, fontSize: 11, lineHeight: 14 },
  hdT: { flex: 1, fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16 },
  hdK: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16 },
  qt: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  qcB: { flex: 1, fontFamily: Font.body900, fontSize: 17, lineHeight: 23.8, letterSpacing: -0.2 },
  kws: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  kc: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1.5, borderColor: Colors.purple, backgroundColor: "#F1ECFB", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4 },
  kcOn: { borderColor: "#2F6B2A", backgroundColor: "#EAF6E7" },
  kcOpen: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  kcT: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  kx: { marginTop: 2, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: Colors.cream, gap: 2 },
  kxB: { fontFamily: Font.body900, fontSize: 14, lineHeight: 19 },
  kxM: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  kxE: { fontFamily: Font.body600, fontSize: 13.5, lineHeight: 19.5 },
  fb: { paddingBottom: 16, paddingHorizontal: 16, gap: 12, overflow: "hidden" },
  fbHead: { flexDirection: "row", alignItems: "flex-end", marginHorizontal: -16, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, backgroundColor: Colors.purple, borderBottomWidth: 2, borderColor: Colors.ink },
  fbHeadT: { flex: 1, gap: 4 },
  fbKick: { fontFamily: Font.display, fontSize: 10, lineHeight: 13, letterSpacing: 0.4 },
  fbT: { fontFamily: Font.display, fontSize: 22, lineHeight: 27, letterSpacing: -0.4 },
  fbChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  fbChip: { borderRadius: 999, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.55)", paddingHorizontal: 9, paddingVertical: 2 },
  fbChipT: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  fbImg: { width: 78, height: 66, marginBottom: -14, marginRight: -4 },
  fbPart: { gap: 4, paddingLeft: 12, borderLeftWidth: 3 },
  fbK: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  fbP: { fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20 },
  qaH: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, marginTop: 6 },
  qa: { padding: 14, gap: 8, boxShadow: "none" },
  qaHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  qaKo: { flex: 1, fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17.5 },
  qaMine: { fontFamily: Font.body700, fontSize: 14.5, lineHeight: 21.75 },
  qaFix: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#EAF6E7", gap: 2 },
  qaFixK: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16 },
  qaFixB: { fontFamily: Font.body800, fontSize: 14.5, lineHeight: 21.75 },
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
  ta: {
    minHeight: 64,
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
  // 받아 적은 말 (말하기 단계의 .said 와 같아요)
  said: { fontFamily: Font.body700, fontSize: 15, lineHeight: 22, textAlign: "center", paddingHorizontal: 8 },
  endT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, textAlign: "center" },
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
