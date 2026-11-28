# API 추가 목록 (프론트 → 백엔드)

`docs/appendix/api-inventory.md`(1 ~ 96)에 **빠져 있던 것**을 모았어요. 번호는 `A1`부터 이어서 붙였어요.
앱 코드에는 이미 화면이나 규칙이 있는데 API 목록에 없던 것들이에요 (2026-11-23 점검 보고서 1장 기준).
경로 · 이름은 제안이에요. 백엔드에서 바꿔도 되고, 바뀌면 OpenAPI 문서에 먼저 적어 주세요.

공통 약속 (backend-kickoff B2 · B5 · B6 · B7 제안 그대로)

- REST + JSON, OpenAPI 문서 같이
- 오류는 모두 `{ "code": "ALREADY_CHECKED_IN", "message": "이미 출석했어요" }` — `message` 는 화면에 그대로 띄울 한국어
- 목록은 `?cursor=&limit=` → `{ "items": [...], "nextCursor": "…" | null }`
- 시각은 UTC (ISO 8601), 화면 표시는 앱이 기기 시간대로 바꿔요
- 로그인 토큰은 `Authorization: Bearer <accessToken>`

## 1. 회원 앱에 더 필요한 API (21가지 + 인증 2개)

| # | 방법 | 경로 | 하는 일 | 앱 코드 |
|---|---|---|---|---|
| A1 | GET · POST | `/popups` · `/popups/:id/dismiss` | 앱 시작 팝업 (기간 · 순서 · 그림 · 이동할 곳) · ‘오늘은 그만 보기’ | `components/home/launch-popup.tsx` · `data/home.ts` `LAUNCH_POPUPS` |
| A2 | GET | `/app/theme?date=` | 시즌 테마 (예: 크리스마스 11/22 ~ 12/31 · 색 · 장식) | `constants/season.ts` |
| A3 | GET | `/me/sparks` · `/me/sparks/ledger?cursor=` | 스파크 잔액 · 내역 (원장 방식: 늘 내역으로 쌓고 잔액은 합계) | `state/avatar.ts` |
| A4 | POST · GET | `/me/progress/:lesson/chest` · `/me/rewards` | 과 보상 상자 열기 · 시즌 보상 받은 것 | `components/home/study-map.tsx` |
| A5 | GET | `/me/progress/skip-test?stage=` | 건너뛰기 테스트 문제 받기 (제출은 기존 22) | `components/home/skip-sheet.tsx` |
| A6 | POST · DELETE · GET | `/members/:id/follow` · `/me/following` · `/me/followers` | 팔로우 · 취소 · 목록 | `state/me.ts` `toggleFollow` |
| A7 | GET · PUT | `/pro-notes/:id/diary` | 프로 노트에 쓰는 내 일기 | `app/me/notes` |
| A8 | GET | `/branches/:id/board` | 지점 안내 보드 (주소 · 시간 · 공지) | `components/my/branch-board.tsx` |
| A9 | GET | `/me/level-test` | 레벨 테스트 결과 · 다른 언어 레벨 | `app/me/settings/langlv.tsx` |
| A10 | GET | `/me/reports` · `/me/warnings` | 내가 한 신고 · 받은 경고 | `app/me/settings/reports.tsx` |
| A11 | GET | `/blocks` | 차단 목록 보기 (만들기 · 풀기는 기존 77) | `app/me/settings/index.tsx` |
| A12 | POST · DELETE | `/events/:id/waitlist` | 이벤트 빈자리 알림 | `app/events/[id].tsx` |
| A13 | (기존 80에 추가) | `POST /challenges` 본문 `expressionIds[]` | 저장 표현을 골라 챌린지 열기 | `components/my/expr-rows.tsx` |
| A14 | (기존 19에 추가) | `GET /me/progress` 응답 `last` | 홈 맵이 마지막에 보던 과 · 단계 | `state/progress.ts` |
| A15 | POST | `/auth/logout` | 로그아웃 (이 기기 토큰 무효) | `src/api/auth.ts` |
| A16 | POST | `/auth/refresh` | 토큰 갱신 (`refreshToken` → 새 토큰) | `src/api/auth.ts` |
| A17 | 결정 필요 | — | 말하기 어려움 · 소리 끄기(15분 유지): 기기에만 둘지, 서버 설정(30)에 넣을지 | `state/learn-prefs.ts` |
| A18 | GET | `/config` · `/config/:key` | 규칙 숫자 · 목록 한 곳에서: 설문 템플릿 · 모임 분류 · 장소 · 입금 계좌 · 오늘 목표 수 · 출석 포인트 · QR 창 | `data/events.ts` · `data/home.ts` |
| A19 | GET | `/app/start-screen` | 첫 화면 그림(비율별 3장) · 바탕색 · 그림 설명. **로그인 없이** 불러요. 지금 것 + 다음 예약 1개 | (새로) 시안 `prototype/onboarding-options.html` |
| A20 | GET | `/me/guide` | 사용 가이드: 내 대상에 맞는 게시 판 + 5장 + `shouldShow`(아직 안 본 판인지) | (새로) |
| A21 | POST | `/me/guide/views` | 가이드 본 기록 `{ version, result: completed \| skipped, lastIndex }` | (새로) |
| A22 | GET | `/members/nickname-check?q=` | 닉네임 쓸 수 있는지 (2~10자 · 중복 · 금칙어) | (새로) 가입 · 설정 |
| A23 | POST · GET · DELETE | `/me/branch-links` · `/me/branch-links/:id` | 지점 연동 요청 보내기 · 내 요청 상태(이유 포함) · 기다리는 중 취소. 처리되면 푸시 | (새로) 가입 · 설정 › 내 지점 |
| A24 | POST | `/sessions/:id/invites` | **함께 가자**: 사전 출석한 세션에 팔로우한 멤버를 불러요 `{ lang, memberIds[] }` → 받는 사람마다 푸시 + 알림(`session_invite`). 보낸 수 돌려줌 | `api/home.ts` `sendSessionInvite` · `components/home/invite-sheet.tsx` |
| A25 | POST | `/me/progress/events` | **퀘스트 성공** 이벤트 `{ type: quest_completed, key, title, deepLink }` → 서버가 내 팔로워에게 알림(`quest_completed`). 아래 '보내는 규칙' | `api/home.ts` `sendQuestDone` · `state/quest-share.ts` |
| A26 | (기존 30에 추가) | `GET · PUT /me/settings` 에 `shareProgress` · `inviteSnoozeUntil` | 퀘스트 성공을 팔로워에게 알리기(기본 켜짐) · '함께 가자고 할까요?' 2주간 보지 않기 기한 | `data/account.ts` `SETTINGS_DEFAULT` · `state/invite-prompt.ts` |
| A27 | (기존 13에 추가) | `GET /me/notifications` 항목에 `type` · `actor` · `deepLink` · `action` | 새 알림 종류 `session_invite` · `quest_completed` (아래 모양) | `data/home.ts` `Noti` · `app/notifications.tsx` |
| A28 | GET · POST | `/me/rewards` · `/me/rewards/:id/seen` | **시즌 보상 자동 지급**: 규칙마다 진행(n/need) · 받았는지 · 안 본 보상. 받은 창을 닫으면 seen. 아래 '시즌 보상 — 자동 지급 규칙' | `data/rewards.ts` · `state/rewards.ts` · `components/my/reward-sheet.tsx` |
| A29 | (기존 63에 추가) | `GET /clubs` 항목에 `lastChatAt` · `?sort=recommended` | **동아리 [추천] 정렬**: 동아리별 마지막 대화 시각을 주면, 그 시각이 최근인 순서로 정렬해요. 아래 '동아리 [추천] 정렬 기준' | `components/meet/club-list.tsx` |
| A30 | (기존 65 바뀜) | `POST /clubs/:id/members` | **신청하면 바로 가입** (승인 대기 · 신청자 목록 없음). 가입 인사는 가입 뒤 선택. 단 **가입 조건**(`○○점 멤버만` · `Lv.N 이상` · `○○어 수강생`)이 안 맞으면 `{ code: CLUB_COND_NOT_MET, message: '잠실점 멤버만 가입할 수 있어요' }` 로 거절 (앱 `joinBlock` 과 같은 규칙) | `components/meet/club/club-join.tsx` |
| A31 | GET · DELETE · POST | `/me/club-applications` · `/me/club-applications/:id` · `/:id/resubmit` | **내가 신청한 동아리**: `{ id, club, status: review \| approved \| rejected, reason, sentAt, decidedAt }`. 검토 중이면 취소, 거절이면 지우기 · 다시 신청. 결정되면 알림(`club_approved` · `club_rejected`) | `components/meet/club-apply.tsx` |
| A32 | GET | `/me/roles` (또는 `/me` 에 추가) | **호스트 · 코호스트 자격**: `{ hostOf: clubId[], cohostOf: clubId[], badge: host \| cohost \| null, history: [{ clubId, role, from, to, why }] }`. 운영 중인 동아리만 셈 — 0개면 badge null. 관리자가 뱃지를 뗄 수 있음(`/admin/members/:id/role`) | `components/meet/model.ts` `useMyClubRoles` · meet-store `hostLog` |
| A33 | (관리자) POST · DELETE | `/admin/clubs/:id/warnings` · `/admin/clubs/:id` · `/admin/challenges/:id/warnings` · `/admin/challenges/:id` | **활동 없음 · 저조 경고 · 닫기**. 서버가 활동을 세서 관리자 웹에 후보를 보여 주고, 관리자가 경고 알림(`club_warning` · `challenge_warning`, n/최대)을 보내요. 닫으면 `club_closed` 알림 + 호스트 · 코호스트 자격 끝. 아래 '활동 없음 · 저조 규칙' | `data/host-rules.ts` |
| A34 | GET | `/me/pro-sessions?cursor=&limit=` | **참여한 세션 기록** (스텝 · 프로): '프로로 참여'로 출석한 세션 `{ total, thisMonth, items: [{ sessionId, date, time, teamName, languageLabel, branchName, kind: COVER \| JOIN, sparks }], nextCursor }`. 스텝 마이 '참여한 세션' 칸을 누르면 열려요. `total` = 마이 `proStats.sessionsTotal` | `api/pro-sessions.ts` · `components/account/pro-sessions-sheet.tsx` |
| A35 | (기존 A3 에 추가) | `GET /me/sparks` `earnRules[].audience` · 서버 지급 2가지 | **프로 · 스텝 스파크**: 프로로 참여 +50 · 한 달 출석률 우수 (아래 '스파크 지급 기준') | `data/my.ts` `SPARK_EARN_PRO` · `components/my/my-sheets.tsx` |
| A36 | (기존 `GET /me/badges` 에 추가) | 항목에 `conditionType` · `threshold` · `progress` | **배지 받는 방법 · 진행**: 배지 상세 시트에 '번개에 5번 참여하면 받아요 · 2 / 5번' 을 그려요. 아래 '배지 — 받는 방법 · 진행 (A36)' | `api/badges.ts` · `data/badge-rules.ts` · `components/my/badge-detail-sheet.tsx` · `app/me/badges.tsx` |

