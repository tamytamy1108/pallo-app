import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type LayoutChangeEvent, type ScrollViewInstance } from 'react-native';

import { logout } from '@/api/auth';
import { useMyLinkRequests } from '@/api/use-link-requests';
import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { AccountPage, Box, Toggle } from '@/components/account/parts';
import { setMarketing, updateSettings, useLogins, useSettings } from '@/components/account/store';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { LAUNCH } from '@/constants/launch';
import { Colors } from '@/constants/theme';
import { setSfxOn, sfx, useSfxOn } from '@/lib/feedback';
import { isMember } from '@/state/access';
import { updateMe, useMe } from '@/state/me';

/**
 * 설정 — 꼭 필요한 것만 (2026-11-25 줄임): 계정(닉네임 · 내 지점 · 로그인) · 알림 7개 · 효과음 · 안전(퀘스트 공유 · 차단) · 도움(자주 묻는 질문) · 로그아웃.
 * 자주 묻는 질문은 마이 아래 메뉴에서 빠져서(2026-11-26) 여기서 들어가요.
 * 누구나 열어요 (비회원도 로그아웃 · 알림 · 차단). 회원 전용 줄은 비회원에게 안 보여요: 스터디 세션 알림.
 * 내 지점(지점 연동 요청 내역 · 상태)은 2026-11-27 다시 넣었어요 — 누구나, 확인 중인 요청이 있으면 '확인 중 N'.
 * 뺀 것: 학습 언어 · 레벨(전산 웹 · 프로가 정해요) · 약관 · 회원 탈퇴 · 말하기 어려움 · 소리 끄기(레슨 안에 있어요) · 하루 목표 · 공개 범위 · 신고 내역 · 이용권 · 결제 내역 · 공지사항 · 앱 버전.
 * 뺀 설정 값은 기본값 그대로 서버에 남아요. 효과음은 @/lib/feedback 이 가져요.
 * 맞는 API: 30 `GET / PUT /me/settings`
 */
