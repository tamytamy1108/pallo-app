/**
 * 앱 시작 파일 — 앱이 꺼져 있을 때 온 푸시를 받으려면 화면(expo-router)보다 먼저 등록해야 해서 따로 뒀어요.
 * import 는 적힌 순서대로 실행돼요. 푸시 등록 → expo-router 시작.
 */
import './src/lib/push-background';
import 'expo-router/entry';