> 인증 2-a: 기존 2 `/auth/phone/verify` 앞에 **인증번호 보내기** `POST /auth/phone/code` 가 하나 더 필요해요 (`src/api/auth.ts` `sendPhoneCode`).

### 함께 가자 · 퀘스트 성공 — 보내는 규칙 (제안)

- **A24 함께 가자**: 회원만 · 내가 팔로우하는 사람에게만 · 사전 출석이 된 세션만. 같은 세션 · 같은 사람에게는 한 번만 (두 번째는 무시하고 `sent`에 안 셈). 받는 사람이 그 세션에 이미 사전 출석했으면 알림 대신 건너뛰어요.
- **A25 퀘스트 성공**: 앱은 처음 끝낸 단계 · 장면마다 이벤트를 하나씩 보내기만 해요 (같은 key 는 앱도 한 번만). 팔로워에게 보낼지는 서버가 정해요:
  - 보내는 사람 설정 `shareProgress` 가 꺼져 있으면 버려요. 받는 사람 설정 '팔로우 알림'(`nFriend`)이 꺼져 있으면 그 사람에겐 안 보내요.
  - **한 사람(보낸 쪽)당 한 시간에 한 번**까지만 푸시. 그 사이 이벤트는 모아서 다음 알림 하나로: 같은 사람이 여러 개면 `태미님이 퀘스트 3개를 성공했어요!` (가장 최근 단계로 이동).
  - **받는 쪽 하루 최대 3개** · 밤 10시 ~ 아침 8시는 알림함에만 쌓고 푸시는 안 보내요. 여러 친구가 같은 시간대에 성공하면 `태미님 외 2명이 퀘스트를 성공했어요` 로 하나.
  - 30일 넘은 이벤트 · 회원이 아닌(연동 전) 사람의 이벤트는 버려요.
