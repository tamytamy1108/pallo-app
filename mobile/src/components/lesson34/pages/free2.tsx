import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { GrowInput } from "@/components/ui/grow-input";
import { MicIcon, SpeakerIcon } from "@/components/lesson/icons";
import { Pressable } from "@/components/ui/pressable";
import { PText } from "@/components/ui/text";
import { showToast } from "@/components/ui/toast";
import { Font } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import type { Lv4Unit } from "@/data/lessons34";
import { sfx } from "@/lib/feedback";
import { useSpeech } from "@/lib/speech";
import { useLearnPrefs } from "@/state/learn-prefs";
import { stepKey } from "@/state/progress";

import type { StepCtx } from "../finish";
import { setTalk } from "../store";
import { fmtS, nrm, words } from "../text";
import { ChkRow, GoBtn, ModeTabs, PINK_INK, SUB, sayEn } from "../ui";
import { Intro, PFoot, Stats } from "./common";
import type { PageApi } from "./study-shell";
import { stopSpeaking } from '@/lib/tts';

export const PPL_IMG = {
  Aiden: require("@/assets/images/lesson34/aiden.jpg"),
  Logan: require("@/assets/images/lesson34/logan.jpg"),
} as const;
const escRx = (x: string) =>
  x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[’']/g, "['’]");

/** FREE TALK 1:1 대화 설정 (프로토타입 mkFree2): 질문 1 · 4 · 5번 + 꼬리 질문 · SAY IT BETTER 2개 미션 */
function free2Of(D: Lv4Unit) {
  const F = D.free;
  const ups = D.better.map(([, up]) => up);
  const lines: [string, string, 1?][] = [
    [`${F[0].bg} ${F[0].en}`, F[0].ko],
    [
      "Why do you think so? Can you give me an example?",
      "왜 그렇게 생각해요? 예를 들어 줄래요?",
    ],
    [`${F[3].bg} ${F[3].en}`, F[3].ko],
    [
      "Interesting. How is that different from what most people think?",
      "흥미롭네요. 보통 사람들 생각과 어떻게 달라요?",
    ],
    [F[4].en, F[4].ko],
    [
      "Great points! You upgraded your English with SAY IT BETTER expressions.",
      "좋아요! SAY IT BETTER 표현으로 말을 업그레이드했어요.",
      1,
    ],
  ];
  return {
    who: "Aiden" as const,
    title: "FREE TALK · 1:1",
    lines,
    turnSec: 60,
    follow: {
      min: 10,
      en: "Interesting! Can you develop that a bit more? Why?",
      ko: "흥미롭네요! 조금 더 이어서 말해 줄래요? 왜요?",
    },
    checks: ups.map((up): [string, RegExp] => [
      up.replace(/[.]$/, ""),
      new RegExp(escRx(up.split(" ").slice(1, 4).join(" ")), "i"),
    ]),
    mission: {
      need: 2,
      label: "SAY IT BETTER",
      en: `Before we wrap up, say that again with a SAY IT BETTER expression, like “${ups[0].replace(/[.]$/, "")}” or “${ups[1].replace(/[.]$/, "")}”.`,
      ko: "마무리 전에, SAY IT BETTER 표현으로 다시 말해 봐요.",
    },
    chips: ups,
  };
}

type Msg = { me?: boolean; en: string; ko?: string };
type Mode = "say" | "write";

/**
 * 본학습 FREE TALK · 1:1 (프로토타입 STEP_VIEW.chat → renderChat · 대본 대화 — 실제 앱은 `/ai/talk`).
 * 질문당 1분 · 단답(10단어 미만)이면 꼬리 질문 · SAY IT BETTER 표현 2개 미션 (못 채우면 끝나기 전 다시 말할 기회 2번).
 */
