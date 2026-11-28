/**
 * 라운지 커뮤니티 탭 훅 — 피드(쪽 넘김) · 하트 · 스크랩 · 댓글 목록 · 댓글 달기(답글) · 댓글 하트 (api/community).
 *
 * 하트 · 스크랩 · 댓글 하트는 누르자마자 캐시를 바꿔 보이고(서버를 기다리지 않게), 서버 응답 수로 맞춰요. 실패하면 다시 받아요.
 * 가짜 서버는 기기 안 라운지 예시 데이터(data/lounge-store)를 그대로 써요 — 서버가 없을 때도 지금과 같은 글 · 하트 · 댓글이 보여요.
 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import type { Comment } from '@/components/common/comments-sheet';
import { LG_C, nameHash, type ComSub, type Post, type PostCat } from '@/data/lounge';
import { addPostComment, findItem, getLounge, postComments, setPostComments, toggleLike, toggleSave, useLounge } from '@/data/lounge-store';
import { agoLabel, parseAgo, whenLabel } from '@/lib/when';

import {
  addCommunityComment,
  deleteCommunityComment,
  editCommunityComment,
  fetchCommunityComments,
  fetchCommunityPosts,
  setCommunityMock,
  toggleCommunityCommentLike,
  toggleCommunityLike,
  toggleCommunityScrap,
  type CommunityComment,
  type CommunityCommentList,
  type CommunityPost,
  type CommunityPostPage,
  type CommunityTopic,
} from './community';
import { apiConfig } from './config';
import { queryKeys } from './queries';
import { branchCodesOf, sameBranch, useLoungeBranches } from './use-lounge-branches';

/* ───────── 주제 칩 ↔ 서버 주제 ───────── */

const TOPIC_OF: Record<PostCat, CommunityTopic> = { daily: 'DAILY', study: 'STUDY', event: 'EVENT', travel: 'TRAVEL', club: 'CLUB', meet: 'MEETUP' };
const CAT_OF: Record<CommunityTopic, PostCat> = { DAILY: 'daily', STUDY: 'study', EVENT: 'event', TRAVEL: 'travel', CLUB: 'club', MEETUP: 'meet' };
/** 커뮤니티 서브 칩 → 서버 topic ('전체'면 null) */
export const topicOfSub = (sub: ComSub): CommunityTopic | null => (sub === 'all' ? null : TOPIC_OF[sub]);

/* ───────── 카드 · 댓글 모양으로 ───────── */

const AV = [LG_C.y, LG_C.sky, LG_C.pk, LG_C.lpu, LG_C.mint];

/**
 * 서버 글 → 카드(PostCard 모양). 가짜 서버일 때는 예시 글의 그림 · 스티커 · 역할을 그대로 더해요 (서버 글엔 없는 칸).
 */
export function toCardPost(d: CommunityPost): Post {
  const at = Date.parse(d.createdAt);
  const seed = apiConfig.useMock ? findItem(d.id) : undefined;
  const extra = seed && seed.k === 'post' ? { pic: seed.pic, lbl: seed.lbl, frames: seed.frames, av: seed.av, role: seed.role, club: seed.club, expr: seed.expr, time: seed.time, at: seed.at } : null;
  return {
    id: d.id,
    k: 'post',
    cat: CAT_OF[d.topic],
    who: d.author.nickname,
    av: AV[nameHash(d.author.code) % AV.length],
    br: d.author.branchName ?? '',
    role: '',
    time: agoLabel(at),
    at,
    imgs: d.images.length ? d.images : undefined,
    ratio: d.ratio ?? undefined,
    n: d.images.length,
    likes: d.likeCount,
    text: d.body,
    ...extra,
    // 가짜 예시 글은 사진 대신 그림이라 장 수는 예시 그대로
    ...(extra && !d.images.length && seed && seed.k === 'post' ? { n: seed.n } : null),
    // 서버가 장마다 맞춘 값을 주면 그걸로 (가짜 예시 값보다 먼저)
    ...(d.frames?.length ? { frames: d.frames } : null),
  };
}

