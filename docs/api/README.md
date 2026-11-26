# Pallo 앱 API 문서 (서버 개발자용)

앱(`mobile/`)의 **모든 화면에서 서버와 연결해야 하는 곳**을 화면 코드에서 하나씩 찾아 Swagger(OpenAPI 3.1)로 정리했어요.
지금 앱은 전부 가짜 데이터(mock)로 돌아가요. 이 문서는 지금 백엔드 컨트롤러와 하나씩 맞춰 봤어요. 새 앱은 `/app/api/v2`(`backend/…/api/appv2`)를 불러요 — 아직 v2 로 안 옮긴 API 는 예전 `/app/api/v1`(`api/app`)에만 있어요.

| 파일 | 내용 |
|---|---|
| [`openapi.yaml`](openapi.yaml) | API 305개: 요청 · 응답 모양, 쓰는 화면, 규칙 · 누가 부를 수 있나(역할) |
| [`screens.md`](screens.md) | 화면 67개마다 무슨 API를 부르는지 · 지금 가짜 데이터가 어디 있는지 · 열린 질문 |
| [`index.html`](index.html) | Swagger UI로 보기 |

## 보는 법

```bash
cd docs/api && npx -y http-server -p 8090 .
```
→ http://localhost:8090 (Swagger UI). 또는 https://editor.swagger.io 에 `openapi.yaml` 을 붙여 넣어요.
위쪽 검색창(filter)에 태그 이름(예: `동아리`)을 넣으면 그 묶음만 보여요.

## 상태 (`x-status`) — 백엔드가 할 일

| 값 | 개수 | 뜻 |
|---|---:|---|
| `existing` | 95 | 이미 있는 API를 그대로 써요. `x-backend` 에 컨트롤러 · DTO 이름. 앱이 이 모양에 맞춰요 |
| `change` | 46 | 있는 API에 필드 · 동작을 더해야 해요. **`x-gap` 에 적은 것만** 고치면 돼요 |
| `new` | 164 | 아직 없어요. 경로 · 모양은 제안이라 바꿔도 돼요 (바꾸면 이 문서를 같이 고쳐 주세요) |

`existing` · `change` 141개는 백엔드 실제 경로(`@*Mapping`)와 하나씩 대조했어요 (모두 있음). `x-backend` 에 `/app/api/v2` 가 적힌 것(41개)이 새 앱 경로에 이미 있는 것이에요.
각 API에 붙은 다른 표시: `x-screens`(쓰는 화면 파일) · `x-app-code`(지금 가짜 데이터 위치) · `x-inventory`(예전 목록 `docs/appendix/api-inventory.md` 번호, `docs/frontend/api-additions.md` A번호).

