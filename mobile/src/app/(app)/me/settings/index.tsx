import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type LayoutChangeEvent, type ScrollViewInstance } from 'react-native';

import { logout } from '@/api/auth';
import { apiErrorMessage } from '@/api/errors';
import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { AccountPage, Box, Toggle } from '@/components/account/parts';
import { setMarketing, updateSettings, useLogins, useSettings } from '@/components/account/store';
import { BranchMultiPicker, withJeom } from '@/components/onboarding/branch-sheet';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { APP_VERSION, getMembership, PROFILE_SCOPES, type Settings } from '@/data/account';
import { setSfxOn, sfx, useSfxOn } from '@/lib/feedback';
import { setNoListen, setNoSpeak, useLearnPrefs } from '@/state/learn-prefs';
import { updateMe, useMe } from '@/state/me';

type BoolKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

/**
 * 설정 (프로토타입 mySettingsHTML · SET0): 계정 · 알림 · 학습 · 공개 범위 · 안전 · 이용권 · 도움 · 로그아웃 · 회원 탈퇴.
 * 학습의 말하기가 어려워요 · 소리 끄기는 15분짜리 (@/state/learn-prefs), 효과음은 @/lib/feedback 이 가져요.
 * 맞는 API: 30 `GET / PUT /me/settings`
 */
