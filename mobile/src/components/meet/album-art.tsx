import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { C, type AlbumArt } from '@/data/meet';

/*
 * 동아리 사진첩 · 정기 모임 썸네일에 쓰는 예시 그림 (프로토타입 LG_PICS — 350 × 350 판을 칸 크기로 줄여요).
 * 사진첩 · 썸네일에서는 그림 속 글자를 숨겨서(color: transparent) 모양만 그려요. 실제 앱은 올린 사진으로 바뀌어요.
 */
export const ALBUM_BG: Record<AlbumArt, string> = { party: C.pu, ramen: C.pk, book: C.sky, run: C.y, trip: C.sky, cafe: C.lpu };

const I = C.ink;
const box = (s: ViewStyle): ViewStyle => ({ position: 'absolute', borderWidth: 2, borderColor: I, ...s });

function Shapes({ k }: { k: AlbumArt }) {
  switch (k) {
    case 'party':
      return (
        <>
          <View style={box({ right: -30, top: -30, width: 170, height: 170, borderRadius: 85, backgroundColor: C.pk })} />
          <View style={box({ right: 40, top: 62, width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' })} />
        </>
      );
    case 'ramen':
      return (
        <>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <Pattern id="rm" patternUnits="userSpaceOnUse" width={36} height={36} patternTransform="rotate(45)">
                <Rect x={18} width={18} height={36} fill="rgba(255,255,255,0.18)" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#rm)" />
          </Svg>
          <View style={box({ left: 175 - 101.5, top: 147 - 48, width: 203, height: 96, borderBottomLeftRadius: 100, borderBottomRightRadius: 100, backgroundColor: '#fff' })} />
          <View style={box({ left: 175 - 115.5, top: 94.5, width: 231, height: 15, borderRadius: 8, backgroundColor: C.y })} />
        </>
      );
    case 'book':
      return (
        <>
          <View style={box({ left: '12%', top: '16%', width: '26%', height: '52%', borderRadius: 6, backgroundColor: C.y, transform: [{ rotate: '-8deg' }] })} />
          <View style={box({ left: '37%', top: '12%', width: '26%', height: '56%', borderRadius: 6, backgroundColor: '#fff' })} />
          <View style={box({ left: '61%', top: '17%', width: '26%', height: '50%', borderRadius: 6, backgroundColor: C.pk, transform: [{ rotate: '7deg' }] })} />
        </>
      );
    case 'run':
      return <View style={box({ left: -20, right: -20, top: '46%', height: 64, borderLeftWidth: 0, borderRightWidth: 0, backgroundColor: C.lsky })} />;
    case 'trip':
      return (
        <>
          <View style={box({ right: 28, top: 26, width: 86, height: 86, borderRadius: 43, backgroundColor: C.y })} />
          <View style={box({ left: -10, right: -10, bottom: 70, height: 46, borderLeftWidth: 0, borderRightWidth: 0, backgroundColor: '#fff' })} />
        </>
      );
    default:
      return (
        <>
          <View style={box({ left: 115, top: 161 - 60, width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', boxShadow: '4px 4px 0px #1E1A2B' })} />
          <View style={box({ left: 143, top: 161 - 32, width: 64, height: 64, borderRadius: 32, backgroundColor: '#C49A6C' })} />
        </>
      );
  }
}

/** size × size 칸에 그림 하나 */
export function AlbumThumb({ k, size, style }: { k: AlbumArt; size: number; style?: ViewStyle }) {
  return (
    <View style={[{ width: size, height: size, backgroundColor: ALBUM_BG[k], overflow: 'hidden' }, style]}>
      <View style={{ position: 'absolute', left: 0, top: 0, width: 350, height: 350, transform: [{ scale: size / 350 }], transformOrigin: 'left top' }} pointerEvents="none">
        <Shapes k={k} />
      </View>
    </View>
  );
}
