import { StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import type { SurveyAnswers } from '@/components/meet/meet-store';
import { Icon } from '@/components/meet/icons';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { SurveyQuestion } from '@/data/events';
import { sfx } from '@/lib/feedback';

/** 필수(*) 질문에 다 답했는지 (프로토타입 svDone) */
export const surveyDone = (Q: SurveyQuestion[], A: SurveyAnswers) =>
  Q.every((q, i) => {
    const a = A[i];
    if (!q.req) return true;
    if (q.t === 'text') return typeof a === 'string' && !!a.trim();
    if (q.t === 'multi') return Array.isArray(a) && a.length > 0;
    return typeof a === 'number';
  });

/** 내가 보낸 답을 [질문, 답] 으로 (프로토타입 svAnsText) */
export const surveyAnswerLines = (Q: SurveyQuestion[], A: SurveyAnswers) =>
  Q.map((q, i): [string, string] => {
    const a = A[i];
    const v = q.t === 'text' ? (typeof a === 'string' ? a.trim() : '') : q.t === 'multi' ? (Array.isArray(a) ? a.map((j) => q.opts[j]).join(', ') : '') : typeof a === 'number' ? q.opts[a] : '';
    return [q.q, v];
  }).filter(([, v]) => v);

/** 신청 설문 답하기 (프로토타입 svAnsHTML · .sv-ans · .sv-a · .sv-o) */
export function SurveyForm({ questions, answers, onChange }: { questions: SurveyQuestion[]; answers: SurveyAnswers; onChange: (a: SurveyAnswers) => void }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.lb}>
        <Icon name="check" size={14} color={Colors.purple} strokeWidth={2.6} />
        <PText style={styles.lbT}>신청 설문 · 주최가 준비한 질문이에요</PText>
      </View>
      {questions.map((q, i) => (
        <View key={q.q} style={styles.card}>
          <PText style={styles.q}>
            {q.q}
            {q.req ? <PText style={styles.req}> *</PText> : null}
          </PText>
          {q.t === 'multi' ? <PText style={styles.small}>여러 개 골라도 돼요</PText> : null}
          {q.t === 'text' ? (
            <TextInput
              value={typeof answers[i] === 'string' ? (answers[i] as string) : ''}
              onChangeText={(t) => onChange({ ...answers, [i]: t })}
              placeholder="답을 적어 주세요"
              placeholderTextColor="#8C8597"
              maxLength={60}
              style={styles.in}
              accessibilityLabel={q.q}
            />
          ) : (
            <View accessibilityRole={q.t === 'one' ? 'radiogroup' : undefined}>
              {q.opts.map((o, j) => {
                const cur = answers[i];
                const on = q.t === 'one' ? cur === j : Array.isArray(cur) && cur.includes(j);
                return (
                  <Pressable
                    key={o}
                    onPress={() => {
                      sfx('pick');
                      if (q.t === 'one') onChange({ ...answers, [i]: j });
                      else {
                        const L = Array.isArray(cur) ? cur : [];
                        onChange({ ...answers, [i]: on ? L.filter((x) => x !== j) : [...L, j].sort() });
                      }
                    }}
                    accessibilityRole={q.t === 'one' ? 'radio' : 'checkbox'}
                    accessibilityState={{ checked: on }}
                    style={styles.o}>
                    <View style={[styles.bx, q.t === 'multi' && styles.bxMulti, on && (q.t === 'one' ? styles.bxOne : styles.bxMultiOn)]}>
                      {on && q.t === 'multi' ? (
                        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M5 12.5l4.5 4.5L19 7.5" />
                        </Svg>
                      ) : null}
                    </View>
                    <PText style={[styles.oT, on && { fontFamily: Font.body900 }]}>{o}</PText>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  lb: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lbT: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 19 },
  card: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, paddingVertical: 12, paddingHorizontal: 14, gap: 6 },
  q: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20.3 },
  req: { fontFamily: Font.body900, fontSize: 14.5, color: '#E5484D' },
  small: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub, marginTop: -4 },
  o: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 42, paddingVertical: 4 },
  bx: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },
  bxMulti: { borderRadius: 7 },
  bxOne: { borderWidth: 7, borderColor: Colors.purple },
  bxMultiOn: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  oT: { fontFamily: Font.body700, fontSize: 14, lineHeight: 20 },
  in: { height: 48, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, paddingHorizontal: 14, fontFamily: Font.body600, fontSize: 14, color: Colors.ink },
});
