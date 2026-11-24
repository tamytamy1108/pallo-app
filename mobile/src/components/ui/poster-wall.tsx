import { useId, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { POSTER_WALLS, cardWords, wallInk, wallMeta, type MadeCard } from '@/data/poster-walls';

/*
 * 포스터 카드 (휴대폰 기본 배경화면 같은 그림 + 직접 적은 큰 글자).
 * PosterWall: 그림만 (칸을 꽉 채워요 · 어떤 비율이든 가운데 기준으로 잘라요)
 * WallCard:   그림 + 글자 (poster = 왼쪽 아래 · square = 가운데)
 * CardMaker:  개설 화면의 '카드 만들기' 칸 (선택) — 켜면 배경 고르기 · 글자 두 줄 · 미리보기
 */

const lg = (id: string, stops: [number, string, number?][], x2 = 0, y2 = 1) => (
  <LinearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
    {stops.map(([o, c, op = 1]) => (
      <Stop key={o} offset={o} stopColor={c} stopOpacity={op} />
    ))}
  </LinearGradient>
);

/** 배경 그림 (100 × 125 좌표) */
function art(id: string, u: string): ReactNode {
  const g = (n: string) => `url(#${u}${n})`;
  switch (id) {
    case 'sunrise':
      return (
        <>
          <Defs>{lg(u + 'a', [[0, '#FFC58A'], [0.55, '#FF7AA2'], [1, '#8B5CF6']], 0.6, 1)}</Defs>
          <Rect width={100} height={125} fill={g('a')} />
          <Circle cx={70} cy={36} r={20} fill="#FFF4D6" opacity={0.6} />
          <Circle cx={70} cy={36} r={30} fill="#FFF4D6" opacity={0.18} />
          <Circle cx={18} cy={104} r={36} fill="#FFFFFF" opacity={0.1} />
        </>
      );
    case 'ocean':
      return (
        <>
          <Defs>{lg(u + 'a', [[0, '#8EDBFA'], [1, '#2F6FD0']])}</Defs>
          <Rect width={100} height={125} fill={g('a')} />
          <Path d="M0 70 Q25 60 50 70 T100 70 V125 H0Z" fill="#FFFFFF" opacity={0.16} />
          <Path d="M0 86 Q25 76 50 86 T100 86 V125 H0Z" fill="#FFFFFF" opacity={0.18} />
          <Path d="M0 102 Q25 93 50 102 T100 102 V125 H0Z" fill="#1F4FA8" opacity={0.35} />
        </>
      );
    case 'peach':
      return (
        <>
          <Defs>{lg(u + 'a', [[0, '#FFEDE3'], [1, '#FFB3A7']])}</Defs>
          <Rect width={100} height={125} fill={g('a')} />
          <Ellipse cx={80} cy={20} rx={32} ry={26} fill="#FF8FA3" opacity={0.35} />
          <Ellipse cx={14} cy={58} rx={26} ry={22} fill="#FFD6A5" opacity={0.7} />
          <Ellipse cx={74} cy={98} rx={38} ry={30} fill="#FFFFFF" opacity={0.3} />
        </>
      );
    case 'lemon':
      return (
        <>
          <Defs>{lg(u + 'a', [[0, '#FFFBD1'], [1, '#FFE200']])}</Defs>
          <Rect width={100} height={125} fill={g('a')} />
          <Circle cx={72} cy={30} r={17} fill="#FFFFFF" opacity={0.8} />
          <Circle cx={72} cy={30} r={26} fill="#FFFFFF" opacity={0.25} />
          <Path d="M0 98 Q40 84 100 96 V125 H0Z" fill="#FFCB2E" opacity={0.6} />
        </>
      );
    case 'mint':
      return (
        <>
          <Defs>{lg(u + 'a', [[0, '#EAF8F0'], [1, '#A6E0C0']])}</Defs>
          <Rect width={100} height={125} fill={g('a')} />
          <Circle cx={26} cy={26} r={10} fill="#FFFFFF" opacity={0.8} />
          <Path d="M0 84 Q30 66 60 80 T100 76 V125 H0Z" fill="#7FCF9F" opacity={0.6} />
          <Path d="M0 100 Q45 86 100 100 V125 H0Z" fill="#3FA672" opacity={0.55} />
        </>
      );
    case 'grape':
      return (
        <>
          <Defs>
            <RadialGradient id={u + 'a'} cx="0.3" cy="0.2" r="1">
              <Stop offset="0" stopColor="#E28BE0" />
              <Stop offset="0.55" stopColor="#7A3FB0" />
              <Stop offset="1" stopColor="#3A1F6E" />
            </RadialGradient>
          </Defs>
          <Rect width={100} height={125} fill={g('a')} />
          <Circle cx={82} cy={96} r={30} fill="#FFFFFF" opacity={0.08} />
          <Circle cx={88} cy={22} r={8} fill="#FFFFFF" opacity={0.2} />
        </>
      );
    case 'night':
      return (
        <>
          <Defs>{lg(u + 'a', [[0, '#0E0B22'], [1, '#3A2470']])}</Defs>
          <Rect width={100} height={125} fill={g('a')} />
          <Circle cx={74} cy={26} r={16} fill="#FFF3C4" opacity={0.15} />
          <Circle cx={74} cy={26} r={9} fill="#FFF3C4" />
          {[[12, 14], [30, 30], [48, 10], [88, 52], [20, 56], [56, 44], [8, 84], [92, 90], [40, 70], [66, 64], [26, 100], [84, 114]].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={i % 3 ? 0.7 : 1.2} fill="#FFFFFF" opacity={0.9} />
          ))}
        </>
      );
    case 'aurora':
      return (
        <>
          <Defs>
            {lg(u + 'a', [[0, '#0B1F33'], [1, '#162B52']])}
            {lg(u + 'b', [[0, '#5CF2B8', 0.85], [1, '#38BDF8', 0]], 1, 0.4)}
            {lg(u + 'c', [[0, '#B784FF', 0], [1, '#B784FF', 0.7]], 1, 0.2)}
          </Defs>
          <Rect width={100} height={125} fill={g('a')} />
          <Path d="M-10 52 C20 18 46 66 76 30 S110 20 110 20 V44 C86 52 60 82 30 64 S-10 78 -10 78Z" fill={g('b')} />
          <Path d="M-10 30 C24 4 50 40 80 10 S110 0 110 0 V18 C84 34 58 52 30 38 S-10 50 -10 50Z" fill={g('c')} />
          {[[14, 98], [36, 112], [62, 100], [88, 110], [78, 86]].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={0.8} fill="#FFFFFF" opacity={0.8} />
          ))}
        </>
      );
    case 'cherry':
      return (
        <>
          <Defs>{lg(u + 'a', [[0, '#FFF3F7'], [1, '#FFC7D9']])}</Defs>
          <Rect width={100} height={125} fill={g('a')} />
          {[[18, 18, 20], [80, 30, -30], [60, 12, 60], [88, 76, 10], [10, 66, -50], [40, 40, 30], [70, 104, -20], [24, 112, 70]].map(([x, y, r], i) => (
            <G key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
              <Path d="M0 -4 C3.5 -3 3.5 2.5 0 4 C-3.5 2.5 -3.5 -3 0 -4Z" fill={i % 2 ? '#F7A8C4' : '#FFB8CF'} />
            </G>
          ))}
        </>
      );
    case 'sky':
      return (
        <>
          <Defs>{lg(u + 'a', [[0, '#A9D4FA'], [1, '#EAF5FF']])}</Defs>
          <Rect width={100} height={125} fill={g('a')} />
          {[[26, 26, 1], [76, 50, 0.8], [36, 88, 1.2]].map(([x, y, s], i) => (
            <G key={i} fill="#FFFFFF" opacity={0.95}>
              <Ellipse cx={x} cy={y} rx={16 * s} ry={6 * s} />
              <Circle cx={x - 5 * s} cy={y - 4 * s} r={6 * s} />
              <Circle cx={x + 4 * s} cy={y - 6 * s} r={8 * s} />
            </G>
          ))}
        </>
      );
    case 'paper':
      return (
        <>
          <Rect width={100} height={125} fill="#FBF6EA" />
          {Array.from({ length: 13 }, (_, i) => (
            <Path key={'h' + i} d={`M0 ${i * 10} H100`} stroke="#E8DFC9" strokeWidth={0.5} />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <Path key={'v' + i} d={`M${i * 10} 0 V125`} stroke="#E8DFC9" strokeWidth={0.5} />
          ))}
          <Rect x={58} y={10} width={34} height={9} fill="#FFE200" opacity={0.85} transform="rotate(8 75 14)" />
        </>
      );
    default: // pallo
      return (
        <>
          <Rect width={100} height={125} fill="#FFE200" />
          <Circle cx={92} cy={8} r={26} fill="#493087" />
          <Circle cx={4} cy={70} r={18} fill="#F28CB1" />
          <Circle cx={74} cy={44} r={6} fill="#FFFFFF" />
          <Circle cx={30} cy={22} r={3} fill="#1E1A2B" opacity={0.85} />
        </>
      );
  }
}