/** 서버 댓글 → 댓글 창 모양. 창은 '다른 사람 하트 수 + 내 하트'로 세니까 내 하트를 빼서 넘겨요 */
function toSheetComment(c: CommunityComment, replies: CommunityComment[] = []): Comment {
  return {
    id: c.id,
    author: c.authorNickname,
    text: c.content,
    time: agoLabel(Date.parse(c.createdAt)),
    mine: c.isMine,
    likes: Math.max(0, c.likeCount - (c.viewerLiked ? 1 : 0)),
    liked: c.viewerLiked,
    replies: replies.length ? replies.map((r) => toSheetComment(r)) : undefined,
  };
}

/* ───────── 피드 ───────── */

type FeedCache = InfiniteData<CommunityPostPage, string | null>;

/**
 * 커뮤니티 탭 피드 — 서브 칩(주제) · 고른 지점(이름)으로 서버가 걸러요. 끝에 닿으면 loadMore.
 * 당겨서 새로고침은 화면의 usePullRefresh 가 켜진 쿼리를 모두 다시 받아요.
 */
export function useCommunityFeed(sub: ComSub, branchNames: string[]) {
  const branches = useLoungeBranches();
  const codes = useMemo(() => branchCodesOf(branches, branchNames), [branches, branchNames]);
  // 지점을 골랐는데 목록을 아직 못 받았으면 기다려요 (전체가 잠깐 보였다가 바뀌지 않게)
  const waiting = branchNames.length > 0 && branches.length === 0;
  const topic = topicOfSub(sub);
  const q = useInfiniteQuery({
    queryKey: queryKeys.communityPosts(topic, codes),
    queryFn: ({ pageParam, signal }) => fetchCommunityPosts({ topic, branchCodes: codes, cursor: pageParam }, { signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: !waiting,
  });
  const posts = useMemo(() => (q.data?.pages ?? []).flatMap((p) => p.items), [q.data]);
  // 가짜 서버: 기기에서 새 글을 올리면(예시 데이터에 더해져요) 다시 받아요. 실서버는 글쓰기 API 가 생길 때 그 훅이 맡아요
  const queryClient = useQueryClient();
  const mockCount = useLounge((s) => (apiConfig.useMock ? s.feed.length : 0));
  const firstCount = useRef(mockCount);
  useEffect(() => {
    if (mockCount === firstCount.current) return;
    firstCount.current = mockCount;
    void queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
  }, [mockCount, queryClient]);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = q;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  return { q, posts, loadMore };
}

/** 캐시에 있는 모든 피드에서 이 글을 바꿔요 */
function patchCachedPost(queryClient: QueryClient, id: string, fn: (p: CommunityPost) => CommunityPost) {
  queryClient.setQueriesData<FeedCache>({ queryKey: ['community', 'posts'] }, (data) =>
    data ? { ...data, pages: data.pages.map((pg) => ({ ...pg, items: pg.items.map((p) => (p.id === id ? fn(p) : p)) })) } : data,
  );
}

/** 하트 — 누르자마자 켜고 수를 맞춘 뒤, 서버가 준 수로 바꿔요 */
export function useToggleCommunityLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => toggleCommunityLike(postId),
    onMutate: (postId) => patchCachedPost(queryClient, postId, (p) => ({ ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) })),
    onSuccess: (r, postId) => patchCachedPost(queryClient, postId, (p) => ({ ...p, likedByMe: r.on, likeCount: r.count })),
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.communityAll }),
  });
}

/** 스크랩(라운지 저장함) — 돌려주는 값: 담았으면 true */
export function useToggleCommunityScrap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => toggleCommunityScrap(postId),
    onMutate: (postId) => patchCachedPost(queryClient, postId, (p) => ({ ...p, scrappedByMe: !p.scrappedByMe })),
    onSuccess: (r, postId) => patchCachedPost(queryClient, postId, (p) => ({ ...p, scrappedByMe: r.on })),
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.communityAll }),
  });
}

/* ───────── 댓글 ───────── */