- **A26 기기 간 맞추기**: `inviteSnoozeUntil` 은 지금 기기에만 남아요 (`state/invite-prompt.ts`). 폰을 바꿔도 2주가 이어져야 하면 서버 설정에 넣어요. `shareProgress` 는 서버 설정이어야 해요 (서버가 보내는 쪽을 거르니까).

### 동아리 [추천] 정렬 기준 (A29 · 2026-11-26)

지금 앱의 추천 순서는 실제 데이터가 아니라 임시 값이에요. 이 기준은 앱 화면에는 적지 않아요.

- 동아리마다 '최근 대화' 표시(방금 대화 · 10분 전 · 30분 전 · 1시간 전 · 3시간 전 · 어제 대화)가 있는데, 지금은 동아리 id 글자로 정해지는 가짜 값이에요.
- 추천 = 이 '최근 대화'가 최근인 순서
- 내가 만든 동아리('방금 만듦')는 늘 맨 앞
- 순서가 같으면 원래 목록 순서 그대로 (내가 만든 것 최신 순 → 기본 목록 순)
- 멤버 수 · 새로 생긴 · 최근 30일 가입 수는 추천 순서에 안 들어가요
- 카테고리 · 지점은 정렬 전에 목록을 거르기만 해요

**백엔드에서 동아리별 '마지막 대화 시각'(`lastChatAt`, UTC ISO 8601)을 주면, 그 시각이 최근인 순서로 바꾸면 돼요.** 대화가 한 번도 없는 동아리는 `null` 로 주고 맨 뒤에 둬요.

