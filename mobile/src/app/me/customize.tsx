import { Stack } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';

import { BottomBar } from '@/components/bottom-bar';
import { AvatarStage, BodyArt, ItemArt, StageArt } from '@/components/character/avatar';
import { ColorPick } from '@/components/my/color-pick';
import { LgIcon, SparkIcon } from '@/components/my/icons';
import { Lift } from '@/components/my/lift';
import { SparkSheet } from '@/components/my/my-sheets';
import { PageTop } from '@/components/my/page-top';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import {
  AV_BG,
  AV_CATS,
  AV_ITEMS,
  AV_RARE_C,
  AV_SW,
  AVC_LIST,
  BG_SW,
  HAIR,
  HAIR_SW,
  SAY_IDEAS,
  type AvCat,
  type Avatar,
  type AvItem,
  type AvRare,
  type AvTab,
} from '@/data/my';
import { sfx } from '@/lib/feedback';
import { avatarChanged, avatarCost, buyAndSave, cloneAvatar, getMyAvatar, isOwned, useMyAvatar, useOwned } from '@/state/avatar';
import { useMe } from '@/state/me';

const pk = <T,>(L: readonly T[]) => L[Math.floor(Math.random() * L.length)];

/**
 * 꾸미기 · 스파크 상점 (프로토타입 renderMyPush 'shop'): 위 줄 · 붙어 있는 미리보기(좌우 · 랜덤 · 원래대로 · 초기화)
 * · 분류 탭 → 타일 칸 → 아래 고정 [사고 저장하기]. 저장하기 전에는 아무 데도 반영되지 않아요.
 */
