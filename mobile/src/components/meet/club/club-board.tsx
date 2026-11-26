import { useState } from 'react';
import { meetRoleKind, RoleTag } from '@/components/common/role-tag';
import { StyleSheet, View } from 'react-native';

import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { ProfileTap } from '@/components/common/profile-tap';
import { CommentsSheet, type Comment } from '@/components/common/comments-sheet';
import { FieldLabel, keepAll, SheetButton, SheetDesc, SheetPills } from '@/components/common/sheet-parts';
import { Checkbox, TextField } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { C, hashId, type Club } from '@/data/meet';
import { sfx } from '@/lib/feedback';
import { HeartPop } from '@/components/ui/heart-pop';

import { Icon } from '../icons';
import { CrownFace } from '../member-face';
import { getMeetStore, setBoard, toggleIn, useMeetStore, type BoardPost } from '../meet-store';
import { clubContent, clubHost } from '../model';
import { chipStyles, Peek } from './club-parts';

const KIND = { note: '공지', rev: '모임 후기', hi: '가입 인사' } as const;
type Filter = 'all' | BoardPost['k'];
const FILTERS: [Filter, string][] = [
  ['all', '전체'],
  ['note', '공지'],
  ['rev', '모임 후기'],
  ['hi', '가입 인사'],
];

/** 동아리 게시판 처음 글 (필독 공지 2개 + 예시 글, 프로토타입 lgClubBoard) */
function seedBoard(c: Club): BoardPost[] {
  // 내가 만든 동아리는 빈 게시판에서 시작해요 (필독 · 공지는 호스트가 써요)
  if (c.mine) return [];
  const { posts, name } = clubContent(c);
  const h = hashId(c.id);
  return [
    { id: c.id + 'n1', k: 'note', w: name('H'), pin: true, ti: `${c.name} 처음 오셨나요? 모임 안내`, bd: `${c.when}에 모여요. 첫날은 자기소개만 해도 충분해요.`, t: '고정', lk: 0, cm: [] },
    { id: c.id + 'n2', k: 'note', w: name('H'), pin: true, ti: '가입 인사 양식', bd: '이름(닉네임) · 공부하는 언어 · 요즘 말해 보고 싶은 주제 한 가지', t: '고정', lk: 0, cm: [] },
    ...posts.map(([k, w, ti, bd, t, lk, cm], i): BoardPost => ({ id: c.id + 'b' + i, k, w: name(w), ti, bd, t, lk: lk + (h % 4), cm: cm.map(([cw, ct]): [string, string] => [name(cw), ct]) })),
  ];
}

/**
 * 게시판에 글 올리기 (관리 › 공지 쓰기도 써요). pin 이면 '필독'으로 맨 위에 고정, 아니면 필독 아래 맨 앞.
 */
export function postToBoard(c: Club, q: BoardPost) {
  const all = getMeetStore().board[c.id] ?? seedBoard(c);
  const pins = all.filter((x) => x.pin).length;
  setBoard(c.id, q.pin ? [q, ...all] : [...all.slice(0, pins), q, ...all.slice(pins)]);
}

export function useBoard(c: Club, inC: boolean, myName: string) {
  const saved = useMeetStore((s) => s.board[c.id]);
  const greet = useMeetStore((s) => s.greet[c.id]);
  let L = saved ?? seedBoard(c);
  // 가입 인사를 남기면 게시판 '가입 인사'에도 올라가요
  if (inC && greet && !L.some((x) => x.id === c.id + 'hi')) L = [...L.slice(0, 2), { id: c.id + 'hi', k: 'hi', w: myName, mine: true, ti: '안녕하세요!', bd: greet, t: '방금', lk: 0, cm: [] }, ...L.slice(2)];
  return L;
}