export default function SettingsScreen() {
  const me = useMe();
  const set = useSettings();
  const logins = useLogins();
  const { noSpeak, noListen } = useLearnPrefs();
  const sound = useSfxOn();
  const ms = getMembership();
  // 알림함의 '알림 설정'처럼 ?section=noti 로 오면 그 칸까지 내려가요 · 마이 '한 줄 소개를 남겨 보세요'는 ?sheet=nick 으로 소개 창부터
  const { section, sheet: openSheet } = useLocalSearchParams<{ section?: string; sheet?: string }>();
  const [sheet, setSheet] = useState<null | 'nick' | 'branch' | 'block' | 'logout'>(openSheet === 'nick' ? 'nick' : null);
  const loginName = Object.keys(logins).find((k) => logins[k]);
  const latest = APP_VERSION.now === APP_VERSION.latest;
  const scrollRef = useRef<ScrollViewInstance>(null);
  const onNotiLayout = (e: LayoutChangeEvent) => {
    if (section === 'noti') scrollRef.current?.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - 12), animated: true });
  };

  const flip = (k: BoolKey, label: string) => <ToggleRow key={k} title={label} value={set[k]} onPress={() => updateSettings({ [k]: !set[k] })} />;

  return (
    <AccountPage title="설정" bodyStyle={styles.body} scrollRef={scrollRef}>
      <Sec title="계정">
        <GoRow title="닉네임 · 한 줄 소개" value={me.name} onPress={() => setSheet('nick')} />
        <GoRow title="내 지점" value={set.branches.length ? set.branches.map(withJeom).join(' · ') : me.branch} onPress={() => setSheet('branch')} />
        <GoRow title="학습 언어 · 레벨" value={`${set.lang} ${me.level}`} onPress={() => go('/me/settings/langlv')} />
        <GoRow title="로그인 계정" value={loginName ? `${loginName} 연결됨` : ''} onPress={() => go('/me/settings/login')} />
      </Sec>
      <Sec title="알림" onLayout={onNotiLayout}>
        <ToggleRow title="세션 알림" sub="세션 전날 저녁 · 예습이 남았으면 알려 줘요" value={set.nSession} onPress={() => updateSettings({ nSession: !set.nSession })} />
        {flip('nSession1h', '세션 1시간 전')}
        <ToggleRow title="번개 · 이벤트 소식" sub="내 지점과 참여한 모임 위주로" value={set.nMeet} onPress={() => updateSettings({ nMeet: !set.nMeet })} />
        {flip('nClubChat', '동아리 채팅')}
        <ToggleRow title="팔로우 알림" sub="새 팔로워 · 내가 팔로우한 멤버의 새 글" value={set.nFriend} onPress={() => updateSettings({ nFriend: !set.nFriend })} />
        {flip('nCmt', '댓글 · 좋아요 · 인사')}
        <ToggleRow title="랭킹 변동" sub="순위가 바뀌면 하루 한 번" value={set.nRank} onPress={() => updateSettings({ nRank: !set.nRank })} />
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
      <Sec title="학습">
        <ToggleRow title="말하기가 어려워요" sub="15분 동안 말하기 문제를 카드 · 고르기로 바꿔요" value={noSpeak} onPress={() => setNoSpeak(!noSpeak)} />
        <ToggleRow title="소리 끄기" sub="15분 동안 소리 없이 풀 수 있게 바꿔요" value={noListen} onPress={() => setNoListen(!noListen)} />
        <ToggleRow title="효과음" sub="정답 · 오답 소리" value={sound} onPress={() => setSfxOn(!sound)} />
        <GoRow
          title="하루 목표"
          value={`퀘스트 ${set.goal}개`}
          onPress={() => {
            const goal = (set.goal % 3) + 1;
            updateSettings({ goal });
            showToast(`하루 목표: 퀘스트 ${goal}개`);
          }}
        />
      </Sec>
      <Sec title="공개 범위 · 안전">
        <GoRow title="프로필 공개" value={set.profile} onPress={() => updateSettings({ profile: PROFILE_SCOPES[(PROFILE_SCOPES.indexOf(set.profile) + 1) % PROFILE_SCOPES.length] })} />
        <ToggleRow title="랭킹에 내 이름 보이기" sub="끄면 랭킹에 ‘익명 회원’으로 보여요" value={set.rankName} onPress={() => updateSettings({ rankName: !set.rankName })} />
        {flip('showBr', '내 지점 보이기')}
        {/* 예전 저장에는 이 값이 없어요 → 없으면 켜진 걸로 (state/quest-share) */}
        <ToggleRow
          title="내 퀘스트 성공을 팔로워에게 알리기"
          sub="레슨 단계 · 상황 장면을 끝내면 팔로워 알림함에 떠요"
          value={set.shareProgress !== false}
          onPress={() => updateSettings({ shareProgress: set.shareProgress === false })}
        />
        <GoRow title="차단한 멤버" value="0명" onPress={() => setSheet('block')} />
        <GoRow title="신고 내역" onPress={() => go('/me/settings/reports')} />
      </Sec>
      <Sec title="이용권">
        <GoRow title="이용권 · 남은 세션" value={`${ms.left}회 남음`} onPress={() => go('/me/pass')} />
        <GoRow title="결제 내역" onPress={() => go('/me/payments')} />
      </Sec>
      <Sec title="도움">
        <GoRow title="공지사항" onPress={() => go('/me/settings/notices')} />
        <GoRow title="자주 묻는 질문" onPress={() => go({ pathname: '/me/support', params: { view: 'faq' } })} />
        <GoRow title="1:1 문의" onPress={() => go({ pathname: '/me/support', params: { view: 'ask' } })} />
        <GoRow title="이용약관 · 개인정보 처리방침" onPress={() => go('/me/settings/terms')} />
        <GoRow title="앱 버전" value={`${APP_VERSION.now}${latest ? ' 최신' : ''}`} onPress={() => go('/me/settings/version')} />
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
      <BranchSheet open={sheet === 'branch'} onClose={() => setSheet(null)} current={set.branches.length ? set.branches : me.branch.split(' · ')} />
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

/** 내 지점 (프로토타입 set-br: 두 지점을 다니면 둘 다 · 매니저가 확인하면 바뀌어요) */
function BranchSheet({ open, onClose, current }: { open: boolean; onClose: () => void; current: string[] }) {
  const [pick, setPick] = useState<string[]>(current);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="내 지점"
      tall
      footer={
        <View>
          <Button
            label="저장하기"
            wide
            onPress={() => {
              if (!pick.length) {
                showToast('지점을 하나 이상 골라 주세요');
                return;
              }
              updateSettings({ branches: pick });
              onClose();
              showToast(`내 지점: ${pick.map(withJeom).join(' · ')} · 매니저가 확인하면 바뀌어요`);
            }}
          />
        </View>
      }>
      <PText style={styles.ds}>두 지점을 다니면 둘 다 골라요. 지점 변경은 다니는 지점 매니저가 확인해요.</PText>
      <BranchMultiPicker selected={pick} onChange={setPick} max={2} mine={current} />
    </Sheet>
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