/** 배경 그림만 (칸을 꽉 채워요) */
export function PosterWall({ id }: { id: string }) {
  const u = 'w' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" pointerEvents="none">
      {art(id, u)}
    </Svg>
  );
}

/** 가장 긴 줄이 칸 폭(width)의 82% 안에 들어가는 글자 크기 (디스플레이 글꼴 대문자 · 한글 한 글자 ≈ 1em) — 웹은 글자 자동 줄이기가 없어서 직접 맞춰요 */
export const fitWordSize = (words: string[], width: number, max: number) => {
  const longest = Math.max(1, ...words.map((w) => [...w].length));
  return Math.max(7, Math.min(max, (width * 0.82) / longest));
};

/** 그림 + 큰 글자. poster: 왼쪽 아래 · square: 가운데 (챌린지 네모 칸). width 를 주면 긴 글자를 칸에 맞게 줄여요 */
export function WallCard({ wall, words, size: max, width, shape = 'poster', style, children }: { wall: string; words: string[]; size: number; width?: number; shape?: 'poster' | 'square'; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const ink = wallInk(wall);
  const size = width ? fitWordSize(words, width, max) : max;
  return (
    <View style={[styles.card, { backgroundColor: wallMeta(wall).base }, style]}>
      <PosterWall id={wall} />
      <View style={shape === 'poster' ? styles.wordsPoster : styles.wordsSquare} pointerEvents="none">
        <PText style={[styles.words, { fontSize: size, lineHeight: size * 1.02, color: ink, textAlign: shape === 'poster' ? 'left' : 'center' }]}>
          {words.join('\n')}
        </PText>
      </View>
      {children}
    </View>
  );
}

type MakerProps = {
  value: MadeCard | null;
  onChange: (v: MadeCard | null) => void;
  /** 글자 칸 비워 두면 들어가는 글자 (두 줄) */
  fallback: string[];
  shape?: 'poster' | 'square';
  /** 글자 다듬기 (예: 챌린지는 영어 대문자만) */
  clean?: (t: string) => string;
  maxLength?: number;
  /** 켰을 때 안내 (기본: 카드가 대표 · 사진은 뒤에) */
  onNote?: string;
};

/**
 * '카드 만들기' 칸 (선택): 켜면 배경 12가지 중 고르기 · 큰 글자 두 줄 · 미리보기.
 * 카드를 만들면 그게 대표(메인)가 되고, 올린 사진은 그 뒤에 보여요.
 */
export function CardMaker({ value, onChange, fallback, shape = 'poster', clean = (t) => t, maxLength = 12, onNote = '카드가 대표가 되고, 올린 사진은 그 뒤에 보여요.' }: MakerProps) {
  const on = !!value;
  const toggle = () => {
    sfx('tap');
    haptic('select');
    onChange(on ? null : { wall: POSTER_WALLS[0].id, words: ['', ''] });
  };
  const setWord = (i: number, t: string) => value && onChange({ ...value, words: value.words.map((w, k) => (k === i ? clean(t) : w)) });
  const pick = (wall: string) => {
    if (!value || value.wall === wall) return;
    sfx('pick');
    haptic('select');
    onChange({ ...value, wall });
  };
  const pw = shape === 'poster' ? 108 : 96;
  const ph = shape === 'poster' ? 135 : 96;
  return (
    <View style={styles.maker}>
      <Pressable onPress={toggle} accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel="카드 만들기" style={styles.tRow}>
        <View style={styles.tTx}>
          <PText style={styles.tB}>카드 만들기 · 선택</PText>
          <PText style={styles.tS}>{on ? onNote : '마땅한 사진이 없으면 배경을 골라 문구를 넣어요.'}</PText>
        </View>
        <View style={[styles.sw, on && styles.swOn]}>
          <View style={[styles.knob, on && styles.knobOn]} />
        </View>
      </Pressable>
      {value ? (
        <>
          <View style={styles.row}>
            <WallCard wall={value.wall} words={cardWords(value.words, fallback)} size={shape === 'poster' ? 26 : 18} width={pw} shape={shape} style={{ width: pw, height: ph, borderRadius: shape === 'poster' ? 14 : 16 }} />
            <View style={styles.ins}>
              {[0, 1].map((i) => (
                <TextInput
                  key={i}
                  value={value.words[i] ?? ''}
                  onChangeText={(t) => setWord(i, t)}
                  maxLength={maxLength}
                  autoCorrect={false}
                  placeholder={fallback[i] ?? ''}
                  placeholderTextColor="#9B94A6"
                  accessibilityLabel={`카드 문구 ${i ? '둘째' : '첫'} 줄`}
                  style={styles.in}
                />
              ))}
              <PText style={styles.hint}>비워 두면 &apos;{fallback.join(' ')}&apos;</PText>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walls}>
            {POSTER_WALLS.map((w) => {
              const sel = w.id === value.wall;
              return (
                <Pressable key={w.id} onPress={() => pick(w.id)} accessibilityRole="button" accessibilityState={{ selected: sel }} accessibilityLabel={`배경 ${w.name}`} style={styles.wItem}>
                  <View style={[styles.wSw, sel && styles.wSwOn, { backgroundColor: w.base }]}>
                    <PosterWall id={w.id} />
                  </View>
                  <PText style={[styles.wN, sel && styles.wNOn]} numberOfLines={1}>
                    {w.name}
                  </PText>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', position: 'relative' },
  wordsPoster: { position: 'absolute', left: '9%', right: '9%', bottom: '8%' },
  wordsSquare: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  words: { fontFamily: Font.display, letterSpacing: -0.6 },
  maker: { gap: 10, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: '#fff', padding: 12 },
  tRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tTx: { flex: 1, gap: 1 },
  tB: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  tS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  sw: { width: 46, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#EEE8DA', padding: 2 },
  swOn: { backgroundColor: Colors.yellow },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink },
  knobOn: { transform: [{ translateX: 18 }] },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  ins: { flex: 1, gap: 6 },
  in: { height: 40, borderWidth: 2, borderColor: Colors.ink, borderRadius: 12, paddingHorizontal: 10, fontFamily: Font.body800, fontSize: 14, color: Colors.ink, backgroundColor: Colors.cream },
  hint: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  walls: { gap: 8, paddingRight: 4 },
  wItem: { width: 54, gap: 3, alignItems: 'center' },
  wSw: { width: 48, height: 60, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  wSwOn: { borderColor: Colors.ink, boxShadow: '2px 2px 0px #1E1A2B' },
  wN: { fontFamily: Font.body700, fontSize: 10.5, lineHeight: 14, color: Colors.inkSub },
  wNOn: { fontFamily: Font.body900, color: Colors.ink },
});
