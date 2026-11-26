import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import type { BranchSummary, RejectedLink } from '@/api/branch-summary';
import { apiErrorMessage } from '@/api/errors';
import { branchSummaryQuery } from '@/api/queries';
import { useAcknowledgeLinkRequest } from '@/api/use-acknowledge-link-request';
import { Button } from '@/components/ui/button';
import { Raised } from '@/components/ui/raised';
import { LayerModal } from '@/components/ui/sheet-stack';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic } from '@/lib/feedback';
import { createStore } from '@/lib/store';

/*
 * 지점 연동 반려 팝업 — 홈에 들어오면 가운데에 떠요. 지점이 남긴 반려 사유를 보여 주고 [확인]을 누르면
 * 서버에 확인했다고 남겨(POST /me/branch-link-requests/:id/acknowledge) 다시는 안 떠요.
 * 바깥을 눌러도 닫히지 않아요 (꼭 [확인]). 안드로이드 뒤로 키는 이번만 닫고, 확인 전이라 다음에 홈에 오면 또 떠요.
 * 여러 지점이 반려됐으면 하나씩 차례로 (확인하면 다음 것).
 * 데이터: 요약 GET /me/branch-summary 의 rejectedLinks — 확인 안 한 · 다시 요청 안 한 반려만 서버가 골라 줘요 (받기 전 · 실패면 안 떠요).
 */

/** 홈에 들어오고 이만큼 뒤에 떠요 (화면이 올라오는 움직임이 끝난 뒤) */
const OPEN_DELAY_MS = 500;

// 떠 있는 동안: 시작 팝업(launch-popup)이 그 위에 겹쳐 뜨지 않게 기다려요
const openStore = createStore(false);
export const useRejectionPopupOpen = openStore.useStore;

const selectRejected = (s: BranchSummary) => s.rejectedLinks;

export function LinkRejectedPopup() {
  const { data } = useQuery({ ...branchSummaryQuery(), select: selectRejected });
  const ack = useAcknowledgeLinkRequest();
  // 이번 홈 방문에서 뒤로 키로 닫았어요 (확인은 안 함)
  const [skipped, setSkipped] = useState(false);
  const [ready, setReady] = useState(false);

  const current = !skipped && data && data.length > 0 ? data[0] : null;

  useEffect(() => {
    if (!current || ready) return;
    const t = setTimeout(() => setReady(true), OPEN_DELAY_MS);
    return () => clearTimeout(t);
  }, [current, ready]);

  const open = ready && !!current;
  useEffect(() => {
    openStore.set(open);
    return () => openStore.set(false);
  }, [open]);

  if (!open || !current) return null;
  return (
    <LinkRejectedPopupView
      key={current.id}
      request={current}
      index={0}
      total={data?.length ?? 1}
      busy={ack.isPending}
      onConfirm={() => ack.mutate(current.id, { onError: (e) => showToast(apiErrorMessage(e)) })}
      onBack={() => setSkipped(true)}
    />
  );
}

/** 팝업 한 장 (데이터 없이 그리기만 — 스토리 · 테스트도 이걸 써요) */
export function LinkRejectedPopupView({
  request,
  index = 0,
  total = 1,
  busy = false,
  onConfirm,
  onBack,
}: {
  request: Pick<RejectedLink, 'branchName' | 'rejectionReason'>;
  index?: number;
  total?: number;
  busy?: boolean;
  onConfirm: () => void;
  /** 안드로이드 뒤로 키 (확인 없이 이번만 닫기) */
  onBack: () => void;
}) {
  const still = useReducedMotion();
  const fade = useSharedValue(still ? 1 : 0);

  useEffect(() => {
    haptic('warning');
    fade.set(withTiming(1, { duration: still ? 0 : 200 }));
  }, [fade, still]);

  const dim = useAnimatedStyle(() => ({ opacity: fade.get() }));
  const reason = request.rejectionReason?.trim();

  return (
    <LayerModal visible transparent animationType="none" onRequestClose={onBack} statusBarTranslucent>
      <Animated.View style={[styles.wrap, dim]} accessibilityViewIsModal accessibilityLabel={`${request.branchName}에서 회원 정보를 찾지 못했어요`}>
        <View style={styles.cardBox}>
          <View style={styles.cardShadow} />
          <View style={styles.card}>
            {total > 1 && (
              <View style={styles.count}>
                <PText style={styles.countText} color={Colors.inkSub}>
                  {index + 1} / {total}
                </PText>
              </View>
            )}
            <View style={styles.iconRow}>
              <Raised radius={20}>
                <View style={styles.icon}>
                  <PText style={styles.q}>?</PText>
                </View>
              </Raised>
            </View>
            <PText style={styles.title} accessibilityRole="header">
              {request.branchName}에서{'\n'}회원 정보를 찾지 못했어요
            </PText>
            {reason ? (
              <View style={styles.note}>
                <PText style={styles.noteLabel} color={Colors.inkSub}>
                  지점에서 남긴 말
                </PText>
                <PText style={styles.noteText}>{reason}</PText>
              </View>
            ) : (
              <PText style={styles.desc} color={Colors.inkSub}>
                자세한 내용은 지점에 물어봐 주세요
              </PText>
            )}
            <View style={styles.foot}>
              <Button label="확인" wide disabled={busy} onPress={onConfirm} />
            </View>
          </View>
        </View>
      </Animated.View>
    </LayerModal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(30,26,43,0.55)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  cardBox: { width: '100%', maxWidth: 330 },
  cardShadow: { position: 'absolute', left: 5, top: 5, right: -5, bottom: -5, borderRadius: 24, backgroundColor: Colors.ink },
  card: { paddingTop: 24, paddingHorizontal: 18, paddingBottom: 18, backgroundColor: Colors.cream, borderWidth: 2, borderColor: Colors.ink, borderRadius: 24 },
  count: { position: 'absolute', top: 12, right: 14 },
  countText: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 },
  iconRow: { alignItems: 'center' },
  icon: { width: 64, height: 64, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#FCE3EA', alignItems: 'center', justifyContent: 'center' },
  q: { fontFamily: Font.display, fontSize: 26, lineHeight: 32 },
  title: { marginTop: 16, textAlign: 'center', fontFamily: Font.body900, fontSize: 19, lineHeight: 26, letterSpacing: -0.5 },
  note: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  noteLabel: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 },
  noteText: { marginTop: 4, fontFamily: Font.body800, fontSize: 13.5, lineHeight: 20 },
  desc: { marginTop: 10, textAlign: 'center', fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20 },
  foot: { marginTop: 18 },
});
