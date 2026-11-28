# 화면별 API 지도

앱 `mobile/src/app/` 의 화면 67개를 하나씩 열어 **서버가 필요한 곳**을 적었어요. API 자세한 모양은 [`openapi.yaml`](openapi.yaml) (Swagger)에 있어요.
상태: `existing` 이미 있음 · `change` 있는 것에 필드 · 동작 추가 · `new` 새로 필요. 경로는 `/app/api/v2` 뒤에 붙어요 (새 앱 · 2026-11. 아직 v2 로 안 옮긴 예전 API 는 `/app/api/v1`, 공개 API는 `/public/api/v1`).

## 한눈에

| 묶음 (Swagger 태그) | existing | change | new | 합계 |
|---|---:|---:|---:|---:|
| 인증 · 시작 | 11 | 4 | 3 | 18 |
| 홈 | 6 | 2 | 3 | 11 |
| 알림 · 공지 | 7 | 1 | 0 | 8 |
| 공통 · 설정값 | 7 | 1 | 1 | 9 |
| 가입 · 온보딩 | 5 | 0 | 4 | 9 |
| 라이브러리 | 1 | 0 | 3 | 4 |
| 학습 · 레슨 | 0 | 0 | 3 | 3 |
| 진도 · 보상 | 0 | 0 | 7 | 7 |
| 음성 · AI | 0 | 0 | 3 | 3 |
| 표현함 | 2 | 2 | 0 | 4 |
| 라운지 피드 | 10 | 3 | 8 | 21 |
| 스토리 | 0 | 0 | 15 | 15 |
| 번개 | 10 | 3 | 8 | 21 |
| 동아리 | 7 | 13 | 12 | 32 |
| 여행 · 해외살이 | 0 | 0 | 14 | 14 |
| 신고 · 차단 | 2 | 0 | 2 | 4 |
| 챌린지 | 11 | 5 | 9 | 25 |
| 이벤트 | 5 | 2 | 15 | 22 |
| 마이 | 5 | 1 | 8 | 14 |
| 프로필 · 팔로우 | 0 | 1 | 5 | 6 |
| 랭킹 · 배지 | 2 | 1 | 2 | 5 |
| 캐릭터 · 상점 | 2 | 0 | 4 | 6 |
| 수강 · 결제 | 8 | 7 | 7 | 22 |
| 프로 노트 | 3 | 0 | 7 | 10 |
| 설정 · 지원 | 4 | 1 | 7 | 12 |
| 프로 · 직원 | 0 | 0 | 14 | 14 |
| **합계** | **108** | **47** | **164** | **319** |

