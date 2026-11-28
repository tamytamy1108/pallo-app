---
name: PALLO
description: 지점 회화 세션과 앱을 잇는 어학 서비스. 크림 바탕에 잉크 테두리, 노랑과 보라로 수다 떠는 라운지.
colors:
  cream: "#FBF6EA"
  ink: "#1E1A2B"
  ink-sub: "#5A5366"
  line: "#E3DCCB"
  white: "#FFFFFF"
  stage: "#E7E0CF"
  pallo-yellow: "#FFE200"
  pallo-purple: "#493087"
  rose-pink: "#D0798E"
  sky: "#8FA6DC"
  lavender: "#E5DDF6"
  sky-mist: "#E3EAF8"
  lesson-teal: "#138A9E"
  lang-en: "#4463A8"
  lang-ja: "#F06593"
  lang-zh: "#EA373F"
  lang-es: "#69BE5F"
  rate-high: "#2E8B57"
  rate-mid: "#C25E00"
  rate-low: "#D23B3B"
typography:
  display:
    fontFamily: "Unbounded, Noto Sans KR, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.14
    letterSpacing: "-1px"
  headline:
    fontFamily: "Unbounded, Noto Sans KR, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.6px"
  title:
    fontFamily: "Unbounded, Noto Sans KR, sans-serif"
    fontSize: "21px"
    fontWeight: 800
    letterSpacing: "-0.5px"
  body:
    fontFamily: "Noto Sans KR, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.6
  label:
    fontFamily: "Noto Sans KR, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 900
  poster:
    fontFamily: "Unbounded, Noto Sans KR, sans-serif"
    fontSize: "36px"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-1.2px"
  book-cover:
    fontFamily: "DM Serif Display, Georgia, serif"
rounded:
  key: "10px"
  control: "14px"
  card-sm: "18px"
  card: "22px"
  pill: "27px"
  sheet: "28px"
  device: "54px"
spacing:
  gutter: "16px"
  stack: "14px"
  feed: "22px"
  tight: "8px"
components:
  button-primary:
    backgroundColor: "{colors.pallo-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "54px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "54px"
  button-purple:
    backgroundColor: "{colors.pallo-purple}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "40px"
  button-key:
    backgroundColor: "{colors.pallo-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.key}"
    height: "64px"
  button-icon:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    size: "44px"
  chip-filter:
    backgroundColor: "transparent"
    textColor: "{colors.ink-sub}"
    rounded: "15px"
    padding: "0 12px"
    height: "30px"
  chip-filter-selected:
    backgroundColor: "{colors.lavender}"
    textColor: "{colors.pallo-purple}"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.card}"
  sheet:
    backgroundColor: "{colors.cream}"
    rounded: "{rounded.sheet}"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.card-sm}"
    height: "52px"
---

# Design System: PALLO

## Overview

**Creative North Star: "수다 떠는 라운지"**

PALLO는 사람들이 모여 떠드는 라운지 같은 앱이에요. 크림색 바탕 위에 잉크색 굵은 테두리를 두른 카드, 버튼, 포스터가 놓여 있고, 노랑과 보라가 그 사이에서 분위기를 띄워요. 화면은 조용히 정보만 늘어놓지 않아요. 지금 누가 무엇을 하는지, 다음에 어디서 만나는지를 보여 주면서 한마디 걸어 보게 만들어요.

손에 잡히는 느낌이 핵심이에요. 모든 누를 수 있는 것은 장난감처럼 잉크 그림자 위에 떠 있다가, 누르면 그림자만큼 쭉 들어가요. 그림자는 흐릿하게 번지지 않고 칼같이 딱 떨어져요. 깊이감은 빛이 아니라 겹친 종이와 스티커에서 나와요.

정보가 많은 학습 화면은 차분하고 정확하게, 라운지와 포스터는 크고 굵게 써요. 같은 잉크 선, 같은 노랑, 같은 PALLO 캐릭터가 두 쪽을 하나로 묶어요.

