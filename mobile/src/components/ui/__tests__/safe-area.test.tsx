import { render } from '@testing-library/react-native';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { SafeAreaView, TightTopInsets, trimTop } from '../safe-area';

const setOS = (os: typeof Platform.OS) => Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });

describe('위 안전 영역 줄이기', () => {
  afterEach(() => setOS('ios'));

  it('아이폰 노치 · 아일랜드만 줄여요', () => {
    setOS('ios');
    expect(trimTop(62)).toBe(50);
    expect(trimTop(59)).toBe(47);
    expect(trimTop(47)).toBe(38);
    expect(trimTop(20)).toBe(20);
    setOS('android');
    expect(trimTop(32)).toBe(32);
  });

  it('SafeAreaView 는 줄인 위 값 + 원래 안쪽 여백을 써요', async () => {
    setOS('ios');
    const insets = { top: 62, bottom: 34, left: 0, right: 0 };
    const { getByTestId } = await render(
      <SafeAreaInsetsContext.Provider value={insets}>
        <TightTopInsets>
          <SafeAreaView testID="safe" edges={['top']} style={{ flex: 1, paddingTop: 4 }} />
        </TightTopInsets>
      </SafeAreaInsetsContext.Provider>,
    );
    const style = StyleSheet.flatten(getByTestId('safe').props.style);
    expect(style.paddingTop).toBe(54);
    expect(style.paddingBottom).toBeUndefined();
  });
});
