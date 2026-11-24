import { Redirect } from 'expo-router';

/**
 * 로그인은 첫 화면(YOUR FIRST STAGE · /welcome)의 '카카오로 시작하기' 하나로 합쳤어요.
 * 예전 주소(/login)로 들어오면 첫 화면으로 보내요.
 */
export default function LoginScreen() {
  return <Redirect href="/welcome" />;
}
