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
| `src/app/design.tsx` | 개발용 디자인 부품 모음 (마이 → 디자인 부품 보기). 출시 전에 빼요 |
| `src/components/ui/` | 디자인 부품: `PText`(글자) · `Button` · `Card` · `Pill` · `Chip` · `Raised`(하드 섀도) |
| `src/components/` | 탭 바 · 화면 틀 |
| `src/constants/theme.ts` | 색 · 둥글기 · 간격 (DESIGN.md 와 같은 값) |
| `src/constants/fonts.ts` | 글꼴 (Unbounded · Noto Sans KR) |