**Key Characteristics:**
- 크림 바탕 + 잉크 테두리(2px) + 딱 떨어지는 오프셋 그림자(4px 4px 0)
- 노랑은 화면의 에너지, 보라는 브랜드와 선택 상태
- 누르면 그림자만큼 들어가는 버튼과 카드
- 큰 영문 Unbounded 제목, 본문은 Noto Sans KR
- 원본 3D PALLO 캐릭터와 스파크 심볼

## Colors

크림 종이 위에 잉크로 그리고, 노랑과 보라를 스티커처럼 붙인 팔레트예요.

### Primary
- **PALLO 노랑** (pallo-yellow): 캐릭터의 노랑이자 PALLO의 에너지. 주요 버튼(출석, 참여하기, 다음, +), 탭바 선택 표시, 스토리 테두리, 번개 띠, 포스터 글씨에 넉넉히 써요.
- **PALLO 보라** (pallo-purple): 브랜드 심볼의 보라. 선택된 칩과 탭 밑줄, 동아리, 진행 바, 키보드 포커스 링에 써요.

### Secondary
- **로즈 핑크** (rose-pink): 오늘 스터디 카드, 번개 지도 표시, 이벤트 띠처럼 '지금 열리는 일'에 써요.
- **하늘** (sky): 해외살이, 일상 카테고리, 차분한 보조 카드에 써요.
- **라벤더** (lavender), **하늘 안개** (sky-mist): 보라와 하늘의 아주 옅은 바탕. 선택된 칩, 챌린지 카드, 아이콘 받침에 써요.

### Tertiary
- **언어 색** (lang-en · lang-ja · lang-zh · lang-es): 영어 · 일본어 · 중국어 · 스페인어를 나타낼 때만 써요. 다른 뜻으로 쓰지 않아요.
- **레슨 청록** (lesson-teal): Lv.1 교재 표지 전용이에요.

### Neutral
- **크림** (cream): 앱 바탕과 시트 바탕.
- **잉크** (ink): 글자, 모든 테두리, 모든 그림자.
- **잉크 보조** (ink-sub): 보조 글자, 시간, 설명.
- **선** (line): 목록 안의 옅은 구분선.
- **흰색** (white): 카드와 버튼 면.
- **무대** (stage): 데스크톱에서 폰 프레임 뒤에 깔리는 바탕.

### Named Rules
**The 노랑은 PALLO의 에너지 Rule.** 노랑은 아끼지 않아요. 스토리 테두리, 번개 띠, 아바타, 탭 선택, 주요 버튼 어디서나 화면의 생기를 만들어요. 다만 노란 글자가 노란 도형 위에 겹치지 않게 해요.

**The 잉크만 그림자 Rule.** 그림자는 잉크색(또는 토스트의 노랑)으로만, 번짐 없이 그려요. 회색 블러 그림자는 쓰지 않아요.

**The 언어 색은 언어만 Rule.** 언어 색은 언어를 가리킬 때만 써요. 장식으로 빌려 쓰지 않아요.

## Typography

**Display Font:** Unbounded (with Noto Sans KR, sans-serif)
**Body Font:** Noto Sans KR (with system-ui)
**Book Font:** DM Serif Display, 일본어 표지는 Noto Serif JP

**Character:** 둥글고 넓은 Unbounded가 큰 소리로 말하고, Noto Sans KR이 또박또박 설명해요. 영문 포스터 글씨는 크게, 한국어 본문은 짧고 굵게 써요.

### Hierarchy
- **Display** (800, 30px, 1.14): 홈 인사말처럼 화면을 여는 한마디.
- **Headline** (800, 26px, 1.15): 탭 제목('라운지', '라이브러리').
- **Title** (800, 21px): 시트 제목, 섹션 제목(17px도 써요).
- **Body** (600, 14px, 1.6): 설명과 글. 한국어는 `word-break: keep-all`로 단어 단위로 줄을 바꿔요.
- **Label** (900, 12.5px): 칩, 버튼 보조 글자, 카드 머리 띠.
- **Poster** (800, 36px, 0.95): 이벤트 · 번개 · 동아리 포스터의 큰 영문 글씨.

