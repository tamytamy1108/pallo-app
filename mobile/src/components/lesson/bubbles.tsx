import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Avatar, pplColor, SaveButton, SpeakerButton } from '@/components/lesson/lesson-ui';
import { showToast } from '@/components/ui/toast';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { toggleExpression, useIsSaved } from '@/state/expressions';

const CHAR = {
  yellow: require('@/assets/characters/c-upright-yellow.png'),
  purple: require('@/assets/characters/c-purple-standard-3d.png'),
};

/**
 * 말풍선 (프로토타입 bubbleHTML · .ls-ask): 왼쪽에 인물 얼굴(+이름) 또는 팔로, 오른쪽 흰 말풍선(영어 + 뜻 + 듣기).
 * 소리 끄기면 듣기 버튼이 숨어요.
 */
export function AskBubble({ who, char, en, ko, soundOff, onSay }: { who?: string; char?: 'yellow' | 'purple'; en: string; ko?: string; soundOff: boolean; onSay: () => void }) {
  const person = !!who;
  return (
    <View style={StyleSheet.flatten([styles.ask, person && styles.askPerson])}>
      {person ? (
        <View style={styles.pav}>
          <Avatar name={who} size={72} />
          <PText style={styles.pavName} color={pplColor(who)}>
            {who}
          </PText>
        </View>
      ) : (
        <Image source={CHAR[char ?? 'yellow']} style={styles.char} contentFit="contain" />
      )}
      <View style={StyleSheet.flatten([styles.bub, person && styles.bubPerson, !soundOff && styles.bubSpk])}>
        <View style={StyleSheet.flatten([styles.tail, person ? styles.tailTop : styles.tailBottom])} />
        <PText style={styles.en}>{en}</PText>
        {ko ? (
          <PText style={styles.ko} color={Colors.inkSub}>
            {ko}
          </PText>
        ) : null}
        {!soundOff && (
          <View style={styles.spk}>
            <SpeakerButton onPress={onSay} />
          </View>
        )}
      </View>
    </View>
  );
}

/** 내 차례 (대화문 역할 연기): 노랑 말풍선에 뜻 + 오른쪽 내 인물 얼굴 '나 · Sonya' (프로토타입 .tk-my) */
export function MyTurnBubble({ me, ko }: { me: string; ko: string }) {
  return (
    <View style={styles.my}>
      <View style={styles.myBub}>
        <View style={styles.myTail} />
        <PText style={styles.myKo}>{ko}</PText>
      </View>
      <View style={styles.pav}>
        <Avatar name={me} size={64} />
        <PText style={styles.pavName} color={pplColor(me)}>
          나 · {me}
        </PText>
      </View>
    </View>
  );
}

/** 표현 저장 · 빼기 + 토스트 (프로토타입 toggleMark · '내 표현함에 저장했어요') — fixed: 고친 문장 */
export function saveExpressionToggle(e: { en: string; ko: string; source: string; fixed?: string }) {
  const on = toggleExpression(e);
  if (on) {
    sfx('save');
    showToast('내 표현함에 저장했어요');
  } else showToast('표현함에서 뺐어요');
}

/** 완성 문장 카드: 영어 + 뜻 + 듣기 + 표현 저장 (프로토타입 .sh-sent) */
export function SentenceCard({ en, ko, soundOff, source, onSay }: { en: string; ko: string; soundOff: boolean; source: string; onSay: () => void }) {
  const saved = useIsSaved(en);
  return (
    <View style={styles.sent}>
      <View style={styles.sentT}>
        <PText style={styles.sentEn}>{en}</PText>
        {ko ? (
          <PText style={styles.sentKo} color={Colors.inkSub}>
            {ko}
          </PText>
        ) : null}
      </View>
      {!soundOff && <SpeakerButton onPress={onSay} size={36} tone="sky" label="문장 듣기" />}
      <SaveButton saved={saved} size={36} onPress={() => saveExpressionToggle({ en, ko, source })} />
    </View>
  );
}

const styles = StyleSheet.create({
  sent: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingLeft: 14, paddingRight: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white },
  sentT: { flex: 1, minWidth: 0 },
  sentEn: { fontFamily: Font.display, fontSize: 14.5, lineHeight: 20, letterSpacing: -0.2 },
  sentKo: { marginTop: 3, fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
  ask: { flexDirection: 'row', alignItems: 'flex-end', gap: 20, marginTop: 6 },
  askPerson: { alignItems: 'flex-start', gap: 16 },
  char: { width: 92, height: 66 },
  pav: { alignItems: 'center', gap: 2 },
  pavName: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  bub: { flex: 1, minWidth: 0, marginBottom: 28, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 20, backgroundColor: Colors.white, boxShadow: '3px 3px 0 #1E1A2B' },
  bubPerson: { marginBottom: 0 },
  bubSpk: { paddingRight: 52 },
  tail: { position: 'absolute', left: -9, width: 14, height: 14, backgroundColor: Colors.white, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: Colors.ink, transform: [{ rotate: '45deg' }] },
  tailBottom: { bottom: 16 },
  tailTop: { top: 28 },
  en: { fontFamily: Font.body900, fontSize: 17, lineHeight: 24, letterSpacing: -0.2 },
  ko: { marginTop: 6, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  spk: { position: 'absolute', top: 10, right: 10 },
  my: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 16, marginTop: 2 },
  myBub: { flex: 1, maxWidth: '76%', paddingVertical: 14, paddingHorizontal: 16, borderWidth: 2, borderColor: Colors.ink, borderRadius: 20, backgroundColor: Colors.yellow, boxShadow: '3px 3px 0 #1E1A2B' },
  myTail: { position: 'absolute', right: -9, top: 24, width: 14, height: 14, backgroundColor: Colors.yellow, borderRightWidth: 2, borderTopWidth: 2, borderColor: Colors.ink, transform: [{ rotate: '45deg' }] },
  myKo: { fontFamily: Font.body900, fontSize: 19, lineHeight: 26 },
});
