/**
 * 라운지 커뮤니티 탭 — `/community/posts` (docs/api/openapi.yaml · 백엔드 MobileCommunityPostController · ReactionController · CommentController).
 *
 * 활성 멤버십이 있는 회원은 지점 · 공개범위와 상관없이 모든 글을 봐요. 하트 · 스크랩 · 댓글 · 댓글 하트도 같은 기준이에요
 * (멤버십이 끝났거나 없으면 403). 지점 거르기를 주면 그 지점 글 + 지점 없는 글만 와요.
 */
import type { PhotoFraming } from '@/lib/photo-framing';

import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

/** 글 주제 (서버 PostTopic) */
export type CommunityTopic = 'DAILY' | 'STUDY' | 'EVENT' | 'TRAVEL' | 'CLUB' | 'MEETUP';

export type CommunityPost = {
  id: string;
  topic: CommunityTopic;
  body: string;
  /** 사진 주소(서버 FQDN 그대로) — 올린 순서. 없으면 [] */
  images: string[];
  /** 사진 비율 가로 / 세로 (사진 없으면 null) — 게시물 틀 비율 (3:4 ~ 1.91:1, 앱이 그릴 때 한 번 더 맞춰요) */
  ratio: number | null;
  /**
   * images 와 같은 순서로 장마다 맞춘 확대 · 위치 (lib/photo-framing PhotoFraming). 아직 서버에 없는 칸 — 앱 쪽 제안(옵션).
   * 없으면 장마다 틀 가운데로 꽉 채워(cover) 그려요.
   */
  frames?: PhotoFraming[] | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  scrappedByMe: boolean;
  author: { code: string; nickname: string; branchName: string | null };
  createdAt: string;
};

export type CommunityPostPage = { items: CommunityPost[]; nextCursor: string | null };

export type CommunityFeedParams = {
  topic?: CommunityTopic | null;
  /** 지점 코드 — 비었으면 전체 지점 */
  branchCodes?: string[];
  cursor?: string | null;
  size?: number;
};

/** 하트 · 스크랩 토글 결과: 누른 뒤 내 상태 · 글 전체 수 */
export type CommunityReaction = { on: boolean; count: number };

/** 공용 댓글 (서버 CommentResponse) */
export type CommunityComment = {
  id: string;
  authorCode: string;
  authorNickname: string;
  authorAvatarPath: string | null;
  content: string;
  parentId: string | null;
  likeCount: number;
  viewerLiked: boolean;
  isMine: boolean;
  isDeleted: boolean;
  isDeletedByAdmin: boolean;
  isHidden: boolean;
  hiddenReason: string | null;
  isAuthor: boolean;
  createdAt: string;
  editedAt: string | null;
};

export type CommunityCommentList = {
  rows: { comment: CommunityComment; replies: CommunityComment[] }[];
  /** 최상위 댓글 수 (더 보기 판정) */
  totalCount: number;
  /** 답글까지 모두 (화면의 '댓글 N') */
  commentCount: number;
};

/** 댓글 한 번에 받는 수 — 글 하나 댓글은 대개 이 안이에요 */
export const COMMUNITY_COMMENT_PAGE = 50;

/* ───────── 가짜 서버 ───────── */

/**
 * 가짜 서버 — 기기 안 라운지 예시 데이터(data/lounge-store)를 보는 쪽(api/use-community)이 넣어 줘요.
 * 여기서 화면 · 저장소를 불러오지 않게 (api 테스트가 화면 부품까지 끌어오지 않도록).
 */
export type CommunityMockServer = {
  feed: (p: CommunityFeedParams) => CommunityPostPage;
  like: (postId: string) => CommunityReaction;
  scrap: (postId: string) => CommunityReaction;
  comments: (postId: string) => CommunityCommentList;
  addComment: (postId: string, content: string, parentId: string | null) => CommunityComment;
  likeComment: (postId: string, commentId: string) => CommunityComment;
  editComment: (postId: string, commentId: string, content: string) => CommunityComment;
  deleteComment: (postId: string, commentId: string) => void;
};
const empty: CommunityMockServer = {
  feed: () => ({ items: [], nextCursor: null }),
  like: () => ({ on: false, count: 0 }),
  scrap: () => ({ on: false, count: 0 }),
  comments: () => ({ rows: [], totalCount: 0, commentCount: 0 }),
  addComment: () => {
    throw new Error('가짜 서버가 아직 없어요');
  },
  likeComment: () => {
    throw new Error('가짜 서버가 아직 없어요');
  },
  editComment: () => {
    throw new Error('가짜 서버가 아직 없어요');
  },
  deleteComment: () => undefined,
};
let mockServer: CommunityMockServer = empty;
export function setCommunityMock(server: CommunityMockServer) {
  mockServer = server;
}

