import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { guardMember } from '@/components/common/trial-guide';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { dday, isPast, monthDay, type Meet } from '@/data/meet';

import { Icon } from './icons';
import { toggleIn, useMeetStore } from './meet-store';
import { CapBar, LgButton, Shadowed } from './parts';
import { Poster, posterFg, posterSlides } from './poster';

/**
 * 번개 카드 = 티켓 (프로토타입 LG_CARD.meet · .lg-pc.mt): 포스터가 카드 맨 위까지 꽉, 위에 '번개 · D-8',
 * 점선 + 양옆 반원 홈, 제목 · 날짜 · 장소 · 인원 바 · 노랑 버튼. 카드에서 바로 참여하지 않고 상세로 가요.
 */
export function MeetCard({ m, width }: { m: Meet; width: number }) {
  const joined = useMeetStore((s) => !!s.joined[m.id]);
  const vac = useMeetStore((s) => !!s.vac[m.id]);
  const cur = m.cur + (joined ? 1 : 0);
  const past = isPast(m);
  const slide = posterSlides(m.id, false, m.posters)[0];
  const fg = posterFg(slide.bg);
  const open = () => router.push(`/meet/${m.id}`);
  const full = cur >= m.max && !joined;

  const btn = past ? (
    <LgButton label="후기 보기" variant="wh" height={36} onPress={open} />
  ) : m.mine ? (
    <LgButton label={m.closed ? '모집 닫음' : '모집 닫기'} variant={m.closed ? 'off' : 'wh'} height={36} onPress={open} />
  ) : full ? (
    <LgButton
      label={vac ? '알림 받는 중' : '빈자리 알림 받기'}
      variant={vac ? 'on' : 'wh'}
      height={36}
      pressedState={vac}
      onPress={() =>
        guardMember(() => {
          toggleIn('vac', m.id);
          showToast(vac ? '빈자리 알림을 껐어요' : '자리가 나면 바로 알려 드릴게요');
        })
      }
    />
  ) : (
    <LgButton label={joined ? '참여 완료' : '참여하기'} variant={joined ? 'done' : 'y'} height={36} onPress={open} />
  );

  return (
    <Shadowed radius={16} style={{ width, opacity: m.closed ? 0.75 : past ? 0.8 : 1 }}>
      <View style={styles.card}>
        <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={`${m.title} 자세히 보기`}>
          <Poster id={m.id} slide={slide} height={150} wordSize={28} />
          <View style={styles.tbar} pointerEvents="none">
            <Icon name="bolt" size={15} color={fg} fill={fg} strokeWidth={1.6} />
            <PText style={[styles.tb, { color: fg }]}>번개</PText>
            <View style={styles.sp} />
            <PText style={[styles.dd, { color: fg }]}>{dday(m)}</PText>
          </View>
          <Svg height={2} width="100%" style={styles.dash}>
            <Line x1={0} y1={1} x2="100%" y2={1} stroke={Colors.ink} strokeWidth={2} strokeDasharray="6 4" />
          </Svg>
        </Pressable>
        <View style={styles.body}>
          <View style={[styles.notch, { left: -15 }]} />
          <View style={[styles.notch, { right: -15 }]} />
          <Pressable onPress={open} accessibilityRole="link">
            <PText numberOfLines={1} style={styles.t}>
              {m.title}
            </PText>
          </Pressable>
          <View style={styles.m}>
            <View style={styles.mi}>
              <Icon name="cal" size={13} color={Colors.inkSub} />
              <PText numberOfLines={1} style={styles.mt}>
                {monthDay(m)} {m.wd}
              </PText>
            </View>
            <View style={[styles.mi, styles.shrink]}>
              <Icon name="pin" size={13} color={Colors.inkSub} />
              <PText numberOfLines={1} style={[styles.mt, styles.shrink]}>
                {m.place}
              </PText>
            </View>
          </View>
          <View style={styles.foot}>
            <View>
              <PText style={styles.n}>
                {cur}/{m.max}명 · {m.host}
              </PText>
              <CapBar cur={cur} max={m.max} />
            </View>
            <View style={styles.sp} />
            {btn}
          </View>
        </View>
      </View>
    </Shadowed>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white, overflow: 'hidden' },
  tbar: { position: 'absolute', top: 0, left: 0, right: 0, height: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, zIndex: 3 },
  tb: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19 },
  dd: { fontFamily: Font.display, fontSize: 14, lineHeight: 17, letterSpacing: -0.3 },
  sp: { flex: 1 },
  dash: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  body: { paddingTop: 12, paddingHorizontal: 14, paddingBottom: 14, position: 'relative' },
  notch: { position: 'absolute', top: -15, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.cream, borderWidth: 2, borderColor: Colors.ink, zIndex: 2 },
  t: { fontFamily: Font.body900, fontSize: 16, lineHeight: 20.8 },
  m: { flexDirection: 'row', gap: 12, marginTop: 5, overflow: 'hidden' },
  mi: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shrink: { flexShrink: 1 },
  mt: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 11 },
  n: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
});