export function FreeTalk1({
  ctx,
  D,
  api,
}: {
  ctx: StepCtx;
  D: Lv4Unit;
  api: PageApi;
}) {
  const [C] = useState(() => free2Of(D));
  const { noSpeak } = useLearnPrefs();
  const [log, setLog] = useState<Msg[]>(() => [
    { en: C.lines[0][0], ko: C.lines[0][1] },
  ]);
  const [i, setI] = useState(0);
  const [fuDone, setFuDone] = useState<Record<number, 1>>({});
  const [mtry, setMtry] = useState(0);
  const [done, setDone] = useState(false);
  const [cm, setCm] = useState<Mode>(noSpeak ? "write" : "say");
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState(false);
  const [turnEnd, setTurnEnd] = useState(0);
  const [now, setNow] = useState(0);
  const sendRef = useRef<(v: string) => void>(() => {});
  const speech = useSpeech({
    onText: (text) => setDraft(text),
    onEnd: (text) => {
      if (text.trim()) sendRef.current(text.trim());
    },
  });

  // 이 질문 남은 시간 (질문이 올 때마다 1분)
  useEffect(() => {
    const t0 = Date.now();
    const tick = setInterval(() => setNow(Date.now()), 500);
    const first = setTimeout(() => {
      setTurnEnd(t0 + C.turnSec * 1000);
      setNow(Date.now());
    }, 0);
    const tm = setTimeout(() => sayEn(C.lines[0][0], api.soundOff, 0.95), 280);
    return () => {
      clearInterval(tick);
      clearTimeout(first);
      clearTimeout(tm);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mine = log
    .filter((m) => m.me)
    .map((m) => m.en)
    .join(" ");
  const checks = C.checks.map(([label, re]) => ({
    label,
    on: re.test(nrm(mine)),
  }));
  const nOn = checks.filter((c) => c.on).length;

  const push = (en: string, ko?: string) => {
    setLog((l) => [...l, { en, ko }]);
    setTurnEnd(Date.now() + C.turnSec * 1000);
    setTimeout(() => sayEn(en, api.soundOff, 0.95), 280);
  };
  const send = (v: string) => {
    sfx("send");
    const nextLog = [...log, { me: true, en: v }];
    setLog(nextLog);
    setDraft("");
    // 단답이면 다음으로 안 넘어가고 꼬리 질문 (한 질문에 한 번)
    if (words(v) < C.follow.min && !fuDone[i]) {
      setFuDone({ ...fuDone, [i]: 1 });
      push(C.follow.en, C.follow.ko);
      return;
    }
    const nx = C.lines[i + 1];
    const endNow = !nx || !!nx[2];
    // 표현 미션: 끝나기 전에 기준을 못 채우면 한 번 더 기회 (최대 2번)
    if (endNow) {
      const all = nrm(
        nextLog
          .filter((m) => m.me)
          .map((m) => m.en)
          .join(" "),
      );
      const used = C.checks.filter(([, re]) => re.test(all)).length;
      if (used < C.mission.need && mtry < 2) {
        setMtry(mtry + 1);
        push(C.mission.en, C.mission.ko);
        return;
      }
    }
    setI(i + 1);
    if (nx) push(nx[0], nx[1]);
    if (endNow) {
      setDone(true);
      sfx("correct");
      setTalk(
        stepKey(ctx.lv, ctx.unit, "free2"),
        nextLog.filter((m) => m.me).map((m) => m.en),
      );
    }
  };
  useEffect(() => {
    sendRef.current = send;
  });

  const left = Math.round((turnEnd - now) / 1000);
  return (
    <>
      {/* 대화는 아래에서부터 쌓여요 (뒤집은 목록 — 새 말이 늘 보이게) */}
      <FlatList
        inverted
        data={log.slice().reverse()}
        keyExtractor={(_m, k) => String(log.length - k)}
        style={st.flex}
        contentContainerStyle={st.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={Gap}
        ListFooterComponent={
          <View style={st.introWrap}>
            <Intro
              text={`${C.title} · 영어로 답하면 ${C.who}이 이어서 물어봐요.`}
            />
          </View>
        }
        ListHeaderComponent={
          <View style={st.tail}>
            {!done && !noSpeak && turnEnd ? (
              <PText style={st.turn} color={left <= 10 ? PINK_INK : SUB}>
                {left > 0 ? "이 질문 남은 시간 " : ""}
                <PText
                  style={st.turnB}
                  color={left <= 10 ? PINK_INK : Colors.ink}
                >
                  {left > 0 ? fmtS(left) : "시간 끝"}
                </PText>
                {left > 0 ? "" : " · 한 문장으로 마무리해요"}
              </PText>
            ) : null}
            <ChkRow
              label={`${C.mission.label} 미션 ${Math.min(nOn, C.mission.need)}/${C.mission.need}`}
              items={checks
                .filter((c) => c.on)
                .map((c) => ({ t: c.label, on: true }))}
            />
            {done ? (
              <>
                <Stats
                  items={[
                    [String(log.filter((m) => m.me).length), "내 발화"],
                    [String(words(mine)), "단어"],
                    [`${nOn}/${checks.length}`, "KEY 표현"],
                  ]}
                />
                <Intro
                  text={
                    nOn
                      ? `잘 썼어요: ${checks
                          .filter((c) => c.on)
                          .map((c) => c.label)
                          .join(", ")}.`
                      : "다음엔 KEY 표현를 하나 넣어 말해 봐요."
                  }
                />
              </>
            ) : null}
          </View>
        }
        renderItem={({ item: m }) =>
          m.me ? (
            <View style={st.meRow}>
              <View style={st.meB}>
                <PText style={st.msgT} color={Colors.white}>
                  {m.en}
                </PText>
              </View>
            </View>
          ) : (
            <View style={st.aiRow}>
              <Image source={PPL_IMG.Aiden} style={st.av} contentFit="cover" />
              <View style={st.flex}>
                <PText style={st.who} color={SUB}>
                  {C.who}
                </PText>
                <View style={st.aiB}>
                  <PText style={st.msgT}>{m.en}</PText>
                  {m.ko ? (
                    <PText style={st.msgK} color={SUB}>
                      {m.ko}
                    </PText>
                  ) : null}
                </View>
                {!api.soundOff ? (
                  <Pressable
                    onPress={() => sayEn(m.en, false, 0.95)}
                    accessibilityRole="button"
                    accessibilityLabel="듣기"
                    style={st.say2}
                  >
                    <SpeakerIcon size={13} />
                    <PText style={st.say2T}>듣기</PText>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )
        }
      />
      <PFoot>
        {done ? (
          <GoBtn label="완료하기" onPress={() => api.finish()} />
        ) : (
          <>
            {hint ? (
              <View style={st.exs}>
                {C.chips.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => {
                      setDraft((d) => (d.trim() ? `${d.trim()} ` : "") + c);
                      setCm("write");
                      setHint(false);
                    }}
                    accessibilityRole="button"
                    style={st.ex}
                  >
                    <PText style={st.exT}>{c}</PText>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={st.hrow}>
              <Pressable
                onPress={() => setHint((h) => !h)}
                accessibilityRole="button"
                accessibilityLabel="표현 힌트"
                accessibilityState={{ selected: hint }}
                style={StyleSheet.flatten([st.bulb, hint && st.bulbOn])}
              >
                <Svg
                  width={22}
                  height={22}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={Colors.ink}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <Path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />
                </Svg>
              </Pressable>
            </View>
            <ModeTabs<"voice" | "write">
              list={[
                ["voice", "말하기"],
                ["write", "쓰기"],
              ]}
              cur={cm === "say" ? "voice" : "write"}
              onPick={(k) => {
                speech.stop();
                setCm(k === "voice" ? "say" : "write");
              }}
            />
            {cm === "say" ? (
              <Pressable
                onPress={() =>
                  speech.listening ? speech.stop() : void speech.start(C.chips)
                }
                accessibilityRole="button"
                accessibilityLabel="눌러서 말하기"
                style={StyleSheet.flatten([
                  st.ftMic,
                  speech.listening && st.ftMicOn,
                ])}
              >
                <MicIcon size={20} color={Colors.white} />
                <PText style={st.ftMicT} color={Colors.white}>
                  {speech.listening ? draft || "듣고 있어요…" : "눌러서 말하기"}
                </PText>
              </Pressable>
            ) : (
              <View style={st.inp}>
                <GrowInput
                  value={draft}
                  onChangeText={setDraft}
                  multiline
                  placeholder="영어로 답해 보세요"
                  placeholderTextColor="#B9B2A3"
                  style={st.ta}
                  accessibilityLabel="내 답"
                />
                <Pressable
                  onPress={() => {
                    const v = draft.trim();
                    if (!v) {
                      showToast("영어로 한마디 적어 주세요");
                      return;
                    }
                    send(v);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="보내기"
                  style={st.sendBtn}
                >
                  <Svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={Colors.ink}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d="M21 3 10 14M21 3l-7 18-4-7-7-4z" />
                  </Svg>
                </Pressable>
              </View>
            )}
          </>
        )}
      </PFoot>
    </>
  );
}

const Gap = () => <View style={st.gap} />;

const st = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  body: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 20, gap: 10 },
  chat: { gap: 10 },
  gap: { height: 10 },
  introWrap: { paddingBottom: 10 },
  tail: { gap: 10, paddingTop: 10 },
  aiRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    paddingRight: 35,
  },
  av: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.ink,
  },
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
  say2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  say2T: { fontFamily: Font.body800, fontSize: 12, lineHeight: 16 },
  meRow: { alignItems: "flex-end", paddingLeft: 38 },
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
  turn: {
    fontFamily: Font.body800,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
  },
  turnB: { fontFamily: Font.display, fontSize: 13, lineHeight: 18 },
  exs: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  ex: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
  },
  exT: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  hrow: { flexDirection: "row", justifyContent: "flex-end" },
  bulb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  bulbOn: { backgroundColor: Colors.yellow },
  ftMic: {
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.purple,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    boxShadow: `0px 4px 0px ${Colors.ink}`,
    marginBottom: 4,
  },
  ftMicOn: { backgroundColor: Colors.rosePink },
  ftMicT: {
    fontFamily: Font.body900,
    fontSize: 15.5,
    lineHeight: 22,
    flexShrink: 1,
  },
  inp: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  ta: {
    flex: 1,
    minHeight: 54,
    maxHeight: 120,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 16,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: Font.body500,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.ink,
    textAlignVertical: "top",
  },
  sendBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
});
