import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance, type TextInputInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';
import { LgIcon } from '@/components/common/icons';
import { MemberFace } from '@/components/common/member-face';
import { keepAll, SheetButton, SheetDesc } from '@/components/common/sheet-parts';
import { guardMember } from '@/components/common/trial-guide';
import { TextField } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { useMe } from '@/state/me';

export type Comment = {
  id: string;
  author: string;
  text: string;
  /** '3시간' · '방금' 처럼 보이는 글 */
  time: string;
  mine?: boolean;
  /** 다른 사람이 누른 좋아요 수 (내 좋아요는 liked 로 더해요) */
  likes?: number;
  /** 내가 좋아요를 눌렀는지 */
  liked?: boolean;
  /** 답글 (한 단계만) */
  replies?: Comment[];
};

export type CommentsSheetProps = {
  open: boolean;
  onClose: () => void;
  comments: Comment[];
  /** 새 댓글을 보냈을 때 (답글 · 수정은 onChange 로 와요) */
  onSend?: (text: string) => void;
  /** 가운데 제목 (기본 '댓글') */
  title?: string;
  /** 글 쓴 사람 — 그 사람 댓글 시간 옆에 '· 작성자' */
  author?: string;
  /** 입력칸 안내 (기본 '대화에 참여하세요…') */
  placeholder?: string;
  /** 목록 맨 위에 붙는 것 (예: 표현 챌린지 머리) */
  head?: ReactNode;
  /**
   * 목록을 부모가 들고 있을 때: 보내기 · 답글 · 수정 · 삭제(되돌리기) · 좋아요가 끝난 전체 목록을 넘겨줘요.
   * 안 넘기면 시트가 열릴 때마다 comments 로 시작해서 시트 안에서만 바뀌어요.
   */
  onChange?: (next: Comment[]) => void;
  /**
   * 스토리 댓글: 공개 댓글이에요. 입력칸 안내가 '○○에게 댓글 달기' (내 스토리면 '내 스토리에 댓글 달기')로 바뀌어요.
   * 올린 사람에게만 보이는 '답장 보내기'는 StoryReplySheet 를 따로 써요.
   */
  story?: { who: string; mine?: boolean };
};

type Mode = { t: 'reply' | 'edit'; id: string } | null;

let seq = 0;
const newId = () => `c-new-${Date.now()}-${++seq}`;

/**
 * 댓글 창 — 라운지 글 · 스토리 · 동아리 게시판 · 챌린지 인증 모든 댓글을 이걸로 통일 (프로토타입 lgCS · lgCSRow · lgCSRender).
 * 화면 84% 큰 시트 · 가운데 '댓글' · 프로필 · 이름 · 시간 · 작성자 · [답글 달기] · '답글 N개 더 보기' · 오른쪽 하트 + 수 ·
 * 내 댓글 수정 · 삭제(되돌리기) · 아래 고정 입력칸. 비회원은 답글 · 보내기에서 체험 안내 시트가 떠요 (좋아요는 그대로).
 * 담당: 공통 부품. props 는 바꾸지 않아요(늘리기만).
 */
