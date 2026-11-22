import {
  NotoSansKR_500Medium,
  NotoSansKR_600SemiBold,
  NotoSansKR_700Bold,
  NotoSansKR_800ExtraBold,
  NotoSansKR_900Black,
} from '@expo-google-fonts/noto-sans-kr';
import { Unbounded_600SemiBold, Unbounded_800ExtraBold } from '@expo-google-fonts/unbounded';

/** 앱을 켤 때 한 번 불러오는 글꼴 파일 (프로토타입에서 쓰는 굵기만). */
export const FontAssets = {
  NotoSansKR_500Medium,
  NotoSansKR_600SemiBold,
  NotoSansKR_700Bold,
  NotoSansKR_800ExtraBold,
  NotoSansKR_900Black,
  Unbounded_600SemiBold,
  Unbounded_800ExtraBold,
};

/**
 * 앱에서는 굵기마다 글꼴 이름이 달라요 (fontWeight 대신 이 이름을 써요).
 * display: 영문 · 숫자 제목 (Unbounded). Unbounded 에는 한글이 없어서 한글은 body 900 으로 그려요.
 */
export const Font = {
  display: 'Unbounded_800ExtraBold',
  displaySemi: 'Unbounded_600SemiBold',
  body500: 'NotoSansKR_500Medium',
  body600: 'NotoSansKR_600SemiBold',
  body700: 'NotoSansKR_700Bold',
  body800: 'NotoSansKR_800ExtraBold',
  body900: 'NotoSansKR_900Black',
} as const;
