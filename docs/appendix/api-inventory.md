# API 목록 (제안)

**상태: 모두 '연결 안 됨'(Mock).** 프로토타입은 서버 호출이 하나도 없어요. 데이터는 코드 안 상수(예시)와 메모리 · `localStorage`에 있고, QR · 테스트 통과는 `setTimeout`으로 흉내 내요. 아래는 화면이 하는 일에서 거꾸로 뽑은 **필요한 API 제안**이에요. 경로 · 이름은 개발 쪽에서 정해도 돼요.

공통 가정: 로그인 토큰 인증, 서버 시각 기준, 목록은 페이지네이션(`cursor`), 역할 검사는 서버에서.

> 여기 없는 API(앱 시작 팝업 · 시즌 테마 · 스파크 내역 · 팔로우 · 첫 화면 · 사용 가이드 · 지점 연동 요청 등 21가지 + 로그아웃 · 토큰 갱신)와 **관리자 웹 API 개요(7묶음)** 는 [`docs/frontend/api-additions.md`](../frontend/api-additions.md) 에 이어서 적었어요 (A1 ~ A23).
> 앱 쪽에서 어느 API까지 옮겼는지는 [`docs/frontend/api-layer.md`](../frontend/api-layer.md) 체크리스트를 봐요.
> **최신 · 기준 문서는 [`docs/api/openapi.yaml`](../api/openapi.yaml) (Swagger)** 예요. 지금 백엔드 컨트롤러와 맞춰 본 화면별 API 269개 · [`docs/api/screens.md`](../api/screens.md). 이 목록은 처음 제안으로 남겨 둬요.

## 인증 · 회원

| # | 방법 | 경로 | 하는 일 | 쓰는 화면 |
|---|---|---|---|---|
| 1 | POST | `/auth/login/:provider` | 카카오 · 애플 · 구글 로그인 (응답에 처음 가입인지 `isNew`) | 시작 |
| 2 | POST | `/auth/phone/verify` | 휴대폰 확인 | 로그인 계정 |
| 3 | GET | `/me` | 내 정보 · 역할 · 유형 · 지점 | 전체 |
| 4 | PATCH | `/me` | 닉네임 · 소개 · 지점 | 설정 |
| 5 | POST / DELETE | `/me/auth-providers/:provider` | 연결 · 해제 (마지막 하나는 서버가 거절) | 로그인 계정 |
| 6 | DELETE | `/me` | 탈퇴 | 설정 |
| 7 | GET | `/members/:id` | 멤버 프로필 | 프로필 |

## 홈 · 출석

| # | 방법 | 경로 | 하는 일 |
|---|---|---|---|
| 8 | GET | `/me/sessions/today` | 오늘 내 세션 · 고를 수 있는 시간대 · QR 창 · 내 사전 출석 |
| 9 | POST / DELETE | `/sessions/:id/rsvp` | 사전 출석 (lang 필수) · 바꾸기 |
| 10 | POST | `/sessions/:id/attendance` | QR 출석 (qr, lang) → +30P · 이번 주 n번째 |
| 11 | GET | `/teams/:id/week-lessons` | 이번 주 진도 |
| 12 | GET | `/notices` · `/notices/:id` | 공지 |
| 13 | GET | `/me/notifications` | 알림함 (kind 필터) |
| 14 | POST | `/me/notifications/read` | 읽음 · 모두 읽음 |
| 15 | GET | `/lounge/highlights` | 홈 라운지 미리보기 |

## 학습

