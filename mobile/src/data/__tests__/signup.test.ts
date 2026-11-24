/**
 * 이메일 가입 입력 규칙이 백엔드 규칙(8~64자 영문+숫자 · 010~019 · 이름 20자)과 맞는지 확인해요.
 */
import { EMPTY_SIGNUP, firstSignupError, isEmail, signupFieldError, type SignupForm } from '../signup';

const OK: SignupForm = { email: 'me@pallo.app', password: 'pallo1234', passwordConfirm: 'pallo1234', name: '김팔로', phone: '010-1234-5678' };

describe('signup rules', () => {
  it('passes a complete form', () => {
    expect(firstSignupError(OK)).toBeNull();
  });

  it('reports the first empty field from the top', () => {
    expect(firstSignupError(EMPTY_SIGNUP)?.field).toBe('email');
    expect(firstSignupError({ ...OK, name: '  ' })?.field).toBe('name');
  });

  it('checks email shape', () => {
    expect(isEmail('a@b.co')).toBe(true);
    expect(isEmail('a@b')).toBe(false);
    expect(isEmail('a b@c.com')).toBe(false);
  });

  it('needs letters and digits, 8 to 64 characters', () => {
    expect(signupFieldError('password', { ...OK, password: 'abcdefgh' })).not.toBeNull();
    expect(signupFieldError('password', { ...OK, password: '12345678' })).not.toBeNull();
    expect(signupFieldError('password', { ...OK, password: 'abc1234' })).not.toBeNull();
    expect(signupFieldError('password', { ...OK, password: `a1${'x'.repeat(63)}` })).not.toBeNull();
    expect(signupFieldError('password', { ...OK, password: 'abcd1234' })).toBeNull();
  });

  it('compares the confirmation with the password', () => {
    expect(signupFieldError('passwordConfirm', { ...OK, passwordConfirm: 'pallo12345' })).toBe('비밀번호가 서로 달라요');
  });

  it('accepts 010~019 phone numbers with or without hyphens', () => {
    expect(signupFieldError('phone', { ...OK, phone: '01012345678' })).toBeNull();
    expect(signupFieldError('phone', { ...OK, phone: '011-123-4567' })).toBeNull();
    expect(signupFieldError('phone', { ...OK, phone: '02-123-4567' })).not.toBeNull();
  });
});
