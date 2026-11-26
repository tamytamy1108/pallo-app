/**
 * 내 위치 한 번 받기 — 권한 거절 · 받음 · 위치 실패 · 시간 초과를 던지지 않고 상태로 돌려줘요.
 */
import { LOCATE_TIMEOUT_MS, locateWith, type LocationModule } from '../location';

const mockRequestPerm = jest.fn();
const mockGetPos = jest.fn();
const Location = {
  requestForegroundPermissionsAsync: () => mockRequestPerm(),
  getCurrentPositionAsync: () => mockGetPos(),
  Accuracy: { Balanced: 3 },
} as unknown as LocationModule;
const locateOnce = () => locateWith(Location);

beforeEach(() => {
  mockRequestPerm.mockReset();
  mockGetPos.mockReset();
});

it('권한을 주면 위치를 받아요', async () => {
  mockRequestPerm.mockResolvedValue({ granted: true, canAskAgain: true });
  mockGetPos.mockResolvedValue({ coords: { latitude: 37.5, longitude: 127.1 } });
  await expect(locateOnce()).resolves.toEqual({ status: 'ok', point: { lat: 37.5, lng: 127.1 }, canAskAgain: true });
});

it('권한 거절 — 다시 물을 수 있는지도 같이 알려 주고, 위치는 묻지 않아요', async () => {
  mockRequestPerm.mockResolvedValue({ granted: false, canAskAgain: false });
  await expect(locateOnce()).resolves.toEqual({ status: 'denied', point: null, canAskAgain: false });
  expect(mockGetPos).not.toHaveBeenCalled();
});

it('위치를 못 받으면(위치 꺼짐 등) off', async () => {
  mockRequestPerm.mockResolvedValue({ granted: true, canAskAgain: true });
  mockGetPos.mockRejectedValue(new Error('Location services are disabled'));
  await expect(locateOnce()).resolves.toMatchObject({ status: 'off', point: null });
});

it('너무 오래 걸리면 off', async () => {
  jest.useFakeTimers();
  try {
    mockRequestPerm.mockResolvedValue({ granted: true, canAskAgain: true });
    mockGetPos.mockReturnValue(new Promise(() => {}));
    const p = locateOnce();
    await jest.advanceTimersByTimeAsync(LOCATE_TIMEOUT_MS);
    await expect(p).resolves.toMatchObject({ status: 'off' });
  } finally {
    jest.useRealTimers();
  }
});