export function CommentsSheet({ open, onClose, comments, onSend, title = '댓글', author, placeholder, head, onChange, story }: CommentsSheetProps) {
  const insets = useSafeAreaInsets();
  const me = useMe();
  const [own, setOwn] = useState<Comment[]>(comments);
  const [wasOpen, setWasOpen] = useState(open);
  const [mode, setMode] = useState<Mode>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);
  const listRef = useRef<ScrollViewInstance>(null);
  const scrollEnd = useRef(false);

  // 시트가 새로 열릴 때마다 부모 목록으로 다시 시작 (부모가 들고 있지 않을 때)
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setOwn(comments);
      setMode(null);
      setText('');
    }
  }
  const list = onChange ? comments : own;
  const latest = useRef(list);
  useEffect(() => {
    latest.current = list;
  }, [list]);

  const commit = (next: Comment[]) => {
    latest.current = next;
    if (onChange) onChange(next);
    else setOwn(next);
  };

  const isMine = (c: Comment) => c.mine || c.author === me.name;
  const authorName = story ? (story.mine ? me.name : story.who) : author;
  const hint = placeholder ?? (story ? (story.mine ? '내 스토리에 댓글 달기' : `${story.who}에게 댓글 달기`) : '대화에 참여하세요…');

  const toggleLike = (id: string) => {
    sfx('toggle');
    commit(mapDeep(latest.current, id, (c) => ({ ...c, liked: !c.liked })));
  };

  const startReply = (c: Comment) =>
    guardMember(() => {
      setMode({ t: 'reply', id: c.id });
      inputRef.current?.focus();
    }, '댓글을 달려면');

  const startEdit = (c: Comment) => {
    setMode({ t: 'edit', id: c.id });
    setText(c.text);
    inputRef.current?.focus();
  };

  const remove = (c: Comment) => {
    const before = latest.current;
    const at = before.findIndex((x) => x.id === c.id);
    if (at < 0) return;
    setMode(null);
    commit(before.filter((x) => x.id !== c.id));
    showToast('댓글을 지웠어요', {
      label: '되돌리기',
      onPress: () => {
        const now = latest.current;
        commit([...now.slice(0, at), c, ...now.slice(at)]);
      },
    });
  };

  const submit = () =>
    guardMember(() => {
      const v = text.trim();
      if (!v) {
        inputRef.current?.focus();
        return;
      }
      const L = latest.current;
      sfx('send');
      if (mode?.t === 'edit') {
        commit(L.map((c) => (c.id === mode.id ? { ...c, text: v } : c)));
        showToast('댓글을 고쳤어요');
      } else if (mode?.t === 'reply') {
        const reply: Comment = { id: newId(), author: me.name, text: v, time: '방금', mine: true, likes: 0 };
        commit(L.map((c) => (c.id === mode.id ? { ...c, replies: [...(c.replies ?? []), reply] } : c)));
        setExpanded((e) => ({ ...e, [mode.id]: true }));
      } else {
        commit([...L, { id: newId(), author: me.name, text: v, time: '방금', mine: true, likes: 0 }]);
        onSend?.(v);
        scrollEnd.current = true;
      }
      setMode(null);
      setText('');
    }, '댓글을 달려면');

  const target = mode ? list.find((c) => c.id === mode.id) : undefined;

  return (
    <Sheet open={open} onClose={onClose} tall scroll={false} gap={0} label={story ? '스토리 댓글' : title} contentStyle={styles.body}>
      <View style={styles.cst}>
        <PText accessibilityRole="header" style={styles.cstTitle}>
          {title}
        </PText>
      </View>
      <ScrollView
        ref={listRef}
        style={styles.csl}
        contentContainerStyle={[styles.cslIn, !list.length && !head && styles.cslEmpty]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (!scrollEnd.current) return;
          scrollEnd.current = false;
          listRef.current?.scrollToEnd({ animated: true });
        }}>
        {head}
        {list.length ? (
          list.map((c) => (
            <CommentRow
              key={c.id}
              c={c}
              mine={isMine(c)}
              isAuthor={c.author === authorName}
              authorName={authorName}
              meName={me.name}
              open={!!expanded[c.id]}
              onExpand={() => setExpanded((e) => ({ ...e, [c.id]: true }))}
              onLike={toggleLike}
              onReply={() => startReply(c)}
              onEdit={() => startEdit(c)}
              onDelete={() => remove(c)}
            />
          ))
        ) : head ? null : (
          <View style={styles.cs0}>
            <PText style={styles.cs0b}>아직 댓글이 없어요</PText>
            <PText style={styles.cs0s}>첫 댓글을 남겨 보세요.</PText>
          </View>
        )}
      </ScrollView>
      {mode && target ? (
        <View style={styles.csm}>
          <PText color={Colors.purple} style={styles.csmText}>
            {mode.t === 'edit' ? '댓글 수정 중' : `${target.author}님에게 답글 남기는 중`}
          </PText>
          <Pressable
            onPress={() => {
              sfx('back');
              setMode(null);
              if (mode.t === 'edit') setText('');
            }}
            accessibilityRole="button"
            accessibilityLabel="취소"
            hitSlop={10}>
            <PText style={styles.csmBtn}>취소</PText>
          </Pressable>
        </View>
      ) : null}
      <View style={[styles.csf, { paddingBottom: 14 + insets.bottom }]}>
        <MemberFace name={me.name} me size={38} />
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={hint}
          placeholderTextColor="#8C8597"
          selectionColor={Colors.purple}
          cursorColor={Colors.purple}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="send"
          submitBehavior="submit"
          onSubmitEditing={submit}
          accessibilityLabel="댓글 쓰기"
          autoComplete="off"
          style={[styles.input, focused && styles.inputOn]}
        />
        <Pressable onPress={submit} accessibilityRole="button" accessibilityLabel="올리기" style={({ pressed }) => [styles.send, pressed && styles.pressed]}>
          <LgIcon name="send" size={18} />
        </Pressable>
      </View>
    </Sheet>
  );
}