### 활동 없음 · 저조 규칙 (A33 · 2026-11-26 제안)

숫자는 `data/host-rules.ts` 와 같아요. 바꾸면 둘 다 고쳐요.

- **동아리 · 활동 없음**: 30일 동안 정기 모임 · 게시글 · 채팅이 하나도 없음
- **동아리 · 활동 저조**: 30일 동안 정기 모임이 한 번도 안 열림 (글 · 채팅만 있음)
- **챌린지 · 활동 없음**: 7일 동안 인증이 하나도 없음 (참여자 모두 합쳐서)
- **경고**: 동아리 7일 간격 최대 3번 (호스트 · 코호스트에게) · 챌린지 3일 간격 최대 2번 (연 사람에게). 알림 본문에 몇 번째 경고인지 · 언제까지 활동하면 되는지
- **닫기 · 지우기**: 마지막 경고 뒤 동아리 7일 · 챌린지 3일 안에도 그대로면 관리자가 닫거나 지울 수 있어요 (자동이 아니라 관리자가 눌러요). 사이에 활동이 생기면 경고 횟수가 0으로
- 닫힌 동아리의 호스트 · 코호스트 자격은 끝나고 기록만 남아요 (A32 `history`)

### 스파크 지급 기준 (A3 · A35 · 2026-11-27 업데이트 · 프로 · 스텝 금액 확정)

앱은 스파크를 POST 하지 않아요. 원래 API(출석 · 단계 완료 · 모임 참여 …)를 서버가 처리하면서 장부(원장)에 쌓아요. 멱등키가 같으면 두 번 주지 않아요.

| 대상 | 언제 | 스파크 | 멱등키 · 비고 |
|---|---|---|---|
| 멤버 | 세션 출석 (QR) | +50 | `attend:{sessionId}:{memberId}` · 지금 앱에 연결된 것 |
| 멤버 | 오늘 퀘스트 완료 | +10 | 하루 한 번 |
| 멤버 | 번개 · 정기 모임 참여 | +40 | 모임마다 한 번 |
| 멤버 | 7일 연속 학습 | +100 | 연속이 7의 배수가 될 때 |
| 멤버 | 게시판 첫 글 · 첫 인사 | +20 | 한 사람 한 번 |
| 멤버 | 주간 랭킹 TOP 3 | +150 · 왕관 | 주마다 |
| **프로 · 스텝** | **프로로 세션 참여** (테이블 QR '프로로 참여' · POST /study/sessions/{id}/check-in role=LEADER) | **+50** | `pro-attend:{sessionId}:{memberId}` · 대타(COVER) · 같이 참여(JOIN) 똑같이 |
| **프로** | **한 달 출석률 100%** | **+300** | 출석률 = 그 달 맡은 세션 중 프로로 출석한 비율. 맡은 세션 **4개 이상**인 달만. **다음 달 1일**에 한 번 (KST) |
| **프로** | **한 달 출석률 90% 이상** | **+150** | 위와 같음. 100% 면 +300 하나만 (높은 쪽만). 멱등키 `pro-rate:{memberId}:{YYYY-MM}` |

- 출석률은 마이 `proStats.attendanceRate` 와 같은 계산이에요. 맡은 세션이 휴강 · 취소된 건 분모에서 빼요.
- 스텝(지점 관리자)은 맡은 세션이 없어 출석률 보상은 없고, 프로로 참여할 때마다 +50 이에요.
- `GET /me/sparks` `earnRules` 에 `audience: MEMBER | PRO` 를 붙여 주세요. 앱은 프로 · 스텝에게만 PRO 줄을 보여 줘요 (지금은 `data/my.ts` `SPARK_EARN_PRO` 로 그려요).
- 스파크 · 보상 알림은 아래 '스파크 · 보상 알림 (2026-11-28 결정)' 표대로 보내요.

#### 스파크 · 보상 알림 (2026-11-28 결정)

푸시 + 알림함(`GET /me/notifications`)은 서버가 나중에 정하는 보상과 놓치기 직전 안내만이에요. 그 자리에서 받은 보상은 앱이 토스트로 보여 주고 푸시는 없어요. 푸시는 받는 사람의 알림 설정을 따르고, 리마인드(놓치기 직전 · 연속 끊기기 전)는 한 사람에게 하루 한 번까지.

