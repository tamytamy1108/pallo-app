import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GhostButton, YellowButton } from '@/components/lesson/lesson-ui';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { LayerModal } from '@/components/ui/sheet-stack';

const IMG = {
  purple: require('@/assets/characters/c-purple-standard-3d.png'),
  yellow: require('@/assets/characters/c-upright-yellow.png'),
};

/**
 * 레슨 위에 아래쪽 카드로 뜨는 확인 창 (프로토타입 .ls-m · lsModal): 팔로가 카드 위로 고개를 내밀고, 노랑 버튼 + 흰 버튼.
 * - 그만하기: '정말 그만할까요?' · 'n문제만 더 하면 끝나요' [계속하기 / 그만하기]
 * - 다시 열 때: '이어서 할까요?' · 'n/전체까지 했어요' [이어서 하기 / 처음부터 시작하기]
 */
export function LessonModal({
  open,
  img,
  title,
  desc,
  yes,
  no,
  onYes,
  onNo,
}: {
  open: boolean;
  img: 'purple' | 'yellow';
  title: string;
  desc: string;
  yes: string;
  no: string;
  onYes: () => void;
  onNo: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <LayerModal visible={open} transparent animationType="fade" onRequestClose={onYes} statusBarTranslucent>
      <View style={StyleSheet.flatten([styles.dim, { paddingBottom: 16 + insets.bottom }])}>
        <View style={styles.card} accessibilityRole="alert" accessibilityLabel={`${title}. ${desc}`}>
          <Image source={IMG[img]} style={styles.img} contentFit="contain" />
          <PText style={styles.title}>{title}</PText>
          <PText style={styles.desc} color={Colors.inkSub}>
            {desc}
          </PText>
          <YellowButton label={yes} onPress={onYes} style={styles.wide} />
          <GhostButton label={no} onPress={onNo} style={styles.wide} />
        </View>
      </View>
    </LayerModal>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, backgroundColor: 'rgba(30,26,43,0.45)' },
  card: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderBottomWidth: 8,
    borderRadius: 26,
    backgroundColor: Colors.white,
  },
  img: { width: 104, height: 92, marginTop: -52 },
  title: { fontFamily: Font.body900, fontSize: 20, lineHeight: 28 },
  desc: { marginBottom: 10, fontFamily: Font.body700, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  wide: { alignSelf: 'stretch' },
});
