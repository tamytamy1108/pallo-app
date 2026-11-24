# 앱의 API 층 (`mobile/src/api`) · 옮기기 체크리스트

서버가 아직 없어서 모든 API 함수는 **가짜 데이터(mock)** 를 돌려줘요. 서버가 생기면 설정 한 줄만 바꾸면 같은 함수가 진짜 서버에 요청해요.
화면은 `data/*.ts` 를 직접 읽지 않고, `api/` 함수 → TanStack Query 를 거쳐서 받아요.

## 구조

| 파일 | 하는 일 |
|---|---|
| `api/config.ts` | 어느 서버(dev · staging · prod)인지, mock 을 쓸지. `app.json › expo.extra.api` 와 `.env` 의 `EXPO_PUBLIC_API_ENV` · `EXPO_PUBLIC_API_MOCK` |
| `api/client.ts` | 공통 요청 함수 `http.get/post/put/patch/delete`. 토큰 붙이기 · 15초 시간 초과 · 오류를 `ApiError` 로. 목록 모양 `Page<T>` |
| `api/errors.ts` | `ApiError { code, message, status }` · `errorMessage(e)` (화면에 띄울 한 줄) |
| `api/token.ts` | 로그인 토큰 저장 (폰: expo-secure-store · 웹 미리보기: localStorage `pallo-tokens` — 새로고침해도 로그인 유지) |
| `api/mock.ts` | 가짜 응답 · 늦추기 · 실패시키기 |
| `api/auth.ts` · `me.ts` · `home.ts` · `learn.ts` | API 하나 = 함수 하나 (번호는 `api-inventory.md` · `api-additions.md`) |
| `api/queries.ts` | 화면이 쓰는 Query 키 · 옵션 (`meQuery()`, `noticesQuery()` …) |
| `api/query-client.ts` | QueryClient 하나 · 앱으로 돌아오면 다시 받기 · 스플래시 동안 홈 데이터 미리 받기 |
| `api/provider.tsx` | `ApiProvider` (app/_layout.tsx) · 받은 `/me` 를 `state/me` 에 넣는 `MeSync` |

## 화면에서 쓰는 법

```tsx
const { data, isPending, isError, error, refetch } = useQuery(noticesQuery());
if (isPending) return <LoadingState />;
if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;
if (data.items.length === 0) return <EmptyState title="아직 공지가 없어요." />;
```

바꾸는 요청은 `useMutation` → 성공하면 관련 Query 를 다시 받아요 (`queryClient.invalidateQueries({ queryKey: queryKeys.me })`).

## 확인하는 법 (웹 미리보기 주소 뒤에)

- `?mockDelay=1500` — 모든 가짜 응답을 1.5초 늦게 (불러오는 중 화면)
- `?mockFail=notices` — 그 API 만 오류 (오류 화면 · 다시 시도). 여러 개는 `,` · 전부는 `all`
- 이름은 각 api 함수의 `mock('이름', …)` 첫 글자 (`me` · `notices` · `notice` · `loungeHighlights` · `popups` · `sessionsToday` · `rsvp` · `attendance` · `login` · `maps` · `books` · `lesson` …)

## 서버가 생기면

1. `app.json › expo.extra.api.baseUrls` 에 dev · staging · prod 주소 (B3)
2. `.env.local` 에 `EXPO_PUBLIC_API_MOCK=0` (또는 `app.json` 의 `mock: false`) — 이것만으로 모든 함수가 `http.*` 쪽으로 가요
3. 응답 타입을 OpenAPI 에서 만든 타입으로 바꾸기 (B2) — 지금은 `data/*.ts` 의 타입을 그대로 써요
4. 토큰 갱신(B4): `client.ts` 에서 401 이면 `refreshTokens()` 한 번 → 다시 요청, 그래도 401 이면 로그인 화면으로
5. `expo-secure-store` 는 네이티브 모듈이라 폰에서 보려면 **개발 빌드를 다시** 만들어야 해요 (`npx expo run:ios` 또는 `eas build --profile development`)

## 옮기기 체크리스트

순서는 backend-kickoff 3번(로그인 · /me → 홈 · 출석 → 학습 → 라운지 · 이벤트 · 마이)과 같아요.
✅ 옮김 · ◐ api 함수만 있음(화면은 아직 data 직접) · ☐ 아직

### 1. 로그인 · /me (1 ~ 7)

- ✅ 1 로그인 — `app/login/index.tsx` → `loginWithProvider` (useMutation) → 토큰 저장 → `/me` 다시 받기
- ✅ 2 휴대폰 확인 — `app/login/phone.tsx` → `sendPhoneCode` · `verifyPhoneCode` (틀리면 `INVALID_CODE`)
- ✅ 3 `/me` — `MeSync` 가 받아서 `state/me` 에 넣어요. 홈은 불러오는 중 · 오류 화면을 보여요
- ◐ 4 `PATCH /me` · 5 로그인 수단 연결 · 6 탈퇴 — `api/me.ts` 함수만. 설정 화면(`app/me/settings/*`, `me/delete.tsx`)은 아직
- ☐ 7 `/members/:id` — `app/me/profile/[id].tsx`
- ☐ 로그인 안 했으면 `/login` 으로 보내기 (지금은 앱 첫 화면이 홈) · 로그아웃 버튼에 `logout()` + `queryClient.clear()`