| 알림 종류 (type) | 대상 | 언제 | 예시 문구 | 보내는 곳 | 누르면 |
|---|---|---|---|---|---|
| `spark_awarded` (reason: `pro_rate`) | 프로 | 다음 달 1일 아침, 출석률 보상 지급 때 | 10월 출석률 100%! 스파크 +300 | 푸시 + 알림함 | 꾸미기 |
| `spark_awarded` (reason: `weekly_top3`) | 멤버 | 주가 끝난 월요일 아침 | 지난주 랭킹 2위! 스파크 +150 · 황금 왕관 | 푸시 + 알림함 | 꾸미기 |
| `reward_granted` | 멤버 | 시즌 보상 조건을 채운 때 (A28) | 산타 세트를 받았어요! 나의 팔로로 꾸미러 가기 | 푸시 + 알림함 | 꾸미기 |
| `spark_adjusted` | 모두 | 관리자가 원장을 고칠 때 (회수 · 조정) | 스파크 50이 조정됐어요 (사유: 중복 지급) | 푸시 + 알림함 | 스파크 내역 |
| `pro_rate_reminder` | 프로 | 월말 3일 전, 90% · 100%까지 1회 남았을 때 (달마다 1번) | 이번 달 100%까지 1회! 남은 세션 11.29(일) 11:00 | 푸시 + 알림함 | PRO'S NOTE |
| `streak_reminder` | 멤버 | 저녁 8시, 연속 3일 이상인데 오늘 아직 학습 안 했을 때 (하루 1번) | 오늘 학습하면 7일 연속 · 스파크 +100 | 푸시 + 알림함 | 홈 스터디 맵 |
| — | 모두 | 상점 새 아이템 · 판매 끝 | 눈사람 모자 판매 끝까지 3일 | 앱 안 토스트만 (상점에 들어왔을 때) | — |
| — | 멤버 | 7일 연속 학습 달성 | 7일 연속 학습! 스파크 +100 | 앱 안 토스트만 | — |
| — | 모두 | 세션 출석 · 프로로 참여 | 출석 완료 · 스파크 +50 | 앱 안 토스트만 | — |
| — | 멤버 | 퀘스트 · 모임 참여 · 첫 글 | 퀘스트 완료 · 스파크 +10 | 앱 안 토스트만 | — |

### 시즌 보상 — 자동 지급 규칙 (A28 · 2026-11-25)

시즌 아이템(산타 모자 · 눈 오는 밤 등)은 스파크로 못 사요. **서버가 조건을 세다가 채우면 자동으로** 내 아이템에 넣어요. 멤버가 '받기' 버튼을 누를 일은 없어요.

| 보상 (`id`) | 들어오는 아이템 | 조건 | 기간 |
|---|---|---|---|
| 산타 세트 (`santa`) | `h-santa` 산타 모자 · `f-beard` 산타 수염 · `w-santa` 산타 옷 · `s-snow` 털 부츠 · `bg:snow` 눈 오는 밤 배경 | 12월에 세션 출석 7일 (같은 날 여러 번은 1일) | 12.1 ~ 12.31 (KST) |
| 황금 왕관 (`crown`) | `h-crown` | 주간 랭킹 TOP 3 (지점 랭킹 · 주가 끝나는 월요일 0시에 확정) | 늘 |
| 금메달 (`medal`) | `a-medal` | 지점 대항전 우승 지점의 멤버 (그 기간에 출석 1번 이상) | 대항전마다 |

- **세는 때**: 출석이 확정될 때(QR · 프로 확인) · 주간 랭킹 확정 때 · 대항전 결과 확정 때. 서버가 진행 수를 올리고, `need` 에 닿는 순간 지급해요.
- **지급**: 아이템을 가진 것(`/me/avatar` 의 `own`)에 넣고, 보상 기록 `{ id, grantedAt, seen:false }` 을 남겨요. 스파크는 그대로. **한 사람 한 보상 한 번만** (같은 시즌에 다시 채워도 또 주지 않아요 · 멱등키 `reward:{id}:{season}`).
- **알림** (`GET /me/notifications` 의 새 `type`):
  - `reward_teaser` — 시즌 시작 날 아침 9시, 조건 안내 `12월에 출석 7일을 채우면 산타 세트를 받아요` (회원 모두 · 한 번).
  - `reward_progress` — 거의 다 채웠을 때 `산타 세트까지 출석 2일 남았어요` (need 의 70% · 마지막 1개 남았을 때, 두 번까지). 밤 10시 ~ 아침 8시엔 알림함에만.
  - `reward_granted` — 받았을 때 푸시 + 알림함 `시즌 보상 · 산타 세트를 받았어요! 꾸미기에서 입어 보세요` → `deepLink: /me/customize?try=santa`.
