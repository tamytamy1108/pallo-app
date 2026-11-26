/** 앱 시작 파일(index.js)이 가장 먼저 불러요 — 꺼져 있을 때 온 푸시 처리기를 화면보다 먼저 등록해요. */
import { registerBackgroundPushHandler } from './push';

registerBackgroundPushHandler();