| # | 방법 | 경로 | 하는 일 |
|---|---|---|---|
| 16 | GET | `/library/maps` | 맵 칩 (커리큘럼 · 상황 · 곧 열릴 맵) |
| 17 | GET | `/library/books/:id` · `/library/books/:id/lessons` | 교재 · 과 목록 |
| 18 | GET | `/lessons/:id` | 과 콘텐츠 (데이터 객체 하나) |
| 19 | GET | `/me/progress?lesson=` | 진도 · 멈춘 위치 |
| 20 | PUT | `/me/progress/:lesson/:step` | 진행 저장 (pos · results) |
| 21 | POST | `/me/progress/:lesson/:step/complete` | 완료 → 포인트(처음만) · 오늘 목표 · 연속 학습 |
| 22 | POST | `/me/progress/skip-test` | 구간 건너뛰기 테스트 제출 → 통과 시 일괄 완료 |
| 23 | POST | `/me/answers` | 처음 답변 · 토론 발화 저장 |
| 24 | GET | `/lessons/:id/listen-items` | 리스닝 룸 문장 |
| 25 | GET | `/audio/:sentenceId` | 원어민 음원 |
| 26 | POST | `/speech/recognize` | 음성 → 글 · 발음 점수 |
| 27 | POST | `/ai/talk` | AI 대화 한 턴 (프리토킹 · 토론 · 디베이트 · 역할극) |
| 28 | POST | `/ai/feedback` | 교정 · 칸 나누기 · 디베이트 점수 · 날카로움 · 일기 정리 |
| 29 | GET / POST / DELETE | `/me/expressions` | 내 표현함 |
| 30 | GET / PUT | `/me/settings` | 알림 · 학습 · 공개 범위 · 리스닝 설정 |

## 랭킹 · 보상 · 캐릭터

| # | 방법 | 경로 | 하는 일 |
|---|---|---|---|
| 31 | GET | `/ranking?scope=member|branch&period=week|month` | 랭킹 |
| 32 | GET | `/me/summary` | 마이 숫자 4칸 · 다음 세션 |
| 33 | GET | `/me/badges` | 배지 |
| 34 | GET / PUT | `/me/avatar` | 내 캐릭터 저장 |
| 35 | GET | `/avatar/items` | 상점 아이템 |
| 36 | POST | `/me/avatar/purchase` | 아이템 사기 (스파크 차감, 모자라면 거절) |

## 수강 · 결제

| # | 방법 | 경로 | 하는 일 |
|---|---|---|---|
| 37 | GET | `/me/membership` · `/me/teams` | 멤버십 · 수강 팀 |
| 38 | GET | `/branches` · `/branches/:id/teams` | 지점 · 팀 · 자리 |
| 39 | POST / DELETE | `/me/change-requests` | 연기 · 팀 · 지점 변경 신청 · 취소 |
| 40 | POST | `/me/membership/hold` | 홀딩 |
| 41 | POST | `/me/membership/renew-request` | 연장 · 재등록 요청 |
| 42 | GET | `/me/pass-usage` | 사용 내역 |
| 43 | GET | `/me/payments` · `/me/payments/:id/receipt` | 결제 내역 · 영수증 (이메일 보내기) |
| 44 | GET | `/me/pro-notes` · `/pro-notes/:id` | 프로 노트 |
| 45 | POST | `/pro-notes/:id/thanks` | 고마워요 |
| 46 | POST | `/me/level-change-requests` | 레벨 변경 요청 |
| 47 | POST | `/trial-bookings` | 체험 신청 |
| 48 | GET | `/trial-slots?branch=&date=` | 체험 날짜 · 시간 · 마감 |

## 라운지

