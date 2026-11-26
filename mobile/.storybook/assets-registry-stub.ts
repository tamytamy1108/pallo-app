/**
 * `@react-native/assets-registry/registry` 대역. react-native-svg 웹 코드가 import 하는데, RN 0.88 워크스페이스엔
 * 이 패키지가 따로 깔려 있지 않다(Metro 가 직접 채움). vite 에선 require('x.png') 가 숫자 id 가 아니라 URL 문자열이라
 * 레지스트리를 찾을 일이 없어, 빈 레지스트리로 둔다.
 */
type Asset = { width?: number; height?: number; scales: number[]; httpServerLocation: string; name: string; type: string };

const assets: Asset[] = [];

export function registerAsset(asset: Asset): number {
  return assets.push(asset);
}

export function getAssetByID(id: number): Asset | undefined {
  return assets[id - 1];
}