### 2. 홈 · 출석 (8 ~ 15)

- ◐ 8 오늘 세션 — `fetchTodaySessions` 있음, 미리 받기도 함. 출석 카드(`session-card.tsx` · `attendance.ts`)는 아직 `data/home.ts` 의 `SLOTS` 를 직접 읽어요 → 규칙 함수가 slots 를 인자로 받게 바꿔야 해요
- ✅ 9 사전 출석 — 홈 `rsvp` useMutation
- ✅ 10 QR 출석 — 홈 `attendance` useMutation (응답 `points` · `weekCount` 는 아직 화면에 안 씀)
- ☐ 11 이번 주 진도 — `data/mock.ts` `MY_BOOK.weekLessons`
- ✅ 12 공지 — 홈 Notice board 띠(`limit=3`) · 공지 목록 · 공지 상세 (없는 공지 = `NOT_FOUND`)
- ☐ 12 설정 › 공지사항 (`app/me/settings/notices.tsx`) — 아직 `NOTICES` 직접
- ◐ 13 · 14 알림함 · 읽음 — 함수만. `app/notifications.tsx` · `noti-state.ts`(종 빨간 점)는 아직
- ✅ 15 라운지 미리보기 — `LoungePreview`
- ✅ A1 시작 팝업 — `LaunchPopup` (‘오늘은 그만 보기’ 저장 `POST /popups/:id/dismiss` 는 아직)

받기 전 · 실패 · 0개일 때: 공지 띠 · 라운지 미리보기 · 팝업은 **칸을 그리지 않아요** (홈의 다른 칸은 그대로). 프로토타입에 정해진 모양이 생기면 맞춰요.

### 3. 학습 (16 ~ 30)

- ✅ 16 상황 맵 — `situationMapsQuery()` (서버 줄 `MapRow[]` → `select` 에서 `toSituationMaps` 로 열린 맵 · 곧 열릴 맵). 라이브러리 탭 · 장면 화면 · 리스닝 룸 제목. 장면 줄은 콘텐츠 대신 `contentId` 만 가져요
- ✅ 17 책장 · 과 목록 — `bookShelfQuery()` → `GET /library/books` (언어별 책장, 권마다 과 목록 `study` 포함). 라이브러리 탭 · 교재 소개 · 과 화면 · 리스닝 룸 제목
  - **백엔드에 제안**: 인벤토리에는 `/library/books/:id/lessons` 만 있어요. 섬 지도가 모든 권의 진도(3/20과)를 한 번에 그려서, 책장 전체를 한 번에 주는 `GET /library/books` 가 있으면 좋아요
- ✅ 18 과 콘텐츠 — `GET /lessons/:id` 하나를 세 함수로: `fetchPatternLesson`(Lv.1 · 2, id `1-1`) · `fetchUnit34`(Lv.3 · 4, id `3-101`) · `fetchSceneContent`(상황 장면, id = 맵 데이터의 `contentId`). 레슨 · Lv.3/4 레슨 · 장면 · 장면 단계 화면 (`components/scene/use-scene.ts`). 없는 id = `NOT_FOUND` → '준비 중' · '곧 열려요'
  - 서버 응답으로 바꿀 때: Lv.3 `liveFix` 가 정규식 · 함수라 JSON 으로 못 와요 → 서버 모양(패턴 문자열 등)을 따로 정해야 해요 (B2)
- 스플래시 동안 책장 · 맵 목록을 미리 받아요 (`prefetchStartData`). 교재 · 맵 · 과 콘텐츠는 10분 동안 다시 받지 않아요
- ☐ 19 · 20 · 21 진도 · 저장 · 완료 — `state/progress.ts` · 포인트 장부(`state/ledger.ts`)와 같이 옮겨요 (다음 차례)
- ☐ 22 건너뛰기 테스트 · A5 문제 받기
- ☐ 23 · 26 · 27 · 28 답변 저장 · 음성 · AI — 엔진 정해지면 (Q-T4)
- ☐ 24 · 25 리스닝 문장 · 음원 — 리스닝 룸 문장은 아직 앱에 든 값 (`listenItemsOf` · `localSceneListenItems`)
- ☐ 29 표현함 — `state/expressions.ts`
- ☐ 30 설정 — `state/learn-prefs.ts` (A17 결정 먼저)

### 4. 라운지 · 이벤트 · 챌린지 · 마이 (31 ~ 96)