export default function CustomizeScreen() {
  const { width } = useWindowDimensions();
  const me = useMe();
  const saved = useMyAvatar();
  const own = useOwned();
  const [d, setD] = useState<Avatar>(() => cloneAvatar(getMyAvatar()));
  const [cat, setCat] = useState<AvTab>('char');
  const [gen, setGen] = useState(0); // 색 막대를 다시 맞출 때 (원래대로 · 초기화 · 랜덤)
  const [earn, setEarn] = useState(false);
  const tabs = useRef<ScrollViewInstance>(null);
  const tabX = useRef<Record<string, { x: number; w: number }>>({});
  const tabW = useRef(0);

  const W = Math.min(width, 520);
  const gridW = W - 32;
  const tileW = (gridW - 20) / 3;
  const artW = tileW - 12 - 4;

  const { cost, need } = avatarCost(d, own);
  const changed = avatarChanged(d, saved);
  const edit = (fn: (x: Avatar) => void) =>
    setD((cur) => {
      const x = cloneAvatar(cur);
      fn(x);
      return x;
    });

  // 고른 탭이 줄 밖에 있으면 가운데로 (프로토타입: 눌러도 줄 위치 유지 · 안 보이면 보이게)
  useEffect(() => {
    const t = tabX.current[cat];
    if (t && tabs.current) tabs.current.scrollTo({ x: Math.max(0, t.x - (tabW.current - t.w) / 2), animated: true });
  }, [cat]);

  const pickTile = (key: string, lock?: string) => {
    if (lock && !isOwned(own, key)) {
      showToast(`잠긴 아이템 · ${lock}`);
      return;
    }
    sfx('tap');
    edit((x) => {
      if (cat === 'char') x.color = key;
      else if (key.startsWith('bg:')) x.bg = key.slice(3);
      else if (key.startsWith('fx-')) x.eq.fx = x.eq.fx === key ? null : key;
      else if (cat !== 'say' && cat !== 'bg') x.eq[cat] = x.eq[cat] === key ? null : key;
    });
  };

  const tool = (k: 'flip' | 'rand' | 'reset' | 'clear') => {
    sfx('tap');
    if (k === 'flip') edit((x) => void (x.flip = !x.flip));
    if (k === 'reset') {
      setD(cloneAvatar(saved));
      setGen((g) => g + 1);
      showToast('마지막으로 저장한 모습으로 돌아왔어요');
    }
    if (k === 'clear') {
      edit((x) => {
        (Object.keys(x.eq) as AvCat[]).forEach((c) => (x.eq[c] = null));
        Object.assign(x, { color: 'yellow', bg: 'cream', flip: false, say: '' });
      });
      setGen((g) => g + 1);
      showToast('아무것도 안 입은 모습이에요 · 저장하기를 누르면 바뀌어요');
    }
    if (k === 'rand') {
      edit((x) => {
        (['eye', 'hat', 'face', 'wear', 'mitt', 'shoe', 'hand', 'acc', 'fx'] as AvCat[]).forEach((c) => {
          const L = AV_ITEMS.filter((i) => i.cat === c && !i.lock && !i.hair);
          x.eq[c] = Math.random() < 0.25 ? null : pk(L).id;
        });
        x.color = Math.random() < 0.5 ? pk(AVC_LIST.filter((k2) => !k2[2]))[0] : pk(AV_SW);
        x.bg = pk(AV_BG.filter((b) => !b.lock)).id;
        x.eq.hair = Math.random() < 0.3 ? null : pk(HAIR).id;
        x.hc = pk(HAIR_SW);
      });
      setGen((g) => g + 1);
    }
  };

  const save = () => {
    const r = buyAndSave(d);
    if (!r.ok) {
      showToast(`스파크가 ${r.short.toLocaleString()}개 모자라요`);
      return;
    }
    sfx('save');
    showToast(r.cost ? `${r.need.join(' · ')} 샀어요 · 저장했어요` : '저장했어요');
  };

  // ---- 타일 ----
  const tile = (key: string, name: string, price: number, rare: AvRare, on: boolean, art: ReactNode, lock?: string) => {
    const has = isOwned(own, key);
    const locked = !!lock && !has;
    const st = has ? (on ? '착용 중' : '보유') : locked ? '잠김' : `${rare} · ${price ? price + ' 스파크' : '무료'}`;
    return (
      <Pressable key={key} onPress={() => pickTile(key, lock)} accessibilityRole="button" accessibilityLabel={`${name} · ${st}`} accessibilityState={{ selected: on }} style={{ width: tileW }}>
        <Lift radius={16} color={Colors.purple} shadow={on}>
          <View style={[styles.tile, on && styles.tileOn]}>
            <View style={[styles.art, locked && styles.artLock]}>{art}</View>
            <PText style={styles.tileB} numberOfLines={1}>
              {name}
            </PText>
            <PText style={[styles.tileS, { color: AV_RARE_C[rare] }]} numberOfLines={1}>
              {st}
            </PText>
          </View>
        </Lift>
      </Pressable>
    );
  };
  const itemArt = (i: AvItem) => {
    if (i.layer === 'fx')
      return (
        <View style={styles.fxsw}>
          <StageArt it={i} width={64 * (300 / 220)} height={64} />
        </View>
      );
    return <ItemArt it={i} width={artW} height={64} hc={d.hc} />;
  };
  const sub = (t: string) => (
    <PText key={`s-${t}`} style={styles.sub}>
      {t}
    </PText>
  );

  let grid: ReactNode;
  if (cat === 'char') {
    grid = (
      <>
        <ColorPick key={`c${gen}`} title="내 맘대로 몸 색 · 무료" cur={d.color} swatches={AV_SW} onPick={(hex) => edit((x) => void (x.color = hex))} />
        {sub('추천 색')}
        <View style={styles.tiles}>{AVC_LIST.map(([k, n, pr]) => tile(k, n, pr, pr ? '에픽' : '기본', d.color === k, <BodyArt color={k} width={Math.min(artW * 0.92, 58 / (332 / 520))} />))}</View>
      </>
    );
  } else if (cat === 'hair') {
    grid = (
      <>
        <ColorPick key={`h${gen}`} title="머리 색 · 무료" cur={d.hc} swatches={HAIR_SW} onPick={(hex) => edit((x) => void (x.hc = hex))} />
        {sub('헤어 스타일')}
        <View style={styles.tiles}>
          <Pressable onPress={() => edit((x) => void (x.eq.hair = null))} accessibilityRole="button" accessibilityLabel="머리 없음 · 원래 모습" accessibilityState={{ selected: !d.eq.hair }} style={{ width: tileW }}>
            <Lift radius={16} color={Colors.purple} shadow={!d.eq.hair}>
              <View style={[styles.tile, !d.eq.hair && styles.tileOn]}>
                <View style={styles.art}>
                  <View style={styles.none}>
                    <PText style={styles.noneT}>없음</PText>
                  </View>
                </View>
                <PText style={styles.tileB}>머리 없음</PText>
                <PText style={[styles.tileS, { color: Colors.inkSub }]}>원래 모습</PText>
              </View>
            </Lift>
          </Pressable>
          {HAIR.map((i) => tile(i.id, i.name, i.price, i.rare, d.eq.hair === i.id, itemArt(i)))}
        </View>
      </>
    );
  } else if (cat === 'bg') {
    grid = (
      <>
        <ColorPick key={`b${gen}`} title="단색 배경 · 무료" cur={d.bg} swatches={BG_SW} onPick={(hex) => edit((x) => void (x.bg = hex))} />
        {sub('꾸며진 배경')}
        <View style={styles.tiles}>
          {AV_BG.map((b) =>
            tile(
              'bg:' + b.id,
              b.name,
              b.price,
              b.rare,
              d.bg === b.id,
              <View style={styles.bgsw}>
                <StageArt bgId={b.id} width={artW} height={64} />
              </View>,
              b.lock,
            ),
          )}
        </View>
        {sub('배경 효과')}
        <View style={styles.tiles}>{AV_ITEMS.filter((i) => i.cat === 'fx').map((i) => tile(i.id, i.name, i.price, i.rare, d.eq.fx === i.id, itemArt(i), i.lock))}</View>
      </>
    );
  } else if (cat === 'say') {
    grid = (
      <View style={styles.sayf}>
        <PText style={styles.sayL}>캐릭터 옆 말풍선 · 14자까지</PText>
        <TextInput
          value={d.say}
          onChangeText={(t) => edit((x) => void (x.say = t.slice(0, 14)))}
          maxLength={14}
          placeholder="예) 같이 말해요"
          placeholderTextColor="#9A93A6"
          autoComplete="off"
          accessibilityLabel="캐릭터 옆 말풍선"
          style={styles.sayIn}
        />
        <View style={styles.ideas}>
          {[...SAY_IDEAS, ''].map((x) => (
            <Pressable key={x || 'none'} onPress={() => edit((y) => void (y.say = x))} accessibilityRole="button" style={styles.idea}>
              <PText style={styles.ideaT}>{x || '말풍선 없애기'}</PText>
            </Pressable>
          ))}
        </View>
        <PText style={styles.sayP}>욕설 · 연락처 · 광고는 쓸 수 없어요. 신고되면 말풍선이 숨겨져요.</PText>
      </View>
    );
  } else {
    const c = cat;
    grid = <View style={styles.tiles}>{AV_ITEMS.filter((i) => i.cat === c).map((i) => tile(i.id, i.name, i.price, i.rare, d.eq[c] === i.id, itemArt(i), i.lock))}</View>;
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <PageTop
        title="꾸미기"
        right={
          <Pressable onPress={() => setEarn(true)} accessibilityRole="button" accessibilityLabel={`스파크 ${me.sparks}개 · 모으는 방법`} hitSlop={8} style={styles.spark}>
            <SparkIcon />
            <PText style={styles.sparkT}>{me.sparks.toLocaleString()} 스파크</PText>
          </Pressable>
        }
      />
      {/* 붙어 있는 미리보기 · 분류 탭 (프로토타입 .av-sticky) */}
      <View style={styles.sticky}>
        <View style={styles.prev}>
          <AvatarStage av={d} width={(W - 32) * 0.8} border />
          <View style={styles.tools}>
            {(
              [
                ['flip', '좌우'],
                ['rand', '랜덤'],
                ['reset', '원래대로'],
                ['clear', '초기화'],
              ] as const
            ).map(([k, l]) => (
              <Pressable key={k} onPress={() => tool(k)} accessibilityRole="button" accessibilityLabel={k === 'flip' ? '좌우 바꾸기' : l} style={styles.toolBtn}>
                {k === 'flip' && <LgIcon name="send" size={16} />}
                <PText style={styles.toolT}>{l}</PText>
              </Pressable>
            ))}
          </View>
        </View>
        <ScrollView
          ref={tabs}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cats}
          onLayout={(e) => (tabW.current = e.nativeEvent.layout.width)}
          accessibilityRole="tablist">
          {AV_CATS.map(([k, l]) => {
            const on = cat === k;
            return (
              <Pressable
                key={k}
                onLayout={(e) => (tabX.current[k] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width })}
                onPress={() => setCat(k)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[styles.cat, on && styles.catOn]}>
                <PText style={[styles.catT, on && styles.catTOn]}>{l}</PText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.grid} keyboardShouldPersistTaps="handled">
        {grid}
      </ScrollView>

      <BottomBar>
        <View style={styles.foot}>
          <View style={styles.fee}>
            <PText style={styles.feeS}>{cost ? `새 아이템 ${need.length}개` : changed ? '바뀐 모습' : '지금 모습'}</PText>
            <PText style={styles.feeB}>{cost ? `${cost.toLocaleString()} 스파크` : '추가 비용 없음'}</PText>
          </View>
          <Pressable onPress={save} disabled={!changed} accessibilityRole="button" accessibilityState={{ disabled: !changed }} style={styles.mainWrap}>
            {({ pressed }) => (
              <Lift radius={27} x={3} y={3} pressed={pressed && changed} shadow={changed} style={!changed && styles.dim}>
                <View style={[styles.main, !changed && styles.mainOff]}>
                  <PText style={[styles.mainT, !changed && styles.mainTOff]}>{cost ? '사고 저장하기' : '저장하기'}</PText>
                </View>
              </Lift>
            )}
          </Pressable>
        </View>
      </BottomBar>

      <SparkSheet open={earn} onClose={() => setEarn(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cream },
  spark: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 2 },
  sparkT: { fontFamily: Font.display, fontSize: 13, lineHeight: 18 },
  sticky: { backgroundColor: Colors.cream, borderBottomWidth: 1.5, borderColor: Colors.line, zIndex: 2 },
  prev: { paddingTop: 8, paddingHorizontal: 16, paddingBottom: 6, alignItems: 'center' },
  tools: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 8 },
  toolBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white },
  toolT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
  cats: { gap: 6, paddingTop: 4, paddingHorizontal: 16, paddingBottom: 10 },
  cat: { height: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center' },
  catOn: { backgroundColor: Colors.ink },
  catT: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  catTOn: { color: Colors.white },
  grid: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  sub: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18, color: Colors.inkSub, marginTop: 6, marginHorizontal: 2, marginBottom: -2 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { alignItems: 'center', gap: 4, paddingTop: 8, paddingHorizontal: 6, paddingBottom: 10, borderWidth: 2, borderColor: Colors.line, borderRadius: 16, backgroundColor: Colors.white },
  tileOn: { borderWidth: 2.5, borderColor: Colors.purple },
  art: { width: '100%', height: 64, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 10 },
  artLock: { opacity: 0.4 },
  tileB: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18 },
  tileS: { fontFamily: Font.body800, fontSize: 11, lineHeight: 15 },
  none: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.line, borderRadius: 10, paddingVertical: 18, paddingHorizontal: 10 },
  noneT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16, color: Colors.inkSub },
  fxsw: { width: '100%', height: '100%', backgroundColor: Colors.cream, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bgsw: { width: '100%', height: '100%', borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.line },
  sayf: { gap: 8 },
  sayL: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  sayIn: { height: 48, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, paddingHorizontal: 14, fontFamily: Font.body800, fontSize: 15, backgroundColor: Colors.white, color: Colors.ink },
  ideas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  idea: { height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white, justifyContent: 'center' },
  ideaT: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  sayP: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fee: { flexShrink: 0, paddingHorizontal: 2, justifyContent: 'center' },
  feeS: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 14, color: Colors.inkSub },
  feeB: { fontFamily: Font.display, fontSize: 18, lineHeight: 22 },
  mainWrap: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.45 },
  main: { height: 54, borderRadius: 27, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  mainOff: { backgroundColor: '#E3DDD0' },
  mainT: { fontFamily: Font.body900, fontSize: 15.5, lineHeight: 21 },
  mainTOff: { color: '#8C8597' },
});