export default function SettingsScreen() {
  const me = useMe();
  const member = isMember(me);
  const set = useSettings();
  const logins = useLogins();
  const sound = useSfxOn();
  // 알림함의 '알림 설정'처럼 ?section=noti 로 오면 그 칸까지 내려가요 · 마이 '한 줄 소개를 남겨 보세요'는 ?sheet=nick 으로 소개 창부터
  const { section, sheet: openSheet } = useLocalSearchParams<{ section?: string; sheet?: string }>();
  const [sheet, setSheet] = useState<null | 'nick' | 'block' | 'logout'>(openSheet === 'nick' ? 'nick' : null);
  const loginName = Object.keys(logins).find((k) => logins[k]);
  const links = useMyLinkRequests();
  const pendingLinks = links.data?.pendingCount ?? 0;
  const scrollRef = useRef<ScrollViewInstance>(null);
  const onNotiLayout = (e: LayoutChangeEvent) => {
    if (section === 'noti') scrollRef.current?.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - 12), animated: true });
  };

  return (
    <AccountPage title="설정" bodyStyle={styles.body} scrollRef={scrollRef}>
      <Sec title="계정">
        <GoRow title="닉네임 · 한 줄 소개" value={me.name} onPress={() => setSheet('nick')} />
        <GoRow title="내 지점" value={pendingLinks ? `확인 중 ${pendingLinks}` : ''} onPress={() => go('/me/settings/branch')} />
        <GoRow title="로그인 계정" value={loginName ? `${loginName} 연결됨` : ''} onPress={() => go('/me/settings/login')} />
      </Sec>
      <Sec title="알림" onLayout={onNotiLayout}>
        {/* 알림은 이름만 (설명 없이 · 2026-11-25) */}
        {/* 스터디 세션(출석)은 회원만 — 비회원에게는 줄을 안 보여요 */}
        {member && <ToggleRow title="스터디 세션 알림" value={set.nSession} onPress={() => updateSettings({ nSession: !set.nSession })} />}
        <ToggleRow title="번개 · 이벤트 소식" value={set.nMeet} onPress={() => updateSettings({ nMeet: !set.nMeet })} />
        {/* 라운지 알림: 예전 '동아리 채팅' 값(nClubChat)을 그대로 써요 — 동아리 채팅 · 라운지 새 소식 */}
        <ToggleRow title="라운지 알림" value={set.nClubChat} onPress={() => updateSettings({ nClubChat: !set.nClubChat })} />
        <ToggleRow title="팔로우 알림" value={set.nFriend} onPress={() => updateSettings({ nFriend: !set.nFriend })} />
        <ToggleRow title="댓글 · 좋아요 · 인사" value={set.nCmt} onPress={() => updateSettings({ nCmt: !set.nCmt })} />
        <ToggleRow title="랭킹 변동" value={set.nRank} onPress={() => updateSettings({ nRank: !set.nRank })} />
        <ToggleRow
          title="마케팅 정보 수신"
          value={set.nMkt}
          onPress={() => {
            setMarketing(!set.nMkt);
            showToast(!set.nMkt ? '마케팅 정보 수신에 동의했어요' : '마케팅 정보 수신 동의를 철회했어요');
          }}
        />
      </Sec>
      <Sec title="소리">
        <ToggleRow title="효과음" sub="정답 · 오답 소리" value={sound} onPress={() => setSfxOn(!sound)} />
      </Sec>
      <Sec title="안전">
        {/* 예전 저장에는 이 값이 없어요 → 없으면 켜진 걸로 (state/quest-share) */}
        <ToggleRow
          title="내 퀘스트 성공을 팔로워에게 알리기"
          sub="레슨 단계 · 상황 장면을 끝내면 팔로워 알림함에 떠요"
          value={set.shareProgress !== false}
          onPress={() => updateSettings({ shareProgress: set.shareProgress === false })}
        />
        {LAUNCH.block ? <GoRow title="차단한 멤버" value="0명" onPress={() => setSheet('block')} /> : null}
      </Sec>
      <Sec title="도움">
        <GoRow title="자주 묻는 질문" onPress={() => go('/me/support')} />
      </Sec>
      <View style={styles.out}>
        <Pressable onPress={() => setSheet('logout')} accessibilityRole="button" hitSlop={8}>
          <PText style={styles.outText}>로그아웃</PText>
        </Pressable>
      </View>

      <NickSheet open={sheet === 'nick'} onClose={() => setSheet(null)} name={me.name} bio={me.bio || set.bio} />
      <Sheet open={sheet === 'block'} onClose={() => setSheet(null)} title="차단한 멤버 0명">
        <PText style={styles.empty}>차단한 멤버가 없어요.</PText>
      </Sheet>
      <Sheet
        open={sheet === 'logout'}
        onClose={() => setSheet(null)}
        title="로그아웃할까요?"
        footer={
          <View>
            <Button
              label="로그아웃"
              wide
              onPress={() => {
                setSheet(null);
                // 토큰을 지우면 로그인 상태(api/session.tsx)가 캐시를 비우고 app/_layout.tsx 가 첫 화면으로 보내요
                void logout();
              }}
            />
          </View>
        }>
        <PText style={styles.ds}>다시 로그인하면 기록은 그대로 있어요.</PText>
      </Sheet>
    </AccountPage>
  );
}

function go(href: Href) {
  sfx('tap');
  router.push(href);
}

function Sec({ title, children, onLayout }: { title: string; children: ReactNode; onLayout?: (e: LayoutChangeEvent) => void }) {
  const rows = Array.isArray(children) ? children.flat().filter(Boolean) : [children];
  return (
    <>
      <PText style={styles.h} accessibilityRole="header" onLayout={onLayout}>
        {title}
      </PText>
      <Box style={styles.card}>
        {rows.map((r, i) => (
          <View key={i} style={i ? styles.line : undefined}>
            {r}
          </View>
        ))}
      </Box>
    </>
  );
}

function GoRow({ title, value, onPress }: { title: string; value?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={value ? `${title}, ${value}` : title} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <PText style={styles.rowB}>{title}</PText>
      {value ? (
        <PText style={styles.rowV} numberOfLines={1}>
          {value}
        </PText>
      ) : null}
      <PText style={styles.chev}>›</PText>
    </Pressable>
  );
}