- ☐ 전부. 순서 제안: 31 랭킹 · 32 마이 숫자 · 33 배지 → 86 이벤트 목록 · 상세 → 49 라운지 피드 → 79 챌린지 → 나머지

## 기기 저장 (서버가 생기기 전까지)

내 기록은 모두 기기에 남아서 앱을 껐다 켜도 이어져요 — `createStore(초기값, { persist: { key } })` (`lib/store.ts` · `lib/device-storage.ts`).
폰은 문서 폴더 `pallo/<key>.json`, 웹 미리보기는 localStorage `pallo-<key>` — 폰과 웹이 같은 키 · 같은 모양으로 저장해요. 회원 탈퇴 · 마이 맨 아래 개발용 버튼이 `clearSavedData()` 로 모두 지워요.

| key | 무엇 | 서버가 생기면 |
|---|---|---|
| `me` · `ledger` | 내 정보 · 포인트 · 스파크 장부 (이번 주 포인트는 주가 바뀌면 0) | 3 `/me` · 장부 API |
| `progress` · `progress-snaps` · `step-data` · `today-goal` · `scene` · `lesson34-answers` | 진도 · 이어서 하기 · 오늘 목표 · 상황 퀴즈 · Lv.3·4 내 답 | 19 · 20 · 21 · 23 |
| `expressions` · `avatar` | 표현함 · 꾸미기 | 29 · 34 · 36 |
| `attendance` | 오늘 사전 출석 · 출석 (날이 바뀌면 처음부터) · 이번 주 횟수 | 8 · 9 · 10 |
| `settings` · `logins` · `asks` · `level-request` · `change-request` · `pro-notes` · `notice-read` · `noti-read` · `notice-dot` | 마이 B · 알림 · 공지 읽음 | 30 · 13 · 14 · 39 · 44 · 45 · 46 · 94 |
| `lounge` · `meets` · `challenges` · `blocks` · `my-reports` | 라운지 · 번개 · 동아리 · 이벤트 · 챌린지 · 차단 · 신고 (라운지 예시 글은 저장하지 않고 내가 바꾼 것만) | 49 ~ 92 |
| `sound` · `listen-prefs` · `learn-prefs` · `library` · `stage-line` · `popup-hidden` | 기기 설정 · 화면 기억 | 기기에 그대로 둬도 돼요 (A17) |

- 저장 모양을 바꾸면 `persist.version` 을 올려요 → 예전 저장은 버리고 처음 값으로 시작해요
- 레슨 · 스피킹 퀴즈 · 상황 퀴즈는 문제를 넘길 때마다 멈춘 곳을 남겨요 → '그만하기' 없이 앱이 꺼져도(쓸어 닫기 · 시스템 종료) 이어서 해요
- Lv.3·4 '그만둔 곳'의 문제 목록은 함수가 들어 있어 못 남겨요 → 다시 켜면 처음 목록에서 멈춘 번호부터
- 내 기록은 아니지만 3D 지도 텍스처 그림도 기억해요 (`components/library/world/texture-cache.ts`): 메모리 72MB · 폰 캐시 폴더 `pallo-tex-v<판>/` 96MB 까지 (가벼운 폰은 24 · 32MB), 운영체제가 비워도 다시 칠하면 돼요. soft-canvas 칠하는 결과가 바뀌면 `VER` 를 올려요
- 처음 들어올 때는 3D 지도를 만드는 동안 2D 사진판(`world/world-photo.tsx` · `flat-maps.ts`, 이름표 · 팔로까지)을 바로 보여 주고, 3D 가 그려지면 같은 구도로 바꿔요 (3D 는 인트로 없이 시작)
- 맵을 바꿀 때(`library-world.tsx`)는 프로토타입처럼 새 3D 가 인트로(옆으로 0.42 라디안 돌며 0.78 → 1 배, 약 0.5초)와 함께 0.3초 동안 떠요. 바로 바뀌게 지금 지도가 다 뜬 뒤 한 번에 갈 수 있는 지도(다른 상황 맵 · 스터디 맵)를 하나씩 미리 만들어 숨겨 둬요(그리기 멈춤 · 메모리가 적은 폰은 안 함). 아직 안 만든 지도면 그려질 때까지 앞 지도가 그대로 있고, 1.2초 안에 안 그려지면 사진판이 먼저 떠요 (그때는 인트로 없이)
- 간판 글자는 soft-canvas 가 글꼴 모양(`world/glyph-data.json` · Lexend · DM Serif Display, OFL)을 경로로 칠해요. 새 글자(한글 등)가 필요하면 글꼴에서 모양을 다시 뽑아요

## 지켜야 할 것

- 화면 모양은 바꾸지 않아요. 데이터를 받는 곳만 바꿔요 (앱 = 프로토타입)
- Query 키는 `queries.ts` 에서만 만들어요
- 오류 문구는 서버 `message` 를 그대로, 화면 분기는 `code` 로
