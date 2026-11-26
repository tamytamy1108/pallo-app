import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-native-web-vite';
import type { PluginOption } from 'vite';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 이 앱 node_modules 에만 깔린 패키지 이름들 (react 19.3 · expo 모듈 등). 워크스페이스 루트로 끌어올려진 패키지
 * (@expo-google-fonts/* 등)가 이걸 import 하면 루트에서 못 찾거나 루트의 다른 버전(react 19.0)을 집는다 —
 * Metro 는 앱 기준으로 찾아 주지만 vite 는 아니라서, dedupe 로 늘 이 앱 것을 쓰게 한다.
 */
function appLocalPackages(): string[] {
  const dir = path.join(appRoot, 'node_modules');
  return fs.readdirSync(dir).flatMap((name) => {
    if (name.startsWith('.')) return [];
    if (name.startsWith('@')) return fs.readdirSync(path.join(dir, name)).map((sub) => `${name}/${sub}`);
    return [name];
  });
}

/** 플러그인 배열(중첩 포함)에서 이름이 같은 플러그인을 뺀다. */
function withoutPlugin(plugins: PluginOption[] | undefined, name: string): PluginOption[] {
  return (plugins ?? []).flat(Infinity as 1).filter((p) => !(p && typeof p === 'object' && 'name' in p && p.name === name)) as PluginOption[];
}

/**
 * pallo-app 컴포넌트 카탈로그 — 앱을 띄우지 않고(로그인·서버 없이) 부품을 상태별로 본다
 * (`npm run storybook -w @academy/pallo-app`, 또는 frontend 루트에서 `npm run storybook:pallo-app`).
 * react-native-web 으로 브라우저에 그린다 — `expo start --web` 과 같은 렌더러라 웹 미리보기와 모양이 같다.
 *
 * 스토리는 `stories/` 에만 둔다 — `src/app/` 아래에 두면 Expo Router 가 화면으로 본다.
 */
const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {
      // Reanimated 4 는 worklet 변환(babel)이 있어야 웹에서도 애니메이션이 돈다.
      pluginReactOptions: {
        babel: { plugins: ['react-native-worklets/plugin'] },
      },
    },
  },
  core: { disableTelemetry: true },
  // 기본 react-docgen 은 import 를 따라 react-native/index.js(타입 문법이 섞인 .js)까지 파싱하다 깨진다.
  // 타입스크립트 컴파일러 기반으로 바꿔 props 표 · 컨트롤을 만든다.
  typescript: { reactDocgen: 'react-docgen-typescript' },
  async viteFinal(viteConfig) {
    // 프레임워크가 넣는 vite-tsconfig-paths 는 frontend 루트 tsconfig(expo/tsconfig.base 확장, 해석 불가)까지 읽다가
    // 깨진다. 빼고 tsconfig.json 의 paths(@/*, @/assets/*)를 별칭으로 직접 준다.
    viteConfig.plugins = withoutPlugin(viteConfig.plugins, 'vite-tsconfig-paths');
    viteConfig.resolve = {
      ...viteConfig.resolve,
      dedupe: [...(viteConfig.resolve?.dedupe ?? []), ...appLocalPackages()],
      alias: [
        // 화면(src/app) 스토리를 내비게이터 없이 그리려고 expo-router 를 대역으로 바꾼다 (expo-router-stub.tsx).
        { find: /^expo-router(\/js-stack)?$/, replacement: path.join(appRoot, '.storybook/expo-router-stub.tsx') },
        { find: '@react-native/assets-registry/registry', replacement: path.join(appRoot, '.storybook/assets-registry-stub.ts') },
        { find: /^@\/assets\//, replacement: `${path.join(appRoot, 'assets')}/` },
        { find: /^@\//, replacement: `${path.join(appRoot, 'src')}/` },
      ],
    };
    // expo-modules-core · react-native-svg 는 타입만 쓰는 이름을 값처럼 import 한다(Metro 는 그냥 넘어감).
    // 개발 서버의 의존성 사전 번들링은 이걸 오류로 막아서, 없는 이름은 undefined 로 채우게 한다(빌드는 원래 경고만).
    viteConfig.optimizeDeps = {
      ...viteConfig.optimizeDeps,
      rolldownOptions: { ...viteConfig.optimizeDeps?.rolldownOptions, shimMissingExports: true },
    };
    viteConfig.define = {
      ...viteConfig.define,
      // Expo 번들러(Metro)가 넣어 주는 값들 — vite 에는 없어서 직접 넣는다.
      'process.env.EXPO_OS': JSON.stringify('web'),
      // 스토리는 서버를 부르지 않게 가짜 응답(src/api/mock)으로 돈다.
      'process.env.EXPO_PUBLIC_API_MOCK': JSON.stringify('1'),
    };
    return viteConfig;
  },
};

export default config;