function ToggleRow({ title, sub, value, onPress }: { title: string; sub?: string; value: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        sfx('toggle');
        onPress();
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={title}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {/* 설명이 없는 줄(알림)은 이동 줄(GoRow)과 같은 모양 — 글자를 감싸지 않아야 토글과 같은 높이 가운데에 와요 (2026-11-26) */}
      {sub ? (
        <View style={styles.rowTx}>
          <PText style={styles.rowT}>{title}</PText>
          <PText style={styles.rowS}>{sub}</PText>
        </View>
      ) : (
        <PText style={styles.rowB}>{title}</PText>
      )}
      <Toggle value={value} />
    </Pressable>
  );
}

/** 닉네임 · 한 줄 소개 (프로토타입 set-nick: 2~10자) */
function NickSheet({ open, onClose, name, bio }: { open: boolean; onClose: () => void; name: string; bio: string }) {
  const [nick, setNick] = useState(name);
  const [line, setLine] = useState(bio);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="닉네임 · 한 줄 소개"
      footer={
        <View>
          <Button
            label="저장하기"
            wide
            onPress={() => {
              const v = nick.trim();
              if (v.length < 2) {
                showToast('닉네임은 2자 이상이에요');
                return;
              }
              // 소개는 마이 카드 · 프로필이 읽는 내 정보(me.bio)에 남겨요
              updateMe({ name: v.slice(0, 10), bio: line.replace(/\s+/g, ' ').trim() });
              onClose();
              showToast('저장했어요');
            }}
          />
        </View>
      }>
      <View style={styles.fields}>
        <Field label="닉네임" value={nick} onChange={setNick} placeholder="2~10자" max={10} />
        <Field label="한 줄 소개 (프로필에 보여요)" value={line} onChange={setLine} placeholder="예) 주말마다 번개 나가요!" max={40} grow />
      </View>
    </Sheet>
  );
}

/** grow: 길게 쓰면 줄이 바뀌고 칸이 늘어나요 (소개). 닉네임은 한 줄 */
function Field({ label, value, onChange, placeholder, max, grow }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; max: number; grow?: boolean }) {
  const Input = grow ? GrowInput : TextInput;
  return (
    <View style={styles.field}>
      <PText style={styles.fieldLabel}>{label}</PText>
      <Input value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#9B94A6" maxLength={max} accessibilityLabel={label} style={[styles.input, grow && styles.inputGrow]} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingTop: 8, paddingBottom: 40, gap: 6 },
  h: { marginTop: 14, marginBottom: 2, marginHorizontal: 4, fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  card: { paddingVertical: 2, paddingHorizontal: 14 },
  line: { borderTopWidth: 1.5, borderColor: Colors.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingVertical: 8 },
  pressed: { opacity: 0.7 },
  // 설명이 있는 줄: 제목 · 설명 묶음을 줄 가운데에 (제목에 flex 를 주면 세로 칸 안에서 위로 치우쳐요)
  rowTx: { flex: 1, minWidth: 0, justifyContent: 'center' },
  rowT: { fontFamily: Font.body800, fontSize: 14.5, lineHeight: 21 },
  rowB: { flex: 1, fontFamily: Font.body800, fontSize: 14.5, lineHeight: 21 },
  rowS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  rowV: { maxWidth: '50%', fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  chev: { fontFamily: Font.body900, fontSize: 15, color: Colors.inkSub },
  out: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 18 },
  outText: { paddingVertical: 6, paddingHorizontal: 2, fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  ds: { marginBottom: 4, fontFamily: Font.body700, fontSize: 15, lineHeight: 23, color: Colors.inkSub },
  empty: { paddingVertical: 30, textAlign: 'center', fontFamily: Font.body700, fontSize: 14, lineHeight: 21, color: Colors.inkSub },
  fields: { gap: 14 },
  field: { gap: 6 },
  fieldLabel: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19 },
  inputGrow: { paddingVertical: 13, lineHeight: 22 },
  input: { minHeight: 52, paddingHorizontal: 16, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, fontFamily: Font.body600, fontSize: 15, color: Colors.ink },
});
