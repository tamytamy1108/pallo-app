import type { Decorator } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

/** 화면 조각(버튼 · 카드)을 기기 가장자리에서 띄워 보는 여백 — 앱 화면 좌우 여백(20)과 같게. */
export const padded: Decorator = (Story) => (
  <View style={{ padding: 20 }}>
    <Story />
  </View>
);
