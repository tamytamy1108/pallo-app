# 라이브러리 상황 맵 데이터 (프론트 → 백엔드)

상황 맵(여행 · 비즈니스 · 카페 · 캠퍼스 …)은 **모양**과 **내용**으로 나뉘어요.

| | 어디에 | 바꾸려면 |
|---|---|---|
| 모양 (3D 섬 · 정류장 자리) | 앱 코드 `mobile/src/components/library/world/presets.ts` + `scenes.js` | **앱 업데이트** |
| 내용 (이름 · 색 · 장면 · 공개일 · 순서) | 지금은 `mobile/src/data/maps/situation-maps.json`, 나중엔 API | **관리자 웹에서 바로** |

앱은 맵 목록을 `getMaps()` 한 곳에서만 받아요 (`mobile/src/data/maps/index.ts`).
지금은 앱에 든 JSON 을 돌려주고, API 가 생기면 이 함수만 `GET /library/maps` 응답으로 바꿔요. 화면 코드는 그대로예요.

## API

`GET /library/maps` (api-inventory 16번) → 아래 모양의 배열. 숨김(`hidden`) 맵은 서버가 빼고 보내도 되고, 보내도 앱이 빼요.

```jsonc
{
  "id": "airport",              // 맵 id. 장면 id = '맵 id-장면 번호' (airport-1), 진도 키에도 써요 → 한 번 정하면 바꾸지 않기
  "preset": "island-travel",    // 모양 키 (아래 표). 앱에 없는 키면 '업데이트하면 열려요' 칩
  "lang": "en",                 // en · ja · zh · es
  "order": 5,                   // 칩 순서 (작을수록 앞)
  "title": "공항",
  "series": "AIRPORT",          // 표지 · 머리 글자
  "color": "#8FA6DC",           // 맵 색 '#RRGGBB'
  "about": "체크인부터 탑승까지",
  "isNew": true,                // NEW 표시 (회원이 한 번 열면 꺼져요)
  "opensAt": "2026-12-15",      // 선택. 이 날 전에는 '12/15 열림' 칩만 (회원 기기 날짜 기준)
  "locked": false,              // 선택. true 면 '커밍순' 칩만
  "hidden": true,               // 선택. true 면 아예 안 보여요 (만드는 중 · 샘플)
  "scenes": [
    { "no": 1, "title": "체크인", "sub": "Check-in", "icon": "pass", "contentId": "airport-1" }
  ]
}
```

장면 줄:

| 필드 | 뜻 |
|---|---|
| `no` | 1부터. 지도 정류장 순서 |
| `title` · `sub` | 한국어 제목 · 영어 부제 |
| `icon` | 정류장 아이콘 이름 (앱에 있는 것: plane seat pass taxi hotel food bag map brief chat mail deal mic coffee book group lib star dorm) |
| `contentId` | 장면 콘텐츠 id (`GET /lessons/:id`, api-inventory 18번). `null` 이면 '커밍순' 장면 |

## 모양 프리셋 (앱에 들어 있는 것)

| 키 | 모양 | 정류장 수 |
|---|---|---|
| `island-travel` | 해변 리조트 섬 | 8 |
| `island-biz` | 도심 빌딩 섬 | 5 |
| `island-cafe` | 역 앞 카페 섬 | 3 |
| `island-campus` | 대학 도서관 섬 | 6 |
| `island-study` | 교재 책장 섬 (스터디 맵 전용, 상황 맵엔 안 써요) | 5 |

- 장면이 정류장 수보다 많으면 넘는 장면은 지도에 안 올라가요. 관리자 웹에서 저장할 때 막아 주세요.
- 같은 모양을 여러 맵이 같이 써도 돼요 (공항 맵 = `island-travel`).

## 누가 무엇을 바꾸나

| 바꿀 것 | 관리자 웹 | 앱 업데이트 |
|---|---|---|
| 새 맵 추가 (있는 모양 고르기) | ✅ | |
| 이름 · 부제 · 소개 · 색 · NEW | ✅ | |
| 칩 순서 · 공개일 · 커밍순 · 숨김 | ✅ | |
| 장면 추가 · 순서 · 아이콘 (앱에 있는 아이콘 중) | ✅ (정류장 수까지) | |
| 장면 콘텐츠 (표현 · 롤플레이 · 퀴즈) | ✅ (`/lessons/:id`) | |
| 맵 id 바꾸기 | ❌ 진도가 끊겨요 | |
| 새 모양 · 정류장 수 늘리기 · 새 아이콘 · 하늘색 | | ✅ |

## 새 맵을 지금(목 데이터로) 넣어 보려면

`situation-maps.json` 에 한 줄을 더해요. 파일 끝의 `airport` 줄이 예시예요 (`hidden: true` 라 안 보여요).
`hidden` 을 지우고 `opensAt` 을 지난 날짜로 바꾸면 칩 · 3D 지도 · 장면 목록이 저절로 생겨요.
확인용 테스트: `mobile/src/data/maps/__tests__/maps.test.ts`.

## 아직 안 하는 것

- 하늘 2색(`sky`) 같은 모양 세부 바꾸기 — 프리셋마다 그림이 달라 나중에 정해요.
- 스터디 맵(교재 책장)은 교재 목록(`/library/books`)에서 오고, 이 문서 범위 밖이에요.
- 2D 그림 + 정류장 점 찍기(B안)는 나중에. 그때는 `preset` 대신 그림 주소와 점 좌표가 들어와요.
