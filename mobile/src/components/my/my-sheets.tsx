import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { MemberFace } from '@/components/character/avatar';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { followLists, MY_BADGES, SPARK_EARN, type Member } from '@/data/my';
import { sfx } from '@/lib/feedback';
import { toggleFollow, useMe } from '@/state/me';

import { BadgeGrid } from './my-blocks';
import { Lift } from './lift';

/** 시트 안 한 줄 설명 (프로토타입 #lgSheet .ds) */
function Ds({ children }: { children: string }) {
  return <PText style={styles.ds}>{children}</PText>;
}

/** 배지 모두 보기 (프로토타입 badge 시트) */
export function BadgeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const got = MY_BADGES.filter((b) => b.on).length;
  return (
    <Sheet open={open} onClose={onClose} title={`배지 ${got} / ${MY_BADGES.length}`} label="배지">
      <Ds>활동하면 배지와 스파크를 받아요.</Ds>
      <BadgeGrid list={MY_BADGES} desc />
    </Sheet>
  );
}

/** 스파크 모으는 법 (프로토타입 earn 시트) */
export function SparkSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="스파크 모으는 법" label="스파크">
      <Ds>스파크로 캐릭터 · 배경 아이템을 살 수 있어요.</Ds>
      <View style={styles.stCard}>
        {SPARK_EARN.map(([l, v], i) => (
          <View key={l} style={[styles.stRow, i > 0 && styles.line]}>
            <PText style={styles.stB}>{l}</PText>
            <PText style={styles.stV}>{v}</PText>
          </View>
        ))}
      </View>
      <Ds>시즌 아이템(산타 모자 · 눈 오는 밤 등)은 기간 보상으로만 받아요.</Ds>
    </Sheet>
  );
}

/** 내 모임 · 찜한 모임 (모임 목록은 라운지에서 — 지금은 빈 상태 문구) */
export function MeetsSheet({ kind, onClose }: { kind: 'joined' | 'saved' | null; onClose: () => void }) {
  const me = useMe();
  const n = kind === 'saved' ? me.savedMeets : me.joinedMeets;
  return (
    <Sheet open={!!kind} onClose={onClose} title={kind === 'saved' ? `찜한 모임 ${n}개` : `내 모임 ${n}개`} label={kind === 'saved' ? '찜한 모임' : '내 모임'}>
      {kind === 'joined' && <Ds>참여한 번개 · 가입한 동아리</Ds>}
      <PText style={styles.empty}>{kind === 'saved' ? '상세 화면의 하트를 누르면 여기 모여요.' : '아직 참여한 모임이 없어요.\n라운지에서 번개나 동아리를 찾아보세요!'}</PText>
    </Sheet>
  );
}

/** 멤버 한 줄: 얼굴 · 이름 · 지점 · [팔로우] (프로토타입 .lg-mrow) */
export function MemberRow({ m, onOpen }: { m: Member; onOpen: (name: string) => void }) {
  const me = useMe();
  const mine = m.name === me.name;
  const on = !!me.following[m.name];
  return (
    <View style={styles.mrow}>
      <Pressable onPress={() => onOpen(m.name)} accessibilityRole="button" accessibilityLabel={`${m.name} 프로필`} style={styles.mrowL}>
        <MemberFace name={m.name} size={36} bg={m.color} />
        <View style={styles.mi}>
          <View style={styles.mh}>
            <PText style={styles.mn}>{m.name}</PText>
            {mine && <PText style={styles.meTag}>나</PText>}
          </View>
          <PText style={styles.mb}>{m.branch}</PText>
        </View>
      </Pressable>
      {!mine && (
        <Pressable
          onPress={() => {
            sfx(toggleFollow(m.name) ? 'pick' : 'tap');
          }}
          accessibilityRole="button"
          accessibilityLabel={on ? `${m.name} 팔로잉 취소` : `${m.name} 팔로우`}>
          {({ pressed }) => (
            <Lift radius={18} x={3} y={3} pressed={pressed}>
              <View style={[styles.fbtn, on && styles.fbtnOn]}>
                <PText style={styles.fbtnT}>{on ? '팔로잉' : '팔로우'}</PText>
              </View>
            </Lift>
          )}
        </Pressable>
      )}
    </View>
  );
}

/** 팔로워 · 팔로잉 목록 (프로토타입 pfList: 위 탭 두 개 · 멤버 줄) */
export function FollowSheet({ name, tab, onTab, onClose, onOpen }: { name: string | null; tab: 'fing' | 'fer'; onTab: (t: 'fing' | 'fer') => void; onClose: () => void; onOpen?: (name: string) => void }) {
  const me = useMe();
  const who = name ?? me.name;
  const L = followLists(who, me, me.following);
  const cur = tab === 'fing' ? L.fing : L.fer;
  const open = (n: string) => {
    onClose();
    if (n === me.name) return;
    if (onOpen) onOpen(n);
    else router.push(`/me/profile/${encodeURIComponent(n)}` as Href);
  };
  return (
    <Sheet open={!!name} onClose={onClose} title={who} tall label={`${who} ${tab === 'fing' ? '팔로잉' : '팔로워'}`}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {(
          [
            ['fer', '팔로워', L.fer.length],
            ['fing', '팔로잉', L.fing.length],
          ] as const
        ).map(([k, l, n]) => {
          const on = tab === k;
          return (
            <Pressable key={k} onPress={() => onTab(k)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[styles.tab, on && styles.tabOn]}>
              <PText style={[styles.tabT, on && styles.tabTOn]}>
                {l} <PText style={styles.tabN}>{n}</PText>
              </PText>
            </Pressable>
          );
        })}
      </View>
      {cur.length ? (
        <View>
          {cur.map((m, i) => (
            <View key={m.name} style={i > 0 && styles.line}>
              <MemberRow m={m} onOpen={open} />
            </View>
          ))}
        </View>
      ) : (
        <PText style={styles.empty}>{tab === 'fing' ? '아직 팔로우한 멤버가 없어요.' : '아직 팔로워가 없어요.'}</PText>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  ds: { fontFamily: Font.body700, fontSize: 14, lineHeight: 21, color: Colors.inkSub },
  empty: { textAlign: 'center', paddingVertical: 30, paddingHorizontal: 10, fontFamily: Font.body700, fontSize: 14, lineHeight: 22, color: Colors.inkSub },
  stCard: { paddingHorizontal: 14, paddingVertical: 2, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white },
  stRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingVertical: 8, gap: 10 },
  stB: { flex: 1, fontFamily: Font.body800, fontSize: 14.5, lineHeight: 21 },
  stV: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.purple },
  line: { borderTopWidth: 1.5, borderColor: Colors.line },
  mrow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  mrowL: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  mi: { flex: 1, minWidth: 0 },
  mh: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mn: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  meTag: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15, color: Colors.purple },
  mb: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  fbtn: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  fbtnOn: { backgroundColor: Colors.white },
  fbtnT: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  tabs: { flexDirection: 'row', gap: 18, borderBottomWidth: 1.5, borderColor: Colors.line },
  tab: { paddingTop: 6, paddingBottom: 10, marginBottom: -1.5, borderBottomWidth: 3, borderColor: 'transparent' },
  tabOn: { borderColor: Colors.ink },
  tabT: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20, color: Colors.inkSub },
  tabTOn: { color: Colors.ink },
  tabN: { fontFamily: Font.body800, fontSize: 12, color: Colors.inkSub },
});