/** 댓글 창 목록 — 창을 열었을 때만 받아요 */
export function useCommunityComments(postId: string, open: boolean) {
  const q = useQuery({
    queryKey: queryKeys.communityComments(postId),
    queryFn: ({ signal }) => fetchCommunityComments(postId, { signal }),
    enabled: open,
  });
  const comments = useMemo(() => (q.data?.rows ?? []).map((t) => toSheetComment(t.comment, t.replies)), [q.data]);
  return { q, comments };
}

/** 댓글 · 답글 달기 — 다 달면 목록과 글의 댓글 수를 다시 받아요 */
export function useAddCommunityComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string | null }) => addCommunityComment(postId, content, parentId ?? null),
    onSuccess: () => patchCachedPost(queryClient, postId, (p) => ({ ...p, commentCount: p.commentCount + 1 })),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.communityComments(postId) }),
  });
}

/** 내 댓글 고치기 */
export function useEditCommunityComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) => editCommunityComment(postId, commentId, content),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.communityComments(postId) }),
  });
}

/** 내 댓글 지우기 — 목록과 글의 댓글 수를 다시 받아요 */
export function useDeleteCommunityComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteCommunityComment(postId, commentId),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.communityComments(postId) }),
        queryClient.invalidateQueries({ queryKey: ['community', 'posts'] }),
      ]),
  });
}

/** 댓글 하트 — 창이 먼저 켜 보이고, 서버 수로 목록을 맞춰요 */
export function useToggleCommunityCommentLike(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => toggleCommunityCommentLike(postId, commentId),
    onSuccess: (c) =>
      queryClient.setQueryData<CommunityCommentList>(queryKeys.communityComments(postId), (data) =>
        data
          ? {
              ...data,
              rows: data.rows.map((t) => ({
                comment: t.comment.id === c.id ? { ...t.comment, likeCount: c.likeCount, viewerLiked: c.viewerLiked } : t.comment,
                replies: t.replies.map((r) => (r.id === c.id ? { ...r, likeCount: c.likeCount, viewerLiked: c.viewerLiked } : r)),
              })),
            }
          : data,
      ),
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.communityComments(postId) }),
  });
}

/* ───────── 가짜 서버 (기기 안 예시 데이터) ───────── */

const MOCK_PAGE = 10;
const MOCK_ME = 'ME';

/** 예시 댓글(창 모양) → 서버 모양 */
function mockCommentDto(c: Comment, parentId: string | null): CommunityComment {
  const ago = parseAgo(c.time) ?? 0;
  return {
    id: c.id,
    authorCode: c.mine ? MOCK_ME : c.author,
    authorNickname: c.author,
    authorAvatarPath: null,
    content: c.text,
    parentId,
    likeCount: (c.likes ?? 0) + (c.liked ? 1 : 0),
    viewerLiked: !!c.liked,
    isMine: !!c.mine,
    isDeleted: false,
    isDeletedByAdmin: false,
    isHidden: false,
    hiddenReason: null,
    isAuthor: false,
    createdAt: new Date(Date.now() - ago).toISOString(),
    editedAt: null,
  };
}

function mockPosts(): Post[] {
  const s = getLounge();
  return s.feed.flatMap((p) => (p.k === 'post' && !s.hidden[p.who] ? [p] : []));
}

function mockPostDto(p: Post): CommunityPost {
  const s = getLounge();
  const liked = !!s.liked[p.id];
  const ago = parseAgo(p.time);
  const at = p.at ?? (ago === null ? Date.now() : Date.now() - ago);
  const topic: CommunityTopic = p.club ? 'CLUB' : TOPIC_OF[p.cat ?? 'daily'];
  return {
    id: p.id,
    topic,
    body: p.text,
    images: p.imgs ?? [],
    ratio: p.imgs?.length ? (p.ratio ?? 1) : null,
    likeCount: p.likes + (liked ? 1 : 0),
    commentCount: postComments(s, p).reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0),
    likedByMe: liked,
    scrappedByMe: !!s.saved[p.id],
    author: { code: p.mine ? MOCK_ME : p.who, nickname: p.who, branchName: p.br || null },
    createdAt: new Date(at).toISOString(),
  };
}

