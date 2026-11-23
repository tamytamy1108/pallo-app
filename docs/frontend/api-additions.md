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

## 1. 회원 앱에 더 필요한 API (16가지 + 인증 2개)

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

> 인증 2-a: 기존 2 `/auth/phone/verify` 앞에 **인증번호 보내기** `POST /auth/phone/code` 가 하나 더 필요해요 (`src/api/auth.ts` `sendPhoneCode`).

### 응답 모양 예시 (앱이 지금 쓰는 모양)

```jsonc
// A1 GET /popups — 오늘 보여 줄 것만, 순서대로
[{ "id": "pop-party", "kicker": "YEAR END PARTY", "title": "PALLO\n연말 랭귀지 파티",
   "sub": "11.29 토 19:00 · 전 지점", "bg": ["#493087", "#1E1A2B"],
   "cta": "자세히 보기", "href": "/events/m2", "until": "2026-11-29" }]

// 10 POST /sessions/:id/attendance  { "qr": "...", "lang": "en" }
{ "firstTime": true, "points": 30, "weekCount": 2 }
```

## 2. 관리자 웹 API 개요 (7묶음)

지금 관리자 API는 76 `/admin/reports` 하나예요. 운영자가 **앱 업데이트 없이** 바꾸는 것은 아래 일곱 묶음이에요.
모두 `/admin/…` 아래에 두고, 역할(본사 · 지점 매니저 · 교재팀 · 프로)마다 서버가 범위를 막아요. 지점 매니저는 자기 지점만.

| 묶음 | 하는 일 | 경로 (제안) | 앱이 읽는 API |
|---|---|---|---|
| **1. 콘텐츠** (먼저) | 교재 · 레벨 · 과 편집 (문제 JSON + 그림 + 음원), 상황 맵 · 장면, 리스닝 문장, 단계별 포인트표 하나로 | `/admin/books` · `/admin/lessons/:id` · `/admin/maps` · `/admin/scenes` · `/admin/listen-items` · `/admin/uploads` | 16 · 17 · 18 · 24 |
| **2. 홈 운영** | 공지(띠 노출 · 고정 · 대상 지점 · 예약), 앱 시작 팝업(기간 · 그림 · 순서), 시즌 테마, 알림 · 푸시 보내기 · 예약 | `/admin/notices` · `/admin/popups` · `/admin/themes` · `/admin/pushes` | 12 · A1 · A2 · 13 |
| **3. 지점 · 수강** | 지점 · 팀 · 프로 · 시간표 · 자리, 팀별 이번 주 진도, 이용권 상품, 입금 계좌, 체험 시간, 연기 · 변경 · 홀딩 승인 | `/admin/branches` · `/admin/teams` · `/admin/week-lessons` · `/admin/passes` · `/admin/trial-slots` · `/admin/change-requests/:id` | 8 · 11 · 37 · 38 · 39 · 48 |
| **4. 보상 · 상점** | 꾸미기 아이템(가격 · 등급 · 판매 기간 · 그림), 배지 조건, 보상 상자 내용, 시즌 보상, 포인트 · 스파크 지급 규칙, 원장 조정(회수) | `/admin/avatar-items` · `/admin/badges` · `/admin/rewards` · `/admin/reward-rules` · `/admin/members/:id/ledger` | 33 · 35 · A3 · A4 |
| **5. 커뮤니티 운영** | 신고함(있음), 동아리 승인, 이벤트 열기 · 제안 검토 · 설문 템플릿 · 결과 받기, 입금 확인, 분류 · 장소 목록 | `/admin/reports`(76) · `/admin/clubs/:id/approve` · `/admin/events` · `/admin/event-proposals` · `/admin/event-applications/:id` · `/admin/config/places` | 63 · 64 · 86 ~ 92 · A18 |
| **6. 권한** | 리더 · 매니저 지정, 서브 호스트 바꾸기, 이용 제한 걸기 · 풀기 | `/admin/members/:id/role` · `/admin/clubs/:id/staff` · `/admin/members/:id/restrictions` | 3 · 66 |
| **7. 지원** | FAQ, 1:1 문의 답변, 약관 버전, 앱 최소 버전, 프로 노트 쓰기 | `/admin/faq` · `/admin/inquiries/:id/reply` · `/admin/terms` · `/admin/app-version` · `/admin/pro-notes` | 93 ~ 96 · 44 |

### 회의에서 같이 정할 것

- 관리자 웹을 이번 범위에 넣는지 (PRD Q-T10), 누가 만드는지
- 규칙 숫자(포인트 · 기간 · 정원)를 `GET /config` 하나로 내려 줄지 (A18)
- 포인트 · 스파크를 **원장(내역)** 으로 쌓기 — 잔액만 저장하지 않기 (A3)
- 교재 문제 JSON 형식 (정규식 채점 필드 포함)
