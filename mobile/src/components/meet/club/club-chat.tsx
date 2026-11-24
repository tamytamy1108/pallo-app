import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { keepAll } from '@/components/common/sheet-parts';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { NOTE, type Club } from '@/data/meet';

import { Icon } from '../icons';
import { CrownFace } from '../member-face';
import { setChat, useMeetStore, type ChatMsg } from '../meet-store';
import { clubContent } from '../model';
import { Peek } from './club-parts';

// 예시 메시지 시각 (프로토타입 lgChat)
const TM = ['오후 8:12', '오후 8:20', '오후 8:21', '오후 8:40', '오후 8:41', '오후 9:02', '오후 9:05', '오후 10:11', '오후 10:15', '오전 6:41', '오전 6:43', '오전 6:44', '오전 6:50', '오전 6:52', '오전 6:58', '오전 7:01', '오전 7:03', '오전 7:10'];

function seedChat(c: Club): ChatMsg[] {
  const { chat, name, fill } = clubContent(c);
  let i = 0;
  return chat.map((row): ChatMsg => {
    if (row.length === 1) return { day: row[0] };
    const [k, x] = row;
    if (k === 'sys') return { sys: x.replace(/^([A-D])님/, (_, w: string) => name(w) + '님') };
    return { n: name(k), host: k === 'H', x: fill(x), t: TM[i++ % TM.length] };
  });
}

/** 채팅 줄들 (가입 인사 · 입장 알림 포함) */
export function useClubChat(c: Club, joinedOnce: boolean, myName: string) {
  const saved = useMeetStore((s) => s.chat[c.id]);
  let L = saved ?? seedChat(c);
  // 가입하면 채팅 맨 아래 'Tammy님이 들어왔어요' (한 번만)
  if (joinedOnce && !L.some((m) => m.sys === `${myName}님이 들어왔어요`)) L = [...L, { sys: `${myName}님이 들어왔어요` }];
  return L;
}

/**
 * 채팅 탭 (위 호스트 안내 고정 · 날짜 구분 · 입장 알림 · 내 말 노랑 말풍선). 가입 전엔 최근 4줄 흐리게 + 잠금.
 * 실시간 연결은 백엔드와 정해요 (Q-T6) — 지금은 이 기기 안에서만 쌓여요.
 */
export function ClubChat({ c, inC, myName, staff }: { c: Club; inC: boolean; myName: string; staff: string[] }) {
  const M = useClubChat(c, inC, myName);
  const [v, setV] = useState('');
  const role = (n?: string, h?: boolean) => (h ? '호스트' : n && staff.includes(n) ? '서브 호스트' : '');
  const msg = (m: ChatMsg, i: number, peek = false) => {
    if (m.day) return <PText key={i} style={styles.day}>{m.day}</PText>;
    if (m.sys) return <PText key={i} style={styles.sys}>{m.sys}</PText>;
    if (m.me)
      return (
        <View key={i} style={[styles.msg, styles.me]}>
          <View style={[styles.bb, { justifyContent: 'flex-end' }]}>
            <PText style={styles.time}>{m.t}</PText>
            <PText style={[styles.p, styles.pMe, keepAll]}>{m.x}</PText>
          </View>
        </View>
      );
    const r = peek ? (m.host ? '호스트' : '') : role(m.n, m.host);
    return (
      <View key={i} style={styles.msg}>
        <CrownFace name={m.n ?? ''} size={32} role={peek ? '' : r} />
        <View style={{ flexShrink: 1 }}>
          <PText style={styles.b}>
            {m.n}
            {r ? ` · ${r}` : ''}
          </PText>
          <View style={styles.bb}>
            <PText style={[styles.p, keepAll]}>{m.x}</PText>
            <PText style={styles.time}>{m.t}</PText>
          </View>
        </View>
      </View>
    );
  };
  if (!inC)
    return (
      <Peek icon="cmt" title={`오늘도 대화 중이에요 · 메시지 ${M.filter((m) => !m.day).length}개`} desc="가입하면 정기 모임 공지 · 지각 연락 · 수다를 같이 나눠요.">
        <View style={[styles.chat, { paddingTop: 6 }]}>{M.filter((m) => !m.day && !m.sys && !m.me).slice(-4).map((m, i) => msg(m, i, true))}</View>
      </Peek>
    );
  const send = () => {
    const t = v.trim();
    if (!t) return;
    const d = new Date();
    setChat(c.id, [...M, { n: myName, me: true, x: t, t: `${d.getHours() < 12 ? '오전' : '오후'} ${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}` }]);
    setV('');
  };
  return (
    <View style={{ marginTop: 14 }}>
      <View style={styles.chat}>
        <View style={styles.pinned}>
          <View style={{ marginTop: 2 }}>
            <Icon name="tack" size={14} color={Colors.purple} strokeWidth={2.6} />
          </View>
          <PText style={styles.pinT}>
            <PText style={styles.pinB}>공지 </PText>
            {c.memo || NOTE[c.id] || '처음엔 듣기만 해도 괜찮아요. 모임 시간 10분 전에 와 주세요.'}
          </PText>
        </View>
        {M.map((m, i) => msg(m, i))}
      </View>
      <View style={styles.in}>
        <GrowInput value={v} onChangeText={setV} onSubmitEditing={send} submitBehavior="submit" maxLines={6} placeholder="멤버들에게 메시지 보내기" placeholderTextColor="#8C8597" style={styles.input} accessibilityLabel="채팅 메시지" returnKeyType="send" />
        <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="보내기" style={styles.send}>
          <Icon name="send" size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chat: { gap: 10 },
  pinned: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.lavender, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  pinT: { flex: 1, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18.75 },
  pinB: { fontFamily: Font.body900, fontSize: 12.5, color: Colors.purple },
  day: { alignSelf: 'center', fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub, backgroundColor: Colors.line, borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10, overflow: 'hidden' },
  sys: { alignSelf: 'center', fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  msg: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, maxWidth: '86%' },
  me: { alignSelf: 'flex-end' },
  b: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  bb: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 3 },
  p: { flexShrink: 1, fontFamily: Font.body600, fontSize: 14, lineHeight: 20.3, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.line, borderRadius: 16, borderTopLeftRadius: 4, backgroundColor: Colors.white, overflow: 'hidden' },
  pMe: { backgroundColor: Colors.yellow, borderColor: Colors.ink, borderTopLeftRadius: 16, borderTopRightRadius: 4 },
  time: { flexShrink: 0, fontFamily: Font.body700, fontSize: 10.5, lineHeight: 15, color: Colors.inkSub },
  // 길게 쓰면 칸이 위로 늘고 보내기는 아래 줄에 맞춰요 · 안드로이드 글자 잘림 없게 includeFontPadding 끔
  in: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 14 },
  input: { flex: 1, minWidth: 0, minHeight: 46, borderWidth: 1.5, borderColor: Colors.line, borderRadius: 23, paddingHorizontal: 16, paddingVertical: 11, includeFontPadding: false, fontFamily: Font.body700, fontSize: 14, lineHeight: 20, backgroundColor: Colors.white, color: Colors.ink },
  send: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
});