- **앱 표시**:
  - 앱을 열 때 `GET /me/rewards` 에 `seen:false` 가 있으면 **받은 창**을 한 번 띄워요 — 내 캐릭터가 그 아이템을 입은 모습 · `SEASON REWARD` · `산타 세트를 받았어요!` · 무엇을 채워서 받았는지 · [나중에] [입어 보기]. 닫으면 `POST /me/rewards/:id/seen`.
  - [입어 보기] = 꾸미기를 그 아이템을 입힌 채로 열어요 (저장은 멤버가 직접).
  - 꾸미기의 잠긴 칸을 누르면 `잠긴 아이템 · 12월 출석 7일 보상 · 지금 2/7일` 처럼 진행을 보여 줘요.
- **응답 모양 (제안)** `GET /me/rewards`:

```json
{ "rewards": [
  { "id": "santa", "name": "산타 세트", "items": ["h-santa", "f-beard", "w-santa", "s-snow", "bg:snow"], "rule": "12월 출석 7일", "need": 7, "unit": "일", "progress": 2, "window": { "from": "2026-12-01", "to": "2026-12-31" }, "grantedAt": null, "seen": true }
] }
```

- 앱 샘플: 지금은 서버가 없어서 진행은 0, 개발 서버에서 `마이?reward=santa` 로 지급을 흉내 내요 (`?reward=reset` 은 처음으로).

### 배지 — 받는 방법 · 진행 (A36 · 2026-11-28)

지급은 이미 서버가 해요(`AppBadgeAwardService` — 번개 · 동아리 확정 · 좋아요 이벤트). 앱은 **받는 방법과 지금 어디까지 왔는지**를 보여 주려고, `GET /me/badges` 항목에 세 칸을 더해 주세요. 셋 다 없어도 앱은 깨지지 않고 설명 글만 보여요.

| 칸 | 값 | 설명 |
|---|---|---|
| `conditionType` | `AppBadgeConditionType` 이름 | 콘솔에서 고른 조건 유형 그대로 |
| `threshold` | 숫자 | 콘솔 기준 숫자 그대로 |
| `progress` | 숫자 \| null | 지금 내 값. 받은 배지도 보내 주세요(받은 뒤에도 더 쌓인 값). 셀 수 없는 유형은 `null` |

`progress` 세는 법 (지급 판정과 같은 값):

| 유형 | progress |
|---|---|
| `HANGOUT_JOIN_COUNT` · `CLUB_JOIN_COUNT` | `app_badge_progress` 에서 그 유형 줄 수 (`countOf`) |
| `POST_LIKES_ON_ONE_POST` | 내 글 중 좋아요가 가장 많은 글의 좋아요 수 |
| `WEEKLY_RANK_TOP` | 지난주 확정 내 순위 (없으면 null) — 낮을수록 좋아서 앱은 막대 대신 '지난주 n위' 로 보여요 |
| `STUDY_STREAK_DAYS` · `SHADOWING_SENTENCE_COUNT` | 학습 기록 도메인 전까지 `null` — 앱은 '진행은 곧 여기서 볼 수 있어요' |

```json
{ "code": "hangout-5", "name": "번개 단골", "description": "번개 5번 참여", "imageUrl": "https://…/a.png",
  "earned": false, "earnedAt": null, "conditionType": "HANGOUT_JOIN_COUNT", "threshold": 5, "progress": 2 }
```

앱 화면 (2026-11-28):

- **배지 모두 보기** `/me/badges` (마이 배지 '모두 보기 ›' · '받은 배지' 숫자 칸 · 배지 푸시 · 축하 시트 [배지 보기]): 받은 개수 · 최근 받은 배지 → **거의 다 왔어요**(못 받은 배지 중 진행이 큰 순 2개) → 모든 배지 칸 → **배지는 이렇게 받아요**(아래 공통 규칙 5줄).
- **배지 상세 시트** (칸을 누르면): 큰 그림 · 받은 날 · 받는 방법 한 줄 · 진행 막대 `2 / 5번` · `3번 더 참여하면 받아요` · 세는 법 · [번개 보러 가기] 같은 하러 가기 버튼 (못 받은 배지만).
- 배지 푸시(`BADGE`)를 누르면 마이 대신 `/me/badges` 로 가요.
- 배지 그림(`imageUrl`)은 **배지 전체**예요 — 앱 · 콘솔 모두 둘레에 동그라미를 따로 그리지 않고, 못 받았으면 흐리게 그려요. 운영용 그림 8개(입체 동그라미 · 말하기 1000 은빛 왕관 방패 · 번개 단골 센 번개)는 `docs/frontend/badge-art` 에 있어요 (PNG 256×256 투명 · svg 원본).
- 그림이 없는 배지는 앱이 조건으로 그려요: 입체 동그라미 + 아이콘, 따라 말하기 1000~ 은 은빛 왕관 방패, 번개 5번~ 은 센 번개 — `threshold` 가 와야 구별돼요.