type RowProps = {
  c: Comment;
  mine: boolean;
  isAuthor: boolean;
  authorName?: string;
  meName: string;
  open: boolean;
  onExpand: () => void;
  onLike: (id: string) => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/** 댓글 한 줄 (.cr) — 답글은 같은 모양을 작게 (.cr.rp) */
function CommentRow({ c, mine, isAuthor, authorName, meName, open, onExpand, onLike, onReply, onEdit, onDelete }: RowProps) {
  const reps = c.replies ?? [];
  return (
    <View style={styles.cr}>
      <MemberFace name={c.author} me={mine} size={38} />
      <View style={styles.cb}>
        <Head c={c} isAuthor={isAuthor} />
        <PText style={styles.ct}>{c.text}</PText>
        <View style={styles.ca}>
          <Action label="답글 달기" onPress={onReply} />
          {mine ? <Action label="수정" onPress={onEdit} /> : null}
          {mine ? <Action label="삭제" onPress={onDelete} /> : null}
        </View>
        {reps.length ? (
          open ? (
            reps.map((r) => <ReplyRow key={r.id} r={r} mine={r.mine || r.author === meName} isAuthor={r.author === authorName} onLike={onLike} />)
          ) : (
            <Pressable
              onPress={() => {
                sfx('soft');
                onExpand();
              }}
              accessibilityRole="button"
              hitSlop={8}
              style={styles.cmore}>
              <View style={styles.cmoreLine} />
              <PText style={styles.caText}>답글 {reps.length}개 더 보기</PText>
            </Pressable>
          )
        ) : null}
      </View>
      <Like c={c} onLike={onLike} />
    </View>
  );
}

function ReplyRow({ r, mine, isAuthor, onLike }: { r: Comment; mine: boolean; isAuthor: boolean; onLike: (id: string) => void }) {
  return (
    <View style={[styles.cr, styles.rp]}>
      <MemberFace name={r.author} me={mine} size={28} />
      <View style={styles.cb}>
        <Head c={r} isAuthor={isAuthor} />
        <PText style={styles.ct}>{r.text}</PText>
      </View>
      <Like c={r} onLike={onLike} />
    </View>
  );
}

function Head({ c, isAuthor }: { c: Comment; isAuthor: boolean }) {
  return (
    <View style={styles.ch}>
      <PText style={styles.chName}>{c.author}</PText>
      <PText style={styles.chTime}>
        {c.time}
        {isAuthor ? ' · 작성자' : ''}
      </PText>
    </View>
  );
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        sfx('soft');
        onPress();
      }}
      accessibilityRole="button"
      hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}>
      <PText style={styles.caText}>{label}</PText>
    </Pressable>
  );
}

