/**
 * 개발용 프로필 (폰 · 웹): 개발 서버를 `EXPO_PUBLIC_DEV_PROFILE=linked npx expo start` 로 켜면 '지점에 연동된 회원'으로 바로 시작해요.
 * - 지점이 연동을 승인하는 관리자 웹이 아직 없어서, 폰에서는 가입 → 연동 확인 중에서 더 나아갈 수 없어요. 연동된 화면은 이걸로 봐요
 * - 첫 화면(가입)을 건너뛰고 홈부터 · 앱을 열 때마다 연동된 회원으로 돌려놔요 (state/me)
 * - 저장은 따로 (폰: 문서 폴더 `pallo@linked/` · 웹: localStorage `pallo@linked-<키>`) → 보통 앱의 가입 · 연동 기록과 섞이지 않아요
 * 실제 앱(__DEV__ 아님)에서는 늘 '' 예요.
 */
const raw = process.env.EXPO_PUBLIC_DEV_PROFILE;

export const devProfile: '' | 'linked' = __DEV__ && raw === 'linked' ? 'linked' : '';
