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
| `api/auth.ts` · `me.ts` · `home.ts` | API 하나 = 함수 하나 (번호는 `api-inventory.md` · `api-additions.md`) |
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
- 이름은 각 api 함수의 `mock('이름', …)` 첫 글자 (`me` · `notices` · `notice` · `loungeHighlights` · `popups` · `sessionsToday` · `rsvp` · `attendance` · `login` …)

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

- ☐ 16 맵 칩 · 17 교재 · 과 목록 — `data/library*.ts` (map-data 세션이 데이터 모양을 바꾸는 중 → 끝난 뒤에)
- ☐ 18 과 콘텐츠 — `data/lesson-lv*.ts` · `lesson34-*.ts` · `situation-content.ts`
- ☐ 19 · 20 · 21 진도 · 저장 · 완료 — `state/progress.ts` (count-bugs 세션이 포인트 원장을 만드는 중 → 끝난 뒤에)
- ☐ 22 건너뛰기 테스트 · A5 문제 받기
- ☐ 23 · 26 · 27 · 28 답변 저장 · 음성 · AI — 엔진 정해지면 (Q-T4)
- ☐ 24 · 25 리스닝 문장 · 음원
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

## 지켜야 할 것

- 화면 모양은 바꾸지 않아요. 데이터를 받는 곳만 바꿔요 (앱 = 프로토타입)
- Query 키는 `queries.ts` 에서만 만들어요
- 오류 문구는 서버 `message` 를 그대로, 화면 분기는 `code` 로