/** 오른쪽 하트 + 수 (.cl) — 좋아요는 비회원도 바로 돼요 */
function Like({ c, onLike }: { c: Comment; onLike: (id: string) => void }) {
  const n = (c.likes ?? 0) + (c.liked ? 1 : 0);
  return (
    <Pressable
      onPress={() => onLike(c.id)}
      accessibilityRole="button"
      accessibilityLabel="좋아요"
      accessibilityState={{ selected: !!c.liked }}
      hitSlop={8}
      style={styles.cl}>
      <LgIcon name="heart" size={18} fill={c.liked ? Colors.rosePink : 'none'} />
      <PText style={styles.clN}>{n || ''}</PText>
    </Pressable>
  );
}

function mapDeep(L: Comment[], id: string, f: (c: Comment) => Comment): Comment[] {
  return L.map((c) => (c.id === id ? f(c) : c.replies?.length ? { ...c, replies: mapDeep(c.replies, id, f) } : c));
}

/**
 * 스토리 '답장 보내기' — 올린 사람에게만 보이는 비공개 답장 (프로토타입 lgStory [data-lgy=msg] 시트).
 * 여는 쪽에서 guardMember(() => setOpen(true), '답장을 보내려면') 로 감싸 주세요.
 */
export function StoryReplySheet({ open, onClose, who, onSend }: { open: boolean; onClose: () => void; who: string; onSend?: (text: string) => void }) {
  const [text, setText] = useState('');
  const send = () => {
    const v = text.trim();
    if (!v) return;
    sfx('send');
    onSend?.(v);
    setText('');
    onClose();
    showToast(`${who}에게 답장을 보냈어요`);
  };
  return (
    <Sheet open={open} onClose={onClose} title={`${who}에게 답장`} label="스토리 답장">
      <SheetDesc>답장은 {who}에게만 보여요.</SheetDesc>
      <TextField value={text} onChangeText={setText} placeholder="예) 저도 그 표현 써 봤어요!" accessibilityLabel="답장 입력" multiline />
      <SheetButton label="답장 보내기" size="inline" onPress={send} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 0 },
  // .cst { text-align: center; padding: 2px 0 10px; border-bottom: 1.5px solid line } h2 16px 900
  cst: { alignItems: 'center', paddingTop: 2, paddingBottom: 10, borderBottomWidth: 1.5, borderColor: Colors.line },
  cstTitle: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  csl: { flex: 1 },
  cslIn: { paddingTop: 8, paddingHorizontal: 18, paddingBottom: 12 },
  cslEmpty: { flexGrow: 1 },
  cs0: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 4 },
  cs0b: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  cs0s: { fontFamily: Font.body700, fontSize: 13, lineHeight: 18, color: Colors.inkSub },
  cr: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  rp: { paddingTop: 8, paddingBottom: 0 },
  cb: { flex: 1, minWidth: 0 },
  ch: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  chName: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  chTime: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  ct: { marginTop: 2, fontFamily: Font.body600, fontSize: 14.5, lineHeight: 14.5 * 1.5, ...keepAll },
  ca: { flexDirection: 'row', gap: 12, marginTop: 4 },
  caText: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  cmore: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, alignSelf: 'flex-start' },
  cmoreLine: { width: 24, height: 1.5, backgroundColor: Colors.line },
  cl: { width: 34, alignItems: 'center', gap: 2, paddingTop: 4 },
  clN: { minHeight: 14, fontFamily: Font.body800, fontSize: 11.5, lineHeight: 14, color: Colors.inkSub },
  // .csm — 답글 · 수정 중 띠
  csm: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 18, backgroundColor: Colors.lavender },
  csmText: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18 },
  csmBtn: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18 },
  // .csf — 아래 고정 입력칸
  csf: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, paddingHorizontal: 18, borderTopWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.cream },
  input: {
    flex: 1,
    minWidth: 0,
    height: 46,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: 23,
    backgroundColor: Colors.white,
    fontFamily: Font.body700,
    fontSize: 14,
    color: Colors.ink,
  },
  inputOn: { borderColor: Colors.ink },
  send: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.94 }] },
});
