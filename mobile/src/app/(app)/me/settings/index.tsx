import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type LayoutChangeEvent, type ScrollViewInstance } from 'react-native';

import { logout } from '@/api/auth';
import { apiErrorMessage } from '@/api/errors';
import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { AccountPage, Box, Toggle } from '@/components/account/parts';
import { setMarketing, updateSettings, useLogins, useSettings } from '@/components/account/store';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { setSfxOn, sfx, useSfxOn } from '@/lib/feedback';
import { updateMe, useMe } from '@/state/me';

/**
 * 설정 — 꼭 필요한 것만 (2026-11-25 줄임): 계정(닉네임 · 로그인) · 알림 4개 · 효과음 · 안전(퀘스트 공유 · 차단) · 도움(고객센터 · 약관) · 로그아웃 · 회원 탈퇴.
 * 뺀 것: 내 지점 · 학습 언어 · 레벨(전산 웹 · 프로가 정해요) · 세세한 알림 · 말하기 어려움 · 소리 끄기(레슨 안에 있어요) · 하루 목표 · 공개 범위 · 신고 내역 · 이용권 · 결제 내역 · 공지사항 · 앱 버전.
 * 뺀 설정 값은 기본값 그대로 서버에 남아요. 효과음은 @/lib/feedback 이 가져요.
 * 맞는 API: 30 `GET / PUT /me/settings`
 */
export default function SettingsScreen() {
  const me = useMe();
  const set = useSettings();
  const logins = useLogins();
  const sound = useSfxOn();
  // 알림함의 '알림 설정'처럼 ?section=noti 로 오면 그 칸까지 내려가요 · 마이 '한 줄 소개를 남겨 보세요'는 ?sheet=nick 으로 소개 창부터
  const { section, sheet: openSheet } = useLocalSearchParams<{ section?: string; sheet?: string }>();
  const [sheet, setSheet] = useState<null | 'nick' | 'block' | 'logout'>(openSheet === 'nick' ? 'nick' : null);
  const loginName = Object.keys(logins).find((k) => logins[k]);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const onNotiLayout = (e: LayoutChangeEvent) => {
    if (section === 'noti') scrollRef.current?.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - 12), animated: true });
  };

  return (
    <AccountPage title="설정" bodyStyle={styles.body} scrollRef={scrollRef}>
      <Sec title="계정">
        <GoRow title="닉네임 · 한 줄 소개" value={me.name} onPress={() => setSheet('nick')} />
        <GoRow title="로그인 계정" value={loginName ? `${loginName} 연결됨` : ''} onPress={() => go('/me/settings/login')} />
      </Sec>
      <Sec title="알림" onLayout={onNotiLayout}>
        <ToggleRow title="세션 알림" sub="세션 전날 저녁 · 예습이 남았으면 알려 줘요" value={set.nSession} onPress={() => updateSettings({ nSession: !set.nSession })} />
        <ToggleRow title="번개 · 이벤트 소식" sub="내 지점과 참여한 모임 위주로" value={set.nMeet} onPress={() => updateSettings({ nMeet: !set.nMeet })} />
        <ToggleRow title="팔로우 알림" sub="새 팔로워 · 내가 팔로우한 멤버의 새 글" value={set.nFriend} onPress={() => updateSettings({ nFriend: !set.nFriend })} />
        <ToggleRow
          title="이벤트 · 혜택 정보 (광고)"
          sub="켜면 수신 동의 날짜가 기록돼요"
          value={set.nMkt}
          onPress={() => {
            setMarketing(!set.nMkt);
            showToast(!set.nMkt ? '이벤트 · 혜택 정보 수신에 동의했어요' : '수신 동의를 철회했어요');
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
        <GoRow title="차단한 멤버" value="0명" onPress={() => setSheet('block')} />
      </Sec>
      <Sec title="도움">
        {/* 고객센터 한 곳: 자주 묻는 질문 + 1:1 문의 + 카카오톡 상담 + 내 지점 전화 */}
        <GoRow title="고객센터 · 자주 묻는 질문" onPress={() => go('/me/support')} />
        <GoRow title="이용약관 · 개인정보 처리방침" onPress={() => go('/me/settings/terms')} />
      </Sec>
      <View style={styles.out}>
        <Pressable onPress={() => setSheet('logout')} accessibilityRole="button" hitSlop={8}>
          <PText style={styles.outText}>로그아웃</PText>
        </Pressable>
        <Pressable onPress={() => go('/me/delete')} accessibilityRole="button" hitSlop={8}>
          <PText style={styles.outText}>회원 탈퇴</PText>
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
                logout().catch((e: unknown) => showToast(apiErrorMessage(e)));
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
      <View style={styles.rowTx}>
        <PText style={styles.rowB}>{title}</PText>
        {sub ? <PText style={styles.rowS}>{sub}</PText> : null}
      </View>
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
  rowTx: { flex: 1, minWidth: 0 },
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