const mockPost = (id: string) => {
  const p = findItem(id);
  if (!p || p.k !== 'post') throw new Error('글을 찾을 수 없어요');
  return p;
};

setCommunityMock({
  feed: ({ topic, branchCodes = [], cursor }) => {
    const all = mockPosts().filter((p) => {
      const t = p.club ? 'CLUB' : TOPIC_OF[p.cat ?? 'daily'];
      if (topic && !(t === topic || (topic === 'CLUB' && p.cat === 'club'))) return false;
      // 지점 없는 글 · '전 지점' 글은 늘 보여요. 두 지점('영등포 · 연신내')은 하나만 맞아도
      if (!branchCodes.length || !p.br || p.br.includes('전 지점')) return true;
      return p.br.split(' · ').some((b) => branchCodes.some((c) => sameBranch(c, b)));
    });
    const from = cursor ? Number(cursor) : 0;
    const items = all.slice(from, from + MOCK_PAGE).map(mockPostDto);
    return { items, nextCursor: from + MOCK_PAGE < all.length ? String(from + MOCK_PAGE) : null };
  },
  like: (id) => {
    const p = mockPost(id);
    toggleLike(id);
    const d = mockPostDto(p);
    return { on: d.likedByMe, count: d.likeCount };
  },
  scrap: (id) => {
    mockPost(id);
    const on = toggleSave(id);
    return { on, count: on ? 1 : 0 };
  },
  comments: (id) => {
    const list = postComments(getLounge(), mockPost(id));
    return {
      rows: list.map((c) => ({ comment: mockCommentDto(c, null), replies: (c.replies ?? []).map((r) => mockCommentDto(r, c.id)) })),
      totalCount: list.length,
      commentCount: list.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0),
    };
  },
  addComment: (id, content, parentId) => {
    const p = mockPost(id);
    const me = '나';
    if (!parentId) {
      addPostComment(p, me, content);
      const list = postComments(getLounge(), p);
      return mockCommentDto(list[list.length - 1], null);
    }
    const reply: Comment = { id: `${id}-r${Date.now()}`, author: me, text: content, time: '방금', mine: true, likes: 0 };
    setPostComments(id, postComments(getLounge(), p).map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c)));
    return mockCommentDto(reply, parentId);
  },
  likeComment: (id, commentId) => {
    const p = mockPost(id);
    let hit: { c: Comment; parent: string | null } | null = null;
    const flip = (c: Comment, parent: string | null): Comment => {
      if (c.id !== commentId) return c;
      const next = { ...c, liked: !c.liked };
      hit = { c: next, parent };
      return next;
    };
    setPostComments(id, postComments(getLounge(), p).map((c) => ({ ...flip(c, null), replies: c.replies?.map((r) => flip(r, c.id)) })));
    if (!hit) throw new Error('댓글을 찾을 수 없어요');
    const h = hit as { c: Comment; parent: string | null };
    return mockCommentDto(h.c, h.parent);
  },
  editComment: (id, commentId, content) => {
    const p = mockPost(id);
    const edit = (c: Comment) => (c.id === commentId ? { ...c, text: content } : c);
    const next = postComments(getLounge(), p).map((c) => ({ ...edit(c), replies: c.replies?.map(edit) }));
    setPostComments(id, next);
    const all = next.flatMap((c) => [{ c, parent: null as string | null }, ...(c.replies ?? []).map((r) => ({ c: r, parent: c.id }))]);
    const found = all.find((x) => x.c.id === commentId);
    if (!found) throw new Error('댓글을 찾을 수 없어요');
    return mockCommentDto(found.c, found.parent);
  },
  deleteComment: (id, commentId) => {
    const p = mockPost(id);
    setPostComments(id, postComments(getLounge(), p).flatMap((c) => (c.id === commentId ? [] : [{ ...c, replies: c.replies?.filter((r) => r.id !== commentId) }])));
  },
});

/** 화면 표시용: 가짜 예시 글의 '10분 전' 같은 글자를 지금 기준으로 */
export const cardWhen = (p: Post) => whenLabel(p.time, p.at);
