import { router } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import { StoryCamera, type StoryShot } from '@/components/lounge/story-camera';
import { StoryEditor } from '@/components/lounge/story-editor';
import { DEFAULT_SPOT } from '@/components/lounge/story-sticker';
import { showToast } from '@/components/ui/toast';
import { LG_C, LG_SCAT, type StickerSpot, STORY_CATS, type StoryCat } from '@/data/lounge';
import { addPost, addStory } from '@/data/lounge-store';
import { CARD, SCREEN } from '@/lib/transitions';
import { plainFraming, type PhotoFraming } from '@/lib/photo-framing';
import { useMe } from '@/state/me';

/**
 * 스토리 올리기 — 카메라 먼저 (인스타그램처럼).
 * 1) 카메라: 카테고리(이벤트는 프로 · 매니저만) 고르고 찍기 · 앨범에서 고르기
 * 2) 다듬기: 사진 맞추기(PhotoFrame) · 'Aa' 사진 위 글(원할 때만 · 끌어서 옮기기 · 색 고르기) · 라운지 피드에도 올리기 · (매니저) 고정 → [스토리 올리기]
 * 24시간 동안 내 얼굴 동그라미로 보이고, 그다음엔 고른 카테고리 하이라이트로 옮겨져요.
 * 사진은 기기 안에서만 보여요 — 올리기(업로드)는 백엔드 Q-T7.
 */
export default function StoryNewScreen() {
  const me = useMe();
  // 스토리 '이벤트' 카테고리는 직원만 — 프로는 멤버와 같아요 (2026-11-26)
  const staff = me.role === 'manager';
  const cats = STORY_CATS.filter((k) => k !== 'event' || staff);
  const [cat, setCat] = useState<StoryCat>(cats[0]);
  const [text, setText] = useState('');
  const [spot, setSpot] = useState<StickerSpot>(DEFAULT_SPOT);
  const [typing, setTyping] = useState(false);
  // 찍은 · 고른 사진과 맞춘 확대 · 위치 (없으면 카메라 단계)
  const [img, setImg] = useState<{ uri: string; framing: PhotoFraming } | null>(null);
  const [feed, setFeed] = useState(false);
  const [pin, setPin] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/lounge'));
  const onShot = (s: StoryShot) => setImg({ uri: s.uri, framing: plainFraming(s.width, s.height) });
  const retake = () => {
    setTyping(false);
    setImg(null);
  };

  const submit = () => {
    // 글은 원할 때만 — 사진만 올려도 돼요
    const t = text.trim();
    const lbl = t && img ? spot : undefined;
    const c = LG_SCAT[cat];
    const role = me.role === 'leader' ? '프로' : me.role === 'manager' ? '매니저' : '';
    addStory({
      id: `my${Date.now()}`,
      who: me.name,
      av: LG_C.y,
      role,
      br: me.branch,
      cat,
      time: '방금',
      h: 0,
      big: t,
      ds: '',
      art: [c.color === LG_C.ink ? LG_C.y : c.color, c.name],
      mine: true,
      pin: pin || undefined,
      img: img?.uri,
      frame: img?.framing,
      lbl,
    });
    if (feed)
      addPost({
        id: `f${Date.now()}`,
        k: 'post',
        c0: 0,
        rec: true,
        cat: 'daily',
        who: me.name,
        av: LG_C.y,
        br: me.branch,
        role: '',
        time: '방금',
        pic: img ? undefined : cat === 'rev' ? 'run' : cat === 'event' ? 'party' : 'cafe',
        imgs: img ? [img.uri] : undefined,
        frames: img ? [img.framing] : undefined,
        lbl,
        n: 1,
        likes: 0,
        text: t,
      });
    close();
    showToast(pin ? `고정 스토리로 올렸어요 · ${c.name} 하이라이트 맨 앞에 남아요` : `스토리를 올렸어요 · 24시간 뒤 ${c.name} 하이라이트로 옮겨져요`);
  };

  return (
    <>
      <Stack.Screen options={{ ...SCREEN.fade, cardStyle: { ...CARD, backgroundColor: '#0E0C14' } }} />
      <StatusBar style="light" />
      {img ? (
        <StoryEditor
          img={img}
          onFraming={(framing) => setImg({ ...img, framing })}
          cat={cat}
          branch={me.branch}
          text={text}
          onText={setText}
          spot={spot}
          onSpot={setSpot}
          typing={typing}
          onTyping={setTyping}
          feed={feed}
          onFeed={() => setFeed(!feed)}
          pin={me.role === 'manager' ? pin : null}
          onPin={() => setPin(!pin)}
          onRetake={retake}
          onSubmit={submit}
        />
      ) : (
        <StoryCamera cats={cats} cat={cat} onCat={setCat} onShot={onShot} onClose={close} />
      )}
    </>
  );
}
