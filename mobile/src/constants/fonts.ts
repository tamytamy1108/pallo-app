import {
  NotoSansKR_500Medium,
  NotoSansKR_600SemiBold,
  NotoSansKR_700Bold,
  NotoSansKR_800ExtraBold,
  NotoSansKR_900Black,
} from '@expo-google-fonts/noto-sans-kr';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import { BlackHanSans_400Regular } from '@expo-google-fonts/black-han-sans';
import { DelaGothicOne_400Regular } from '@expo-google-fonts/dela-gothic-one';
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
  BlackHanSans_400Regular,
  DelaGothicOne_400Regular,
  Anton_400Regular,
  // 중국어 인사말 '你好' 두 글자만 잘라 낸 Noto Sans SC 900 (2KB). 다른 한자는 없어요 — 중국어 글이 더 필요하면 전체 글꼴로 바꿔요
  NotoSansSC_900_nihao: require('@/assets/fonts/NotoSansSC-Black-nihao.ttf'),
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
  /** 홈 인사말 닉네임의 한글 (Unbounded 와 굵기를 맞춘 포스터 글꼴) */
  nameKo: 'BlackHanSans_400Regular',
  /** 홈 인사말 닉네임의 일본어 (가나 · 한자) */
  nameJa: 'DelaGothicOne_400Regular',
  /** 첫 화면 포스터 문구 (YOUR FIRST WORD, …) */
  poster: 'Anton_400Regular',
  /** 중국어 인사말 你好 (그 두 글자만 있어요) */
  zhHello: 'NotoSansSC_900_nihao',
} as const;
