# 데이터 모델 (제안)

프로토타입에는 서버가 없어요. 아래 모델은 화면이 쓰는 상태 객체(`S` · `ST` · `LG` · `SET` · `MYAV` · `MS` · `CHG` 등)와 예시 데이터 모양에서 **거꾸로 뽑은 제안**이에요. 이름 · 타입은 개발 쪽에서 정해도 돼요. 확실하지 않은 것은 `[TBC]`로 표시했어요.

## 회원 · 지점 · 수강

### Member
| 필드 | 타입 | 설명 |
|---|---|---|
| id | ID | |
| nickname | string | 화면 이름 (예: Tammy) |
| realName | string | 입금자명 · 체험 신청용 한국어 이름 |
| phone | string | 휴대폰 (확인 필요) |
| email | string? | |
| role | enum | `member` · `guest` · `leader` · `manager` |
| userType | enum | `member`(스터디 회원) · `sub`(앱 구독자) |
| branchIds | ID[] (최대 2) | 다니는 지점 |
| bio | string | 한 줄 소개 |
| studyLang · level | enum · string | 학습 언어 · 레벨 |
| authProviders | enum[] | kakao · apple · google (최소 1개) |
| createdAt · deletedAt | datetime | 탈퇴 처리 [TBC] |

### Branch · Region
| 필드 | 타입 | 설명 |
|---|---|---|
| id · name | | 예: 하남점 |
| region | enum | 서울 · 경기 · 충청 · 경상 |
| mapRegion | enum | 지도 지역: 서울 · 경기 · 천안 · 대전 · 대구 · 울산 · 부산 |
| address · station | string | |
| contact | {phone, hours, staff} | 문의 · 문자 |
| bankAccount | {bank, number, holder} | 이벤트 입금 계좌 |

### Team (수강 반)
| 필드 | 타입 | 설명 |
|---|---|---|
| id · branchId · no | | 예: 3팀 |
| lang · level | | 예: 영어 · Intermediate 2 |
| schedule | string / rule | 예: 화목 19:30 |
| proName | string | 담당 프로 |
| seatsLeft | int | 자리 |
| weekLessons | int[] | 이번 주 진도 (예: [5, 6]) |

### SessionSlot (세션 회차)
| 필드 | 타입 | 설명 |
|---|---|---|
| id · teamId · branchId | | |
| startAt | datetime | |
| lang | enum | |
| qrOpenAt · qrCloseAt | datetime | 시작 −30분 ~ +20분 (확정 필요) |
| rsvpCloseAt | datetime | [TBC] |

### Rsvp · Attendance
| 필드 | 타입 | 설명 |
|---|---|---|
| memberId · slotId | | |
| rsvp | enum | `yes` · `no` |
| lang | enum | 고른 언어 (필수) |
| checkedInAt | datetime? | QR 출석 시각 |
| method | enum | `qr` [TBC: 수동 출석?] |
| points | int | +30 |

### Membership (이용권)
| 필드 | 타입 | 설명 |
|---|---|---|
| plan | string | 예: H+ 6개월 멤버십 · 48회 |
| startAt · endAt | date | |
| total · used | int | 남은 횟수 = total − used |
| postponeLeft · postponeMax | int | 연기 가능 (예: 2 / 3) |
| holds | Hold[] | 최대 2번, 한 번 4주 |

**Hold** — startAt · weeks · status. **PassUsage** — date · slotId · `attend` / `absent`.

### ChangeRequest (연기 · 팀 · 지점 변경)
| 필드 | 타입 | 설명 |
|---|---|---|
| teamId | ID | 바꿀 팀 |
| newStartDate | date | 오늘 + 14일 ~ 멤버십 끝 |
| gap | enum | `keep` · `rest` |
| toTeamId | ID? | 옮길 팀 (없으면 그대로) |
| kinds | enum[] | `postpone` · `team` · `branch` (계산 값) |
| message | string? | 운영진에게 |
| status | enum | `pending` · `approved` · `rejected` · `canceled` [TBC] |

## 학습

### Book · Lesson · Step
| 모델 | 필드 |
|---|---|
| Book | id · lang · level · series · coverColor · kind(`pattern` · `topic` · `debate` · `situation`) · lessonCount · locked |
| Lesson | id · bookId · no · title · story(한 줄 이야기) · page · patterns[3] · content(JSON — `LV1_01` 같은 데이터 객체 하나) · session(Lv.3 회차 양식) · hasData |
| Step | id · lessonId · stage(`pre` · `main` · `post`) · type(STEP_VIEW / TKV 블록) · title · desc · minutes · xp |
| SituationMap | id · title · series · color · about · scenes[] (`{ title, sub, icon, data: { expr, rp } }`) · opensAt(곧 열릴 맵) |

