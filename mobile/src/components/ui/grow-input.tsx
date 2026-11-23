import { useState, type ComponentProps } from 'react';
import { StyleSheet, TextInput } from 'react-native';

type Props = ComponentProps<typeof TextInput>;

/**
 * 여러 줄 입력칸: 길게 쓰면 칸이 저절로 늘어나요 (안에 스크롤이 생기지 않게).
 * style 의 minHeight 아래로는 줄지 않아요. 나머지는 TextInput 과 똑같이 써요.
 */
export function GrowInput({ style, onContentSizeChange, ...rest }: Props) {
  const [h, setH] = useState(0);
  const minH = (StyleSheet.flatten(style)?.minHeight as number | undefined) ?? 0;
  return (
    <TextInput
      {...rest}
      multiline
      scrollEnabled={false}
      onContentSizeChange={(e) => {
        setH(Math.ceil(e.nativeEvent.contentSize.height));
        onContentSizeChange?.(e);
      }}
      style={[style, { height: Math.max(minH, h + 2) }]}
    />
  );
}
