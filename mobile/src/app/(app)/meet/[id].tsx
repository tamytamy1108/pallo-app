import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { CommentsSheet, type Comment } from '@/components/common/comments-sheet';
import { guardMember } from '@/components/common/trial-guide';
import { DetailFrame } from '@/components/meet/detail/detail-frame';
import { CopyBtn, Desc, DSec, HostRow, InfoRow, InfoRows, infoStyles, MainBtn, MemberSection, SafetyNote, SaveBtn } from '@/components/meet/detail/detail-parts';
import { AskSheet, JoinSheet } from '@/components/meet/detail/sheets';
import { Bolt } from '@/components/meet/icons';
import { setText, toggleIn, updateMyMeet, useMeetStore } from '@/components/meet/meet-store';
import { findMeet, hostName, membersOf } from '@/components/meet/model';
import { CapBar } from '@/components/meet/parts';
import { EmptyState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { DESC, dday, isPast, MONTHS, capFull, capText } from '@/data/meet';
import { devClubRole } from '@/lib/dev-profile';
import { sfx } from '@/lib/feedback';
import { seeAt, SEE } from '@/lib/see';
import { useMe } from '@/state/me';

/**
 * 번개 상세 (docs/pages/04-lounge.md '상세 화면' — 프로토타입 lgDetail 의 번개 쪽).
 * 정보 줄: 일시 · 장소(복사) · 참가비 · 인원 · 호스트 → 소개 → 함께하는 멤버 → 안전 안내 → 아래 고정 [찜][참여하기].
 * 맞는 API: 59 `/meetups/:id` · 60 `/meetups/:id/join` · `/waitlist` · 61 `/meetups/:id/close`
 */
export default function MeetDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const myMeets = useMeetStore((s) => s.myMeets);
  const m = findMeet(String(id), myMeets);
  const me = useMe();
  // 개발용: 마이 '개발 · 사람'의 모임 역할(lib/dev-profile devClubRole). 호스트면 모든 번개를 내가 연 것처럼, 멤버 · 코호스트면 참여한 것처럼 봐요 (번개엔 코호스트가 없어요)
  const devHost = __DEV__ && devClubRole === 'host';
  const devIn = __DEV__ && (devClubRole === 'member' || devClubRole === 'co');
  const [devClosed, setDevClosed] = useState(false);
  const joined = useMeetStore((s) => !!s.joined[String(id)]) || devIn;
  const saved = useMeetStore((s) => !!s.saved[String(id)]);
  const vac = useMeetStore((s) => !!s.vac[String(id)]);
  const myHi = useMeetStore((s) => s.mhi[String(id)] ?? '');
  const [join, setJoin] = useState(false);
  const [cancel, setCancel] = useState(false);
  // 모집 닫기 확인 (닫으면 되돌릴 수 없어요)
  const [closeAsk, setCloseAsk] = useState(false);
  const [reviews, setReviews] = useState(false);
  const [cmts, setCmts] = useState<Comment[]>(REVIEW_SEED);

  if (!m) return <EmptyState title="모임을 찾을 수 없어요" />;
  const mine = !!m.mine || devHost;
  // 내가 연 번개가 아닌데 개발용으로 호스트처럼 볼 때는 모집 닫기를 이 화면에만 남겨요
  const closed = m.mine ? !!m.closed : devClosed;
  const setClosed = (v: boolean) => (m.mine ? updateMyMeet(m.id, { closed: v }) : setDevClosed(v));
  const past = isPast(m);
  const cur = m.cur + (joined ? 1 : 0);
  const full = capFull(cur, m.max) && !joined;
  const members = membersOf({ ...m, mine }, cur, joined || mine, myHi, { name: me.name, branch: me.branch });
  const dd = dday(m);

  const main = past ? (
    <MainBtn label="후기 보기" variant="wh" onPress={() => setReviews(true)} />
  ) : mine ? (
    <MainBtn
      label={closed ? '모집 닫음' : '모집 닫기'}
      variant={closed ? 'off' : 'wh'}
      grow={false}
      onPress={() => {
        if (!closed) setCloseAsk(true);
      }}
    />
  ) : full ? (
    <MainBtn
      label={vac ? '알림 받는 중' : '빈자리 알림 받기'}
      variant={vac ? 'on' : 'wh'}
      onPress={() =>
        guardMember(() => {
          toggleIn('vac', m.id);
          showToast(vac ? '빈자리 알림을 껐어요' : '자리가 나면 바로 알려 드릴게요');
        }, '빈자리 알림을 받으려면')
      }
    />
  ) : (
    <MainBtn label={joined ? '참여 완료' : m.max > 0 ? `참여하기 · 남은 자리 ${m.max - cur}` : '참여하기'} variant={joined ? 'done' : 'y'} onPress={() => (joined ? setCancel(true) : guardMember(() => setJoin(true), '번개에 참여하려면'))} />
  );

  return (
    <>
      <DetailFrame
        id={m.id}
        posters={m.posters}
        card={m.card}
        title={m.title}
        heading={m.title}
        kicker={
          <>
            <Bolt />
            <PText style={kick}>번개 · 한 번 만나요</PText>
          </>
        }
        cta={
          <>
            <SaveBtn
              on={saved}
              onPress={() => {
                sfx('toggle');
                toggleIn('saved', m.id);
                if (saved) showToast('저장을 취소했어요');
                else showToast('저장했어요', seeAt(SEE.savedMeets));
              }}
            />
            {main}
          </>
        }>
        <InfoRows>
          <InfoRow first icon="cal" main={`${MONTHS.indexOf(m.mon) + 1}월 ${Number(m.day)}일 ${m.wd}`} sub={past ? '끝난 모임이에요' : dd + (dd === 'D-DAY' ? ' · 오늘이에요' : ' 남았어요')} />
          <InfoRow
            icon="pin"
            main={m.place}
            sub={
              <>
                <PText style={infoStyles.sub}>{m.addr || m.reg}</PText>
                {m.addr2 ? <PText style={[infoStyles.sub, { fontFamily: Font.body900, color: Colors.ink }]}>{m.addr2}</PText> : null}
              </>
            }
            end={<CopyBtn text={[m.addr || m.place, m.addr2].filter(Boolean).join(' · ')} />}
          />
          <InfoRow icon="heart" main="참가비 없음 · 각자 계산" />
          <InfoRow icon="users" main={m.max > 0 ? `${capText(cur, m.max)} ${cur >= m.max ? '· 마감' : `· 남은 자리 ${m.max - cur}`}` : capText(cur, m.max)} sub={m.max > 0 ? <CapBar cur={cur} max={m.max} width={140} /> : '누구나 함께해요'} />
          <HostRow name={mine ? me.name : hostName(m.host)} branch={mine ? me.branch : m.br === '전 지점' ? '본사' : m.br} me={mine} />
        </InfoRows>
        <DSec>소개</DSec>
        <Desc text={DESC[m.id] || `${m.place}에서 만나요. 영어로 먼저 인사하고, 그다음은 편하게 이야기해요. 처음 오는 분도 환영이에요.`} />
        <MemberSection
          title="함께하는 멤버"
          members={members}
          onHi={(t) => {
            setText('mhi', m.id, t);
            showToast('인사를 남겼어요');
          }}
          onHiDel={() => {
            const keep = myHi;
            setText('mhi', m.id, null);
            showToast('인사를 지웠어요', { label: '되돌리기', onPress: () => setText('mhi', m.id, keep) });
          }}
        />
        <SafetyNote />
      </DetailFrame>

      <JoinSheet
        open={join}
        onClose={() => setJoin(false)}
        it={{ ...m, party: false }}
        onJoin={() => {
          setJoin(false);
          toggleIn('joined', m.id);
          sfx('save');
          showToast(`${m.title} 참여했어요 · ${m.wd}`, seeAt(SEE.joinedMeets));
        }}
      />
      <AskSheet
        open={cancel}
        onClose={() => setCancel(false)}
        title="참여를 취소할까요?"
        desc={`${m.title} · ${MONTHS.indexOf(m.mon) + 1}월 ${Number(m.day)}일`}
        button="참여 취소"
        onConfirm={() => {
          setCancel(false);
          toggleIn('joined', m.id);
          showToast('참여를 취소했어요');
        }}
      />
      <AskSheet
        open={closeAsk}
        onClose={() => setCloseAsk(false)}
        title="모집을 닫을까요?"
        desc="더는 참여 신청을 받지 않아요. 닫으면 되돌릴 수 없어요"
        button="모집 닫기"
        onConfirm={() => {
          setCloseAsk(false);
          setClosed(true);
          showToast('모집을 닫았어요 · 지도에서 빠져요');
        }}
      />
      <CommentsSheet
        open={reviews}
        onClose={() => setReviews(false)}
        comments={cmts}
        onSend={(t) => guardMember(() => setCmts((L) => [...L, { id: 'me' + Date.now(), author: me.name, text: t, time: '방금', mine: true }]), '댓글을 달려면')}
      />
    </>
  );
}

const kick = { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 19, color: Colors.purple };

// 프로토타입 LG_CMTS 앞 두 줄 (지난 번개 후기 예시)
const REVIEW_SEED: Comment[] = [
  { id: 'r1', author: '민준', text: '오 저도 이 표현 써봤어요!', time: '14시간', likes: 3 },
  { id: 'r2', author: '소라', text: '다음 번개는 꼭 갈게요', time: '12시간', likes: 1 },
];
