# 꾸미기 아이템 그림 (av-art)

마이 › 꾸미기의 아이템 · 배경 그림 원본과 PNG 뽑는 도구예요.
카테고리(헤어 · 눈 · 모자 · 얼굴 · 옷 · 장갑 · 신발 · 손 · 액세서리 · 배경)마다 10개씩.

- `art.js` — 원본 그림 (SVG). 캐릭터 원본 좌표(520 × 332) 위에 그려서 눈 · 팔 · 다리 자리에 꼭 맞아요.
  옷 · 장갑 · 신발은 몸 모양(`body-mask.png`)으로 자르고 캐릭터 원본(`up-yellow.png`)의 빛 · 그림자를 곱해요.
- `lab.html` — 노랑 캐릭터에 입혀 보는 작업대 (`?cat=hat` · `?cat=combo` · `&w=380` 크게).
- `export.html` — PNG 를 떠서 `assets/characters/av/` 에 저장하고 `geo.json`(자리)을 만들어요.
- `make-assets.js` — `geo.json` → `src/components/character/av-assets.ts` · `src/data/av-items.ts`.

## 고치는 순서

```bash
node mobile/scripts/av-art/serve.js
```

1. `art.js` 를 고치고 http://localhost:8765/lab.html 에서 확인
2. http://localhost:8765/export.html 열기 → "끝 ✓" 나올 때까지 기다리기
3. `node mobile/scripts/av-art/make-assets.js`

새 아이템은 `art.js` 의 해당 목록에 한 줄 더하면 돼요 (id · 이름 · 가격 · 등급 · 그림).