| # | 방법 | 경로 | 하는 일 |
|---|---|---|---|
| 49 | GET | `/lounge/feed?tab=&cat=&branches=` | 피드 |
| 50 | POST / PATCH / DELETE | `/posts` · `/posts/:id` | 글 |
| 51 | POST | `/uploads/images` | 사진 (≤20MB 원본 → 긴 변 1080px) |
| 52 | POST / DELETE / GET | `/posts/:id/likes` | 좋아요 · 목록 |
| 53 | GET / POST | `/:target/:id/comments` | 댓글 (post · story · board · checkin · entry) |
| 54 | PATCH / DELETE | `/comments/:id` | 내 댓글 |
| 55 | GET / POST / DELETE | `/stories` · `/stories/:id` | 스토리 |
| 56 | POST | `/stories/:id/views` · `/stories/:id/reply` | 본 표시 · 비공개 답장 |
| 57 | POST / DELETE | `/stories/:id/pin` | 매니저 고정 |
| 58 | GET | `/lounge/map?kind=` | 지도 집계 |
| 59 | GET / POST | `/meetups` · `/meetups/:id` | 번개 |
| 60 | POST / DELETE | `/meetups/:id/join` · `/meetups/:id/waitlist` | 참여 · 빈자리 알림 |
| 61 | POST | `/meetups/:id/close` | 모집 닫기 |
| 62 | GET | `/places?region=` | 장소 고르기 |
| 63 | GET / POST | `/clubs` · `/clubs/:id` | 동아리 (만들면 승인 대기) |
| 64 | POST | `/clubs/:id/approve` | 매니저 승인 |
| 65 | POST / DELETE | `/clubs/:id/members` | 가입 · 나가기 (정기 모임 참석도 함께 취소) |
| 66 | PUT | `/clubs/:id/staff` | 코호스트 (≤3) |
| 67 | GET / POST | `/clubs/:id/board` · `/clubs/:id/photos` | 게시판 · 사진첩 |
| 68 | WS / GET | `/clubs/:id/chat` | 채팅 (실시간) |
| 69 | GET / POST / DELETE | `/clubs/:id/sessions` · `/club-sessions/:sid/attend` | 정기 모임 · 참석 |
| 70 | PUT | `/club-sessions/:sid/one-liner` · `/:target/:id/greeting` | 한마디 · 인사 |
| 71 | GET / POST | `/trips` · `/trips/:id/apply` | 여행 동행 · 신청 (안전 수칙 4개) |
| 72 | POST | `/trips/:id/applications/:aid/accept` | 수락 |
| 73 | GET / POST | `/abroad-profiles` | 해외살이 |
| 74 | POST / DELETE | `/saves` | 찜 |
| 75 | POST | `/reports` | 신고 |
| 76 | GET / PATCH | `/admin/reports` · `/admin/reports/:id` | 신고함 처리 (매니저) |
| 77 | POST / DELETE | `/blocks` | 차단 |
| 78 | POST | `/posts/:id/pin` · `/posts/:id/hide` | 공지 고정 · 숨기기 (프로 · 지점 관리자) |

## 챌린지

| # | 방법 | 경로 | 하는 일 |
|---|---|---|---|
| 79 | GET | `/challenges` · `/challenges/hot` | 목록 · TOP3 |
| 80 | POST | `/challenges` | 열기 |
| 81 | GET | `/challenges/expression-check?text=` | 같은 표현 확인 |
| 82 | POST | `/challenges/:id/join` | 참여 |
| 83 | GET / POST | `/challenges/:id/checkins` | 인증 (하루 1번) |
| 84 | GET | `/challenges/:id/ranking` | 순위 |
| 85 | GET / POST | `/challenges/:id/entries` | 표현 챌린지 문장 · 팁 |

## 이벤트

| # | 방법 | 경로 | 하는 일 |
|---|---|---|---|
| 86 | GET | `/events` · `/events/:id` | 목록 · 상세 |
| 87 | POST | `/events` | 열기 (프로 · 지점 관리자) |
| 88 | POST | `/events/:id/applications` | 신청 (설문 답) |
| 89 | DELETE | `/event-applications/:id` | 취소 |
| 90 | PATCH | `/event-applications/:id` | 입금 확인 (운영) [TBC] |
| 91 | GET | `/events/:id/survey-results(.xlsx)` | 설문 결과 (주최 · 매니저) |
| 92 | POST / DELETE | `/event-proposals` | 제안 · 취소 |

## 지원

| # | 방법 | 경로 | 하는 일 |
|---|---|---|---|
| 93 | GET | `/faq` | 자주 묻는 질문 |
| 94 | GET / POST | `/me/inquiries` | 1:1 문의 |
| 95 | GET | `/terms` · `/terms/:id/versions` | 약관 |
| 96 | GET | `/app/version` | 최신 버전 |

## 푸시 알림 (서버 → 기기)

세션 전날 저녁(예습 남음) · 세션 1시간 전 · 번개 · 이벤트 소식 · 동아리 채팅 · 댓글 · 좋아요 · 인사 · 랭킹 변동(하루 한 번) · 광고(동의 시) · 공지 · 프로 노트 도착 · 참여 확정 · 가입 승인 · 동행 수락 · 이벤트 마감 · 입금 확정 · 정기 모임 전날. 보내는 시각 · 묶음 규칙은 Q-B10.
