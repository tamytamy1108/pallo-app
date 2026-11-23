import { GLView, type GLViewProps, type SurfaceCreateEvent } from 'expo-gl';
import { useState } from 'react';
import { Platform } from 'react-native';

/** 그리기 판이 준비됐는데 GL 이 아직 안 붙었으면 이만큼(프레임) 기다려요 (~1초) */
const WAIT_FRAMES = 60;
/** 끝내 안 붙으면 판을 새로 만들어 다시 해 보는 횟수 */
const RETRIES = 2;

const glContexts = () => (globalThis as { __EXGLContexts?: Record<string, unknown> }).__EXGLContexts;

/**
 * expo-gl GLView 그대로인데, '그리기 판 준비됨' 신호를 받았을 때 GL 이 없으면 앱을 죽이지 않아요.
 * 지도 탭을 빠르게 오가면 판이 만들어지자마자 치워지거나 GL 이 붙지 못해서,
 * expo-gl 이 빈 값을 그대로 써 'Cannot set property __expoSetLogging of undefined' 로 멈췄어요.
 * → GL 이 붙을 때까지 기다리고, 그사이 화면에서 빠졌으면 그만둬요. 끝내 안 붙으면 onLost (판을 새로 만들어요).
 */
class GuardedGLView extends GLView {
  /** GL 이 끝내 안 붙었을 때 (SafeGLView 가 넣어요) */
  onLost: (() => void) | null = null;
  private gone = false;

  constructor(props: GLViewProps) {
    super(props);
    const create = this._onSurfaceCreate;
    this._onSurfaceCreate = (event: SurfaceCreateEvent) => {
      const id = event.nativeEvent.exglCtxId;
      let frames = 0;
      const attach = () => {
        if (this.gone) return;
        if (glContexts()?.[String(id)]) {
          create({ nativeEvent: { exglCtxId: id } });
          return;
        }
        frames += 1;
        if (frames > WAIT_FRAMES) {
          if (__DEV__) console.log(`[gl] context ${id} never attached`);
          this.onLost?.();
          return;
        }
        requestAnimationFrame(attach);
      };
      attach();
    };
  }

  componentWillUnmount() {
    this.gone = true;
    super.componentWillUnmount();
  }
}

/** 폰: GL 이 안 붙으면 판을 새로 만들어 최대 RETRIES 번 다시 (그래도 안 되면 지도 없이 바탕만) */
function NativeSafeGLView(props: GLViewProps) {
  const [attempt, setAttempt] = useState(0);
  return (
    <GuardedGLView
      key={attempt}
      {...props}
      ref={(view) => {
        if (view) view.onLost = () => setAttempt((n) => (n < RETRIES ? n + 1 : n));
      }}
    />
  );
}

/** 웹은 캔버스라 이 문제가 없어요 — 폰에서만 지켜요 */
export const SafeGLView = Platform.OS === 'web' ? GLView : NativeSafeGLView;
