/**
 * 이메일 회원가입 입력 규칙 (백엔드 POST /auth/signup 과 같게 · docs/api/openapi.yaml AuthSignupRequest).
 * 이메일 100자까지 · 비밀번호 8~64자 영문+숫자 · 이름 20자까지 · 전화번호 010~019.
 */
import { isPhone } from './trial';

export const NAME_MAX = 20;
export const EMAIL_MAX = 100;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;

export type SignupField = 'email' | 'password' | 'passwordConfirm' | 'name' | 'phone';

export type SignupForm = Record<SignupField, string>;

export const EMPTY_SIGNUP: SignupForm = { email: '', password: '', passwordConfirm: '', name: '', phone: '' };

/** 칸 순서 (가입하기를 누르면 위에서부터 첫 문제를 알려요) */
export const SIGNUP_FIELDS: SignupField[] = ['email', 'password', 'passwordConfirm', 'name', 'phone'];

export const isEmail = (v: string) => v.length <= EMAIL_MAX && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const isPassword = (v: string) => v.length >= PASSWORD_MIN && v.length <= PASSWORD_MAX && /[A-Za-z]/.test(v) && /\d/.test(v);

/** 한 칸의 문제 (없으면 null). 빈 칸은 '입력해 주세요' */
export function signupFieldError(field: SignupField, form: SignupForm): string | null {
  const v = field === 'password' || field === 'passwordConfirm' ? form[field] : form[field].trim();
  switch (field) {
    case 'email':
      if (!v) return '이메일을 입력해 주세요';
      return isEmail(v) ? null : '이메일 주소를 확인해 주세요';
    case 'password':
      if (!v) return '비밀번호를 입력해 주세요';
      return isPassword(v) ? null : `영문 · 숫자를 섞어 ${PASSWORD_MIN}자 이상으로 해 주세요`;
    case 'passwordConfirm':
      if (!v) return '비밀번호를 한 번 더 입력해 주세요';
      return v === form.password ? null : '비밀번호가 서로 달라요';
    case 'name':
      if (!v) return '이름을 입력해 주세요';
      return v.length <= NAME_MAX ? null : `이름은 ${NAME_MAX}자까지 쓸 수 있어요`;
    case 'phone':
      if (!v) return '전화번호를 입력해 주세요';
      return isPhone(v) ? null : '전화번호를 확인해 주세요';
  }
}

/** 위에서부터 첫 문제가 있는 칸 (모두 맞으면 null) */
export function firstSignupError(form: SignupForm): { field: SignupField; message: string } | null {
  for (const field of SIGNUP_FIELDS) {
    const message = signupFieldError(field, form);
    if (message) return { field, message };
  }
  return null;
}
