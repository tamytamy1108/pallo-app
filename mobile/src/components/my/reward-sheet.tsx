import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AvatarStage } from '@/components/character/avatar';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { type Avatar } from '@/data/my';
import { avBgs, avItem } from '@/state/av-catalog';
import { REWARD } from '@/data/rewards';
import { haptic, sfx } from '@/lib/feedback';
import { cloneAvatar, useMyAvatar } from '@/state/avatar';
import { eul, markRewardSeen, useUnseenReward } from '@/state/rewards';

/** 보상 아이템을 입혀 본 모습 (배경은 'bg:' 키) */
export function wearReward(a: Avatar, keys: readonly string[]): Avatar {
  const x = cloneAvatar(a);
  keys.forEach((k) => {
    const it = avItem(k);
    if (k.startsWith('bg:')) x.bg = k.slice(3);
    else if (it) x.eq[it.cat] = k;
  });
  return x;
}

/**
 * 시즌 보상을 받았을 때 한 번 뜨는 창 (앱 어디서든 · app/_layout 에 붙어 있어요).
 * 서버가 조건(예: 12월 출석 7일)을 채운 걸 보고 자동으로 넣어 주면, 다음에 앱을 열 때 이 창 + 알림함 한 줄이 생겨요.
 * 내 캐릭터가 받은 아이템을 입은 모습 · 무엇을 채워서 받았는지 · [나중에] [입어 보기](꾸미기에 입혀서 열려요 · 저장은 직접).
 */
export function RewardHost() {
  const unseen = useUnseenReward();
  const av = useMyAvatar();
  // 띄운 보상은 닫히는 움직임이 끝날 때까지 붙잡아 둬요 (본 걸로 바꿔도 창이 바로 사라지지 않게)
  const [id, setId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [go, setGo] = useState<Href | null>(null);
  if (unseen && !id) {
    setId(unseen);
    setOpen(true);
  }
  const r = id ? REWARD[id] : null;
  if (!r || !id) return null;
  const close = (to?: Href) => {
    setGo(to ?? null);
    setOpen(false);
    markRewardSeen(id);
  };
  const names = r.items.map((k) => (k.startsWith('bg:') ? `${avBgs().find((b) => b.id === k.slice(3))?.name ?? ''} 배경` : (avItem(k)?.name ?? k))).join(' · ');
  return (
    <Sheet
      open={open}
      onClose={() => close()}
      onClosed={() => {
        setId(null);
        if (go) router.push(go);
      }}
      label={`${r.name} 받음`}
      footer={
        <>
          <Button label="나중에" variant="secondary" wide onPress={() => close()} />
          <Button
            label="입어 보기"
            wide
            onPress={() => {
              sfx('pick');
              haptic('success');
              close(`/me/customize?try=${id}` as Href);
            }}
          />
        </>
      }>
      <AvatarStage av={wearReward(av, r.items)} width={260} border style={styles.stage} />
      <PText style={styles.kicker} color={Colors.purple}>
        SEASON REWARD
      </PText>
      <PText style={styles.title} accessibilityRole="header">
        {`${r.name}${eul(r.name)} 받았어요!`}
      </PText>
      <PText style={styles.body} color={Colors.inkSub}>
        {`${r.rule}${eul(r.rule)} 채워서 자동으로 들어왔어요.\n${names}`}
      </PText>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  stage: { alignSelf: 'center' },
  kicker: { textAlign: 'center', fontFamily: Font.display, fontSize: 11, lineHeight: 15, letterSpacing: 1.4 },
  title: { textAlign: 'center', fontFamily: Font.body900, fontSize: 21, lineHeight: 28, letterSpacing: -0.5 },
  body: { textAlign: 'center', fontFamily: Font.body600, fontSize: 13.5, lineHeight: 21 },
});