/* ───────── API ───────── */

const postPath = (postId: string) => `/community/posts/${encodeURIComponent(postId)}`;

/** GET /community/posts?topic=&branch=&cursor=&size= — 최신순 한 쪽 */
export function fetchCommunityPosts(p: CommunityFeedParams, { signal }: Opts = {}): Promise<CommunityPostPage> {
  if (apiConfig.useMock) return mock('communityPosts', () => mockServer.feed(p));
  return http.get('/community/posts', {
    signal,
    query: {
      topic: p.topic ?? undefined,
      branch: p.branchCodes?.length ? p.branchCodes.join(',') : undefined,
      cursor: p.cursor ?? undefined,
      size: p.size,
    },
  });
}

/** POST /community/posts/{id}/like — 누를 때마다 켜고 꺼요 */
export function toggleCommunityLike(postId: string): Promise<CommunityReaction> {
  if (apiConfig.useMock) return mock('communityLike', () => mockServer.like(postId));
  return http.post(`${postPath(postId)}/like`);
}

/** POST /community/posts/{id}/scrap — 라운지 저장함에 담기 · 빼기 */
export function toggleCommunityScrap(postId: string): Promise<CommunityReaction> {
  if (apiConfig.useMock) return mock('communityScrap', () => mockServer.scrap(postId));
  return http.post(`${postPath(postId)}/scrap`);
}

/** GET /community/posts/{id}/comments — 최상위 최신순 + 답글 */
export function fetchCommunityComments(postId: string, { signal }: Opts = {}): Promise<CommunityCommentList> {
  if (apiConfig.useMock) return mock('communityComments', () => mockServer.comments(postId));
  return http.get(`${postPath(postId)}/comments`, { signal, query: { page: 1, size: COMMUNITY_COMMENT_PAGE } });
}

/** POST /community/posts/{id}/comments — parentId 를 주면 그 댓글의 답글 */
export function addCommunityComment(postId: string, content: string, parentId: string | null = null): Promise<CommunityComment> {
  if (apiConfig.useMock) return mock('communityAddComment', () => mockServer.addComment(postId, content, parentId));
  return http.post(`${postPath(postId)}/comments`, { content, parentId: parentId == null ? null : Number(parentId) });
}

/** PUT /community/posts/{id}/comments/{commentId} — 내 댓글 고치기 */
export function editCommunityComment(postId: string, commentId: string, content: string): Promise<CommunityComment> {
  if (apiConfig.useMock) return mock('communityEditComment', () => mockServer.editComment(postId, commentId, content));
  return http.put(`${postPath(postId)}/comments/${encodeURIComponent(commentId)}`, { content });
}

/** DELETE /community/posts/{id}/comments/{commentId} — 내 댓글 지우기 (답글이 있으면 '삭제된 댓글'로 남아요) */
export function deleteCommunityComment(postId: string, commentId: string): Promise<void> {
  if (apiConfig.useMock) return mock('communityDeleteComment', () => mockServer.deleteComment(postId, commentId));
  return http.delete(`${postPath(postId)}/comments/${encodeURIComponent(commentId)}`);
}

/** POST /community/posts/{id}/comments/{commentId}/like — 댓글 하트 켜고 끄기 */
export function toggleCommunityCommentLike(postId: string, commentId: string): Promise<CommunityComment> {
  if (apiConfig.useMock) return mock('communityCommentLike', () => mockServer.likeComment(postId, commentId));
  return http.post(`${postPath(postId)}/comments/${encodeURIComponent(commentId)}/like`);
}