### Named Rules
**The 큰 글씨는 영문 Rule.** Unbounded 큰 글씨(포스터, 숫자, D-day)는 영문과 숫자에 써요. 한국어 제목은 Noto Sans KR 900으로 써요.

## Layout

폰 한 화면(390px 폭)을 기준으로 해요. 양옆 여백은 16px, 카드 사이는 14px, 라운지 피드 카드 사이는 22px예요. 화면 위에는 상태 표시줄 자리 58px, 아래에는 떠 있는 탭바 자리 150px를 비워 둬요.

가로로 넘기는 줄(스토리, 칩, 탭)은 화면 끝까지 흘러가고, 스크롤바는 숨겨요. 하단 탭바는 화면 아래 24px 위에 떠 있어요. 오른쪽 아래 노란 + 버튼은 탭바 바로 위, 맨 위로 가기 버튼은 그 위에 놓여요.

데스크톱에서는 폰 프레임(390 × 844, 테두리 10px, 모서리 54px)을 무대 바탕 가운데에 놓아요.

## Elevation & Depth

깊이는 흐릿한 그림자가 아니라 겹친 종이에서 나와요. 누를 수 있는 것은 잉크 오프셋 그림자 위에 떠 있고, 누르면 그만큼 내려앉아요. 시트와 스토리처럼 화면 위에 올라오는 면은 그림자 대신 어두운 막(잉크 45%)과 위쪽만 둥근 모서리로 구분해요. 탭바만 예외로 반투명 유리(블러 12px)를 써요.

### Shadow Vocabulary
- **기본 그림자** (`box-shadow: 4px 4px 0 #1E1A2B`): 카드, 버튼, 포스터.
- **작은 그림자** (`box-shadow: 3px 3px 0 #1E1A2B`): 라운지 작은 버튼, 여권 카드.
- **키보드 키** (`box-shadow: 0 6px 0 #1E1A2B`): 레슨 화면 아래 큰 버튼. 누르면 5px 내려가요.
- **토스트** (`box-shadow: 4px 4px 0 #FFE200`): 잉크 토스트 아래 노란 그림자.
- **겹친 회원증** (`box-shadow: 6px 6px 0 -2px #fff, 6px 6px 0 #1E1A2B, 12px 12px 0 -2px #E5DDF6, 12px 12px 0 #1E1A2B`): 동아리 카드 전용.

### Named Rules
**The 누르면 들어가요 Rule.** 그림자가 있는 것은 누를 수 있어요. 누르면 그림자만큼 이동하고 그림자가 0이 돼요(0.15초). 누를 수 없는 것에는 그림자를 달지 않아요.

## Shapes

모든 면은 잉크 2px 테두리로 둘러요(레슨 키는 2.5px). 모서리는 크기에 따라 둥글기가 달라요: 레슨 키 10px, 아이콘 버튼 14px, 작은 카드 18px, 카드 22px, 큰 버튼은 높이의 절반(완전한 알약), 시트 위쪽 28px.

반복되는 모양이 있어요. 번개는 점선과 양옆 반원 홈이 있는 티켓, 동아리는 뒤에 카드가 겹친 회원증, 지도 표시는 PALLO 스파크 심볼, 스토리는 동그라미와 노란 테두리예요.

## Components

### Buttons
누르면 쭉 들어가는 장난감 버튼이에요.
- **Shape:** 완전한 알약(높이 54px, 넓은 버튼 60px).
- **Primary:** PALLO 노랑 면, 잉크 글자 900, 잉크 테두리, 기본 그림자.
- **Secondary:** 흰 면에 같은 테두리와 그림자.
- **Purple:** 동아리 가입처럼 브랜드 행동에 쓰는 보라 면, 흰 글자.
- **Key (레슨):** 모서리 10px, 높이 64px, 아래로만 6px 그림자. 누르면 5px 내려가요.
- **Active:** 그림자만큼 이동, 그림자 0. **Focus:** 보라 3px 외곽선, 2px 띄움.
- **Disabled:** 옅은 베이지 면, 회색 글자, 그림자 없음.