### LessonProgress
| 필드 | 타입 | 설명 |
|---|---|---|
| memberId · lessonId · stepId | | |
| status | enum | `todo` · `in_progress` · `done` |
| pos | int | 멈춘 문제 번호 (`ST.pos[과:단계]`) |
| results | json | 문제별 마지막 결과 (`TK.res`) |
| score · total | int | 최종 점수 |
| firstDoneAt | datetime | 포인트는 처음 완료 때만 |
| skippedByTest | bool | 구간 건너뛰기로 완료 |

**lastOpened** (`ST.last`) — 홈 스터디 맵 위치용, 회원별 1개.

### FirstAnswer (처음 답변)
memberId · lessonId · stepId · text / audioUrl · createdAt — 복습 Before / After · FINAL POSITION 비교용. Lv.3 토론 발화(`ST.talk`)도 같은 방식으로 저장 → IMPROVEMENT 리라이트.

### SavedExpression (내 표현함)
| 필드 | 타입 | 설명 |
|---|---|---|
| text | string | 원래 문장 (AI 교정 후 문장 포함) |
| ko | string | 뜻 |
| card | {expr, ko} | 챌린지용 핵심 표현 (`cardOf`) |
| parts | {pre, ans, post}? | 패턴 하이라이트 |
| src | {kind: `book` · `trip` · `free` · `listen`, label} | 나온 곳 |
| lang | enum | |
| createdAt | datetime | |

### 학습 설정
noSpeakUntil · noListenUntil (datetime, 15분) · sfx(bool) · dailyGoal(int) · listenPrefs(`LRP`) — 기기 간에 같이 쓰려면 서버, 아니면 기기 저장 [TBC].

## 보상 · 캐릭터

| 모델 | 필드 |
|---|---|
| PointLedger | memberId · amount · reason(`attend` · `step` · …) · refId · at → 이번 주 / 이번 달 합계 |
| RankingSnapshot | scope(`member` · `branch`) · period(`week` · `month`) · rank · points · closedAt [TBC] |
| Streak | memberId · currentDays · lastActiveDate (학습 1개 이상 = 이어짐) |
| Badge · MemberBadge | id · name · condition [TBC] / memberId · badgeId · earnedAt |
| Avatar | memberId · color(프리셋 또는 자유 색) · hairColor · bg · equipped{hat, face, wear, mitt, shoe, hand, acc, hair, eye} · flip · say(14자) |
| AvatarItem | id · cat · name · price · rarity(`basic` · `common` · `rare` · `epic` · `season`) · locked |
| SparkLedger | memberId · amount · reason [TBC] |

## 라운지

| 모델 | 주요 필드 |
|---|---|
| Post | authorId · branchIds(작성자 지점) · cat(일상 · 스터디 · 이벤트 · 여행 · 동아리 · 번개) · text · images[{url, ratio}] (≤10) · ratio · likes · comments · hidden · pinned |
| Story | authorId · cat(`LG_SCAT`) · image · title · desc · createdAt · expiresToHighlightAt(+24h) · pinnedByManager · alsoPostToFeed · linkedId(번개 · 이벤트) |
| StoryView | storyId · memberId |
| Comment | targetType(post · story · clubBoard · checkin · expressionEntry) · targetId · parentId(답글) · authorId · text · likes · editedAt · deletedAt |
| Like | targetType · targetId · memberId |
| DirectReply | storyId · from · to · text (스토리 비공개 답장) |
| Meetup (번개) | hostId · title · posters[] · startAt(오늘 ~ +14일) · place{name, address, detail, lat, lng, region} · capacity · fee · status(`open` · `closed` · `past`) · waitlist |
| MeetupMember | meetupId · memberId · greeting · joinedAt |
| Club | hostId · subHostIds(≤3) · name · cat · lang · branchId · region · posters[] · intro · hostIntro · joinCond(`anyone` · 조건) · chatNotice · status(`pending_approval` · `active`) |
| ClubMember | clubId · memberId · role · status(`requested` · `member`) · greeting · joinedAt |
| ClubSession (정기 모임) | clubId · no · startAt · topic · place{…} · capacity · prep(준비물) |
| ClubSessionAttendee | sessionId · memberId · oneLiner(한마디) |
| ClubBoardPost | clubId · type(공지 · 모임 후기 · 가입 인사) · mustRead · authorId · text · images |
| ClubPhoto | clubId · authorId · url · caption |
| ClubChatMessage | clubId · authorId · text · type(`msg` · `join` · `notice`) · at |
| TripPost (여행 동행) | authorId · country · city · from · to · type · styles[] · capacity · cur |
| TripApplication | tripId · memberId · safetyChecked(4개) · status(`pending` · `accepted` · `rejected`) · openChatUrl |
| AbroadProfile (해외살이) | memberId · country · city · intro |
| Save (찜) | targetType · targetId · memberId |
| Report | reporterId · targetType · targetId · reason · status(`open` · `done`) · result(`hide` · `warn` · `restrict` · `ok`) · handledBy · dueAt(+24h) |
| Block | memberId · blockedId |

