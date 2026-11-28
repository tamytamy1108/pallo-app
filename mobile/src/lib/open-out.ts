/** 앱 밖으로: 지도에서 주소 찾기 · 전화 · 문자 · 복사. 못 열면 알려 줘요. */
import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';

import { showToast } from '@/components/ui/toast';

/** 네이버 지도에서 주소 · 이름으로 찾기 (앱이 있으면 앱, 없으면 웹) */
export function openMap(query: string) {
  Linking.openURL(`https://map.naver.com/p/search/${encodeURIComponent(query)}`).catch(() => showToast('지도를 열 수 없어요'));
}

/** 전화 앱에 번호를 넣어 열어요 (바로 걸지는 않아요) */
export function openTel(tel: string) {
  Linking.openURL(`tel:${tel.replace(/[^0-9+]/g, '')}`).catch(() => showToast(`${tel} · 이 기기에서는 전화를 걸 수 없어요`));
}

/** 문자 앱에 번호를 넣어 열어요 */
export function openSms(tel: string) {
  Linking.openURL(`sms:${tel.replace(/[^0-9+]/g, '')}`).catch(() => showToast(`${tel} · 이 기기에서는 문자를 보낼 수 없어요`));
}

/** 클립보드에 넣고 알려 줘요 (폰 · 웹 모두) */
export function copyText(text: string, msg: string) {
  Clipboard.setStringAsync(text)
    .then(() => showToast(msg))
    .catch(() => showToast('복사하지 못했어요'));
}

/** 전화번호 복사 — '번호를 복사했어요 · 번호' */
export function copyTel(tel: string) {
  copyText(tel, `번호를 복사했어요 · ${tel}`);
}