목차: [인증 · 홈 · 알림 · 공통](#core) · [가입 · 온보딩](#onboarding) · [학습](#learn) · [라운지](#lounge) · [챌린지 · 이벤트](#community2) · [마이](#my) · [프로 · 직원 (역할별)](#staff)


<a id="core"></a>

## core — 화면별 API (인증 · 시작 / 홈 / 알림 · 공지 / 공통 · 설정값)

### 앱 바깥 틀 · 부팅 — `app/_layout.tsx` (+ `api/provider.tsx`, `api/query-client.ts`)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 스플래시 동안 내 정보 받기 · state/me 에 넣기 (MeSync) | GET /me | change | api/me.ts fetchMe · state/me.ts ME0 |
| 연동 대기 카드 · 반려 팝업 · 다가오는 체험 (회원 · 비회원 두 가지만, 나머지는 이 요약으로) | GET /me/branch-summary · 반려 확인 POST /me/branch-link-requests/{id}/acknowledge | existing | api/branch-summary.ts · use-branch-progress.ts |
| 부팅 설정값 (카카오 키 · 운영 규칙 숫자) | GET /config | change | data/home.ts QR_BEFORE · QR_AFTER · ATTEND_POINTS · TODAY_GOAL 상수 |
| 앱 버전 확인 (강제/권장 업데이트) | GET /config/app-version | new | 없음 |
| 푸시 토큰 등록 (로그인 뒤 · Firebase FCM) | PUT /me/push-tokens | existing | api/push-registration.ts · push-tokens.ts |
| 로그아웃 · 푸시 끔 → 해제 | DELETE /me/push-tokens?token= | existing | api/push-tokens.ts unregisterPushToken |
| 401 → 토큰 갱신 한 번 | POST /auth/refresh | existing | api/auth.ts refreshTokens |
| 홈 첫 화면 미리 받기 | 홈 섹션의 GET 들 (/study/courses · /notices?board · /home/lounge-highlights · /popups) | — | api/query-client.ts prefetchStartData |
| 백오피스 문구 캐시 (필요 화면만) | GET /contents · GET /contents/{key} | existing | 앱은 하드코딩 |

기기에만 저장 (API 없음): access · refresh 토큰 (SecureStore · 웹은 localStorage)
가입 단계 화면(약관 → 닉네임 → 캐릭터 → 지점 회원?)은 이제 앱에 있어요 → onboarding-screens.md. 회원 · 비회원은 GET /me memberAccessLevel, 연동 대기 · 반려 · 체험 예약은 GET /me/branch-summary 로 봐요 (권한 · 홈 카드).

### 탭 틀 — `app/(tabs)/_layout.tsx`
서버 호출 없음. 기기에 토큰이 없고 가입 단계를 안 끝냈으면 첫 화면(/)으로 보내요 (api/token.ts getTokens · state/onboarding.ts done). 토큰이 있으면 needsOnboarding 은 GET /me 로.

### 로그인 — `app/login/index.tsx`
서버 호출 없음 — 예전 주소라 첫 화면(/)으로 보내기만 해요. 로그인은 `app/(auth)/index.tsx` '카카오로 시작하기' 하나 (onboarding-screens.md 첫 화면):
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 카카오로 시작 ((auth)/index.tsx) | POST /auth/login (kakao authCode) | change (응답 isNewMember 추가) | api/auth.ts loginWithProvider (경로 /auth/login/:provider → 버림) |
| 로그인 뒤 가입 단계로 갈지 | 응답 isNewMember (= GET /me needsOnboarding) | change | isNewMember: !getOnboarding().done (가짜) |

Apple · Google 버튼 · '먼저 둘러볼게요'는 없앴어요 (2026-11-24).
열린 질문:
- 로그인을 카카오 하나로 두면 iOS 심사(4.8)에 걸려요 — iOS 에만 Apple 로그인을 더할지 (Q-O11).
- 비회원 둘러보기에서 홈 GET 들(공지 · 팝업 · 라운지 미리보기 · 테마 · 체험 시간)을 토큰 없이 열지 — 스펙에는 "토큰 있으면 붙이고 없어도 됨"(security `{}` + bearer)으로 적었어요. /study · /me/notifications 는 로그인 필요.
- 지점 QR(카카오싱크) 유입 시 응답 inquiryBranchName 으로 가는 "상담 접수 확인 화면"과 POST /qr-inquiries/{candidateId}/preference · GET /public/api/v1/branches/{code}/consultation-hours 는 백엔드에 있지만 앱 화면이 없어요.

### 휴대폰 번호로 시작 — `app/login/phone.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 인증번호 받기 · 다시 받기 | POST /auth/phone/code | new | api/auth.ts sendPhoneCode · CODE_SECONDS=180 |
| 인증번호 확인 → 로그인 | POST /auth/phone/verify | new | api/auth.ts verifyPhoneCode (INVALID_CODE → invalid_code) |

참고 (백엔드에 있고 앱 화면 없음): POST /auth/email-login (existing).
열린 질문: 휴대폰 OTP 로그인을 새로 만들지, 이 화면을 이메일 로그인으로 바꿀지.

### 이메일 회원가입 — `app/(auth)/signup.tsx` (첫 화면 '카카오로 시작하기' 아래 [회원가입])
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 연령대 칩 (선택 · 못 받으면 칸 숨김) | GET /auth/signup/options | existing | api/auth.ts fetchSignupOptions · api/queries.ts signupOptionsQuery |
| [가입하기] → 토큰 저장 → 가입 과정 | POST /auth/signup | existing | api/auth.ts signUpWithEmail · data/signup.ts 입력 규칙 (409 → '이미 가입한 이메일이에요') |

열린 질문: 가입한 이메일로 다시 들어올 **이메일 로그인 화면**(POST /auth/email-login)이 아직 앱에 없어요.

### 체험 예약 (앱 안) — `app/trial/index.tsx` (+ `components/onboarding/trial-form.tsx` · `trial-slots.tsx` · `branch-sheet.tsx`, `components/common/trial-guide.tsx`)
가입 단계 체험 예약(`app/onboarding/trial.tsx`)과 같은 한 장이에요. 들어오는 곳: 홈 둘러보기 카드 · 체험 권유 시트 [상담 예약하기] · 마이 잠김 칸 · 체험 안내 시트(guardMember) · 교재 소개 · /trial?lang=ja. 이름 · 번호는 가입 때 적은 값으로 미리 채워요.
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 지점 선택하기 → 지점 목록 시트 (검색 · 권역 칩 · 전체 n) | GET /public/api/v1/branches | change (region · phone) | data/account.ts BRANCHES · BRANCH_REGIONS |
| 희망 언어 (하나) | GET /public/api/v1/candidate-inquiries/options | existing | app-parts.tsx ONB_LANGS |
| 상담 시간 (날짜 5일 → 시간 칸 · 마감 흐리게) — 지점 · 언어를 바꾸면 다시 | GET /trial-slots?branchCode= (오늘부터 5일) | existing | trial-slots.tsx TIMES · trialSlots (가짜 마감) |
| 배우고 싶은 이유 (여러 개 · 선택) · 전달 사항 (200자 · 선택) | (예약 보내기에 같이) | — | app-parts.tsx WHY_REASONS |
| [체험 예약하기] → 예약 확정(/trial/done) | POST /trial-applications (가입 뒤 앱 안) · 가입 단계 안에서는 POST /onboarding trial | existing | state/trial-booking.ts setLastTrial · updateMe({trial}) |

열린 질문: 체험 동의 약관 — 앱 체험 화면엔 동의 칸이 없어요. 가입 때 동의(app-onboarding)로 갈음할지, 체험용 배치를 따로 둘지. 이미 다가오는 체험이 있는데 또 예약하면 막을지 · 바꿀지(예약 변경은 지금 '지점에 전화'). 체험 시간표 · 정원 · 언어별 프로 일정은 어디서 읽을지(Q-O10).

### 체험 예약 확정 (앱 안) — `app/trial/done.tsx`
서버 호출 없음 — 방금 보낸 값(state/trial-booking.ts useLastTrial)으로 '첫 무대 입장권'을 그려요 (가입 때 `app/onboarding/trial-done.tsx` 와 같은 TrialDoneView). 다시 열면 GET /me/branch-summary upcomingTrials.

### 홈 — `app/(tabs)/index.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 인사 Hey {이름} | GET /me (nickname) | change | state/me.ts name |
| 종 분홍 점 (1분마다 · 푸시 오면 바로) | GET /me/notifications/unread-count → {count} | existing | noti-state.ts useUnreadCount · api/use-notifications.ts |
| Notice board 띠 (3개 순환) | GET /notices?limit=3 | existing | data/mock.ts BOARD_NOTICES |
| 오늘 스터디 카드 (스터디 회원) | GET /study/courses?date=오늘 | change (qrOpensAt · qrClosesAt · regular) | data/home.ts SLOTS · MY_SLOT · MY_LANG · attendance.ts |
| 오늘 스터디 자리를 누구냐에 따라 (components/home/home-card.tsx): 회원 출석 카드 · 연동 대기 잠긴 라벤더 · 못 찾음 '다시 요청하기' · 체험 D-n · 둘러보기 카드 | GET /me (memberAccessLevel) · GET /me/branch-summary | existing | state/access.ts userKind · api/use-branch-progress.ts |
| 지점 연동 결과 푸시 배너 · 잠긴 카드가 풀리는 순간 | 푸시 + GET /me/notifications (BRANCH_LINK_*) → GET /me 다시 | change | state/link-events.ts · components/home/link-push.tsx · link-unlock.tsx · link-admin-dev.tsx(개발용 '지점 처리 흉내') |
| 출석 · 사전 출석 막기 (비회원) | 없음 (앱 guardMember) — 서버도 403 member_only | — | components/common/trial-guide.tsx |
| 스터디 맵 진도 · 마지막 단계 · 건너뛰기 | learn 도메인 | — | state/progress.ts · map-state.ts · skip-sheet.tsx |
| 맵의 이번 주 과 | GET /me/week-lessons | new | data/mock.ts MY_BOOK.weekLessons · weekByLevel |
| 맵 보상 상자 열기 | POST /me/progress/chests/{chestKey}/open | new (A4 · learn 과 겹치면 그쪽) | state/chest.ts · chestReward() |
| 맵 계절 · 크리스마스 색 | GET /home/theme | new | constants/season.ts seasonOf · XMAS |
| 라운지 미리보기 슬라이드 | GET /home/lounge-highlights | new | data/home.ts LOUNGE_HIGHLIGHTS |
| 앱 시작 팝업 | GET /popups | existing | data/home.ts LAUNCH_POPUPS |

기기에만 저장 (API 없음): 카드 제목 차례(stage-line) · 팝업 '오늘은 그만 보기'(popup-hidden) · 개발용 ?now= · ?season= (components/home/dev.ts)
참고: 백엔드 GET /home/recommendations (챌린지 · 동아리 · 행아웃 캐러셀)와 GET /study/courses/footprint ("내 언어 발자국"), GET /study/courses/nearest 는 있지만 지금 앱 홈은 그리지 않아요.

### 출석 시트 · QR — `components/home/session-card.tsx` · `attend-sheet.tsx` · `qr-scanner.tsx` · `attendance.ts`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 시간대 × 언어 고르기 (사전 출석 · 출석 모드) | GET /study/courses?date= (time 으로 묶기 · languageCode) | change | slotSelectable · slotSub · firstSelectable |
| 참석 알리기 | POST /study/courses/{courseId}/pre-check-in?date= | existing | api/home.ts sendRsvp |
| 사전 출석 변경 | DELETE 이전 → POST 새 courseId | existing | attendance.ts sendRsvp (덮어쓰기) |
| QR 인식 → 어느 지점 · 테이블 | GET /tables/{qrCode} | existing | qr-scanner.tsx onScanned |
| (QR 안 읽힐 때 직접 고르기 · 앱에 없음) | GET /tables?branchId= | existing | 없음 |
| 출석 → +30P · 이번 주 n번째 (프로 · 직원은 '프로로 참여 / 멤버로 참여'를 골라 role LEADER · MEMBER, 등록 팀 · 이용권 확인 없음 — 아래 [프로 · 직원](#staff)) | POST /study/sessions/{sessionId}/check-in {tableId, role} | change (firstTime · points · sparks · weekCount) | api/home.ts sendAttendance · state/ledger awardPoints/awardSparks |

기기에만 저장 (API 없음): 없음 — 지금 기기에 남기는 출석 상태(attendance)는 전부 서버 값으로 바뀌어요.
열린 질문:
- 앱은 "입구 QR + 언어 선택", 백엔드는 "테이블 QR + 수업(courseId=시간·언어)" — 스캐너 문구 · 흐름을 테이블 기준으로 바꿀지. 같은 지점에 열린 회차가 여럿이면 어느 sessionId 로 출석할지(시트에서 고른 수업 우선).
- 앱 상태 '오늘은 쉬어요'(rsvp=no)는 보내는 UI 가 없어 서버 상태도 두지 않았어요.
- 자리 이동 PUT /study/sessions/{sessionId}/check-in/seat 는 앱에 아직 없어요. 리더(=프로) 출석 → prosNoteId 는 '출석하면 프로스 노트가 바로 열려요'로 정했어요 ([10-roles](../pages/10-roles.md)).
- 카운트다운 · 출석 창 표시를 서버 시각으로 맞추는 방법 (응답 Date 헤더 보정으로 충분한지).

### 알림함 — `app/notifications.tsx` (+ `components/home/noti-state.ts`)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 목록 · 탭(전체 · 공지) — 공지 게시 알림은 [이벤트] · [업데이트] · [중요] 머리말 → 공지 상세 | GET /me/notifications?category=&cursor=&limit= → {items, nextCursor, unreadCount} (v2, meta.kind NOTICE · REFERENCE) | change (학습 · 라운지 · 이벤트 탭 값 · actor 추가) | api/use-notifications.ts · data/home.ts NOTI_TABS |
| 행 누르기 → 읽음 → 이동 | PATCH /me/notifications/{id}/read (v2) | existing | noti-state.ts markNotiRead · Noti.href (→ type+reference 로 앱이 경로 계산) |
| 모두 읽음 | POST /me/notifications/read-all (v2 · 탭 상관없이) | existing | noti-state.ts markAllNotiRead |
| 알림 설정 (톱니) — 비회원은 흐리게 · 누르면 체험 안내 시트 | my 도메인 (설정 › 알림) | — | /me/settings?section=noti · state/access.ts canUse('settings') |
| 지점 연동 결과 알림 (연동됨 ✓ → /my · 못 찾음 ? → /link-rejected) | GET /me/notifications (type BRANCH_LINK_APPROVED · BRANCH_LINK_REJECTED) | change | state/link-events.ts addNoti · LinkBadge |
| 회원 전용 화면 알림(/me/notes · pass · study · change)을 비회원이 누름 | 없음 (앱이 memberGate) | — | MEMBER_HREFS |

참고: GET /me/notifications/{id} (existing) 는 앱이 상세 화면이 없어 안 써요.
열린 질문: type → category 매핑과 새 type 값(내일 세션 · 예습 남음 · 댓글 · 챌린지 인증 남음 · 이벤트 마감 · 공지 새 글 · 번개 확정 · 동행 수락)을 백엔드가 정해야 해요.

### 공지 목록 — `app/notice/index.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 목록 (고정 먼저 · 최신 순) | GET /notices?cursor=&limit= | existing | data/mock.ts NOTICES |

기기에만 저장 (API 없음): 공지 새 글 점(notice-dot · 상세를 열면 읽음)
열린 질문: 공지 읽음을 계정 단위로 서버에 둘지 (기기 바꾸면 점이 다시 생겨요).

### 공지 상세 — `app/notice/[id].tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 상세 (본문 문단 · 행동 버튼) | GET /notices/{id} · 고정 PUT · DELETE /notices/{id}/pin | existing | api/home.ts fetchNotice |
| 공유 | 없음 (링크 복사 토스트만) | — | — |

### 디자인 확인 — `app/design.tsx`
서버 호출 없음 (개발용 화면).

### 공통 컴포넌트 — `components/common/**`
- `trial-guide.tsx` (guardMember · memberGate · openTrial) · `trial-booking.tsx` (체험 예약 내용 시트 — GET /me/branch-summary upcomingTrials) · `upsell-sheet.tsx` · `member-lock.tsx` · `scroll-lock.tsx`: 서버 호출 없음 (권한은 GET /me memberAccessLevel · 비회원이 기다리는 것은 GET /me/branch-summary, 잠김 본 수는 기기에만 — onboarding-screens.md 참고). `trial-sheet.tsx` 는 없어졌어요 → 위 체험 예약.
- `comments-sheet.tsx` · `report-sheet.tsx`: 지금 서버 호출 없음 (state/me 만 읽음). 댓글 · 신고 API 는 그 시트를 여는 도메인(lounge 등)이 정의해요.
- `member-face.tsx` · `sheet-parts.tsx` · `icons.tsx`: 서버 호출 없음.

### 공통 설정값 (화면 없음 · 여러 도메인이 씀)
| 하는 일 | API (method path) | 상태 |
|---|---|---|
| 선택지 묶음 (관심사 · 직업 · 학습언어 …) | GET /me/master-data?kinds= | existing |
| 내 활성 멤버십 지점 | GET /me/branches | existing |
| 이미지 올리기 | POST /uploads/images/{purpose} | existing |
| 로그아웃 (설정 화면 버튼) | POST /auth/logout | new |

PATCH /me (api/me.ts patchMe: 닉네임 · 소개 · 지점) 는 여기서 정의하지 않았어요 → my 도메인의 PATCH /me/profile (existing) 과 지점 이동 신청으로 대신해요.

<a id="onboarding"></a>

## onboarding — 화면별 API (가입 · 온보딩)

기준: docs/pages/09-onboarding.md · api-additions A19 ~ A23. 다른 태그에 있는 API 는 그대로 가리켜요 (core: 인증 · 시작 / my: 마이 · 수강 · 결제).
흐름: 첫 화면 → 카카오 로그인 → (처음이면) 약관 → 닉네임 → 캐릭터 → 지점 회원이에요? → 회원 · 체험 · 앱 구경 → GET /onboarding (약관 · 미리 채울 값) … POST /onboarding → 홈.

### 첫 화면 — `app/(auth)/index.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 관리자 웹 그림(비율별 3장 중 하나) · 바탕색 · 그림 설명, 다음 예약 미리 받기 | GET /public/api/v1/start-screen | new | 앱 고정 'YOUR FIRST STAGE' 움직이는 포스터만 (기본 화면) |
| 카카오로 시작하기 → 처음이면 약관, 아니면 홈 | POST /auth/login → 응답 isNewMember (core loginWithProvider) | change | api/auth.ts loginWithProvider · isNewMember: !getOnboarding().done (가짜) |
| 로그인 뒤 내 정보 | GET /me (core getMe) | change | queryKeys.me 다시 받기 |

기기에만 저장 (API 없음): 받아 둔 시작 화면 그림 한 장 + 다음 예약 그림 (다음에 열 때 바로 띄우기). 카카오 동의 창 취소 토스트.
열린 질문: 지금 첫 화면은 움직이는 포스터(앱 고정)예요 — 관리자 그림으로 덮을지, 움직임을 영상 · Lottie 로 받을지 (09-onboarding 1장 '앱에 넣는 방식'). 그림 저장소 · CDN · 기기 저장 기간 (Q-O4). 로그인을 카카오 하나로 두면 iOS 심사 4.8 (Q-O11).

### 약관 동의 — `app/onboarding/terms.tsx` (+ `components/onboarding/start-terms.tsx`)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 체크 줄 (만 14세 · 이용약관 · 개인정보 필수 / 이벤트 · 번개 소식 선택) · › 전문 | GET /public/api/v1/consents/app-onboarding (core listAppOnboardingConsents) | existing | ITEMS 고정 4개 · 전문은 '준비 중' 토스트 |
| [동의하고 시작하기] (필수 다 체크해야 켜짐) | POST /me/consents (core submitOnboardingConsents) | existing | state/onboarding.ts agreed (지금은 기기에만) |

열린 질문: 선택 동의(이벤트 · 번개 소식)를 설정 › 알림 광고 동의(GET · PATCH /me/settings)와 같은 값으로 묶는 방법 — 동의 이력(/me/consents)이 기준인지, settings 시각인지. 지금 앱은 동의 제출을 가입 끝까지 미뤄요(뒤로 가면 다시 고칠 수 있게) — 서버는 시트를 닫을 때 바로 받아도 돼요.

### 닉네임 — `app/onboarding/nickname.tsx` (+ `components/onboarding/start-nickname.tsx` · `start-stage.tsx`)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 카카오 이름 미리 채우기 (규칙에 안 맞으면 빈칸) | 카카오 SDK 프로필 (서버 없음) | — | state/onboarding.ts nickname '서현' (가짜) |
| 입력하는 동안 중복 확인 (0.4초 뒤) | GET /members/nickname-check?q= | new | start-nickname.tsx TAKEN (가짜) |
| 저장 (가입 끝에 한 번) | PATCH /me/profile nickname (my updateMyProfile) | change (2~10자 · 한글/영문/숫자 · 중복 409) | finishOnboarding → updateMe({name}) |

### 캐릭터 고르기 — `app/onboarding/character.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 몸 색 7가지 중 하나 → 마이 캐릭터 기본 몸 색 | POST /onboarding palloloCode (가입 끝에 · 목록은 GET /asset-catalog) | existing | state/onboarding.ts color · state/avatar.ts setAvatarBody |

몸 그림 7장은 앱 번들 (서버 없음). PUT /me/avatar(my saveMyAvatar) 는 쓰지 않아요 — 가입 때 고른 색은 무료로 가진 목록에 더해야 해서 completeOnboarding 이 같이 해요.

### 지점 회원이에요? — `app/onboarding/member.tsx`
서버 호출 없음. 고른 길(member · trial · app)은 POST /onboarding path(MEMBER · TRIAL · APP) 로 가입 끝에 보내요 (state/onboarding.ts path).

### 지점 연동 요청 (회원) — `app/onboarding/link.tsx` (+ `components/onboarding/branch-sheet.tsx` · `link-consent.tsx` · `parts.tsx`)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 지점 칸 → 지점 목록 시트 (검색 · 권역 칩 · 이미 연동 · 요청 중은 못 고름) | GET /me/branch-link-requests/branches (my listLinkableBranches) | change (region) | data/account.ts BRANCHES · BRANCH_REGIONS |
| 이름(지점에 등록한 이름 2~20자) · 휴대폰(로그인 번호 미리 채움) · [필수] 정보 보내기 동의 | (아래 보내기에 같이) | — | state/onboarding.ts realName · phone · data/trial.ts isPhone · formatPhone |
| [연동 요청 보내기] → 확인 중 화면 | POST /me/branch-link-requests {branchCode, name, phone, consent} (my createBranchLinkRequest) | change (name · phone · consent 추가 · note 선택) | 지금은 값만 쌓아요 (가짜) |

열린 질문: 휴대폰을 로그인 때 받은 번호로 채우려면 카카오 로그인에서 번호를 받아 GET /me 에 실어야 해요 (지금 Me 에 phone 없음). 이름 · 번호가 둘 다 같으면 매니저 없이 바로 연동할지 (Q-O7).

### 지점에서 확인 중 — `app/onboarding/link-wait.tsx` (+ `components/onboarding/link-tracker.tsx` · `start-palloro.tsx`)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| '○○점에 연동을 요청했어요!' · 진행 표시(요청 보냄 시각 → 확인 중 → 연동 완료) | POST 응답 (createdAt · branchName) · 다시 열면 GET /me/branch-link-requests | new | nowHHMM() · state/onboarding.ts branch |
| [시작하기] (안드로이드 뒤로도) → 가입 끝 → 홈 | POST /onboarding {path: MEMBER, member{branchCode, realName, phone}, palloloCode} | existing | state/onboarding.ts finishOnboarding (link 'pending' · role 'guest') |

지점이 처리하면: 푸시 + 알림함 맨 위 알림(BRANCH_LINK_APPROVED → /my · BRANCH_LINK_REJECTED → /link-rejected) → GET /me · GET /me/branch-summary 다시 (core listMyNotifications · getMe). 앱 흉내: state/link-events.ts receiveLinkResult · components/home/link-admin-dev.tsx(개발용).
열린 질문: 24시간 넘게 안 되면 '조금 늦어지고 있어요' 문구로 바꾸려면 서버가 늦음 여부를 줘야 해요(createdAt 으로 앱이 계산해도 됨) · 주말 · 휴무일 기준 (Q-O8).

### 연동 안 됨 — `app/link-rejected.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| '○○점에서 회원 정보를 찾지 못했어요' · 지점에서 남긴 말 · 보낸 정보 | GET /me/branch-link-requests (가장 최근 · rejectionReason · name · phone) | new | state/link-events.ts note(REJECT_NOTE_MOCK) · state/onboarding.ts |
| [고쳐서 다시 요청하기] → 연동 요청 화면 (값 미리 채움) | POST /me/branch-link-requests (my createBranchLinkRequest) | change | restartLinkRequest · updateOnboarding({path: member}) |
| [○○점에 전화하기] | 응답 branchPhone | new | BRANCH_TEL_MOCK |
| 지금은 둘러볼게요 → 홈 | 없음 | — | — |

### 체험 예약 (가입) — `app/onboarding/trial.tsx` (+ `components/onboarding/trial-form.tsx` · `trial-slots.tsx` · `branch-sheet.tsx`)
앱 안 체험 예약(`app/trial/index.tsx`, core-screens.md)과 같은 한 장이에요.
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 지점 선택하기 → 지점 목록 시트 (전체 n · 권역 칩) | GET /public/api/v1/branches (core listPublicBranches) | change (region · phone) | data/account.ts BRANCHES |
| 이름 · 휴대폰 (카카오 값 미리 채움) | (보내기에 같이) | — | state/onboarding.ts realName · phone |
| 희망 언어 (하나) — 바꾸면 시간표가 바뀌어요 | GET /public/api/v1/candidate-inquiries/options (core getTrialInquiryOptions) | existing | app-parts.tsx ONB_LANGS |
| 상담 시간: 날짜 5일 → 시간 칸 (지점 · 언어 프로님 일정 · 마감 흐리게) | GET /trial-slots?branchCode= (core listTrialSlots) | existing | trial-slots.tsx TIMES · trialSlots (가짜) |
| 배우고 싶은 이유(여러 개 · 선택) · 전달 사항(200자 · 선택) | (보내기에 같이) | — | WHY_REASONS · note |
| [체험 예약하기] → 예약 확정 | POST /onboarding {path: TRIAL, trial} (core completeOnboarding) | existing | updateOnboarding({...b, path: trial}) |

### 체험 예약 확정 (가입) — `app/onboarding/trial-done.tsx` (+ `components/onboarding/trial-done-view.tsx` · `done-ticket.tsx` · `done-stage.tsx` · `done-notice.tsx`)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| '첫 무대 입장권' (지점 · 날짜 · 시간 · 상담 언어 · 예약자 · 전달 사항) | 서버 호출 없음 — 방금 보낸 값 | — | state/onboarding.ts |
| [앱 둘러보기] (안드로이드 뒤로도) → 가입 끝 → 홈 (홈 맨 위 D-n 체험 카드) | POST /onboarding {path: TRIAL, trial{…}} → GET /me/branch-summary upcomingTrials | new | finishOnboarding → updateMe({trial}) |

### 희망 언어 (앱 구경) — `app/onboarding/langs.tsx` (+ `components/onboarding/app-langs.tsx` · `app-parts.tsx`)
서버 호출 없음 — 여러 개 고른 순서(맨 앞 = 홈 첫 언어)를 가입 끝에 POST /onboarding app.languageCodes 로 보내요. 언어 4개는 앱 고정 (Lang enum).

### 배우고 싶은 이유 (앱 구경) — `app/onboarding/why.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 이유 여러 개 (안 골라도 돼요) | (보내기에 같이) | — | WHY_REASONS · state/onboarding.ts why |
| [앱 둘러보기] → 가입 끝 → 홈 | POST /me/onboarding {path: app, bodyColor, langs, reasons} | new | finishOnboarding (role guest) |

### 고른 지점 안내 (앱 구경) — `app/onboarding/branch.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 지점 이름 · 넘겨 보는 사진 · 소개 · 주소 · 운영 시간 · 스터디 줄('영어 · 일본어 · 7팀') · 연락처 — 지점이 안 적은 줄은 안 그려요 | GET /branches/{branchCode}/guide | existing | api/onboarding.ts fetchBranchPublicGuide (가짜: mockBranchPublicGuide) |
| [전화] | (위 응답 phone) | — | lib/open-out openTel |
| [앱 둘러보기] → 가입 끝 → 홈 (안내를 못 받아도 눌러요) | POST /onboarding (APP) | existing | api/use-onboarding.ts useSubmitOnboarding |

### 사용 가이드 5장 — (앱 화면 아직 없음)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 로그인 뒤 홈 전에 (안 본 판일 때만) · 설정 › 도움 › 사용 가이드 다시 보기 | GET /me/guide | new | 없음 |
| [PALLO 시작하기] · [건너뛰기] 기록 | POST /me/guide/views | new | 없음 |

열린 질문: 가이드를 가입 단계 앞 · 뒤 어디에 둘지 (Q-O1) · 대상별로 나눌지 (Q-O2) · 알림 허용 · 환영(+50 스파크)을 어디에 끼울지 (Q-O9 — 지금 앱은 세 길 모두 바로 홈).

### 회원 · 비회원 권한 (여러 화면) — `state/access.ts` · `state/lock-hits.ts` · `components/common/trial-guide.tsx` · `member-lock.tsx` · `scroll-lock.tsx` · `upsell-sheet.tsx` · `trial-booking.tsx`
| 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 누구인지(회원 · 연동 대기 · 못 찾음 · 체험 예약 · 비회원) | GET /me (memberAccessLevel) · GET /me/branch-summary (core getMe) | existing | state/access.ts userKind · canUse · api/use-branch-progress.ts |
| 회원 전용을 누르면 체험 안내 시트 · 토스트 | 없음 (앱) — 서버도 회원 전용 API 에서 403 member_only | — | trial-guide.tsx guardMember · memberGate |
| 체험 예약 내용 시트 (지점 · 날짜 · 시간 · 언어 · 전달 사항 · 지점 전화) | GET /me/branch-summary upcomingTrials (전달 사항은 아직 없음 · 지점 전화는 늘 null) | change | api/use-branch-progress.ts trial · state/onboarding.ts note · BRANCH_TEL_MOCK |

기기에만 저장 (API 없음): 스크롤로 잠김 칸을 본 수(3 · 6 · 9 … 번째면 '체험해 보시겠어요?' 권유 시트 · 앱을 켠 동안만) · 시트 한 번에 하나(state/lock-hits.ts) · 가입 중 고른 값(state/onboarding.ts — 끝나면 서버로) · 방금 한 체험 예약(state/trial-booking.ts — 확정 화면용) · 연동 결과 '톡 튀어나오는 순간'을 봤는지(state/link-events.ts homeMoment · myMoment).
열린 질문: 비회원(role guest)에게 로그아웃 · 탈퇴 입구를 어디에 둘지 (설정이 잠겨 있어요). 체험 예약 변경 · 취소 API — 지금은 '지점에 전화'뿐. 요청 취소(A23 DELETE /me/branch-link-requests/{id}) 는 앱 버튼이 없어 넣지 않았어요.

<a id="learn"></a>

## 학습 (learn) — 화면별 API

진도 키 모양 (앱 그대로, 서버도 같은 키를 써 주세요): 교재 `레벨:과:단계` (`1:1:pat`), 상황 장면 `맵 id:장면 번호:단계` (`travel:1:mis`), 장면 도장 `scene:장면 id`, 보상 상자 `레벨:과`.
과 id (경로의 `lessonId` · `/lessons/{id}`): 교재 `레벨-과` (`1-1` · `3-101`), 장면 `맵 id-장면 번호` (`travel-1`).

### 라이브러리 탭 — `app/(tabs)/library.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 스터디 맵 섬 · 과 카드 (언어별 책장) | GET /library/books | new | data/library.ts BOOKS · data/library-lessons.ts STUDY_LEVELS |
| 상황 맵 칩 · 3D 섬 · 장면 카드 · 곧 열림 칩 | GET /library/maps | new | data/maps/situation-maps.json |
| 섬 진도 (3/20과) · 이어서 하기 · 장면 도장 | GET /me/progress | new | state/progress.ts (done · last) |
| 과 시트 · 단계 팝업 (components/library/lesson-sheet.tsx · step-popup.tsx) 멈춘 곳 '3/9까지' | GET /me/progress?lesson= | new | state/progress.ts pos · posOf |

기기에만 저장 (API 없음): 고른 언어 · 스터디/상황 탭 · 고른 맵 · 고른 섬 (components/library/library-state.ts), 새 맵 본 표시 `seen` (NEW 끄기).
열린 질문: '열리면 알림 받기' (교재 없는 언어 · 곧 열릴 맵)는 지금 토스트뿐 — 알림 신청 API 가 필요한지. `opensAt` 비교를 기기 날짜로 할지, 서버가 `locked` 를 계산해 줄지.

### 교재 소개 (잠긴 교재) — `app/book/[id].tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 표지 · 소개 · 목차 미리 보기 | GET /library/books (같은 응답 · `toc` · `about` 추가) | new | app/book/[id].tsx TOC_EN · TOC_JA 고정 |
| 이 레벨 상담 신청 → 체험 신청 | (체험 도메인) | — | app/trial/* |

### 과 화면 — `app/unit/[id].tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 표지 · 제목 · 오늘의 패턴 요약 · 단계 카드 | GET /library/books (study.lessons[].data) | new | data/library-lessons.ts |
| 단계 카드 다음 · 이어서 · 체크 | GET /me/progress?lesson= | new | state/progress.ts |
| Lv.3 · 4 회차 자료 PDF 받기 | POST /materials/textbooks/{id}/downloads | existing | components/library/unit-parts.tsx PDF_FILES (앱에 든 PDF) |
| 리스닝 룸으로 | (리스닝 룸) | — | — |

열린 질문: 회차 PDF 를 백엔드 Textbook 으로 등록해 `pdf.textbookId` 를 실어 줄 수 있는지 (그러면 기존 다운로드 API 그대로).

### 리스닝 룸 — `app/listening.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 문장 목록 (?unit · ?level · ?map · ?key) | GET /library/listen-items | new | data/library-listen.ts LISTEN_ITEMS · data/situation.ts localSceneListenItems |
| 원어민 음원 재생 | ListenItem.audioUrl (#25 /audio 대신) | new | 기기 TTS expo-speech (components/library/listen-player.ts) |
| 문장 저장 · 빼기 | POST · DELETE /learning/expression-notes | change · existing | state/expressions.ts toggleExpression |
| 제목 | GET /library/books · GET /library/maps | new | — |

기기에만 저장 (API 없음): 리스닝 설정 (자동 · 순서 · 간격 · 반복 · 속도 · 가리기 · 섞기, components/library/listen-prefs.ts) — 설정 도메인(#30 `/me/settings` listenPrefs)으로 옮길지는 설정 쪽에서 결정. 소리 끄기 15분 (state/learn-prefs.ts).

### 레슨 Lv.1 · 2 — `app/lesson/[step].tsx`
(components/lesson/** : task-runner · shadow · order · role · build · match · answer · pick · sit-view · story-view · talk-view · quiz-view · chal-view · celebrate)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 과 콘텐츠 받기 (LessonData) | GET /lessons/{id} | new | data/lesson-lv1.ts LV1_01 · data/lesson-lv2.ts LV2_01 |
| 단계 열 때 마지막 단계 남기기 | PUT /me/progress/last | new | state/progress.ts setLastStep |
| 문제 넘길 때 · 그만둘 때 멈춘 곳 · 화면 상태 · 쓴 내용 | PUT /me/progress/{lessonId}/steps/{stepId} | new | state/progress.ts savePos · saveSnapshot · setStepData |
| 처음 답변 저장 (복습 비교) | PATCH /me/answers/{lessonId} | new | components/lesson/answer-task.tsx setStepData |
| 단계 끝 → 포인트 · 빠른 답 보너스 · 오늘 목표 · 다음 단계 | POST /me/progress/{lessonId}/steps/{stepId}/complete | new | components/lesson/use-step-finish.ts · state/ledger.ts · state/today-goal.ts |
| AI 프리토킹 (talk) · Lv.2 상황 역할극 (sit · act) | POST /ai/talk | new | 대본 D.talk · D.act + lib/words.ts gradeTalk · fixSentence |
| 30초 챌린지 채점 | POST /ai/feedback (kind chal) | new | components/lesson/chal-view.tsx (패턴 정규식) |
| 따라 말하기 · 스피킹 퀴즈 채점 | (기기 음성 인식 + 앱 채점) · 선택 POST /speech/recognize | new | lib/speech.ts · lib/words.ts matchSpeech · gradeWords |
| 표현 저장 · 빼기 | POST · DELETE /learning/expression-notes | change · existing | components/lesson/bubbles.tsx · shadow-task.tsx |

Lv.1 상황 활동(그림 속 인물 → 단어 카드 대화)은 대본을 맞추는 거라 AI 가 필요 없어요. 그림은 `photoUrl` 로 받아야 해요 (지금 앱에 든 jpg).
기기에만 저장 (API 없음): 말하기가 어려워요 · 소리 끄기 15분 (state/learn-prefs.ts) — A17 결정 전까지.

### 레슨 Lv.3 · 4 — `app/lesson34/[step].tsx`
(components/lesson34/** : runner · corners · pages/dtalk · free2 · blocks/say · misc · match · fill · finish · store)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 회차 콘텐츠 받기 (Unit34) | GET /lessons/{id} | new | data/lesson34-lv3.ts LV3_101 · data/lesson34-lv4.ts LV4_101 · LV4_HW |
| 마지막 단계 · 멈춘 곳 | PUT /me/progress/last · PUT /me/progress/{lessonId}/steps/{stepId} | new | state/progress.ts · components/lesson34/store.ts saveRun (실행 동안만) |
| 앞 코너 답 이어 받기 (별표 질문 · 대화 답 · 저널 · Before/After · 내 입장 · FREE TALK 말) | GET · PATCH /me/answers/{lessonId} | new | components/lesson34/store.ts (ans · after · side · talk) |
| 짝 맞추기 최고 기록 | POST …/complete (best) · GET /me/progress | new | components/lesson34/store.ts setBest |
| 단계 끝 → 포인트 · 오늘 목표 · 다음 단계 | POST /me/progress/{lessonId}/steps/{stepId}/complete | new | components/lesson34/finish.tsx |
| AI 대화 DAILY TOPIC · FREE TALK 1:1 · DEBATE 3라운드 · FOLLOW-UP | POST /ai/talk | new | pages/dtalk.tsx · pages/free2.tsx · corners.ts · blocks/misc.tsx (대본) |
| AI 교정 · 칸 나누기 · SAY IT BETTER · 토론 점수 + MVP · 질문 날카로움 · 일기 정리 | POST /ai/feedback | new | components/lesson34/text.ts aiFix · polishLive · splitAnswer · upgradeOf · polish |
| 표현 저장 (JOURNAL 자동 저장 포함) | POST · DELETE /learning/expression-notes | change · existing | components/lesson34/ui.tsx · corners.ts |

⚠ Lv.3 `live` (LiveFix = [RegExp, 함수, 이유])와 `daily[].tw` (RegExp)는 JSON 으로 못 보내요. 제안: 교정은 `/ai/feedback` kind=fix 로 서버에서, 콘텐츠에는 정규식 소스 문자열(`tw`)과 치환 문자열로만 표현되는 `LiveFixRule` 만. 함수가 필요한 규칙 2개(상태동사 -ing · 빈도부사 + -ing)는 JSON 규칙으로 못 옮겨요.

### 상황 장면 — `app/scene/[id]/index.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 맵 · 장면 찾기 | GET /library/maps | new | data/maps |
| 장면 콘텐츠 받기 | GET /lessons/{id} | new | data/situation-content.ts SCENE_CONTENT |
| 단계 체크 · 이어서 · 도장 | GET /me/progress?lesson= | new | state/progress.ts · components/scene/scene-store.ts |
| 처음부터 (멈춘 곳 지우기) | PUT /me/progress/{lessonId}/steps/{stepId} (pos null) | new | state/progress.ts clearPos |

기기에만 저장 (API 없음): 처음 들어와 레벨을 골랐는지 `picked` (components/scene/scene-store.ts).
열린 질문: 상황 퀴즈 레벨(qLv)의 기본값은 `/me` 의 내 레벨(지금 data/situation.ts MY_QUIZ_LEVELS [1, 2] 고정)에서 와야 해요 — /me 에 퀴즈 레벨(0~4)을 둘지. 마지막으로 고른 레벨을 기기에만 둘지 서버에 둘지.

### 상황 장면 단계 — `app/scene/[id]/[step].tsx`
(components/scene/** : mission · flow · bank · quiz · talk · step-frame)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 장면 콘텐츠 | GET /lessons/{id} | new | SCENE_CONTENT |
| 상황 퀴즈 멈춘 곳 (순서 · 결과 · 레벨) | PUT /me/progress/{lessonId}/steps/exq | new | components/scene/scene-store.ts saveQuizPos |
| 단계 끝 → 포인트 · 레벨별 최고 기록 · 다섯 단계 다 끝내면 도장 | POST /me/progress/{lessonId}/steps/{stepId}/complete | new | components/scene/step-frame.tsx · scene-store.ts saveBest |
| AI 미션 대화 (미션 3개 확인 · 고친 문장) | POST /ai/talk (scene-talk) | new | components/scene/talk.tsx · talk-grade.ts missionHits · fixParts |
| 표현 저장 · 고친 문장 저장 | POST · DELETE /learning/expression-notes | change · existing | components/scene/parts.tsx · talk.tsx |

### 홈 스터디 맵 — `components/home/study-map.tsx` · `components/home/skip-sheet.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 정류장 진도 · 지금 정류장 · 과 칩 | GET /me/progress · GET /library/books | new | state/progress.ts · data/library-lessons.ts |
| 정류장 눌러 시작 (처음부터면 멈춘 곳 지우기) | PUT /me/progress/last · PUT …/steps/{stepId} (pos null) | new | state/progress.ts setLastStep · clearPos |
| 구간 건너뛰기 테스트 받기 | GET /me/progress/skip-test | new | 없음 (1.2초 뒤 통과로 흉내) |
| 테스트 제출 → 통과하면 그 구역까지 일괄 완료 · 단계마다 +10P | POST /me/progress/skip-test | new | study-map.tsx pass · data/home.ts SKIP_POINTS |
| 과 보상 상자 열기 (XP · 배지 · 새 단어 · 연속 학습) | POST /me/progress/{lessonId}/chest | new | state/chest.ts (앱 켜 둔 동안만) · data/home.ts chestReward 고정값 |
| 열린 과 (교재가 들어온 과만) | GET /library/books (lessons[].data 유무) | new | components/home/map-state.ts OPEN_UNITS 고정 |

열린 질문: 건너뛰기 테스트 문항 · 통과 기준 (정책 미정). 보상 상자 내용(배지 · 아이템) 규칙.

### 내 표현함 (저장 · 빼기) — 레슨 · 장면 · 리스닝 룸 공통
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 목록 · 저장됨 표시 | GET /learning/expression-notes | change (from · source · fixed · core 추가, en 필터) | state/expressions.ts · data/my.ts SEED_EXPRESSIONS |
| 저장 (첨삭 없이 직접) | POST /learning/expression-notes | change (직접 저장 본문 · 저장된 행 응답) | saveExpression · toggleExpression |
| 빼기 · 빼기 되돌리기 | DELETE /learning/expression-notes/{id} · 다시 POST | existing | removeExpression · restoreExpression |
| 저장한 표현 수 | GET /learning/expression-notes/count | existing | useSavedCount |

열린 질문: 백엔드는 '임의 글이 노트에 못 들어오게' 첨삭 스냅샷에서만 저장해요. 학습 화면 직접 저장을 허용할지, 허용한다면 lessonId 로 콘텐츠 안 문장인지 검사할지.

### 음성 · AI 공통
- 음성 인식은 지금 기기(expo-speech-recognition · 브라우저)로 진짜 돌아가요 — 흉내가 아니에요. 서버 STT · 발음 점수(#26 POST /speech/recognize)는 화면이 아직 부르지 않아요 → 폴백 · 발음 점수가 필요한지 결정 필요.
- 흉내 내는 곳: AI 대화 응답 (콘텐츠 대본 lines/replies 순서대로), 대화 평가 (lib/words.ts gradeTalk), 교정 (lib/words.ts fixSentence · text.ts aiFix · polishLive · talk-grade.ts fixParts), 칸 나누기 · 업그레이드 · 토론 점수 · 날카로움 · 일기 정리 (text.ts · corners.ts · blocks/misc.tsx).
- 백엔드 AI 첨삭(/learning/corrections, SSE 스트림 포함)은 '첨삭 받기' 화면용 — 기록에 남고 두 번 불러야 해서 레슨 실시간 교정엔 그대로 못 써요. 내부 AIConnection 재사용은 가능. 오늘의 회화 챌린지(/learning/daily-challenge)는 이 화면들과 관계없어요 (30초 챌린지 단계는 과 콘텐츠 chal).
열린 질문: /ai/talk 를 동기 한 번으로 할지 SSE 스트림으로 할지 (응답 시간). AI 실패 시 앱은 대본 · 규칙으로 계속 진행 — 그 경우 포인트는 그대로 주는지.

### 진도 · 보상 공통 규칙 (서버가 계산)
- 단계 포인트는 처음 끝낼 때만 (Lv.1 · 2 pat 5 · dlg 10 · bank 5 · sit 15 · story 15 · talk 15 · quiz 10 · chal 10, Lv.3 · 4 · 장면은 data/library.ts STUDY_STEPS · data/situation.ts SCENE_STEPS). 포인트표는 관리자 웹에서 — 원하면 /library/books `study.steps` 로 앱에 내려 주세요.
- 빠른 답 보너스 (Lv.1 · 2): speed = round(xp × 0.5 × fast / timed), 지난 최고보다 큰 만큼만.
- 장부 이벤트 id 로 중복 지급 방지: `step:{키}` · `speed:{키}:{speed}` · `skip:{키}` (state/ledger.ts). 랭킹 · 장부 조회(/me/rewards)는 랭킹 · 보상 도메인.
- 오늘 목표 2개 · 같은 단계 하루 한 번 · 장면 도장은 안 셈 · 날짜는 서버(자정 기준).
- 백엔드 /materials/textbooks/{id}/quiz-sets/{setNumber}/activities/{activity} (PATTERN · DIALOGUE · WORD_BANK 완료)가 Lv.1 · 2 예습 pat · dlg · bank 완료와 같은 개념이에요. 새 진도 API 를 만들 때 같은 테이블로 합칠지 결정 필요 (포인트 · 오늘 목표 · 멈춘 곳은 그 API 에 없어요).

<a id="lounge"></a>

## 라운지 · 번개 · 동아리 · 해외 동행 — 화면별 API

용어: 앱 '번개' = 백엔드 hangout, 앱 '정기 모임' = 백엔드 club meeting. 경로는 모두 `/app/api/v1` 아래.
삭제 후 [되돌리기] 토스트가 있는 곳(글 댓글 · 스토리 · 게시판 글 · 인사말)은 앱이 토스트가 사라진 뒤에 DELETE 를 보내요 → 복구 API 없음.

### 라운지 탭 — `app/(tabs)/lounge.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 추천 탭 피드 (전체 = 최신순 · 인기 = 최근 7일 하트 순, 지금은 커뮤니티 글만 — 순서는 서버가 정함) | GET /community/posts/recommended?pick=ALL\|HOT&branch= | existing | useRecommendedFeed |
| 추천 탭에 번개 · 파티 · 챌린지 섞기 (번개 상세 연동 뒤) | (추천 API 응답 확장) | new | — |
| 추천 탭 작은 한국 지도 숫자 (지금은 숨김) | GET /lounge/map | new | data/lounge.ts MAP_SPOTS |
| 탭 '새 글' 배지 (커뮤니티 · 챌린지 · 번개·동아리, 지점 필터 없음 · 9+) — 탭별 마지막 본 때를 앱이 보내면 그 뒤로 생긴 수 | GET /lounge/unread-counts?com=&chal=&meet= | new | api/use-lounge-new-counts.ts (가짜 서버 셈) |
| 커뮤니티 탭 (칩 전체 · 일상 · 스터디 · 이벤트 · 여행 · 동아리 · 번개, 지점 필터) | GET /community/posts?topic=&branchCodes= | change | FEED (k=post) |
| 지점 선택 시트 후보 | GET /hangouts/branches | change | LG_BRS · LG_BREG |
| 해외 동행 탭 · 세계 지도 숫자 | GET /lounge/world-map?mode=live\|trip | new | trip.tsx useCountryCounts |
| 해외살이 · 여권 카드 줄 | GET /abroad-profiles | new | LG_PEOPLE |
| 해외살이 이야기 | GET /community/posts?category=OVERSEAS_LIFE&countryCode= | change | FEED (k=abroad) |
| 여행 동행 · 탑승권 카드 | GET /trips?countryCode= | new | FEED (k=trip) |
| 챌린지 탭 본문 | (챌린지 도메인) | — | components/challenge |
| 번개 · 동아리 탭 본문 | 아래 '번개 · 동아리 탭' | — | components/meet/meet-tab.tsx |
| + 버튼 '무엇을 만들까요?' | 없음 (각 화면으로 이동만) | — | components/lounge/create-sheet.tsx |

기기에만 저장 (API 없음): 탭마다 마지막으로 본 때(새 글 배지 기준 · 서버 시계로) · 보던 탭 · 서브 칩 · 고른 지점(실행 중만 — 이벤트 탭 갔다 와도 유지) · 세계 지도에서 고른 나라 · 추천 지도에서 고른 지역 · 맨 위로 버튼.

### 글 카드 — `components/lounge/post-card.tsx` (피드 · 글 하나 보기 공통)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| ♡ 좋아요 · 사진 두 번 탭(켜기만) | POST /community/posts/{postId}/like (본문 {liked}) | change | lounge-store liked · toggleLike · likeOn |
| 좋아요 누른 사람 시트 (30명 + 외 N명) | GET /community/posts/{postId}/likes | new | LG_LIKERS |
| 저장 (라운지 저장함) | POST /community/posts/{postId}/bookmark | existing | lounge-store saved |
| 💬 댓글 창 · 답글 · 수정 · 삭제 · 댓글 ♡ | GET · POST /community/posts/{postId}/comments · PUT · DELETE …/comments/{commentId} · POST …/like | existing | LG_CMTS · cmts |
| ⋯ 공지로 고정 (프로 · 지점 관리자) | POST · DELETE /community/posts/{postId}/pin | new | 토스트만 |
| ⋯ 이 글 숨기기 [되돌리기] (프로 · 지점 관리자) | POST · DELETE /community/posts/{postId}/hide | new | hideMember (사람 단위) |
| ⋯ 신고 · 차단 | POST /reports (live) · POST /blocks · DELETE /blocks/{memberCode} | new | report-sheet.tsx |
| 해외살이 카드 '○○에게 질문하기' | POST /members/{code}/questions | new | AskSheet (토스트만) |
| 보내기(링크 복사) | 없음 — 앱이 공유 링크를 만들어요 | — | 토스트만 |

열린 질문: '이 글 숨기기'가 글 하나인지, 그 사람 글 전부인지(지금 앱은 사람 단위로 숨겨요). 공지 고정 개수 제한.

### 글 하나 보기 — `app/post/[id].tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 글 불러오기 (차단 · 숨김이면 '글을 볼 수 없어요') | GET /community/posts/{postId} | change | lounge-store useItem |
| 조회수 기록 (처음 한 번) | POST /community/posts/{postId}/view | existing | 없음 |
| 좋아요 · 댓글 · 신고 · 차단 | 글 카드와 같아요 | — | — |

### 글쓰기 — `app/compose.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 사진 올리기 (최대 10장 · 원본 20MB · 긴 변 1080px JPEG) | POST /uploads/images/community-post-image (공통) | existing | 기기 uri 그대로 |
| [올리기] (주제 · 본문 · 사진 · 비율) | POST /community/posts | change | addPost |

기기에만 저장 (API 없음): 사진 자르기(확대 · 위치)는 올리기 전에 앱이 잘라요 → 서버엔 잘린 사진만.
열린 질문: 앱에 제목 칸이 없어요 — title 을 선택으로 할지, 서버가 본문 앞부분으로 채울지. 앱 글은 BRANCH_LOUNGE + PUBLIC 로 보내도 되는지.

### 스토리 줄 — `components/lounge/story-row.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 내 스토리 · 사람별(24시간) · 카테고리 하이라이트 (안 본 것 먼저, 매니저 고정 맨 앞) | GET /stories/tray?branchCodes= | new | STORIES · userGroups · highlightCats |

### 스토리 보기 — `app/story/[id].tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 묶음 넘겨 보기 (id = u:코드 · c:카테고리) | GET /stories/tray (받아 둔 것) | new | storyGroups |
| 스토리 id 로 바로 들어옴 (알림) | GET /stories/{storyId} | new | stories |
| 본 표시 | POST /stories/{storyId}/views | new | markSeen |
| ♡ | POST /stories/{storyId}/like | new | sliked |
| '○○에게 댓글 달기' · 💬 전체 댓글 (답글 · 수정 · 삭제 · ♡) | GET · POST /stories/{storyId}/comments · PUT · DELETE …/{commentId} · POST …/like | new | STORY_CMTS · scmts |
| '답장 보내기' (올린 사람에게만, 앱 화면 아직 없음) | POST /stories/{storyId}/reply | new | 없음 |
| 내 스토리 [지우기] | DELETE /stories/{storyId} | new | dropStory |
| 매니저 [고정하기 / 고정 풀기] | PUT · DELETE /stories/{storyId}/pin | new | setStoryPin |
| 매니저 [내리기] | POST /stories/{storyId}/takedown | new | dropStory |
| 번개 · 파티 스토리 [참여하기] | 없음 (/events/{id} 로 이동) | — | Story.meet |

기기에만 저장 (API 없음): 5초 자동 넘김 · 누르고 있으면 멈춤.
열린 질문: 비공개 답장은 어디서 읽나요(알림함 · 1:1 메시지)? 스토리 사진 업로드 purpose(STORY_PHOTO 를 새로 둘지).

### 스토리 올리기 — `app/story/new.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 사진 (선택) | POST /uploads/images/{purpose} (공통) | existing | 기기 uri |
| [스토리 올리기] (카테고리 · 한 줄 · 커뮤니티에도 · 매니저 고정) | POST /stories | new | addStory (+ addPost) |

### 번개 · 동아리 탭 — `components/meet/meet-tab.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 한국 지도 지역별 숫자 · 지역 고르기 | GET /lounge/map | new | regionCounts |
| 날짜 줄 · 5주 달력 배지 | GET /hangouts (응답 dayCounts) | change | MEETS |
| 번개 카드 줄 (지역 · 날짜 · 지점) | GET /hangouts?region=&date=&branchCodes=&when=upcoming | change | MEETS · myMeets |
| 지난 번개 줄 | GET /hangouts?when=past | change | isPast |
| 동아리 목록 (카테고리 · 정렬 추천/멤버 많은/새로 생긴 · 더보기) | GET /clubs?category=&region=&sort= | change | CLUBS · clubX |

기기에만 저장 (API 없음): 전체/번개/동아리 칩 · 지난 번개 펼침.

### 번개 상세 — `app/meet/[id].tsx` (+ `components/meet/detail/*`)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 상세 · 함께하는 멤버(인사말) | GET /hangouts/{id} | change | findMeet · membersOf · DESC |
| 확인 체크 → [참여 신청하기] (승인제 · 확정 전엔 가게 이름 · 주소 대신 시 · 구 · 역) | POST /hangouts/{id}/participants | existing | meet-store askJoin |
| [수락 기다리는 중] → 신청 취소 · [참여 확정] → 참여 취소 | DELETE /hangouts/{id}/participants/me | existing | meet-store leaveMeet |
| 호스트: '참여 신청 N명' 목록 | GET /hangouts/{id}/join-requests | existing | meet-store reqs |
| 호스트: [수락] · [거절] (사유 고르기 필수 — 정원·일정 / 조건 안 맞음 / 기타 직접 쓰기) | POST /hangouts/{id}/join-requests/{participantId}/approve · reject (reasonCode) | existing | meet-store decideReq · components/meet/detail/reject-sheet.tsx |
| 신청자: 응답 기한 · 거절 사유 문구 · 다시 신청 가능 여부 (재신청 1번 · 24시간 · 시작 3시간 전 마감) | GET /hangouts/{id} (viewerRequestExpiresAt · viewerRejectReason · viewerCanReapply) | existing | components/meet/join-rules.ts |
| 내 인사 남기기 · 고치기 · 지우기 | PUT · DELETE /hangouts/{id}/participants/me/greeting | new | mhi |
| 호스트 [모집 닫기] [되돌리기] | POST · DELETE /hangouts/{id}/close | new | updateMyMeet(closed) |
| 꽉 참 → [빈자리 알림 받기] | POST · DELETE /hangouts/{id}/waitlist | new | vac |
| 찜 하트 | POST /hangouts/{id}/bookmark | new | saved |
| 지난 번개 [후기 보기] (댓글 · 수정 · 삭제 · ♡) | GET · POST /hangouts/{id}/comments · PUT · DELETE …/{commentId} · POST …/like | existing | REVIEW_SEED |
| 공유 · 주소 복사 | 없음 | — | — |

열린 질문: 참여자 지점을 누구에게 보여 주나요(문서: '호스트에게만 내 지점이 보여요')? 모집 닫기와 취소(CLOSED)를 상태로 어떻게 나눌지.

### 번개 열기 — `app/meet/new.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 지역 지도에서 장소 고르기 | GET /places?region= | new | PLACE_SPOTS (components/event/form-parts.tsx) |
| 포스터 올리기 (최대 10장) | POST /uploads/images/hangout-photo (공통) | existing | 기기 uri |
| [번개 열기 · 지도에 표시] | POST /hangouts | change | addMyMeet |

열린 질문: 날짜 범위 — 앱 코드는 7일, 문서는 14일. 소개(description) 칸이 앱 폼에 없어요(선택으로 바꾸거나 앱에 칸 추가).

### 동아리 상세 — `app/club/[id].tsx` (+ `components/meet/club/*`)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 상세 (홈 탭 · 아래 고정 '최근 30일 N명 가입') | GET /clubs/{id} | change | findClub · clubX · HOST_INTRO |
| 홈 · 멤버(인사말 · NEW · 코호스트) | GET /clubs/{id}/members | change | membersOf · clubStaff |
| 홈 · 다가오는 정기 모임 4회 | GET /clubs/{id}/meetings?upcoming=true&limit=4 | change | clubSessions |
| 홈 · 일정 목록 12주 (schedule.tsx) | GET /clubs/{id}/meetings?upcoming=true&limit=12 | change | clubSessions(12) |
| [일정 만들기] (호스트 · 코호스트 · 운영 중일 때만) — 제목 · 날짜 · 시작/끝 · 정원(무관 가능) · 장소 · 메모 → 멤버 모두 알림 | POST /clubs/{id}/meetings | change (endTime · 장소 선택 · 인원 무관 · 코호스트) | meet-store.ts addSched · session-new.tsx |
| 홈 · 같은 카테고리 추천 | GET /clubs?category= | change | CLUBS |
| 가입하기 / 가입 신청 (club-join.tsx) | POST /clubs/{id}/members | change | setClubState |
| 가입 인사 남기기 · 고치기 · 지우기 | PUT · DELETE /clubs/{id}/members/me/greeting | new | greet |
| 나가기 · 신청 취소 (정기 모임 참석도 취소) | DELETE /clubs/{id}/members/me | change | setClubState(null) |
| 찜 하트 | POST /clubs/{id}/bookmark | new | saved |
| 코호스트 정하기 (앱 화면 아직 없음) | PUT /clubs/{id}/staff | new | clubStaff |
| 게시판 (칩 · 필독 공지 · 비멤버 2개 미리보기) | GET /clubs/{id}/board-posts | change | CLUB_CONTENT.posts · board |
| 게시판 글쓰기 (호스트는 공지) | POST /clubs/{id}/board-posts | change | setBoard |
| 내 글 삭제 [되돌리기] | DELETE /clubs/{id}/board-posts/{postId} | existing | setBoard |
| 글 ♡ | POST · DELETE /clubs/{id}/board-posts/{postId}/likes | existing | bliked |
| 글 댓글 | GET · POST /clubs/{id}/board-posts/{postId}/comments | existing | BoardPost.cm |
| 사진첩 (비멤버 6장 흐리게) | GET /clubs/{id}/photos | new | CLUB_CONTENT.album |
| 채팅 (지난 메시지 · 비멤버 4줄 · 공지 고정) | GET /clubs/{id}/chat/messages + WS /topic/clubs/{id}/chat | new | CLUB_CONTENT.chat · chat |
| 채팅 보내기 | POST /clubs/{id}/chat/messages | new | setChat |

기기에만 저장 (API 없음): 보던 탭(홈 · 게시판 · 사진첩 · 채팅) · 탭별 스크롤 자리.

### 정기 모임 회차 시트 — `components/meet/club/session-sheet.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 회차 상세 · 참석 멤버 한마디 | GET /clubs/{id}/meetings/{meetingId} | change | clubSessions · sessionMembers |
| 만든 일정 고치기 · 취소 (참석 멤버 알림) | PUT · DELETE /clubs/{id}/meetings/{meetingId} | change | meet-store.ts removeSched |
| 참석하기 | POST /clubs/{id}/meetings/{meetingId}/participants | existing | att |
| 참석 취소 | DELETE /clubs/{id}/meetings/{meetingId}/participants/me | existing | att |
| 한마디 남기기 · 지우기 | PUT · DELETE /clubs/{id}/meetings/{meetingId}/participants/me/one-liner | new | shi |
| 빈자리 알림 | POST · DELETE /clubs/{id}/meetings/{meetingId}/waitlist | new | vac |
| [가입하고 참석하기] | POST /clubs/{id}/members 후 참석 | — | — |

열린 질문: 정기 모임을 방장이 회차마다 만들지(지금 백엔드) vs 동아리 요일 · 시간으로 서버가 자동 생성할지(지금 앱 흉내). 회차 번호 · 주제는 누가 정하나요.

### 동아리 만들기 — `app/club/new.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 포스터 올리기 | POST /uploads/images/club-photo (공통) | existing | 기기 uri |
| [승인 요청하기] → 승인 대기 카드 (요일 · 시간 칩 meetTime · 최대 인원 스테퍼 3~40 maxMembers) | POST /clubs | change | addMyClub · TIMES · Stepper |
| 내 신청 카드 (검토 중 1~3일 · 거절 이유 · 다시 보내기 · 지우기) · 호스트 기록 · 운영 규칙 상자 | GET /me/club-applications | new | meet-store.ts myClubs · hostLog · data/host-rules.ts |

열린 질문: 동아리를 지점 · 지역에 묶을지(지금 백엔드는 전역 — 앱은 지점 · 지역 필터와 지도 숫자에 써요). 앱 폼에 '소개(description)' 칸이 없어요. 가입 조건 'Lv.2 이상 · 수강생만'을 서버가 검증할지, 표시 + 승인제로만 둘지. 매니저 승인은 콘솔(apphub) 몫 — 앱에는 승인 화면이 없어요.

### 여행 동행 신청 — `app/trip/[id].tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 동행 정보 (알림으로 들어오면) | GET /trips/{tripId} | new | useItem |
| 안전 수칙 4개 체크 + 소개 → [동행 신청하기] | POST /trips/{tripId}/applications | new | setTripState('wait') · LG_SAFE |

### 해외 동행 카드 · 시트 — `components/lounge/trip.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 세계 지도 숫자 | GET /lounge/world-map | new | useCountryCounts |
| 동행 구하기 (TripMakeSheet) | POST /trips | new | addTrip |
| 내 동행 [모집 닫기] [되돌리기] | POST · DELETE /trips/{tripId}/close | new | closeTrip |
| [수락 기다리는 중] → 신청 취소 | DELETE /trips/{tripId}/applications/me | new | setTripState(null) |
| [오픈채팅 열기] | 없음 (Trip.openChatUrl 로 이동) | — | 토스트만 |
| 내 동행에 온 신청 보기 · 수락 (앱 화면 아직 없음) | GET /trips/{tripId}/applications · POST …/{applicationId}/accept | new | setTimeout 예시 수락 |
| 나도 해외에 있어요 (AbroadRegSheet) | PUT /me/abroad-profile | new | addPerson |
| 내 카드 내리기 | DELETE /me/abroad-profile | new | removeMyPerson |
| '○○에게 질문 보내기' (PersonSheet) | POST /members/{code}/questions | new | 토스트만 |

열린 질문: 오픈채팅 링크는 동행 만들 때 받나요(앱 폼에 칸 추가 필요), 수락할 때 받나요? '○○에게 질문하기'는 어디로 가나요(알림 · 1:1 메시지)?

### 신고 · 차단 시트 — `components/common/report-sheet.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 신고 사유 고르기 | GET /reports/reasons | live | api/reports.ts (REPORT_REASON 마스터데이터) |
| 신고하기 | POST /reports | live | api/reports.ts · 내 신고 내역은 아직 reportStore(기기) |
| 차단하기 (사유 6개) [되돌리기] | POST /blocks · DELETE /blocks/{memberCode} | new | blockStore |
| 차단한 사람 글 · 스토리 숨기기 | 서버가 모든 라운지 목록에서 빼요 (앱 필터 없앰) | — | useBlockedNames · useIsBlocked |

다른 도메인 몫: 차단 목록 보기 `GET /blocks` · 내 신고 내역 `GET /me/reports` (설정 화면, me 도메인).
열린 질문: 차단을 회원 코드로 하나요(지금 앱은 이름)? 같은 대상 중복 신고 처리.

### 화면 없음 · API 불필요
- `components/lounge/create-sheet.tsx` · `route-sheet.tsx` · `section.tsx` · `lg-*` · `icons.tsx` · `face.tsx` · `pics.tsx` · `map-parts.tsx` · `components/meet/poster.tsx` · `album-art.tsx` · `parts.tsx` · `korea-paths.ts` — 그리기만.
- `data/lounge-maps.ts` — 지도 윤곽(정적).

<a id="community2"></a>

## community2 — 챌린지 · 이벤트 화면별 API

백엔드: 챌린지는 `MobileChallengeController` (`/challenges`) 가 일상 챌린지 뼈대(목록 · 상세 · 참여 · 인증 · 좋아요 · 인증 댓글)를 이미 가지고 있어요. 이벤트는 백엔드에 아예 없어요 (`api/app` 어디에도 event 없음) → 모두 new.

### 라운지 '챌린지' 탭 — `components/challenge/challenge-tab.tsx` (라운지 `app/(tabs)/lounge.tsx` 안)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 핫 TOP3 · 표현 챌린지 줄 · 참여 중 · 진행 중 · 곧 시작 보기 | GET /challenges?kind=&category=&branch= | change | data/challenge.ts CHALLENGES · hotScore · isPre |
| 표현 필터 검색 (표현 · 뜻 · 예문 · 연 사람 · 출처) | GET /challenges?kind=expression&q= | change | challenge-tab.tsx ExprSearch |
| 카드 [오늘 인증] → 인증 시트 | POST /challenges/{id}/verifications | change | addCheckin |
| 카드 '인증 완료' 다시 눌러 취소 | DELETE /challenges/{id}/verifications/{postId} | existing | toggleChecked |
| 카드 '신청 완료'(시작 전) 다시 눌러 취소 | DELETE /challenges/{id}/members/me | existing | toggleChecked (프로토타입이 신청도 checked 로 둠) |
| 카드 [참여하기] | (API 없음 — 상세를 열기만) | — | — |
| 시작 전 내가 연 챌린지 [멤버 초대] | (API 없음 — 초대 링크 복사) | — | cards.tsx invite |

### 챌린지 상세 (일상) — `app/challenge/[id].tsx` → `components/challenge/daily-detail.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 진행 카드 · 홈 탭(가이드 · 기간 · 주기 · 방법 · 호스트 · 멤버 · 내 인증 7일 · 최근 인증) | GET /challenges/{id} | change | findChallenge · dayOf · weekOf · feedOf |
| [참여하기] / [도전 신청하기] → 응원 시트 | POST /challenges/{id}/members | existing | toggleJoin |
| [찜] | POST · DELETE /challenges/{id}/save | new | toggleSaved |
| 인증 탭 피드 | GET /challenges/{id}/verifications?page= | change (aspectRatio) | feedOf |
| 인증 좋아요 | POST · DELETE /challenges/{id}/verifications/{postId}/likes | existing | toggleLiked |
| 답글 창 보기 · 달기 | GET · POST /challenges/{id}/verifications/{postId}/comments | existing | checkinReplies · addCheckinReply |
| 답글 고치기 · 지우기 · 좋아요 | PUT · DELETE …/comments/{commentId} · POST …/comments/{commentId}/like | existing | (앱 시트는 아직 보내기만) |
| 순위 탭 (내 순위 카드 · 시상대 · 4~10위 · 10위 밖 내 줄) | GET /challenges/{id}/ranking | new | rankingOf |
| 다른 멤버 인증 길게 눌러 신고 · 차단 | (공통 신고 · 차단 API — 다른 도메인) | — | components/common/report-sheet.tsx |
| [공유] | (API 없음 — 링크 복사) | — | — |

### 오늘 인증 시트 — `components/challenge/check-sheet.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 사진 올리기 (앨범 · 촬영, 최대 10장) | POST /uploads/images/challenge-verification-photo | existing (다른 조각) | expo-image-picker uri |
| 인증하기 (하루 1번 · 사진 방식은 1장 이상) | POST /challenges/{id}/verifications | change (최대 3장 → 10장 · aspectRatio) | addCheckin |

### 응원 시트 — `components/challenge/cheer-sheet.tsx`
서버 호출 없음 (참여 직후 축하 화면). 백엔드의 '응원 한마디'(`/challenges/{id}/cheers`)는 지금 앱 화면에 없어요.

### 표현 챌린지 창 — `app/challenge/[id].tsx` (?write=1) → `components/challenge/chx-sheet.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 표현 카드(예문 · 출처) | GET /challenges/{id} | change | findChallenge · challengeSrc |
| 나만의 문장 목록 (좋아요 · 답글) | GET /challenges/{id}/entries | new | entriesOf · seedEntries |
| 문장 · 답글 달기 (처음이면 자동 참여) | POST /challenges/{id}/entries | new | addEntry · xJoined |
| 내 글 고치기 · 지우기([되돌리기]) | PUT · DELETE /challenges/{id}/entries/{entryId} | new | editEntry · removeEntry |
| 좋아요 | POST /challenges/{id}/entries/{entryId}/like | new | toggleLiked |
| 듣기 | (API 없음 — 기기 TTS) | — | expo-speech |

### 챌린지 열기 — `app/challenge/new.tsx` → `components/challenge/new-challenge.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 일상 챌린지 열기 (이름 · 시작 · 기간 · 주기 · 방법 · 안내 · 카드 문구) | POST /challenges (kind=daily) | change | createDaily · planOf |
| 표현 챌린지 열기 (표현 하나 · 기간 · 첫 문장) | POST /challenges (kind=expression, expressionIds) | change (A13) | createExpression · cardOfSaved |
| 같은 표현 확인 ('이미 있는 챌린지예요' · 버튼 흐림) | GET /challenges/expression-check?text= | new | findSameExpr · normExpr |
| 표현 고르기 목록 (내 표현함) | GET /me/expressions (마이 · 라이브러리 조각) | — | state/expressions.ts |
| 카테고리 목록 | GET /me/master-data?kinds=CHALLENGE_CATEGORY (공통 조각) | existing | data/challenge.ts CH_CATS |
| '어떻게 인증하나요?' 예시 칩 | GET /challenge-guide-templates | existing | CH_GD (지금은 placeholder 만) |

### 내 표현함 '챌린지' 버튼 — `components/my/expr-rows.tsx` (A13) · 표현 저장 알림 `lib/chal-offer.ts`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 저장 직후 '같은 표현 챌린지가 있어요' / '챌린지로 열 수 있어요' | GET /challenges/expression-check?text= | new | findSameExpr |
| [챌린지] → /challenge/new?expr=id → 열기 | POST /challenges (expressionIds) | change | openChallenge |

### 이벤트 탭 — `app/(tabs)/event.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 배너(다가오는 5개) · 다가오는/지난 목록 · 지점 · 종류 칩 | GET /events?status=&kind=&branch= | change (v2 에 다가오는 것 목록만 — 2026-11-26) | api/events.ts fetchEvents + 예시 data/events.ts EVENTS · fromServer · splitEvents |
| 내가 제안한 이벤트 카드 (검토 중 · 승인 · 반려 사유 · 취소) | GET /event-proposals | existing | api/event-proposals.ts fetchMyEventProposals |
| 확정 카드 [이벤트 보기] → 상세 | GET /event-proposals 의 eventId → GET /events/{id} | existing (2026-11-26) | proposal-cards.tsx |
| 확정 · 반려 카드 [지우기] · 반려 [다시 제안하기] 뒤 예전 카드 지우기 | POST /event-proposals/{id}/hide | existing (2026-11-26) | hideEventProposal |
| 승인 · 반려 알림 → 누르면 이벤트 탭 | 서버가 보냄 (알림 type EVENT_PROPOSAL_APPROVED · REJECTED, 푸시 data.type EVENT_PROPOSAL) | existing (2026-11-26) | api/push-to-banner.ts |
| 제안 [취소] (대기 중만) | DELETE /event-proposals/{id} | existing | cancelEventProposal |
| [오픈하기] — 회원: 제안서 / 프로 · 지점 관리자: 바로 열기 | POST /events (프로 · 지점 관리자) | new | (지금은 누구나 제안서로) |
| 지점 선택 목록 | GET /events/form-options (branches) 또는 공통 지점 API | new | components/lounge/branch-select.tsx |

### 이벤트 상세 — `app/events/[id].tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 정보 줄 · 소개 · 함께하는 멤버 · 내 신청 카드 · 문자 문의 시트 · 멤버 주최면 HOST 줄 | GET /events/{id} | change (v2 에 기본 정보 · host · mine — 신청 · 멤버는 아직) | api/events.ts fetchEvent · findEvent(예시) · eventContact · membersOf |
| [참여하기] → 확인 시트(설문 · 입금 계좌 · 확인 체크) | POST /events/{id}/applications | new | toggleIn('joined') · setAnswers |
| '참여 완료' → 참여 취소 | DELETE /events/{id}/applications/me | new | toggleIn('joined') |
| 정원 참 [빈자리 알림 받기] (A12) | POST · DELETE /events/{id}/waitlist | new | toggleIn('vac') |
| [찜] | POST · DELETE /events/{id}/save | new | toggleIn('saved') |
| 함께하는 멤버 내 인사 남기기 · 지우기 | PUT · DELETE /events/{id}/members/me/greeting | new | setText('mhi') |
| 지난 이벤트 [후기 보기] · 후기 달기 | GET · POST /events/{id}/reviews | new | useState cmts |
| 주소 · 계좌번호 · 전화번호 복사 | (API 없음 — 클립보드) | — | — |

### 이벤트 제안 — `app/events/propose.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 카테고리 칩 | GET /event-proposals/categories | existing | fetchEventCategories |
| 진행 지점 · 장소 지도 · 예상 인원 선택지 | GET /events/form-options | new | BRANCHES · PLACE_SPOTS · CAPS |
| 이벤트 사진 올리기 (10장까지 · 없으면 카드 만들기) | POST /uploads/images/event-photo | existing | uploadEventPhoto |
| [제안 보내기] (이용 중 회원만 — 아니면 409) | POST /event-proposals | existing | createEventProposal |

### 운영 쪽 (앱 화면 없음 · docs/pages/06-event.md)
| 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 이벤트 열기 (설문 최대 5개 · 자주 쓰는 질문) | POST /events · GET /events/form-options (surveyTemplates) | new | SURVEY_LIB · SURVEY_SETS |
| 포스터 올리기 | POST /uploads/images/{purpose} — 새 purpose EVENT_POSTER | change (다른 조각) | — |
| 입금 확인 → 확정 | PATCH /events/{id}/applications/{applicationId} | new | my-application.tsx 문구 |
| 설문 결과 · 엑셀로 받기 | GET /events/{id}/survey-results · /survey-results.xlsx | new | — |

기기에만 저장 (API 없음): 챌린지 탭 선택 칩 · 지점 선택, 이벤트 탭 다가오는/지난 탭 · 종류 칩, 방금 연 챌린지 반짝임(flash), 배너 자동 넘김, 듣기(TTS).

열린 질문:
- 챌린지 개설 승인: 백엔드는 개설 = 승인 대기(PENDING) → 관리자 승인. 앱은 열자마자 진행 · 목록에 보여요. 회원 챌린지는 바로 열지, 승인을 거칠지?
- 인증 주기: 백엔드 DAILY · THREE_PER_WEEK · WEEKLY ↔ 앱 매일 / 주 1~6회 + 요일 지정. 요일 기반으로 바꿀지? 요일이 아닌 날 인증도 받을지(지금은 하루 1번이면 언제든)?
- 인증 사진 최대 장 수: 백엔드 3 · 앱 10.
- 사진 + 댓글 방식에서 댓글을 선택으로 할지 (앱은 비우면 '오늘 인증!' 을 넣음 — 백엔드 PHOTO_AND_TEXT 는 글 필수).
- 표현 챌린지 문장은 공통 댓글 모듈(대상 타입 새로)로 둘지, 인증 게시물로 둘지. '팁 · 질문' 을 따로 탭으로 나눌지.
- 챌린지 지점: 백엔드 챌린지는 지점과 무관(전역). 앱은 연 사람 지점으로 거르고 '전 지점(공식)' 은 늘 보여요 → 호스트 지점 기준으로 거를지.
- 챌린지 자체 좋아요(likeCount, 핫 점수) — 지금 앱에 좋아요 버튼은 없고 숫자만. 찜 수로 대신할지?
- 지우기 [되돌리기]: 서버 소프트 삭제 + restore 를 둘지, 앱이 몇 초 늦게 지울지.
- 이벤트 유료 입금 확인 방법(수동 · 자동) · 24시간 지나면 자동 반환할지 (Q-P2). 환불 규정.
- 빈자리 알림: 먼저 신청한 사람부터 차례로 / 모두에게 동시에.
- 이벤트 후기: 참여자만 쓸지, 누구나.
- 지점 · 장소 · 설문 템플릿 · 입금 계좌를 `/events/form-options` 로 둘지 A18 `GET /config` 로 합칠지.

<a id="my"></a>

## 마이 도메인 — 화면별 API

경로는 모두 `/app/api/v1` 기준 (약관 3개만 `/public/api/v1`). 상태: existing 21 · change 10 · new 40.

### 마이 탭 — `app/(tabs)/my.tsx`
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 내 이름 · 지점 · 역할 · 레벨 (앱 전체 useMe) | GET /me | change | state/me.ts ME0 |
| 캐릭터 카드 · 숫자 4칸(회원: 연속 학습 · 이번 주 랭킹 · 참여 중인 모임 · 받은 배지 / 프로: 이번 달 세션 · 출석 체크 · 보낸 노트 · 받은 고마워요) · 팔로잉/팔로워 수 · 스파크 · 배지 미리보기 · 내 활동 개수(찜한 챌린지 포함) — 칸이 null 이면 안 그려요 | GET /me/mypage (v2 MyPageV2Response) | existing | api/my-page.ts · api/use-my-page.ts (가짜 서버 mockMyPage) |
| 랭킹 요약 (시상대 1~3위 + 내 순위) | GET /me/mypage (ranking — 지금은 서버도 예시 값, 랭킹 구현 때 GET /ranking/members 와 같은 판정으로) | existing | api/my-page.ts ranking |
| 내 모임 시트 — 동아리 · 번개 · 이벤트 탭 (챌린지 탭 · 제안한 이벤트는 아직 기기 상태) | GET /me/meets?box=JOINED (v2 MyMeetsV2Response) | existing | api/my-activity.ts · api/use-my-activity.ts useMyMeets (가짜 서버 = meet-store) |
| 찜한 모임 시트 | GET /me/meets?box=SAVED | existing (늘 빈 목록 — 찜 도메인 없음) | useMyMeets · meetLines |
| 찜한 챌린지 시트 (하트 = 찜 토글은 기기 상태) | GET /me/saved-challenges (v2 SavedChallengesV2Response) | existing (늘 빈 목록 — 찜 도메인 없음) | useSavedChallenges (가짜 서버 = data/challenge saved) |
| 내가 쓴 글 → 라운지로 | (라운지 몫) | — | state/me.ts postCount |
| 내 표현함 목록 (`app/me/expressions.tsx` — 찾기 · 나온 곳 칩은 받은 첫 쪽 100개 안에서) · 개수는 GET /me/mypage activity.savedExpressionCount | GET /me/expressions?page=&size= (PageResponse<MyExpressionV2Response>) | existing (표현 노트 · 나온 곳 · 고친 문장은 null) | useMyExpressions (가짜 서버 = state/expressions) |
| PRO'S NOTE 카드(새 노트 n · 최근 받은/보낸 노트 · n/m명 읽음) · 내 수업(프로, 이번 주 맡은 세션) · 내 스터디(이용권 · 듣는 팀 · 리더) — 서버가 준 칸만 | GET /me/mypage (proNote · myClasses · study) | existing | components/account/pro-note-card.tsx · my-class-card.tsx · my-study-card.tsx |
| 스텝 숫자 칸 참여한 세션 → 참여한 세션 시트 (전체 · 이번 달 · 달마다 기록 · 대타/참여 · +스파크) | GET /me/pro-sessions (A34) | new | api/pro-sessions.ts · components/account/pro-sessions-sheet.tsx |
| 지점 안내 (회원만 보여요) | 아래 컴포넌트 | | |
| 비회원: 랭킹 윗부분 아래 '지점 회원이 되면 열려요' 칸 · 메뉴 '이용권 · 결제 내역' · 지점 안내는 회원만 | GET /me/mypage (branchMember · 받기 전엔 GET /me memberAccessLevel) · GET /me/branch-summary | existing | state/access.ts isMember · canUse · components/common/member-lock.tsx · scroll-lock.tsx |
| 잠김 칸 아래 버튼: 연동 대기 '연동 확인 중이에요' · 못 찾음 '다시 요청하기'(→ /link-rejected) · 체험 예약 '체험 예약 보기' · 그 밖 '체험 신청하기' + '이미 회원이에요 · 연동 요청'(→ /onboarding/link) | GET /me | change | components/common/member-lock.tsx |

기기에만 저장 (API 없음): '기기에 저장한 기록 지우기' · '디자인 부품 보기' (개발용 입구, 출시 전 삭제). 스크롤로 잠김 칸을 본 수(3 · 6 · 9 번째 권유 시트 · state/lock-hits.ts).

### 캐릭터 카드 · 팔로우 시트 · 배지 모두 보기 · 스파크 시트 — `components/my/my-hero.tsx` · `my-sheets.tsx` · `my-blocks.tsx` · `app/me/badges.tsx` · `badge-detail-sheet.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 내 캐릭터 그리기 (로그인 뒤 서버 모습 · 가진 것을 기기에) | GET /me/avatar | existing | api/use-my-avatar.ts · state/avatar.ts saved |
| 팔로잉 · 팔로워 목록 | GET /members/{code}/following · /followers | new | data/my.ts followLists |
| 목록에서 팔로우 · 끊기 | POST · DELETE /members/{code}/follow | new | state/me.ts toggleFollow |
| 배지 모두 보기 `app/me/badges.tsx` (받은 개수 · 최근 받은 배지 · 거의 다 왔어요 2개 · 전체/받은/못 받은 칸, 콘솔 순서 · 마이 배지 칸은 앞 4칸) — 마이 '모두 보기 ›' · '받은 배지' 칸 · 배지 푸시 · 축하 시트 [배지 보기] 에서 와요 | GET /me/badges (earnedAt · A36 conditionType · threshold · progress) | change | api/use-badges.ts useMyBadges · data/my.ts MY_BADGES (cond 예시) |
| 배지 상세 시트 (칸을 누르면): 큰 그림 · 받은 날 · 받는 방법 한 줄 · 진행 막대 '2 / 5번' · 'n번 더' · 하러 가기 버튼(못 받은 배지만) | GET /me/badges (목록에서 code 로 찾음, 따로 부르지 않음) | change | components/my/badge-detail-sheet.tsx · api/use-badges.ts useMyBadge · badgeProgress · data/badge-rules.ts (문구 · 이동할 곳) |
| 배지 받으면 탭 화면 위 축하 시트 (앱 열 때 · 돌아올 때 · 배지 푸시 때 물어요) → 닫으면 본 것으로 | GET /me/badges/unseen · POST /me/badges/seen | existing | components/my/badge-celebrate.tsx · api/use-badges.ts |
| 스파크 모으는 방법 (프로 · 스텝은 PRO 줄도) | GET /me/sparks (earnRules · audience) | new | data/my.ts SPARK_EARN · SPARK_EARN_PRO |
| 프로필 카드 이름 아래 줄 '○○점 · 언어 Lv.n · 회원' + 작은 표시 ● 연동 확인 중 · ✓ 연동됨(처음 한 번 톡 튀어나옴) · 연동 안 됨 | GET /me (memberAccessLevel) · GET /me/branch-summary | existing | components/my/my-hero.tsx · state/link-events.ts myMoment |

### 멤버 프로필 — `app/me/profile/[id].tsx` · `components/my/profile-sheet.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 캐릭터 룸 · 이름 · @아이디 · 지점 · 학습 언어 · 팔로잉/팔로워 · 함께 아는 멤버 · 이번 주 포인트 비교 · 학습 현황 · 배지 · 동아리 | GET /me/mypage/{code} | change | data/my.ts findMember · memberAvatar · memberHandle · memberLangs · nameHash |
| 한 줄 소개 (그 사람이 마이에서 남긴 글 · 안 남겼으면 줄 숨김) | GET /me/mypage/{code} (profile.bio) | existing | data/my.ts memberBio |
| [팔로우] · 끊기 | POST · DELETE /members/{code}/follow | new | state/me.ts toggleFollow |
| 팔로우 직후 추천 멤버 · 추천 멤버 n명 시트 | GET /me/follow-recommendations?basedOn= | new | profile-sheet.tsx recs |
| 팔로잉 · 팔로워 시트 | GET /members/{code}/following · /followers | new | followLists |
| 신고하기 · 차단하기 | (공통 신고 · 차단 API 몫 — 여기서 정의 안 함) | — | — |

주소 파라미터를 이름 → 회원 code 로 바꿔야 해요 (`/me/profile/Hyun` → `/me/profile/M8F2K1`).

### 꾸미기 (스파크 상점) — `app/me/customize.tsx` · `components/character/**` · `state/avatar.ts` · `state/ledger.ts`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 분류 탭 · 타일 (이름 · 가격 · 보상 잠김 · 그림) | GET /asset-catalog (backgrounds · effects · items) — 등급 · 시즌은 GET /avatar/items(new) 가 필요할 때만 | existing | data/av-items.ts AV_ITEMS · AV_BG · data/my.ts AVC_LIST |
| 저장된 모습 · 가진 것 · 스파크 잔액 (스파크는 아직 0) | GET /me/avatar | existing | state/avatar.ts {saved, own} · state/me.ts sparks |
| [저장하기] (새로 살 것 0개) | PUT /me/avatar (409 item_not_owned) | existing | buyAndSave (cost 0) |
| [사고 저장하기] (스파크 차감 + 저장 한 번에) | POST /me/avatar/purchase | new | state/avatar.ts avatarCost · buyAndSave · ledger award(shop) |
| 위 스파크 잔액 → 모으는 방법 | GET /me/sparks | new | SPARK_EARN |
| (장부 내역 — 지금 화면 없음, 원장 확인용) | GET /me/rewards?currency= | new | state/ledger.ts events |
| 다른 회원 캐릭터 (홈 맵 · 랭킹 · 라운지 얼굴) | 각 목록 응답의 avatar(AvatarLook) | new | data/my.ts memberAvatar(이름 해시) |

기기에만 저장 (API 없음): 저장 전 고르는 중인 모습(draft) · [좌우] [랜덤] [원래대로] [초기화] (저장 전까지 화면 상태) · 캐릭터 그림 PNG · 좌표(av-assets.ts, 앱 번들).
포인트 · 스파크 지급: 앱이 POST 하지 않아요. 단계 완료 · 출석 등 원래 API 를 서버가 처리하면서 장부에 쌓아요 (state/ledger.ts 는 없어짐).

### 랭킹 · 퀘스트 — `app/me/ranking.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 개인 × 이번 주 / 이번 달 (내 순위 띠 · 시상대 · 4~10위 · 10위 밖 내 근처 줄 · 10위까지 남은 점수) | GET /ranking/members?period=WEEK\|MONTH | new | api/ranking.ts · api/use-ranking.ts (가짜 서버 rankPeople) |
| 지점 대항전 (지점별 합계 막대 · 우리 지점 강조 — 합산은 서버) | GET /ranking/branches?period=WEEK\|MONTH | new | api/ranking.ts · api/use-ranking.ts (가짜 서버 mockBranchRanking) |
| 얼굴 누르면 프로필 | GET /me/mypage/{code} | change | — |
| 챌린지 카드 · 내 표현함 | (챌린지 · 학습 도메인 몫) | — | state/expressions |

### 연기 · 팀 · 지점 변경 — `app/me/change.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 신청서 정보 (남은 횟수 · 지금 팀 · 같은 지점 옮길 수 있는 팀 · 날짜 범위 · 대기 요청) | GET /me/course-change | change | data/account.ts getMembership · MY_TEAMS · teamsOf · CHANGE_MIN |
| 잠깐 쉬어가기 신청서 — 내 스터디 · 남은 횟수 · 돌아올 후보(같은 언어) · 날짜 규칙 · 사유 칩(마스터데이터 DEFERRAL_REASON) · 대기 건 | GET /me/deferral-requests/form | new | data/account.ts getMembership · MY_TEAMS · sameLevelTeams · REST_* · CLOSED_WEEKDAY |
| 잠깐 쉬어가기 — 시작일 → 돌아올 스터디(그대로 · 같은 언어 다른 수업) → 복귀일 → 사유(코드 + 5자) (2026-11-28) | POST /me/deferral-requests (returnDate · reasonCode · reason · returnChanges) | change | store.ts submitChangeRequest |
| 팀 바꾸기 (SWAP) · 팀 하나 더하기 (ADD) | POST /me/course-change-requests | existing | submitChangeRequest |
| 지점 옮기기 — 권역별 지점 | GET /me/branch-transfer/branches?sourceBranchId= | existing | BRANCHES · BRANCH_REGIONS |
| 지점 옮기기 — 그 지점 팀 | GET /me/branch-transfer/branches/{code}/courses | new | teamsOf(branch) |
| 지점 옮기기 신청 (팀 · 남길 말 포함) | POST /me/branch-transfer-requests | change | submitChangeRequest |

기기에만 저장 (API 없음): 단계(pick · form · confirm) · 요약 문장(앱이 고른 값으로 만들어요).
열린 질문:
- 새 일정 하한: 앱 문구 '오늘 + 2주' vs 백엔드 수업 변경 MIN_LEAD_DAYS=3 · 지점 이동 MIN_LEAD_DAYS · 연기 '다음 날부터'. 하나로 정해서 minEffectiveDate 로 내려 주세요.
- (정함 2026-11-28) 쉬어가기 설계:
  - 돌아올 수업은 연기 신청에 같이 받아 자식 테이블 deferral_return_changes 에 저장해요. 실제 복귀를 처리할 때 이 값을 읽어 옮겨요. 승인 때 예약 변경을 미리 만들지 않으니, 기간을 고치거나 중간에 취소해도 맞출 게 없어요.
  - 복귀 때 옮길 수업에 갈 수 없으면 그 쌍만 건너뛰고(SKIPPED) 원래 수업 그대로 둬요. 수업 변경 횟수는 실제로 옮길 때만 쓰고, 해당 지점에 알림을 보내요.
  - 돌아올 후보는 같은 지점 · 같은 언어만 봐요. 레벨은 Course 에 없어서 나중에 정해요.
  - 사유는 마스터데이터 DEFERRAL_REASON 하나예요. 1달 넘게도 같은 목록이고, 특별한 경우인지는 운영진이 판단해요.
- 연기 · 변경 '남은 횟수'가 연기 · 팀 변경 · 지점 이동을 한 주머니로 세는지 (앱 PLANS.changes 는 하나) vs 백엔드 remainingChanges(수업 변경)만.
- 팀 변경과 연기를 한 번에 ('연기 + 지점 이동' 조합 · 07-my.md) — 지금 화면은 종류 하나만 고르니 두 건으로 나눠 보내도 되는지.
- 대기 요청은 회원당 1건(수업 변경) — 연기 · 지점 이동 대기와 동시에 있어도 되는지.

### 내 스터디 카드 — `components/account/my-study-card.tsx` (마이 · `app/me/study.tsx`)
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 멤버십 이름 · 기간 · 남은 횟수 링 · 무료 포함 · 연기 · 변경 남은 횟수 · 팀 수 · 주 n회 · 팀 목록 | GET /me/memberships (ACTIVE) | change | getMembership · MY_TEAMS |
| '○○ 신청 · 운영진 확인 중' | GET /me/course-change (pendingRequest · pendingDeferral · pendingBranchTransfer) | change | store.ts useChangeRequest |
| [신청 취소] | PUT /me/course-change-requests/{id}/cancel · /me/deferral-requests/{id}/cancel · /me/branch-transfer-requests/{id}/cancel | existing | cancelChangeRequest |

`app/me/study.tsx`: 같은 카드만 보여 줘요 (추가 API 없음).

### 진도 시트 — `components/my/course-progress.tsx`
팀별 진도(교재 · 단계)는 학습 도메인(bookShelfQuery · progress) 몫. 팀 목록만 GET /me/memberships courses 를 써요.

### 지점 안내 — `components/my/branch-board.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 지점 탭 (내 팀 지점들) | GET /me/branches | existing | data/my.ts MY_BRANCHES |
| 주소 · 시간 · 고정 공지 · 주차/계좌 · 와이파이 · 사물함 · 문의 · 협업 업체(포스터 · 링크) | GET /me/branch-guides (협업 업체 · 사물함은 아직 없음) | existing | api/branch-guide.ts |

기기에만 저장 (API 없음): 복사 · 지도 · 전화 열기 (기기 기능).

### 이용권 · 남은 세션 — `app/me/pass.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 남은 횟수 · 유료/무료 · 기간 · D-day · 내 이용권 표(총 · 남은 · 주 참여 · 연기 · 변경 · 만료일) | GET /me/memberships/{id} (또는 목록) | change | getMembership |
| 사용 내역 (6개 → 더 보기) | GET /me/memberships/{id}/usage | new | PASS_LOG |
| [연기 · 변경 신청] → /me/change | (위 신청서) | | |

열린 질문: 연장 · 재등록 요청(#41)은 지금 코드에 화면이 없어 정의하지 않았어요. 홀딩(#40)은 연기 신청(POST /me/deferral-requests)으로 통일.

### 결제 내역 — `app/me/payments.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 결제 목록 (이용권은 금액 숨김 · 환불은 분홍) | GET /me/payments | new | PAYMENTS |
| 영수증 [이메일로 받기] | POST /me/payments/{id}/receipt-email | new | 토스트만 |
| [환불 문의] → 1:1 문의 (유형 결제 · 환불) | POST /me/inquiries (categoryCode · content) | existing | support ?type= |

열린 질문: 멤버십 밖 결제(캠프 · 레벨 테스트)를 백엔드가 어디에 두는지 — 지금은 멤버십 PaymentLine 만 있어요.

### 내 표현함 — `app/me/expressions.tsx` · `components/my/expr-rows.tsx`
목록 · 빼기 · 되돌리기 · 챌린지로 열기는 **학습 도메인 표현함 API**(`/me/expressions`) 를 써요 — 여기서 정의하지 않아요. 챌린지 만들기는 챌린지 도메인.

### PRO'S NOTE 카드 — `components/account/pro-note-card.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| '오늘 노트 준비 중' | GET /pros-notes/incoming | new | PN_WAIT |
| 최근 2개 · NEW | GET /pros-notes?role=participant&pageSize=2 | change | PRO_NOTES · read |
| 누르면 읽음 | POST /pros-notes/{noteId}/read | existing | markNoteRead |

### 프로 노트 모음 — `app/me/notes/index.tsx` (+ `?view=diary` → `components/account/diary-list.tsx`)
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 받은 노트 전체 · 팀별 탭 (NEW · 첫 질문 + 나머지 n개 · 달마다 머리 · [더 보기]) | GET /me/pros-notes?box=RECEIVED&courseId=&cursor= | existing | api/use-pros-note.ts useProsNotes (가짜 서버 = PRO_NOTES) |
| 프로: 보낸 노트 탭 (n/m명 읽음 · 고마워요는 서버에 없어 안 그림) | GET /me/pros-notes?box=SENT | existing | useProsNotes('SENT') (가짜 서버 = PRO_SENT_NOTES) |
| 프로 여부 · 보낸/받은 노트 수 · 팀 탭 이름 | GET /me/mypage (proNote.sent · received.total · study.teams) | existing | api/use-my-page.ts |
| 오늘 준비 중 (서버에 없어 가짜 서버일 때만) | GET /pros-notes/incoming | new | use-pros-note.ts useNoteWait (PN_WAIT) |
| '저장한 표현' 탭 · 저장 취소 | 학습 도메인 표현함 API | — | state/expressions |
| 스터디 일기 모아 보기 | GET /me/study-diaries | new | store diary · DIARY_EXAMPLES |

### 프로 노트 한 장 — `app/me/notes/[id].tsx` · `components/account/pro-note-parts.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 항목(서버: 질문 + AI 답 → 종류 '질문') · 보낸 노트면 n/m명 읽음. 예문 · 마무리 인사 · 같은 팀이 보낸 마음 · 고마워요 바는 서버에 없어 안 그려요 | GET /me/pros-notes/{noteId} | existing | api/use-pros-note.ts (가짜 서버 = PRO_NOTES · noteReactions) |
| 열면 읽음 (받은 노트만 · 마이 '새 노트 n' 다시 받기) | POST /me/pros-notes/{noteId}/read | existing | api/use-pros-note.ts useMarkProsNoteRead |
| [고마워요] 켜기 · 끄기 | PUT · DELETE /pros-notes/{noteId}/thanks | new | toggleNoteThanks |
| 감사 인사 보내기 | POST /pros-notes/{noteId}/messages | new | sendNoteMessage · PN_THANKS |
| 오늘의 스터디 일기 보기 · 저장 | GET · PUT /pros-notes/{noteId}/diary | new | saveDiary · DIARY_EXAMPLES |
| 항목 [저장] → 내 표현함 | 학습 도메인 표현함 API | — | toggleExpression |

열린 질문:
- 백엔드 노트는 '리더가 질문 → AI 답'(questions) 모양이고, 앱은 프로가 쓴 태그 항목(items) + 마무리 인사예요. 지금은 questions 를 종류 '질문' 항목으로 바꿔 보여 줘요(2026-11-26). items · 마무리 인사를 새로 저장할지는 미정.
- 프로 = 리더로 정했어요 (2026-11-25). 앱 문구는 '프로님'.
- 같은 팀 멤버가 보낸 감사 인사를 서로 보여 줄지 (지금 예시는 보여 줘요).

### 설정 — `app/me/settings/index.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 닉네임 · 한 줄 소개 저장 | PATCH /me/profile | change | updateMe · updateSettings({bio}) |
| 내 지점 (매니저 확인) 선택지 | GET /me/branch-link-requests/branches | change (region) | BRANCHES |
| 내 지점 저장 → 요청 | POST /me/branch-link-requests | change | updateSettings({branches}) |
| 내 지점 요청 상태 · 계정 칸 '내 지점'(확인 중 N) → /me/settings/branch | GET /me/branch-link-requests · GET /me/branch-summary | existing | settings.branches |

### 설정 › 내 지점 — `app/me/settings/branch.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 확인 중 · 지난 요청(연동됨 · 반려됨) 목록 | GET /me/branch-link-requests | existing | api/use-link-requests.ts splitLinkRequests |
| 줄 누르기 → 요청 내용 시트 (지점 · 이름 · 번호 · 반려 이유 — 옛 앱 요청은 이름 · 번호 숨김) | (목록 응답 그대로) | existing | |
| 그 지점의 가장 최근 반려면 [다시 요청하기] (보냈던 값 채움) | POST /me/branch-link-requests | existing | |
| 학습 언어 · 레벨 값 | GET /me/study-level (또는 /me) | new | set.lang · me.level |
| 로그인 계정 값 | GET /me/auth-providers | new | useLogins |
| 알림 7개 · 광고 동의(날짜 기록) · 프로필 공개 · 랭킹 이름 · 지점 보이기 · 하루 목표 | GET · PATCH /me/settings | new | SETTINGS_DEFAULT · updateSettings · setMarketing |
| 차단한 멤버 n명 시트 | GET /me/blocks | new | '0명' 고정 |
| 이용권 'n회 남음' | GET /me/memberships | change | getMembership |
| 앱 버전 '1.0.0 최신' | GET /app-version?platform= | new | APP_VERSION |
| 로그아웃 → 첫 화면(/) | POST /auth/logout (core) | new | router.replace('/') |
| 회원 탈퇴 → /me/delete | | | |

기기에만 저장 (API 없음): 말하기가 어려워요(15분) · 소리 끄기(15분) · 효과음 (state/learn-prefs · lib/feedback).
열린 질문: 하루 목표(dailyGoal)를 서버 설정에 둘지 — 홈 퀘스트 · 연속 학습 계산이 쓰면 서버, 아니면 기기. 광고 동의를 /me/consents(약관 동의 이력)로 남길지 settings 시각만 둘지.

### 학습 언어 · 레벨 — `app/me/settings/langlv.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 지금 언어 · 레벨 · 시작일 · 주차 · 레벨 테스트 결과 시트 · '요청됨' · 다른 언어 | GET /me/study-level | new | MY_LEVEL · LEVEL_TEST · OTHER_LANGS · useLevelRequest |
| 레벨 변경 요청 (방향 · 이유) | POST /me/level-change-requests | new | requestLevelChange |
| 다른 언어 [체험 신청] → /trial | (체험 도메인 몫) | — | — |

### 로그인 계정 — `app/me/settings/login.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 카카오 · 애플 · 구글 연결 상태 · 휴대폰 · 이메일 | GET /me/auth-providers | new | LOGINS_DEFAULT |
| 연결 | POST /me/auth-providers/{provider} | new | api/me.ts linkProvider |
| 해제 (마지막 하나는 409 last_provider) | DELETE /me/auth-providers/{provider} | new | api/me.ts unlinkProvider |
| 휴대폰 번호 변경 (인증번호 → 확인) | POST /me/phone/verification-code · PUT /me/phone | new | 토스트만 |
| 이메일 등록 (인증 메일) | PUT /me/email | new | 토스트만 |

열린 질문: 지금 백엔드 로그인은 카카오 authCode 하나뿐 — 애플 · 구글 로그인을 열지 (애플 심사상 소셜 로그인이 있으면 애플 로그인 필요).

### 공지사항 — `app/me/settings/notices.tsx`
공지 목록 · 상세(`/notice/[id]`)는 홈 · 공통 도메인의 공지 API 를 그대로 써요 (여기서 정의 안 함). 안 읽은 표시(분홍 점)는 기기에만 저장(store.ts noticeRead) — 서버 읽음이 필요하면 공지 도메인에서.

### 신고 내역 — `app/me/settings/reports.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 내가 한 신고 (대상 · 사유 · 날짜 · 접수/처리 완료 · 결과) | GET /me/reports | new | MY_REPORTS |
| 받은 경고 | GET /me/warnings | new | '0' 고정 |

열린 질문: 경고 이의 신청 API (화면 자리만 있음).

### 약관 목록 — `app/me/settings/terms.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 4종 이름 · 시행일 | GET /public/api/v1/consents | change | TERMS |

### 약관 하나 — `app/me/settings/term.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 본문 · 시행일 | GET /public/api/v1/consents/{code} | existing | TERMS[i] |
| [이전 버전] | GET /public/api/v1/consents/{code}/versions | new | 토스트만 |

앱 주소 파라미터를 순서(i) → 약관 code 로 바꿔요.

### 앱 버전 — `app/me/settings/version.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 지금 버전 · 최신 여부 · [다시 확인] · [업데이트] · 새 기능 | GET /app-version?platform= | new | APP_VERSION |

기기에만 저장 (API 없음): 오픈소스 라이선스 목록 (앱 고정).

### 고객센터 — `app/me/support.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 자주 묻는 질문 (찾기 · 칩 · 펼침) | GET /faq {categories, items} | existing | api/support.ts fetchFaq |
| 내 지점 전화 (내 지점 먼저, 없으면 번호 적은 첫 지점 · 번호가 없으면 줄 없음) | GET /me/branch-guides (phone) | existing | api/use-branch-guide.ts useMyBranchContact |
| 1:1 문의하기 (분류 · 내용 5~2000자) | POST /me/inquiries | existing | api/support.ts createInquiry |
| 내 문의 (답변 대기 · 완료) — 버그 보고(?view=bug)는 보낸 내용만 보여요: 답변 상태 · 관리자 답변은 안 그려요 (2026-11-28) | GET /me/inquiries | existing | api/support.ts fetchMyInquiries |

기기에만 저장 (API 없음): [도움이 됐어요] (지금 토스트만) · 카카오톡 상담(채널 링크).
v2 에서는 `/me/inquiries` 가 1:1 문의예요 (MobileUserInquiryController). 예전 v1 `/me/inquiries`(신청 내역)는 지점 연동은 `/me/branch-link-requests` · `/me/branch-summary`, 연기 · 수업 변경은 GET /me/course-change 로 봐요.

### 회원 탈퇴 — `app/me/delete.tsx`
| 화면에서 하는 일 | API | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 이유 고르기 → 탈퇴 → 첫 화면(/) | DELETE /me?reason= | new | api/me.ts deleteAccount · LEAVE_REASONS |

열린 질문: 이용 중 멤버십이 있으면 막을지(409 active_membership_exists) · 남은 횟수 환불 안내.

### 전체 열린 질문 (백엔드 결정)
1. 랭킹 지점 대항전: 두 지점 회원 포인트를 어느 지점에 넣을지 · 주/달 경계(KST 월요일 0시 · 1일 0시) 확정.
2. 캐릭터 그림: 새 아이템 그림을 서버에서 내려줄지(지금은 앱 번들) — 안 내려주면 앱 업데이트 없이 새 아이템을 못 팔아요.
3. 스파크 지급 규칙(출석 +50 외 퀘스트 · 모임 · 연속 · 첫 글 · TOP3)과 시즌 아이템 지급 방식.
4. 멤버십이 여러 개(ACTIVE 2개)일 때 마이 카드 · 이용권 화면이 무엇을 보여 줄지.
5. 프로 노트 모양(items vs questions) — 위 프로 노트 참고.
6. GET /me 를 다른 도메인(인증 · 공통)도 정의할 수 있어요 — 합칠 때 MeDetail 하나로.
7. 회원 전용 화면(`app/me/change.tsx` · `study.tsx` · `pass.tsx` · `notes/index.tsx` · `notes/[id].tsx`)은 지점 연동 전(GET /me role guest)이면 앱이 'MemberOnly · 지점 회원이 되면 열려요' 칸만 보여 주고 API 를 부르지 않아요 (components/common/member-lock.tsx). 서버도 그 API 들에서 비회원이면 403 member_only 로 막아 주세요.


<a id="staff"></a>

## 프로 · 직원 (역할별) — 화면별 API

**누가 무엇을 할 수 있는지**는 `openapi.yaml` 맨 위 '누가 부를 수 있나'와 각 API 의 `x-roles` · `x-demo-blocked` 에 있어요. 화면 · 버튼까지 전체 표는 [10-roles](../pages/10-roles.md) (6장 행동별 권한).
계정 역할은 GET /me `role` = `guest · member · pro · manager · hq` (예전 `leader` → `pro`). 프로 · 직원도 **회원 앱을 그대로** 써요 (홈 · 스터디 맵 · 레슨 — 공부도 해요). 아래는 그 위에 더하는 것이에요. 앱 화면은 아직 없고 시안 `prototype/role-screens.html` 기준이에요.

### 역할마다 서버가 막아야 하는 것 (앱만 막으면 안 돼요)
| 하는 일 | 누가 | 서버 | API |
|---|---|---|---|
| 회원 전용 (출석 · 내 스터디 · 이용권 · 프로 노트 · 글쓰기 · 참여) | guest | 403 member_only | 여러 API (GET /me 설명) |
| 연기 · 팀 · 지점 · 레벨 변경 신청 · 체험 예약 (보여 주기 모드) | manager · hq (pro 는 회원처럼 돼요, 2026-11-26) | 403 demo_account (`x-demo-blocked`) | POST /me/deferral-requests · /me/course-change-requests · /me/branch-transfer-requests · /me/level-change-requests · /candidate-inquiries |
| 이벤트 신청 (2026-11-26) | pro · manager · hq 모두 진짜로 돼요 | 막지 않아요 | POST /events/{id}/applications |
| 지점 연동 요청 (2026-11-26) | 연동 전(guest)만 버튼이 보여요 · 이미 연동된 계정에는 안 보여요 | — | POST /me/branch-link-requests |
| 공지 고정 · 글 숨기기 · 이벤트 바로 열기 | manager · hq (pro 는 ×, 2026-11-26) | 나머지 403 (`x-roles`) | POST · DELETE /community/posts/{postId}/pin · /hide, POST /events |
| 스토리 고정 · 다른 사람 스토리 내리기 | manager | 나머지 403 | PUT · DELETE /stories/{storyId}/pin, POST /stories/{storyId}/takedown |
| 이벤트 입금 확인 · 설문 결과 | manager · 그 이벤트 주최 | 나머지 403 | PATCH /events/{id}/applications/{applicationId}, GET /events/{id}/survey-results(.xlsx) |
| 코호스트 정하기 | 그 동아리 HOST · 자기 지점 manager | 나머지 403 | PUT /clubs/{id}/staff |
| 출석 (어느 세션이든 · 등록 팀 · 이용권 확인 없음) | pro · manager · hq | **허용** (진짜 기록 · 포인트 · 랭킹) | POST /study/sessions/{sessionId}/check-in |

### 프로 (pro · hq) — 홈 출석 카드 · 마이 '내 수업' · PRO'S NOTE
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 오늘 내 세션 카드 (여러 개면 옆으로 · 없으면 다음 세션) | GET /staff/sessions/today | new | 없음 |
| 프로 출석 체크 (테이블 QR → 프로로 참여) → 노트 쓰기 바로 열기 | POST /study/sessions/{sessionId}/check-in {role LEADER} → prosNoteId | change | 없음 |
| 프로스 노트 쓰기 · 임시 저장 | GET · PUT /staff/pros-notes/{noteId} | new | 없음 (회원 노트 화면 모양 그대로) |
| 반에 보내기 → 회원 알림 | POST /staff/pros-notes/{noteId}/send | new | 없음 |
| 보낸 노트 목록 (n명 읽음 · 고마워요) | GET /staff/pros-notes | new | 없음 |
| 출석 명단 · 손 출석 · 지각 · 결석 | GET /staff/sessions/{sessionId}/roster · PATCH …/roster/{memberCode} | new | 없음 |
| 세션 진행 (진도 · 토픽 · 질문 카드 · 타이머) | GET /staff/sessions/{sessionId}/plan | new | 없음 |
| 내 일정 (이번 주 · 다음 주, 보기만) | GET /staff/sessions?from&to | new | 없음 |
| 내 반 · 내 반 학생 | GET /staff/teams · GET /staff/teams/{teamId}/students | new | 없음 |
| 반 공지 (휴강 · 교실 · 준비물) | POST /staff/teams/{teamId}/notices | new | 없음 |
| 마이 숫자 칸 (프로: 이번 달 세션 · 출석률 · 보낸 노트 · 받은 고마워요 / 스텝: 참여한 세션 누적) | GET /staff/me/summary (attendanceRate · sessionsTotal) | new | api/my-page.ts proStats · data/account.ts PRO_STATS |
| 이름 옆 `PRO` (라운지 · 프로필) | AuthorRole PRO (글 · 댓글 · 스토리 · 프로필) | change | 앱은 지금 '리더' 글자 |

### 지점 관리자 (manager)
| 화면에서 하는 일 | API (method path) | 상태 | 지금 앱 데이터 |
|---|---|---|---|
| 홈 현황 요약 카드('스텝에게만 보여요' · 오늘 스터디 · 프로/스텝 · 멤버 인원 · 프로 출석 예정과 실제) → 모두 보기(`app/branch/today.tsx`): 세션별 출석 인원 · 테이블(QR)마다 몇 명 · 프로 출석 체크 — 테이블 QR 출석이 바로 반영 | GET /manager/branch/today | new | api/branch-today.ts (가짜: data/branch-today.ts) · components/home/branch-status-card.tsx |
| 출석 명단 보기 | GET /staff/sessions/{sessionId}/roster | new | 없음 |
| 이름 옆 `STAFF` · 소속 줄(지점 이름 · 본사는 PALLO) | AuthorRole STAFF | change | 앱은 지금 '매니저' 글자 |
| 연동 · 체험 · 신고 · 회원 요청 처리 | 앱에 없어요 — 전산(관리자) 웹 | — | — |

기기에만 저장 (API 없음): 개발용 '사람 바꾸기'(마이 DEV · `lib/dev-profile.ts`) — 가짜 서버로 역할마다 화면을 볼 때만 써요.
열린 질문:
- 앱 `state/me.ts` 의 role 값은 아직 `leader` · `manager` 예요. 서버가 `pro` · `hq` 로 주면 앱도 이름을 바꿔요.
- 한 세션에 프로가 둘이 되면(이미 맡은 프로가 있는데 또 '프로로 참여') 둘 다 노트를 쓸지, 한 명만 (10-roles 3-1).
- 프로스 노트 모양: 백엔드는 '리더 질문 → AI 답', 앱은 태그 항목(표현 · 바로잡기 · 뜻 · 질문) + 마무리 인사 (README 9번).
- 보여 주기 모드 오류 코드 이름 `demo_account` 로 할지 (10-roles 7장과 같은 이름).