## 챌린지

| 모델 | 주요 필드 |
|---|---|
| Challenge | hostId · kind(`daily` · `expression`) · cat · name · cardText(2줄) · startAt · days · freq{type: `daily` · `weekly_n` · `weekdays`, n, days[]} · method(`comment` · `photo_comment`) · guide · expression{text, ko, src} · endsAt |
| ChallengeMember | challengeId · memberId · joinedAt (표현 챌린지는 첫 글 시각) |
| ChallengeCheckin | challengeId · memberId · date(하루 1번) · text · images |
| ExpressionEntry | challengeId · authorId · type(`sentence` · `tip`) · text · likes |

중복 판단 규칙: 표현 글자를 소문자 · 기호 없이 정규화, 기간이 남은 챌린지 중 한쪽이 다른 쪽을 포함하면 같은 표현.

## 이벤트

| 모델 | 주요 필드 |
|---|---|
| Event | hostId(리더 · 매니저) · branchId(또는 전 지점) · cat(파티 · 클래스 · 여행) · title · posters[] · startAt · endInfo · place{…} · capacity · fee · feeBefore(할인 전) · intro · contact · survey[] (≤5) · refundPolicy [TBC] |
| SurveyQuestion | text · type(`one` · `multi` · `text`) · options[] · required |
| EventApplication | eventId · memberId · answers · status(`pending_payment` · `confirmed` · `canceled` · `expired`) · payDeadline(+24h) · paidConfirmedBy [TBC] |
| EventProposal | memberId · photos[] · branchId · addressDetail · wishDate(+7일 ~ +3달) · cat · title · desc · expectedSize · feeType · status(`reviewing` · `accepted` · `rejected` · `canceled`) |

## 운영 · 지원

| 모델 | 주요 필드 |
|---|---|
| Notice | tag(공지 · 이벤트 · 새 소식) · target(전 지점 · 지점) · title · body[] · cta{label, link} · pinned · publishedAt · author |
| Notification | memberId · kind(`notice` · `learn` · `lounge` · `event`) · text · link · readAt |
| ProNote | memberId · teamId · sessionDate · proName · items[{type: 표현 · 바로잡기 · 뜻 · 질문, text, example}] · closing · thankedAt |
| Inquiry | memberId · type · body · status(`waiting` · `answered`) · answer |
| Payment | memberId · date · item · amount · method · status(`paid` · `refunded`) · receipt |
| LevelChangeRequest | memberId · direction · reason · status |
| TrialBooking | name · phone · level · branchId · lang · date(일요일 제외) · time · consentAt |
| Terms | kind · version · effectiveAt · body |
| Settings | `SET0` 키 전부 + mktConsentAt |

## 시작 · 사용 가이드 (관리자 웹에서 올림)

자세한 규칙은 [pages/09-onboarding.md](../pages/09-onboarding.md).

| 모델 | 주요 필드 |
|---|---|
| StartScreen | images{short(1242×2208), regular(1290×2780), long(1290×2866)} · bgColor(남는 곳 채우는 색) · imageAlt · from · until? · order · status(`draft` · `scheduled` · `live` · `ended`) · updatedBy · updatedAt |
| Guide | audience(`all` · `member` · `guest` · `sub`) · version · status(`draft` · `live`) · reshow(이미 본 회원에게 한 번 더) · publishedAt · publishedBy |
| GuideSlide | guideId · order(1~5) · image(정사각형 1080px+) · imageAlt · bg(`yellow` · `lavender` · `pink` · `mist` · `beige` · `white`) · title(≤20자) · body?(≤60자) |
| GuideView | memberId · guideVersion · result(`completed` · `skipped`) · lastIndex · viewedAt |

Member에 더할 것: `onboardedAt`(가입 단계 끝난 시각, 없으면 다음 로그인 때 가입 단계로) · `avatarBody`(가입 때 고른 몸 색)

### BranchLinkRequest (지점 연동 요청)
| 필드 | 타입 | 설명 |
|---|---|---|
| id · memberId · branchId | ID | 지점마다 `pending`은 하나만 |
| name · phone | string | 지점에 등록한 이름 · 휴대폰 (앱이 보낸 값) |
| status | enum | `pending` · `linked` · `rejected` · `canceled` · `unlinked` |
| branchMemberRef | string? | 지점 전산 회원 번호 (예: H-0412). 연동하면 채워짐 |
| reasonCode · reasonText | enum? · string? | 못 찾음 이유 (`phone_mismatch` · `name_mismatch` · `not_member` · `already_linked` · `other`) — 회원에게 보여요 |
| consentAt | datetime | 지점에 정보 보내기 동의 |
| requestedAt · handledAt · handledBy | datetime · datetime? · ID? | 처리한 매니저 |