### Chips
- **Style:** 높이 30px 알약, 옅은 베이지 1.5px 테두리, 잉크 보조 글자.
- **State:** 선택되면 라벤더 바탕 + 보라 테두리 + 보라 글자. 지점 선택 칩만 잉크 2px 테두리로 따로 보여요.

### Cards / Containers
- **Corner Style:** 22px.
- **Background:** 흰색. 종류에 따라 핑크 · 하늘 · 라벤더 면도 써요.
- **Shadow Strategy:** 기본 그림자.
- **Border:** 잉크 2px.
- **Internal Padding:** 14~16px.

### Inputs / Fields
- **Style:** 높이 46px, 잉크 2px 테두리, 흰 바탕, 모서리 14px(검색처럼 한 줄 입력은 알약).
- **Focus:** 보라 외곽선.

### Navigation
- **하단 탭바:** 화면 아래 떠 있는 반투명 유리 막대(높이 72px, 모서리 24px, 잉크 테두리). 선택된 탭은 노란 둥근 표시가 미끄러져 들어와요.
- **화면 안 탭:** 글자 탭 줄. 선택된 탭은 잉크 글자 + 보라 3px 밑줄, 나머지는 회보라 글자.

### Sheets
아래에서 올라오는 크림 시트. 위쪽 모서리 28px, 잉크 테두리, 맨 위 손잡이 막대, 뒤는 잉크 45% 막.

### Poster Cards (signature)
라운지의 이벤트 · 번개 · 동아리 카드예요. 위 38px 색 띠가 종류를 알려 줘요(번개 노랑, 동아리 보라, 이벤트 분홍). 그 아래 200px 포스터에 큰 영문 글씨와 브랜드 도형이 들어가요. 번개는 티켓 모양, 동아리는 겹친 회원증 모양이에요.

### Story Row (signature)
62px 동그라미가 10px 간격으로 늘어서요. 안 본 스토리는 노란 테두리(스토리 수만큼 칸이 나뉨), 본 건 얇은 회색 테두리예요.

### Toast
화면 위에서 튀어나오는 잉크 알림. 흰 글자 800, 노란 오프셋 그림자, 모서리 18px.

## Do's and Don'ts

### Do:
- **Do** 누를 수 있는 모든 것에 잉크 2px 테두리와 오프셋 그림자를 주고, 누르면 그림자만큼 들어가게 해요.
- **Do** 노랑을 넉넉히 써서 화면에 생기를 줘요. 같은 색 글자와 도형은 겹치지 않게 해요.
- **Do** 원본 3D PALLO 캐릭터 이미지를 그대로 써요. 색 바꾸기와 좌우 반전만 해요.
- **Do** 지도 표시와 브랜드 장식에는 브랜드 파일의 스파크 심볼을 그대로 써요.
- **Do** 색 카드 위의 카운트다운, 상태, 'D-3' 같은 표시는 박스 없이 글씨로만 써요.
- **Do** 기기에서 '동작 줄이기'를 켜면 모션을 꺼요.

### Don't:
- **Don't** 흐릿한 회색 그림자, 그라데이션 버튼, 유리 효과를 카드에 쓰지 않아요(유리는 하단 탭바만).
- **Don't** 시스템 이모지를 쓰지 않아요. PALLO 전용 SVG 아이콘을 써요.
- **Don't** PALLO 캐릭터를 다시 그리거나 얼굴을 바꾸지 않아요.
- **Don't** 색 카드 위에 작은 박스나 알약 모양 태그를 겹쳐 올리지 않아요.
- **Don't** 인스타그램처럼 보이는 그라데이션 테두리를 쓰지 않아요. 스토리 테두리는 PALLO 노랑이에요.
- **Don't** 언어 색을 언어가 아닌 곳에 쓰지 않아요.