공통 규칙 (서버 그대로 — 화면 '배지는 이렇게 받아요'):

1. 활동이 기준에 닿는 순간 저절로 받아요 (신청 없음).
2. 받으면 알림 + 푸시 한 건, 앱을 열면 축하 화면 (푸시를 꺼 두어도 축하 화면은 떠요).
3. 같은 번개 · 동아리는 한 번만 세고, 빠지거나 나가도 줄지 않아요 (누적). 연 번개 · 만든 동아리도 세요.
4. 받은 배지는 회수하지 않아요 (배지를 숨겨도 받은 사람에겐 남아요).
5. 소급 지급 없음 — 새 배지 · 기준을 낮춘 배지는 이미 넘은 회원도 **다음 활동 때** 받아요.

### 응답 모양 예시 (앱이 지금 쓰는 모양)

```jsonc
// A1 GET /popups — 오늘 보여 줄 것만, 순서대로
[{ "id": "pop-party", "kicker": "YEAR END PARTY", "title": "PALLO\n연말 랭귀지 파티",
   "sub": "11.29 토 19:00 · 전 지점", "bg": ["#493087", "#1E1A2B"],
   "cta": "자세히 보기", "href": "/events/m2", "until": "2026-11-29" }]

// A19 GET /app/start-screen — 없으면 current: null (앱 기본 화면)
// 앱은 화면 비율에 맞는 한 장만 받아요 (09-onboarding '잘리지 않고 화면을 꽉 채우는 법')
{ "current": { "id": "ss-party",
               "images": { "short": "https://cdn.example/ss-party-1242x2208.jpg",
                           "regular": "https://cdn.example/ss-party-1290x2780.jpg",
                           "long": "https://cdn.example/ss-party-1290x2866.jpg" },
               "bgColor": "#1E1A2B", "imageAlt": "연말 랭귀지 파티 포스터. 12월 20일 토요일 저녁 7시, 전 지점.",
               "from": "2026-12-01", "until": "2026-12-20" },
  "next": null }

// A23 POST /me/branch-links  { "branchId": "hanam", "name": "김서현", "phone": "01012345678", "consent": true }
{ "id": "bl-91", "status": "pending", "branch": "하남점", "requestedAt": "2026-11-23T12:40:00Z" }
// 못 찾음이면 GET /me/branch-links/bl-91
{ "id": "bl-91", "status": "rejected", "reasonCode": "phone_mismatch", "reasonText": "등록된 번호가 달라요. 등록할 때 쓴 번호로 다시 요청해 주세요." }

// A20 GET /me/guide
{ "version": 3, "audience": "all", "shouldShow": true,
  "slides": [{ "image": "https://cdn.example/g3-1.png", "imageAlt": "QR을 든 노랑 팔로", "bg": "yellow",
               "title": "세션 날엔 QR로 출석", "body": "지점에 도착하면 홈 스터디 카드에서 QR을 찍어요." } /* 5장 */] }

// 10 POST /sessions/:id/attendance  { "qr": "...", "lang": "en" }
{ "firstTime": true, "points": 30, "weekCount": 2 }

// A24 POST /sessions/s2000/invites  { "lang": "en", "memberIds": ["m-minjun", "m-sora"] }
{ "sent": 2 }

// A25 POST /me/progress/events  (응답 본문 없음 · 202)
{ "type": "quest_completed", "key": "1:1:sit", "title": "1과 Cafe Complaint · 본학습",
  "deepLink": "/lesson/sit?lv=1&unit=1", "at": "2026-11-24T11:20:00Z" }

// A27 GET /me/notifications 의 새 항목 두 가지
{ "id": "n-881", "type": "session_invite", "kind": "learn",
  "actor": { "id": "m-minjun", "name": "민준" },
  "text": "민준님이 오늘 20:00 영어 세션에 가요. 같이 갈래요?",
  "deepLink": "/?attend=rsvp&slot=1&lang=0",   // 앱 홈이 그 시간 · 언어로 사전 출석 시트를 열어요
  "session": { "id": "s2000", "lang": "en" }, "action": "같이 가기", "createdAt": "…", "read": false }
{ "id": "n-882", "type": "quest_completed", "kind": "learn",
  "actor": { "id": "m-sora", "name": "소라" }, "others": 0,   // 묶이면 '외 n명'
  "text": "소라님이 「1과 Cafe Complaint · 본학습」 퀘스트를 성공했어요!",
  "deepLink": "/lesson/sit?lv=1&unit=1", "action": "나도 이어서 하기", "createdAt": "…", "read": false }
```

