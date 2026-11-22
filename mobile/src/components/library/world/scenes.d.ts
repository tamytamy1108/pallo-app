/** scenes.js (프로토타입 3D 코드를 옮긴 JS) 의 타입 */
import type { Host, Stage } from './stage';

/** 스터디 맵: [이름, 진도, 상태] · 상황 맵: [장면 이름, 아이콘, 상태] (+ sel = 고른 섬) */
export type WorldRow = [string, string, string];
export type WorldSC = WorldRow[] & { sel?: number };

export function mountWorld(host: Host, id: string, SC: WorldSC, onOpen: (no: number) => void): Stage;
export const BUILD: Record<string, unknown>;
