import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useFocusRing } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

type Props = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  /** 틀린 값: 테두리를 붉게 */
  invalid?: boolean;
};

/**
 * 비밀번호 칸: TextField(네모 칸)와 같은 모양 · 오른쪽 눈 버튼으로 글자 보이기/숨기기.
 * 라벨 · 안내 줄은 부르는 쪽이 그려요.
 */
export function PasswordField({ invalid = false, ...rest }: Props) {
  const [shown, setShown] = useState(false);
  const focus = useFocusRing(rest);
  return (
    <View>
      <TextInput
        placeholderTextColor="#8C8597"
        selectionColor={Colors.purple}
        cursorColor={Colors.purple}
        textAlignVertical="center"
        autoCapitalize="none"
        autoCorrect={false}
        {...rest}
        {...focus}
        secureTextEntry={!shown}
        style={[styles.input, invalid && styles.invalid, focus.ringStyle]}
      />
      <Pressable
        onPress={() => setShown((s) => !s)}
        sound="toggle"
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={shown ? '비밀번호 숨기기' : '비밀번호 보기'}
        style={styles.eye}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={shown ? Colors.purple : Colors.inkSub} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <Circle cx={12} cy={12} r={3} />
          {shown ? null : <Path d="M4 4l16 16" />}
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // TextField 네모 칸과 같아요 (.lg-fl input) · 눈 버튼 자리만큼 오른쪽을 비워요
  input: {
    height: 46,
    paddingLeft: 14,
    paddingRight: 48,
    paddingVertical: 0,
    includeFontPadding: false,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    fontFamily: Font.body700,
    fontSize: 14,
    color: Colors.ink,
  },
  invalid: { borderColor: '#B23A5A' },
  eye: { position: 'absolute', right: 2, top: 1, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
