# PALLO 앱 (Expo)

실제로 출시할 PALLO 앱의 프론트엔드예요. 디자인 기준은 `../prototype/index.html` 과 `../DESIGN.md` 예요.

## 처음 한 번

```bash
cd mobile
npm install
```

## 화면 보기

```bash
cd mobile
npx expo start
```

- **폰으로 보기:** 폰에 **Expo Go** 앱을 설치하고, 터미널에 뜨는 QR 코드를 찍어요 (아이폰은 기본 카메라 앱으로). 컴퓨터와 폰이 같은 와이파이에 있어야 해요.
- **컴퓨터 브라우저로 보기:** 터미널에서 `w` 를 눌러요.
- 코드를 저장하면 화면이 바로 바뀌어요.

## 부품을 상태별로 보기 (Storybook)

```bash
npm run storybook          # http://localhost:6006 (frontend 루트에서는 npm run storybook:mobile)
```

- 로그인 · 서버 없이 부품 하나를 상태별로 봐요. 웹 미리보기와 같은 react-native-web 으로 그려요.
- 스토리는 `stories/<영역>/X.stories.tsx` 에만 둬요 (`src/app/` 에 두면 화면이 돼요).
- 툴바 **회원 유형**(회원 · 연동 대기 · 연동 안 됨 · 체험 예약 · 앱 구독만 · 비회원)이 나(state/me)를 바꿔요. 스토리 하나를 고정하려면 `globals: { userKind: 'pending' }`.
- 스토어로 정해지는 상태(오늘 목표 등)는 스토리의 `beforeEach` 에서 스토어를 채워요 (`stories/home/GoalCard.stories.tsx` 참고).
- 데이터 훅을 쓰는 부품은 `parameters.queries: [[쿼리키, 응답], ...]` 로 캐시를 미리 채워요.
- 화면(src/app) 스토리는 `stories/pages/` 에 둬요. expo-router 는 대역이라 이동하지 않고 Actions 패널에 기록만 남아요.
  주소 값은 `parameters.route: { params: { id: '1' } }`.
- 불러오는 중 · 오류는 가짜 API 로: `parameters.api: { delayMs: LOADING_FOREVER }` · `{ fail: ['notices'] }` (`stories/pages/notice/NoticeList.stories.tsx` 참고).
- 다 그려지는지 한 번에 확인: Storybook 을 띄운 채로 `node scripts/storybook-smoke.mjs [스토리 id 앞부분]` (설치된 Chrome 을 헤드리스로 써요).

## 확인 (작업 끝날 때마다)

```bash
npm test           # 자동 테스트 (채점 · 듣기 흐름)
npx tsc --noEmit   # 타입 검사
npx expo lint      # 코드 규칙 검사
```

말하기(음성 인식) 시험 목록은 `../docs/frontend/speech-test-plan.md` 에 있어요.

## 폴더

| 폴더 | 들어 있는 것 |
|---|---|
| `src/app/(tabs)/` | 아래 탭 다섯 화면: `index`(홈) · `library` · `lounge` · `event` · `my` |
| `src/app/notice/[id].tsx` | 공지 · 이벤트 상세 (행동 버튼은 아래 고정 바) |
| `src/components/home/` | 홈 부품: 공지 띠 · 오늘 스터디 카드 · 스터디 맵 · 크리스마스 장식(`christmas.tsx`) |
| `src/constants/season.ts` | 계절 정하기 — 11월 22일 ~ 12월 31일은 크리스마스 맵 |
| `src/components/bottom-bar.tsx` | 아래 고정 바 — 행동 버튼은 늘 여기에 |
| `src/app/lesson/[step].tsx` · `src/components/lesson/` | 레슨 화면 · 따라 말하기 문제 · 단어 카드 · 보라 팔로 한마디 |
| `src/lib/speech.ts` · `src/lib/words.ts` | 듣기(음성 인식) · 채점. 테스트는 `src/lib/__tests__/` |
| `src/data/mock.ts` | 가짜 데이터. API가 나오면 서버 값으로 바꿔요 |
| `src/lib/store.ts` · `src/lib/device-storage.ts` | 전역 상태 · 기기 저장 (`createStore(초기값, { persist: { key } })` 면 앱을 껐다 켜도 남아요). 마이 맨 아래 개발용 '기기에 저장한 기록 지우기' |
| `src/app/design.tsx` | 개발용 디자인 부품 모음 (마이 → 디자인 부품 보기). 출시 전에 빼요 |
| `src/components/ui/` | 디자인 부품: `PText`(글자) · `Button` · `Card` · `Pill` · `Chip` · `Raised`(하드 섀도) |
| `src/components/` | 탭 바 · 화면 틀 |
| `src/constants/theme.ts` | 색 · 둥글기 · 간격 (DESIGN.md 와 같은 값) |
| `src/constants/fonts.ts` | 글꼴 (Unbounded · Noto Sans KR) |