/** 게시판 탭 (전체 · 공지 · 모임 후기 · 가입 인사). inC = 잠금 없이 보기(멤버 · 호스트 · 코호스트 · 스텝, model clubOpen). 가입 안 한 사람만 글 2개 흐리게 + '글 n개 더' */
export function ClubBoard({ c, inC, myName, staff }: { c: Club; inC: boolean; myName: string; staff: string[] }) {
  const [f, setF] = useState<Filter>('all');
  const [write, setWrite] = useState(false);
  const [cm, setCm] = useState<string | null>(null);
  const liked = useMeetStore((s) => s.bliked);
  const all = useBoard(c, inC, myName);
  const L = all.filter((q) => f === 'all' || q.k === f);
  const host = clubHost(c);
  const roleOf = (w: string) => (w === host ? '호스트' : staff.includes(w) ? '코호스트' : '');
  // 호스트 · 코호스트: 필독 고정 · 풀기
  const canPin = host === myName || staff.includes(myName) || !!c.mine;
  const [openPin, setOpenPin] = useState<string | null>(null);
  const setPin = (q: BoardPost, pin: boolean) => {
    const rest = all.filter((x) => x.id !== q.id);
    const pins = rest.filter((x) => x.pin).length;
    const next = { ...q, pin, t: pin ? '고정' : q.t === '고정' ? '방금' : q.t };
    setBoard(c.id, pin ? [next, ...rest] : [...rest.slice(0, pins), next, ...rest.slice(pins)]);
    showToast(pin ? '필독으로 맨 위에 고정했어요' : '필독 고정을 풀었어요');
  };

  const post = (q: BoardPost, i: number) => {
    if (q.pin)
      return (
        <View key={q.id} style={[styles.bp, styles.pin, i > 0 && styles.line]}>
          {/* 필독: 누르면 내용이 펼쳐져요 */}
          <Pressable onPress={() => setOpenPin(openPin === q.id ? null : q.id)} accessibilityRole="button" accessibilityState={{ expanded: openPin === q.id }}>
            <PText style={styles.pinT}>
              <PText style={styles.pk}>필독 </PText>
              {q.ti}
            </PText>
          </Pressable>
          {openPin === q.id ? (
            <>
              <PText style={[styles.bd, keepAll]}>{q.bd}</PText>
              {inC && canPin ? (
                <Pressable onPress={() => setPin(q, false)} accessibilityRole="button" hitSlop={6} style={{ alignSelf: 'flex-start', marginTop: 6 }}>
                  <PText style={styles.ftT}>필독 고정 풀기</PText>
                </Pressable>
              ) : null}
            </>
          ) : null}
        </View>
      );
    const on = !!liked[q.id];
    const role = roleOf(q.w);
    const kind = meetRoleKind(role);
    return (
      <View key={q.id} style={[styles.bp, i > 0 && styles.line]}>
        <View style={styles.hd}>
          <ProfileTap name={q.w}>
            <CrownFace name={q.w} size={26} me={q.w === myName} role={role} />
          </ProfileTap>
          <PText style={styles.hdB}>{q.w}</PText>
          {kind ? <RoleTag kind={kind} /> : null}
          <View style={{ flex: 1 }} />
          <PText style={styles.hdS}>
            {q.t} · {KIND[q.k]}
          </PText>
        </View>
        <PText style={styles.ti}>{q.ti}</PText>
        <PText style={[styles.bd, keepAll]}>{q.bd}</PText>
        <View style={styles.ft}>
          <Pressable
            disabled={!inC}
            onPress={() => {
              sfx('tap');
              toggleIn('bliked', q.id);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={styles.ftB}
            hitSlop={6}>
            <HeartPop on={on}><Icon name="heart" size={17} color={Colors.inkSub} fill={on ? C.pk : 'none'} /></HeartPop>
            <PText style={styles.ftT}>{q.lk + (on ? 1 : 0) || '좋아요'}</PText>
          </Pressable>
          <Pressable disabled={!inC} onPress={() => setCm(q.id)} accessibilityRole="button" style={styles.ftB} hitSlop={6}>
            <Icon name="cmt" size={17} color={Colors.inkSub} />
            <PText style={styles.ftT}>{q.cm.length || '댓글'}</PText>
          </Pressable>
          {inC && canPin && q.k === 'note' ? (
            <Pressable onPress={() => setPin(q, true)} accessibilityRole="button" style={styles.ftB} hitSlop={6}>
              <Icon name="tack" size={15} color={Colors.inkSub} strokeWidth={2.4} />
              <PText style={styles.ftT}>필독으로 고정</PText>
            </Pressable>
          ) : null}
          {q.mine ? (
            <>
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={() => {
                  const i0 = all.findIndex((x) => x.id === q.id);
                  setBoard(c.id, all.filter((x) => x.id !== q.id));
                  showToast('글을 지웠어요', { label: '되돌리기', onPress: () => setBoard(c.id, [...all.slice(0, i0), q, ...all.slice(i0)]) });
                }}
                accessibilityRole="button"
                hitSlop={6}>
                <PText style={styles.ftT}>삭제</PText>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    );
  };

  const cq = all.find((q) => q.id === cm);
  const comments: Comment[] = cq ? cq.cm.map(([w, t], i) => ({ id: cq.id + i, author: w, text: t, time: cq.t, mine: w === myName })) : [];

  return (
    <View>
      <View style={chipStyles.row}>
        {FILTERS.map(([k, l]) => (
          <Pressable key={k} onPress={() => setF(k)} accessibilityRole="button" accessibilityState={{ selected: f === k }} style={[chipStyles.b, f === k && chipStyles.on]}>
            <PText style={[chipStyles.t, f === k && chipStyles.tOn]}>{l}</PText>
          </Pressable>
        ))}
      </View>
      {inC ? (
        <>
          <Pressable onPress={() => setWrite(true)} accessibilityRole="button" style={styles.write}>
            <Icon name="plus" size={16} strokeWidth={2.8} />
            <PText style={styles.writeT}>글쓰기</PText>
          </Pressable>
          <View style={{ marginTop: 14 }}>{L.length ? L.map(post) : <PText style={styles.empty}>{canPin ? '아직 글이 없어요. 글쓰기 › 공지로 첫 필독(모임 안내 · 가입 인사 양식)을 올려 보세요.' : '아직 글이 없어요.'}</PText>}</View>
        </>
      ) : (
        <Peek icon="shield" title={`글 ${Math.max(0, L.length - 2)}개 더 있어요`} desc="가입하면 공지 · 모임 후기 · 가입 인사를 모두 보고, 좋아요 · 댓글도 남길 수 있어요.">
          <View>{L.filter((q) => !q.pin).slice(0, 2).map(post)}</View>
        </Peek>
      )}
      <BoardWrite
        open={write}
        onClose={() => setWrite(false)}
        c={c}
        host={host === myName || staff.includes(myName)}
        onPost={(k, ti, bd, pin) => {
          const pins = all.filter((x) => x.pin).length;
          const q: BoardPost = { id: c.id + 'u' + Date.now(), k, w: myName, mine: true, pin: pin || undefined, ti, bd, t: pin ? '고정' : '방금', lk: 0, cm: [] };
          setBoard(c.id, pin ? [q, ...all] : [...all.slice(0, pins), q, ...all.slice(pins)]);
          setWrite(false);
          setF('all');
          showToast(pin ? '필독으로 올렸어요 · 게시판 맨 위에 고정돼요' : '게시판에 올렸어요');
        }}
      />
      <CommentsSheet
        open={!!cq}
        onClose={() => setCm(null)}
        title="게시판 댓글"
        comments={comments}
        onSend={(t) => {
          if (!cq) return;
          setBoard(
            c.id,
            all.map((x) => (x.id === cq.id ? { ...x, cm: [...x.cm, [myName, t]] } : x)),
          );
        }}
      />
    </View>
  );
}

/** 게시판 글쓰기 (호스트 · 코호스트는 공지도) */
function BoardWrite({ open, onClose, c, host, onPost }: { open: boolean; onClose: () => void; c: Club; host: boolean; onPost: (k: BoardPost['k'], ti: string, bd: string, pin: boolean) => void }) {
  const kinds: string[] = [...(host ? ['공지'] : []), '모임 후기', '가입 인사'];
  const [k, setK] = useState<string>(host ? '공지' : '모임 후기');
  // 공지는 '필독'으로 맨 위에 고정할 수 있어요 (호스트 · 코호스트)
  const [pin, setPin] = useState(true);
  const [ti, setTi] = useState('');
  const [bd, setBd] = useState('');
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="게시판 글쓰기"
      onClosed={() => {
        setTi('');
        setBd('');
      }}
      footer={
        <SheetButton
          label="올리기"
          size="foot"
          onPress={() => {
            if (!ti.trim()) return showToast('제목을 적어 주세요');
            if (!bd.trim()) return showToast('내용을 적어 주세요');
            onPost(k === '공지' ? 'note' : k === '가입 인사' ? 'hi' : 'rev', ti.trim(), bd.trim(), k === '공지' && pin);
          }}
        />
      }>
      <SheetDesc>{c.name} 멤버에게만 보여요.</SheetDesc>
      <View style={{ gap: 6 }}>
        <FieldLabel>어떤 글인가요?</FieldLabel>
        <SheetPills options={kinds} value={k} onChange={setK} />
      </View>
      {k === '공지' ? <Checkbox checked={pin} onChange={setPin} label="필독으로 맨 위에 고정" sub="처음 온 멤버가 먼저 읽어야 할 글 (모임 안내 · 가입 인사 양식 등)" size={20} /> : null}
      <TextField label="제목" value={ti} onChangeText={setTi} placeholder={k === '공지' ? '예) 처음 오셨나요? 모임 안내' : '예) 토요일 러닝 후기'} />
      <GrowInput value={bd} onChangeText={setBd} multiline placeholder="예) 오늘은 5km를 뛰고 카페에서 영어로 20분 이야기했어요!" placeholderTextColor="#8C8597" style={styles.ta} accessibilityLabel="글 내용" />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  bp: { paddingVertical: 12 },
  line: { borderTopWidth: 1, borderColor: Colors.line },
  pin: { paddingVertical: 10 },
  pinT: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  pk: { fontFamily: Font.body900, fontSize: 14, color: Colors.purple },
  hd: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 26 },
  hdB: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19 },
  hdS: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  ti: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21, marginTop: 8 },
  bd: { fontFamily: Font.body600, fontSize: 13.5, lineHeight: 20.9, marginTop: 3 },
  ft: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 },
  ftB: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 2 },
  ftT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
  write: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow },
  writeT: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  empty: { textAlign: 'center', paddingVertical: 30, fontFamily: Font.body700, fontSize: 14, color: Colors.inkSub },
  ta: { minHeight: 110, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontFamily: Font.body600, fontSize: 14, lineHeight: 22.4, color: Colors.ink, textAlignVertical: 'top' },
});
