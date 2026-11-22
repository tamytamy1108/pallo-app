import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { MY_QUIZ_LEVELS, QUIZ_LEVELS, type QuizLevel } from '@/data/situation';

import { BigBtn, Foot, Kick, SUB } from './parts';

/**
 * 레벨(난이도) 고르기 (프로토타입 sitLvPick).
 * - mode 'scene': 장면에 처음 들어오면 장면 화면보다 먼저 · '레벨 바꾸기' — 미션 문장 · 롤플레이 자막 · 퀴즈 난이도가 이 레벨로
 * - mode 'quiz': 상황 퀴즈 결과의 '다른 난이도로 다시 풀기'
 * 내 레벨(두 레벨 병행이면 둘 다)에 '내 레벨', 푼 레벨엔 '최고 n/15'.
 */
export function LevelPick({ title, mode, initial, best, onGo }: { title: string; mode: 'scene' | 'quiz'; initial: QuizLevel; best: Partial<Record<QuizLevel, number>>; onGo: (lv: QuizLevel) => void }) {
  const mine = MY_QUIZ_LEVELS;
  const [sel, setSel] = useState<QuizLevel>(initial);
  const cur = QUIZ_LEVELS.find((x) => x.lv === sel) ?? QUIZ_LEVELS[1];
  const scene = mode === 'scene';
  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Kick style={styles.kickTop}>
          {title} · {scene ? '시작하기 전에' : '상황 퀴즈 15문제'}
        </Kick>
        <PText style={styles.h2} accessibilityRole="header">
          {scene ? '내 레벨을 골라요' : '어떤 난이도로 할까요?'}
        </PText>
        <PText style={styles.intro} color={SUB}>
          {scene ? (
            '미션 문장 · 롤플레이 자막 · 퀴즈 난이도가 이 레벨로 맞춰져요. 장면 화면에서 언제든 바꿀 수 있어요.'
          ) : mine.length > 1 ? (
            <>
              <PText style={[styles.intro, styles.b]} color={SUB}>
                {mine.map((n) => `Lv.${n}`).join(' · ')}
              </PText>
              를 함께 듣고 있어요. 두 레벨 모두 풀어 보면 좋아요.
            </>
          ) : (
            '같은 상황 15개를 레벨마다 다른 방식으로 물어요. 다 풀고 다른 난이도로 다시 풀 수 있어요.'
          )}
        </PText>
        <View style={styles.pick} accessibilityRole="radiogroup" accessibilityLabel="난이도">
          {QUIZ_LEVELS.map((x) => {
            const on = x.lv === sel;
            const rec = best[x.lv];
            return (
              <Pressable
                key={x.lv}
                onPress={() => {
                  setSel(x.lv);
                  sfx('tap');
                  haptic('select');
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`Lv.${x.lv} ${x.name}${mine.includes(x.lv) ? ' 내 레벨' : ''}${rec != null ? ` 최고 ${rec}/15` : ''}`}>
                {({ pressed }) => (
                  <View>
                    {!pressed ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.pcShadow]} /> : null}
                    <View style={[styles.pc, on && styles.pcOn, pressed && styles.pcDown]}>
                      <View style={styles.h}>
                        <PText style={styles.lv}>Lv.{x.lv}</PText>
                        <PText style={styles.name}>{x.name}</PText>
                        {mine.includes(x.lv) ? (
                          <View style={styles.mine}>
                            <PText style={styles.mineText} color={Colors.yellow}>
                              내 레벨
                            </PText>
                          </View>
                        ) : null}
                        {rec != null ? (
                          <View style={styles.best}>
                            <PText style={styles.bestText} color="#2E8B57">
                              최고 {rec}/15
                            </PText>
                          </View>
                        ) : null}
                      </View>
                      <PText style={styles.d} color={SUB}>
                        {x.d}
                      </PText>
                      <View style={[styles.ex, on && styles.exOn]}>
                        <PText style={styles.exText} color="#7A7488">
                          {x.ex}
                        </PText>
                      </View>
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <Foot>
        <BigBtn
          label={`Lv.${sel} ${cur.name}으로 시작하기`}
          onPress={() => {
            sfx('tap');
            onGo(sel);
          }}
        />
      </Foot>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 24, gap: 10 },
  kickTop: { marginTop: 14 },
  h2: { fontFamily: Font.body900, fontSize: 22, lineHeight: 30, letterSpacing: -0.3 },
  intro: { marginHorizontal: 0, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 13.5 * 1.6 },
  b: { fontFamily: Font.body900 },
  pick: { gap: 10 },
  pcShadow: { top: 4, bottom: -4, borderRadius: 18, backgroundColor: Colors.ink },
  pc: { alignItems: 'flex-start', gap: 4, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 2.5, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white },
  pcOn: { backgroundColor: '#FFF6B8' },
  pcDown: { transform: [{ translateY: 3 }] },
  h: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 8 },
  lv: { fontFamily: Font.display, fontSize: 15, lineHeight: 21 },
  name: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  mine: { height: 20, paddingHorizontal: 8, borderRadius: 10, backgroundColor: Colors.ink, justifyContent: 'center' },
  mineText: { fontFamily: Font.body900, fontSize: 10, lineHeight: 14 },
  best: { marginLeft: 'auto', height: 20, paddingHorizontal: 8, borderRadius: 10, backgroundColor: '#E3F5EA', justifyContent: 'center' },
  bestText: { fontFamily: Font.body800, fontSize: 11, lineHeight: 15 },
  d: { fontFamily: Font.body700, fontSize: 13, lineHeight: 13 * 1.45 },
  ex: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#F4F0E6' },
  exOn: { backgroundColor: Colors.white },
  exText: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
});
