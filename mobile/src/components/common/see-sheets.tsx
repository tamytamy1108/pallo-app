import { SavedChallengesSheet } from '@/components/challenge/saved-sheet';
import { SavedPostsSheet } from '@/components/lounge/saved-posts-sheet';
import { MyMeetsSheet } from '@/components/my/my-meets-sheet';
import { MeetsSheet } from '@/components/my/my-sheets';
import { closeSeeSheet, useSeeSheet } from '@/lib/see';

/**
 * 토스트 [보러가기] 목록 시트 (lib/see): 맨 바깥(_layout)에 한 번만 있어요.
 * 보던 화면 위에 그대로 떠서, 닫으면 누르기 전 그 자리(같은 탭 · 같은 스크롤)예요. 시트 안 줄을 누르면 그 화면이 지금 화면 위에 쌓여요.
 */
export function SeeSheetHost() {
  const open = useSeeSheet();
  return (
    <>
      <MeetsSheet kind={open === 'saved-meets' ? 'saved' : null} onClose={closeSeeSheet} />
      <MyMeetsSheet open={open === 'joined-meets'} onClose={closeSeeSheet} />
      <SavedChallengesSheet open={open === 'saved-challenges'} onClose={closeSeeSheet} />
      <SavedPostsSheet open={open === 'saved-posts'} onClose={closeSeeSheet} />
    </>
  );
}
