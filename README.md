# Pallo 앱

`frontend/apps/pallo-app` 에 있는 Pallo 앱 코드와 문서예요.

| 폴더 · 파일 | 내용 |
| --- | --- |
| `mobile/` | Expo React Native 앱 (화면 `src/app`, API `src/api`, 목 데이터 `src/data`, 로컬 상태 `src/state`) |
| `prototype/` | HTML 화면 시안 · 디자인 옵션 비교 |
| `characters/` | 캐릭터 3D 모델 · 색 팔레트 |
| `docs/` | 문서. 서버 API 는 `docs/api/` |
| `PRODUCT.md` · `DESIGN.md` | 제품 · 디자인 원칙 |

## 서버 API 문서 (`docs/api/`)

앱 화면마다 서버에서 받아야 할 것을 OpenAPI(Swagger)로 정리했어요.

- `openapi.yaml`: API 전체. `x-status` 로 이미 있음(existing) · 필드 추가(change) · 새로 필요(new) 를 나눠요.
- `screens.md`: 화면별로 어떤 API 를 부르는지.
- `README.md`: 보는 법, 규칙, 아직 정할 것.

로컬에서 Swagger 로 보기 (저장소 맨 위에서):

```bash
npx -y http-server@14.1.1 frontend/apps/pallo-app/docs/api -p 8090 -s -c-1
```

그다음 http://localhost:8090 을 열어요.

## API 문서 자동 최신화 루틴

앱과 백엔드가 계속 바뀌니까, Claude 예약 작업 **Pallo API 문서 최신화**(`pallo-api-docs-sync`)가 문서를 따라 고쳐요.

- **언제:** 매일 10시 · 13시 · 16시 · 19시 · 22시. Claude 앱이 꺼져 있으면 다음에 켤 때 돌아요.
- **보는 것:** secret `wip/local-main-pre-mobile` 의 새 커밋 중 API 에 영향 있는 것만.
  - 앱: 새 화면 · 새 동작(만들기 · 신청 · 삭제 등) · 목 데이터의 새 필드 · 역할 · 이름 변경
  - 백엔드: 새로 생기거나 바뀐 `@*Mapping` 경로 → 문서의 new 를 existing / change 로 바꿈
  - 스타일 · 애니메이션 · 스토리북만 바뀐 건 무시
- **하는 일:** wip 에서 `claude/api-sync-…` 브랜치를 따서 `openapi.yaml` · `screens.md` 를 고치고, lint(`@redocly/cli`)를 통과시킨 뒤 wip 에 `--no-ff` 로 합치고 secret 에 push 해요. 정하기 애매한 정책은 `docs/api/README.md` 의 "정할 것" 에 남겨요.
- **멈추는 때:** 작업 공간에 커밋 안 된 변경이 있거나 wip 에 합칠 때 충돌이 나면, 고치지 않고 이유를 보고해요.
- **지킬 것:** secret `main` 은 건드리지 않고, force-push 하지 않아요.
- 마지막으로 확인한 커밋은 `~/.claude/scheduled-tasks/pallo-api-docs-sync/last-commit` 에 적어 둬요. 실행 시간 · 내용은 Claude 앱의 Scheduled 에서 바꿔요.