> 딥링크는 앱 안 주소 그대로예요. 비회원 · 둘째 챕터 잠금은 앱 화면이 다시 확인해요 (09-onboarding '회원 · 비회원 권한').

## 2. 관리자 웹 API 개요 (7묶음)

지금 관리자 API는 76 `/admin/reports` 하나예요. 운영자가 **앱 업데이트 없이** 바꾸는 것은 아래 일곱 묶음이에요.
모두 `/admin/…` 아래에 두고, 역할(본사 · 지점 매니저 · 교재팀 · 프로)마다 서버가 범위를 막아요. 지점 매니저는 자기 지점만.

| 묶음 | 하는 일 | 경로 (제안) | 앱이 읽는 API |
|---|---|---|---|
| **1. 콘텐츠** (먼저) | 교재 · 레벨 · 과 편집 (문제 JSON + 그림 + 음원), 상황 맵 · 장면, 리스닝 문장, 단계별 포인트표 하나로 | `/admin/books` · `/admin/lessons/:id` · `/admin/maps` · `/admin/scenes` · `/admin/listen-items` · `/admin/uploads` | 16 · 17 · 18 · 24 |
| **2. 홈 운영** | 공지(띠 노출 · 고정 · 대상 지점 · 예약), 앱 시작 팝업(기간 · 그림 · 순서), 시즌 테마, 알림 · 푸시 보내기 · 예약, **첫 화면**(그림 · 문구 · 아래 칸 색 · 기간 · 순서), **사용 가이드**(대상 · 5장 · 판 · 한 번 더 보여 주기 · 되돌리기) | `/admin/notices` · `/admin/popups` · `/admin/themes` · `/admin/pushes` · `/admin/start-screens` · `/admin/guides` · `/admin/guides/:id/publish` · `/admin/uploads` | 12 · A1 · A2 · 13 · A19 · A20 |
| **3. 지점 · 수강** | **지점 연동 요청**(자동 후보 찾기 · 연동하기 · 못 찾음 이유 · 연동 풀기), 지점 · 팀 · 프로 · 시간표 · 자리, 팀별 이번 주 진도, 이용권 상품, 입금 계좌, 체험 시간, 연기 · 변경 · 홀딩 승인 | `/admin/branches` · `/admin/teams` · `/admin/week-lessons` · `/admin/passes` · `/admin/trial-slots` · `/admin/change-requests/:id` · `/admin/link-requests` · `/admin/link-requests/:id/link` · `/admin/link-requests/:id/reject` | 8 · 11 · 37 · 38 · 39 · 48 |
| **4. 보상 · 상점** | 꾸미기 아이템(가격 · 등급 · 판매 기간 · 그림), 배지 조건, 보상 상자 내용, 시즌 보상, 포인트 · 스파크 지급 규칙, 원장 조정(회수) | `/admin/avatar-items` · `/admin/badges` · `/admin/rewards` · `/admin/reward-rules` · `/admin/members/:id/ledger` | 33 · 35 · A3 · A4 |
| **5. 커뮤니티 운영** | 신고함(있음), 동아리 승인, 이벤트 열기 · 제안 검토 · 설문 템플릿 · 결과 받기, 입금 확인, 분류 · 장소 목록 | `/admin/reports`(76) · `/admin/clubs/:id/approve` · `/admin/events` · `/admin/event-proposals` · `/admin/event-applications/:id` · `/admin/config/places` | 63 · 64 · 86 ~ 92 · A18 |
| **6. 권한** | 프로 · 지점 관리자 지정, 코호스트 바꾸기, 이용 제한 걸기 · 풀기 | `/admin/members/:id/role` · `/admin/clubs/:id/staff` · `/admin/members/:id/restrictions` | 3 · 66 |
| **7. 지원** | FAQ, 1:1 문의 답변, 약관 버전, 앱 최소 버전, 프로 노트 쓰기 | `/admin/faq` · `/admin/inquiries/:id/reply` · `/admin/terms` · `/admin/app-version` · `/admin/pro-notes` | 93 ~ 96 · 44 |

### 회의에서 같이 정할 것

- 관리자 웹을 이번 범위에 넣는지 (PRD Q-T10), 누가 만드는지
- 규칙 숫자(포인트 · 기간 · 정원)를 `GET /config` 하나로 내려 줄지 (A18)
- 포인트 · 스파크를 **원장(내역)** 으로 쌓기 — 잔액만 저장하지 않기 (A3)
- 교재 문제 JSON 형식 (정규식 채점 필드 포함)
