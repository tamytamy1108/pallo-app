import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { apiErrorMessage } from '@/api/errors';
import { useCompleteOnboarding } from '@/api/session';
import { useBranchPublicGuide, useSubmitOnboarding } from '@/api/use-onboarding';
import { NextButton, OnbScreen } from '@/components/onboarding/parts';
import { Pressable } from '@/components/ui/pressable';
import { Raised } from '@/components/ui/raised';
import { ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { openTel } from '@/lib/open-out';
import { updateOnboarding, useOnboarding } from '@/state/onboarding';

/** 화면 좌우 여백 (OnbScreen 본문과 같아요) */
const SIDE = 20;
const PHOTO_H = 250;
const RADIUS = 22;

const IC = {
  loc: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  clk: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  talk: 'M4 5h16v12H8l-4 3z',
  tel: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
} as const;

/**
 * 가입 › 앱 구경 › 고른 지점 안내 (전체 화면 · 진행 바 칸 없음) — 디자인 캔버스 시안 B.
 * 위에서부터: 지점 이름 → 넘겨 보는 지점 사진 → 지점 소개 → 주소 · 운영 시간 · 스터디 · 연락처 → '앱 둘러보기'.
 * 내용은 GET /branches/{code}/guide — 지점이 콘솔 설정 > 지점 > 지점 안내에 적은 사진 · 소개 · 문의 · 운영 시간, 주소는 지점 등록 정보,
 * 스터디 줄은 그 지점에 열린 수업. 지점이 적지 않은 줄은 그리지 않고, 사진이 없으면 빈 사진 칸이에요.
 * 안내를 못 받아도 '앱 둘러보기'는 그대로 눌러요 (가입을 막지 않아요).
 * '앱 둘러보기' → POST /onboarding (APP) 뒤 가입이 끝나고 홈 (홈 시작 공지는 그다음에 떠요). 뒤로 가면 지점을 다시 골라요.
 */
export default function OnboardingBranch() {
  const branch = useOnboarding((s) => s.branch);
  const branchCode = useOnboarding((s) => s.branchCode);
  const guide = useBranchPublicGuide(branchCode);
  const complete = useCompleteOnboarding();
  const submit = useSubmitOnboarding();
  const busy = submit.isPending || complete.isPending;
  const g = guide.data;
  const name = g?.name ?? branch;

  const browse = () => {
    updateOnboarding({ path: 'app' });
    if (busy) return;
    // 가입 전체를 POST /onboarding (APP: 언어 · 이유) 으로 보내고, 되면 세션이 가입을 끝내 홈으로
    submit.mutate('APP', { onSuccess: () => complete.mutate(undefined, { onError: (e) => showToast(apiErrorMessage(e)) }) });
  };

  return (
    <OnbScreen footer={<NextButton label={busy ? '보내는 중…' : '앱 둘러보기'} disabled={busy} onPress={browse} />}>
      <PText style={styles.title} accessibilityRole="header">
        팔로 {name}입니다!
      </PText>
      {guide.isPending ? (
        <LoadingState />
      ) : guide.isError ? (
        <ErrorState onRetry={() => guide.refetch()} />
      ) : (
        <>
          <Photos photos={g?.photos ?? []} branch={name} />
          {g?.intro ? (
            <View style={styles.introBox}>
              <PText style={styles.introT} accessibilityRole="header">
                지점 소개
              </PText>
              <PText style={styles.intro}>{g.intro}</PText>
            </View>
          ) : null}
          {g && (g.address || g.openHours || g.study || g.phone) ? (
            <View style={styles.list}>
              {g.address ? <Row ic="loc">{g.address}</Row> : null}
              {g.openHours ? <Row ic="clk">{g.openHours}</Row> : null}
              {g.study ? <Row ic="talk">{g.study}</Row> : null}
              {g.phone ? (
                <Row
                  ic="tel"
                  end={
                    <Pressable onPress={() => openTel(g.phone ?? '')} accessibilityRole="button" accessibilityLabel={`${name}에 전화하기`} hitSlop={8} style={styles.call}>
                      <PText style={styles.callT}>전화</PText>
                    </Pressable>
                  }>
                  {g.phone}
                </Row>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </OnbScreen>
  );
}

/** 지점 사진: 옆으로 넘겨요 (n / 전체 · 아래 점). 사진이 없으면 빈 사진 칸 */
function Photos({ photos, branch }: { photos: string[]; branch: string }) {
  const { width } = useWindowDimensions();
  const w = width - SIDE * 2;
  const [i, setI] = useState(0);
  return (
    <View style={styles.photoWrap}>
      <Raised radius={RADIUS}>
        <View style={styles.photoBox}>
          {photos.length ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / (w - 4)))}
              accessibilityLabel={`${branch} 사진 ${photos.length}장`}>
              {photos.map((p, k) => (
                <Image key={k} source={{ uri: p }} style={{ width: w - 4, height: PHOTO_H - 4 }} contentFit="cover" accessibilityIgnoresInvertColors />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.empty} accessible accessibilityLabel={`${branch} 사진 준비 중`}>
              <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#7A705C" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <Circle cx={12} cy={13} r={3.5} />
              </Svg>
              <PText style={styles.emptyT}>지점 사진 준비 중이에요</PText>
            </View>
          )}
          {photos.length > 1 ? (
            <>
              <View style={styles.count}>
                <PText style={styles.countT}>
                  {i + 1} / {photos.length}
                </PText>
              </View>
              <View style={styles.dots} pointerEvents="none">
                {photos.map((_, k) => (
                  <View key={k} style={[styles.dot, k === i && styles.dotOn]} />
                ))}
              </View>
            </>
          ) : null}
        </View>
      </Raised>
    </View>
  );
}

function Row({ ic, children, end }: { ic: keyof typeof IC; children: ReactNode; end?: ReactNode }) {
  return (
    <View style={styles.row}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.purple} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <Path d={IC[ic]} />
      </Svg>
      <PText style={styles.rowT}>{children}</PText>
      {end}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 4, fontFamily: Font.body900, fontSize: 28, lineHeight: 36, letterSpacing: -0.6 },
  photoWrap: { marginTop: 16, marginRight: 4, marginBottom: 4 },
  photoBox: { height: PHOTO_H, borderRadius: RADIUS, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#CFC5B0', overflow: 'hidden' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyT: { fontFamily: Font.body700, fontSize: 13, color: Colors.inkSub },
  count: { position: 'absolute', right: 12, top: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(30,26,43,0.78)' },
  countT: { fontFamily: Font.display, fontSize: 11, lineHeight: 15, color: Colors.white },
  dots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotOn: { width: 18, backgroundColor: Colors.white },
  introBox: { marginTop: 16, gap: 6, paddingHorizontal: 2 },
  introT: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  intro: { fontFamily: Font.body600, fontSize: 14, lineHeight: 22, color: Colors.ink },
  list: { marginTop: 16, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, overflow: 'hidden' },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1.5, borderColor: Colors.line, marginTop: -1.5 },
  rowT: { flex: 1, fontFamily: Font.body700, fontSize: 14, lineHeight: 20 },
  call: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 2, borderColor: Colors.ink },
  callT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
});