묶음별 개수는 [`screens.md` 맨 위 표](screens.md#한눈에)에 있어요. 큰 덩어리로 보면:
- **v2 에 있음 (2026-11)**: 카카오 로그인(SDK 토큰 · authCode) · 토큰 갱신 · `/me` · 가입 단계(`GET · POST /onboarding`) · 지점 선택지 · 고른 지점 안내(공개) · 체험 시간표 · 체험 상담 신청 · 지점 연동 요청 · 진행 상황 요약 · 지점 안내 · 마이 집계 · 푸시 토큰 · 공지(고정) · 시작 팝업 · FAQ · 1:1 문의 · 에셋 카탈로그 · 이벤트 제안(보내기 · 내 제안 · 취소 · 목록에서 지우기 · 분류 · 승인 · 반려 알림) · 이벤트 목록 · 상세(다가오는 것만 · 신청은 아직) · 신고하기 · 신고 사유 · 이미지 업로드 · 프로 노트 목록 · 지점 시트 가까운 순(lat · lng)
- **거의 있음 (v1)**: 로그인 · `/me` · 출석(`/study`) · 커뮤니티 글 · 번개(`/hangouts`) · 동아리(`/clubs`) · 챌린지(`/challenges`) · 수강 변경 · 연기 · 지점 이동
- **전부 새로**: 첫 화면 · 가입 마무리 · 닉네임 확인 · 사용 가이드, 학습 콘텐츠 · 진도 · 보상, 음성 · AI, 스토리, 여행 · 해외살이, 이벤트 신청 · 지난 이벤트 · 찜 · 후기 (목록 · 상세 기본 · 제안은 있음), 캐릭터 · 상점, 랭킹 · 배지, 차단, 공지

## 역할 — 누가 부를 수 있나

계정 역할은 GET /me `role` = `guest · member · pro · manager · hq`, 모임 역할은 `viewerRole` (HOST · SUB_HOST(코호스트) · MEMBER).
`openapi.yaml` 맨 위 설명에 규칙을 모았고, API 마다 표시를 붙였어요:
- `x-roles`: 그 계정 역할만 (나머지 403 forbidden) · `x-roles-note`: 모임 역할(그 모임 HOST 등)도 되는 경우
- `x-demo-blocked: true`: 직원(manager · hq)의 **보여 주기 모드** (pro 는 2026-11-26부터 회원과 같아요) — 화면은 끝까지 열지만 신청 · 제출은 `403 demo_account`
- 표시 없음: 로그인한 누구나 (회원 전용은 guest 면 `403 member_only`)
- 프로 · 직원만 쓰는 새 API 14개는 '프로 · 직원' 태그 (`/staff/*` · `/manager/*`)

화면별로는 [`screens.md` 프로 · 직원](screens.md#staff), 화면 · 버튼까지 전체 표는 [`docs/pages/10-roles.md`](../pages/10-roles.md).

## 배포 전에 DB 에 적용할 것

운영 DB 는 `ddl-auto=validate` 라 아래 DDL 을 **배포 전에** 적용해야 서버가 떠요.

| 날짜 | 파일 (`backend/src/main/resources/db/`) | 내용 | 관련 API |
|---|---|---|---|
| 2026-11-26 | `migration-event-proposal-notify-hide.sql` | `event_proposals.hidden_at` 추가 · `member_notifications.type` 에 `EVENT_PROPOSAL_APPROVED` · `EVENT_PROPOSAL_REJECTED` | `POST /event-proposals/{id}/hide` · 제안 승인 · 반려 알림 · `GET /events` |

enum `MODIFY` 는 `schema.sql` 기준 전체 값 목록이에요. 그사이 다른 작업이 값을 늘렸으면 `SHOW CREATE TABLE` 로 확인해 같이 넣어 주세요.

## 공통 약속 (지금 백엔드 방식 그대로)

- 오류: `{ "error": "snake_case", "message": "화면에 띄울 한국어" }` (`GlobalExceptionHandler`). 앱은 `error` 로만 분기
- 새 목록 API: `?cursor=&size=` → `{ rows, nextCursor }`. 있는 API는 지금 모양 그대로
- 시간 UTC ISO 8601 · 사진은 `POST /uploads/images/{purpose}` 먼저 (새 purpose 필요한 것은 설명에 적었어요)
- 포인트 · 스파크 · 랭킹 · 연속 학습 · 정원 · 자격은 **서버가 계산**. 앱이 지금 기기에서 하는 규칙을 각 API 설명에 옮겨 적었어요
- 공개 API(약관 · 체험 접수 · 첫 화면, `/public/api/v1`)는 그 API에만 `servers` 를 따로 달았어요. 체험 접수는 로그인 토큰이 있으면 같이 보내 계정과 이어요

## 백엔드가 정해 줘야 할 것 (큰 것만 — 나머지는 screens.md 각 화면의 '열린 질문')

1. **로그인**: 지금은 카카오 `authCode` 만. Apple · Google 추가할지 (iOS 심사), 휴대폰 인증 로그인을 둘지 · 이메일 로그인으로 바꿀지
2. **출석**: 앱은 '입구 QR + 언어 고르기', 백엔드는 '테이블 QR + 코스'. 흐름 하나로 맞추기
3. **학습 콘텐츠**: `/materials`(PDF 교재 · 퀴즈 세트)와 앱의 과 콘텐츠(Lv.1~4 · 상황 장면)를 합칠지 따로 둘지. Lv.3 `liveFix` 는 정규식 · 함수라 JSON 형식(`LiveFixRule`)을 제안했고, 2개 규칙은 서버 `/ai/feedback` 로 옮겨야 해요
4. **음성 · AI**: 서버 음성 인식 · 발음 점수가 필요한지 (지금은 기기 인식), `/ai/talk` 동기 응답 · SSE 중 무엇으로
5. **표현함**: 백엔드는 'AI 교정 결과만 저장', 앱은 레슨 · 리스닝에서 바로 저장 → 바로 저장 허용
6. **동아리 · 챌린지**: 지점 · 지역에 묶을지 (앱은 지점별로 거름), 바로 가입(`OPEN`) 허용, 챌린지 승인 대기(PENDING) 를 앱에서 어떻게 보여 줄지, 인증 빈도 · 사진 개수(백엔드 3 · 앱 10)
7. **이벤트 결제**: 계좌 이체 입금 확인 방법, 24시간 안 내면 자리 풀기, 환불 규칙. 제안을 승인하면 서버에 이벤트(Event)가 생기지만 앱이 볼 이벤트 목록 · 상세 API(GET /events …)는 아직 없어요 — 그 모양을 이 문서의 new 대로 할지, 이벤트 포스터 사진 purpose 를 EVENT_PHOTO 로 같이 쓸지
8. **수강 변경 날짜**: 앱은 오늘 + 2주부터, 백엔드는 수업 변경 3일 · 연기 다음 날부터. 남은 변경 횟수를 하나로 셀지
9. **프로 노트**: 백엔드는 리더 질문 + AI 답, 앱은 태그 붙은 항목(표현 · 바로잡기 · 뜻 · 질문) + 프로 한마디
10. **랭킹**: 지점 두 곳 회원의 포인트를 어느 지점에 셀지
11. **v1 → v2**: 새 앱은 `/app/api/v2` 만 불러요. 아직 v1 에만 있는 API(출석 · 라운지 · 번개 · 동아리 · 챌린지 · 수강 변경 등)를 v2 로 옮길 때 경로 · 모양을 이 문서대로 바꿀지, v1 모양 그대로 옮길지. v2 공지 목록은 `?cursor=&limit=` → `{items, nextCursor}` 라 새 목록 약속(`size` · `rows`)과 달라요 — 어느 쪽으로 맞출지
12. **동아리 만들기 승인**: 신청(PENDING) → 관리자 승인 · 거절을 서버 상태로 둘지, 내 신청 목록(`GET /me/club-applications`) · 닫기 · 활동 저조 경고(A33) 규칙
13. **역할**: `role` 값 이름(`pro` · `manager` · `hq`, 예전 `leader`), 보여 주기 모드 오류 코드(`demo_account`), 한 세션에 프로가 둘일 때

## 앱 쪽에서 맞출 것 (프론트 할 일 — 참고)

- `api/errors.ts` 의 `{code,message}` → `{error,message}`, `api/client.ts` 의 `Page {items,nextCursor}` → `{rows,nextCursor}`
- 로그인 `/auth/login/:provider` → `POST /auth/login`, `isNewMember` → `GET /me` 의 `needsOnboarding`. 온보딩 화면(약관 → 닉네임) 새로 만들기
- `PATCH /me` → `PATCH /me/profile`
- 가입 끝내기는 `POST /onboarding` (palloloCode · path · member/trial/app 블록) · 지점 연동 반려는 `GET /me/branch-summary` + `POST /me/branch-link-requests/{id}/acknowledge` (붙임 끝)

## 고치는 법

API 모양이 바뀌면 `openapi.yaml` 을 먼저 고치고 `npx -y @redocly/cli@1.34.0 lint docs/api/openapi.yaml` 로 확인해요.
화면이 바뀌면 `screens.md` 의 그 화면 표도 같이 고쳐요.
