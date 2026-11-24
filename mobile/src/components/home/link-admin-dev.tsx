import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors, TabBarSpace } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { REJECT_NOTE_MOCK, simulateBranchResult, useLinkEvents, type LinkResult } from '@/state/link-events';
import { useMe } from '@/state/me';

import { LineIcon } from './icons';

const WRENCH = 'M14.7 6.3a4 4 0 0 0-5.4 5.2L3.5 17.3a1.8 1.8 0 0 0 2.5 2.5l5.8-5.8a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.3-.5-.5-2.3z';

/**
 * 개발용 (웹 미리보기에서만): 관리자 웹이 앱에 없어서, 지점 매니저가 연동 요청을 처리한 것처럼 흉내 내요.
 * 연동 확인 중(link=pending)일 때 홈 왼쪽 아래 떠 있는 알약 → 시트에서 [연동해 주기] · [못 찾음으로 처리].
 * 2.5초 뒤 서버에서 온 것처럼 결과가 도착해요 (state/link-events). 주소 /?admin=link · /?admin=reject 로 바로 불러도 돼요.
 */
export function LinkAdminDev() {
  const link = useMe((m) => m.link);
  const processing = useLinkEvents((s) => s.processing);
  if (!__DEV__ || Platform.OS !== 'web') return null;
  if (link !== 'pending' && !processing) return null;
  return <DevPill processing={processing} />;
}

function DevPill({ processing }: { processing: boolean }) {
  const branch = useMe((m) => m.branch);
  const [open, setOpen] = useState(false);
  const run = (r: LinkResult) => {
    setOpen(false);
    sfx('send');
    simulateBranchResult(r);
  };
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={processing}
        accessibilityRole="button"
        accessibilityLabel="개발용 지점 처리 흉내"
        accessibilityState={{ disabled: processing }}
        style={styles.pillWrap}>
        {({ pressed }) => (
          <View style={[styles.pill, pressed && styles.pillPressed]}>
            <LineIcon d={WRENCH} size={15} width={2} color={Colors.yellow} />
            <PText style={styles.pillText} color={Colors.white}>
              {processing ? '지점에서 처리 중…' : '지점 처리 흉내'}
            </PText>
            <PText style={styles.devTag} color={Colors.ink}>
              DEV
            </PText>
          </View>
        )}
      </Pressable>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="지점 처리 흉내"
        footer={
          <>
            <Button label="못 찾음 처리" variant="secondary" wide onPress={() => run('rejected')} />
            <Button label="연동해 주기" wide onPress={() => run('linked')} />
          </>
        }>
        <PText style={styles.desc} color={Colors.inkSub}>
          관리자 웹에서 {branch} 매니저가 이 연동 요청을 처리했다고 쳐요. 2.5초 뒤 서버에서 온 것처럼 푸시 · 알림이 도착해요 (기다리는 동안 알약에 ‘지점에서 처리 중…’).
        </PText>
        <View style={styles.note}>
          <PText style={styles.noteLabel} color={Colors.inkSub}>
            못 찾음일 때 지점이 남기는 말
          </PText>
          <PText style={styles.noteText}>{REJECT_NOTE_MOCK}</PText>
        </View>
        <PText style={styles.desc} color={Colors.inkSub}>
          주소로 바로: /?admin=link · /?admin=reject
        </PText>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  pillWrap: { position: 'absolute', left: 16, bottom: TabBarSpace + 14, zIndex: 50 },
  // 개발용이라 앱 버튼과 다르게: 잉크 바탕 · 노란 점선
  pill: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 40, paddingLeft: 12, paddingRight: 6, borderRadius: 20, backgroundColor: Colors.ink, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.yellow },
  pillPressed: { transform: [{ scale: 0.96 }] },
  pillText: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  devTag: { overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, backgroundColor: Colors.yellow, fontFamily: Font.display, fontSize: 9, lineHeight: 14, letterSpacing: 0.6 },
  desc: { fontFamily: Font.body600, fontSize: 13.5, lineHeight: 21 },
  note: { padding: 12, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  noteLabel: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 },
  noteText: { marginTop: 4, fontFamily: Font.body800, fontSize: 13.5, lineHeight: 20 },
});
