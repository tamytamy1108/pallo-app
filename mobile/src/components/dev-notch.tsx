import { useContext, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

/**
 * 개발용 (웹에서만): 주소에 ?notch=1 을 붙이면 iPhone 15 처럼 위 59 · 아래 34 안전 영역과
 * 가짜 상태 바(9:41 · 다이내믹 아일랜드 · 배터리) · 홈 막대를 그려요. 실제 폰에서 시간과 겹치는지 볼 때 써요.
 * 한 번 켜면 새로고침 전까지 화면을 옮겨도 그대로예요. 실제 앱에서는 아무 일도 안 해요.
 */
/** ?notch=1 아이폰 15 (아일랜드) · ?notch=se 아이폰 SE (홈 버튼 · 위 20) · ?notch=android 안드로이드 (위 32) */
const KIND = Platform.OS === 'web' && __DEV__ && typeof window !== 'undefined' ? (window.location.search.match(/[?&]notch=(1|se|android)\b/)?.[1] ?? null) : null;
const DEVICES = {
  '1': { top: 59, bottom: 34, island: true, home: true },
  se: { top: 20, bottom: 0, island: false, home: false },
  android: { top: 32, bottom: 24, island: false, home: true },
} as const;
const DEV = KIND ? DEVICES[KIND as keyof typeof DEVICES] : null;
const INSETS = { top: DEV?.top ?? 0, bottom: DEV?.bottom ?? 0, left: 0, right: 0 };

export function DevNotch({ children }: { children: ReactNode }) {
  const parent = useContext(SafeAreaInsetsContext);
  const [dev] = useState(DEV);
  if (!dev) return <>{children}</>;
  return (
    <SafeAreaInsetsContext.Provider value={{ ...(parent ?? INSETS), ...INSETS }}>
      {children}
      <View style={[styles.bar, { height: dev.island ? 54 : dev.top, paddingTop: dev.island ? 4 : 0, paddingLeft: dev.island ? 48 : 16, paddingRight: dev.island ? 32 : 12 }]} pointerEvents="none">
        <Text style={[styles.time, !dev.island && styles.timeSmall]}>9:41</Text>
        {dev.island ? <View style={styles.island} /> : null}
        <View style={styles.icons}>
          <View style={styles.signal} />
          <View style={styles.battery} />
        </View>
      </View>
      {dev.home ? <View style={styles.home} pointerEvents="none" /> : null}
    </SafeAreaInsetsContext.Provider>
  );
}

// 글자색은 가운데 회색: 밝은 화면 · 어두운 화면 둘 다에서 자리가 보이게 (실제로는 화면마다 흰색 · 검정으로 바뀌어요)
const MARK = '#8A8494';

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, top: 0, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 48, paddingRight: 32, paddingTop: 4, zIndex: 9999 },
  time: { fontSize: 17, fontWeight: '600', color: MARK },
  timeSmall: { fontSize: 12 },
  island: { position: 'absolute', left: '50%', top: 11, width: 125, height: 37, marginLeft: -62.5, borderRadius: 19, backgroundColor: '#000' },
  icons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  signal: { width: 18, height: 11, borderRadius: 2, backgroundColor: MARK },
  battery: { width: 26, height: 12, borderRadius: 4, borderWidth: 1.5, borderColor: MARK },
  home: { position: 'absolute', bottom: 8, left: '50%', width: 134, height: 5, marginLeft: -67, borderRadius: 3, backgroundColor: MARK, zIndex: 9999 },
});
