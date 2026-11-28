import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { CommentsSheet, type Comment } from '@/components/common/comments-sheet';
import { guardMember } from '@/components/common/trial-guide';
import { areaLine } from '@/components/meet/area';
import { DetailFrame } from '@/components/meet/detail/detail-frame';
import { CopyBtn, Desc, DSec, HostRow, InfoRow, InfoRows, infoStyles, JoinRequestSection, MainBtn, MemberSection, SafetyNote, SaveBtn } from '@/components/meet/detail/detail-parts';
import { AskSheet, JoinSheet } from '@/components/meet/detail/sheets';
import { Bolt } from '@/components/meet/icons';
import { Pressable } from '@/components/ui/pressable';
import { approveMyAsk, askJoin, decideReq, leaveMeet, rejectMyAsk, setText, toggleIn, updateMyMeet, useMeetStore } from '@/components/meet/meet-store';
import { askClosed, askDeadline, deadlineText, MAX_REJECTS, meetStart, rejectPhrase } from '@/components/meet/join-rules';
import { RejectSheet } from '@/components/meet/detail/reject-sheet';
import { findMeet, hostName, membersOf, type Member } from '@/components/meet/model';
import { CapBar } from '@/components/meet/parts';
import { EmptyState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { C, DESC, dday, isPast, MEMBER_POOL, MEMBERS, MONTHS, capFull, capText } from '@/data/meet';
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
  // 참여는 승인제: 신청(asked) → 호스트가 수락하면 확정(joined). 확정 전엔 가게 이름 · 주소가 안 보여요
  const joined = useMeetStore((s) => !!s.joined[String(id)]) || devIn;
  const askedRaw = useMeetStore((s) => !!s.asked[String(id)]) && !joined;
  const askAt = useMeetStore((s) => s.askAt[String(id)]);
  const rej = useMeetStore((s) => s.rej[String(id)]);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  // 마감 · 만료 판정 기준 시각 (화면을 열 때 한 번)
  const [now] = useState(() => Date.now());
  const reqNames = useMeetStore((s) => s.reqs[String(id)]) ?? NO_REQS;
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
  // 신청해 둔 사람은 꽉 차도 '수락 기다리는 중'을 그대로 봐요 (빈자리 알림 대신)
  const full = capFull(cur, m.max) && !joined && !askedRaw;
  const members = membersOf({ ...m, mine }, cur, joined || mine, myHi, { name: me.name, branch: me.branch });
  const dd = dday(m);
  // 가게 이름 · 지도 주소 · 상세 주소 · 복사는 호스트 · 참여 확정(호스트가 수락)된 사람 · 스텝만 봐요 (안전).
  // 신청만 한 사람 · 그 밖의 사람은 시 · 구 · 가까운 역만. 취소하면 다시 가려져요
  const seeAddr = mine || joined || me.role === 'manager';
  const area = areaLine(m.addr, m.reg, m.place);
  const placeShown = seeAddr ? m.place : area;
  // 승인제 규칙 (join-rules): 24시간 · 시작 3시간 전 중 이른 때 답이 없으면 신청이 끝나요 · 거절은 2번까지 · 시작 3시간 전부터 신청 마감
  const start = meetStart(m);
  const deadline = askDeadline(askAt ?? now, start);
  const expired = askedRaw && now >= deadline;
  const asked = askedRaw && !expired;
  const rejected = !joined && !asked && !!rej;
  const canReapply = !rej || rej.n < MAX_REJECTS;
  const askShut = askClosed(start, now);
  const reqs: Member[] = reqNames.map((n) => {
    const seed = [...MEMBERS, ...MEMBER_POOL].find(([x]) => x === n);
    return { n, c: seed?.[1] ?? C.sky, b: seed?.[2] ?? m.br, t: '참여 신청', hi: '' };
  });

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
  ) : joined || asked ? (
    <MainBtn label={joined ? '참여 확정' : '수락 기다리는 중'} variant={joined ? 'done' : 'on'} onPress={() => setCancel(true)} />
  ) : !canReapply ? (
    <MainBtn label="이 번개는 더 신청할 수 없어요" variant="off" />
  ) : askShut ? (
    <MainBtn label="신청 마감 · 시작 3시간 전" variant="off" />
  ) : (
    <MainBtn
      label={rejected ? `다시 신청하기 · ${MAX_REJECTS - (rej?.n ?? 0)}번 남음` : expired ? '다시 신청하기' : m.max > 0 ? `참여 신청하기 · 남은 자리 ${m.max - cur}` : '참여 신청하기'}
      variant="y"
      onPress={() => guardMember(() => setJoin(true), '번개에 참여하려면')}
    />
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
            main={placeShown}
            sub={
              seeAddr ? (
                <>
                  <PText style={infoStyles.sub}>{m.addr || m.reg}</PText>
                  {m.addr2 ? <PText style={[infoStyles.sub, { fontFamily: Font.body900, color: Colors.ink }]}>{m.addr2}</PText> : null}
                </>
              ) : (
                <PText style={infoStyles.sub}>
                  {asked
                    ? `호스트가 수락하면 장소와 주소가 보여요 · ${deadlineText(deadline, now)}까지 답이 없으면 신청이 끝나요`
                    : rejected && rej
                      ? `거절됐어요 · ${rejectPhrase(rej.code)}`
                      : expired
                        ? '호스트가 답하지 않아 신청이 끝났어요 · 다시 신청할 수 있어요'
                        : '참여가 확정되면 장소와 주소가 보여요'}
                </PText>
              )
            }
            end={seeAddr ? <CopyBtn text={[m.addr || m.place, m.addr2].filter(Boolean).join(' · ')} /> : undefined}
          />
          <InfoRow icon="heart" main="참가비 없음 · 각자 계산" />
          <InfoRow icon="users" main={m.max > 0 ? `${capText(cur, m.max)} ${cur >= m.max ? '· 마감' : `· 남은 자리 ${m.max - cur}`}` : capText(cur, m.max)} sub={m.max > 0 ? <CapBar cur={cur} max={m.max} width={140} /> : '누구나 함께해요'} />
          <HostRow name={mine ? me.name : hostName(m.host)} branch={mine ? me.branch : m.br === '전 지점' ? '본사' : m.br} me={mine} />
        </InfoRows>
        <DSec>소개</DSec>
        <Desc text={DESC[m.id] || `${placeShown}에서 만나요. 영어로 먼저 인사하고, 그다음은 편하게 이야기해요. 처음 오는 분도 환영이에요.`} />
        {mine && !past ? (
          <JoinRequestSection
            members={reqs}
            onDecide={(n, ok) => {
              if (!ok) return setRejectFor(n);
              decideReq(m.id, n, true);
              showToast(`${n}님 참여를 수락했어요 · 장소와 주소가 보여요`);
            }}
          />
        ) : null}
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
        {__DEV__ && asked ? (
          <>
            <Pressable onPress={() => approveMyAsk(m.id)} accessibilityRole="button" style={{ alignSelf: 'center', padding: 8 }}>
              <PText style={infoStyles.sub}>개발용 · 호스트가 수락한 것처럼 보기</PText>
            </Pressable>
            <Pressable onPress={() => rejectMyAsk(m.id, 'SCHEDULE', m.title)} accessibilityRole="button" style={{ alignSelf: 'center', padding: 8 }}>
              <PText style={infoStyles.sub}>개발용 · 호스트가 거절한 것처럼 보기</PText>
            </Pressable>
          </>
        ) : null}
      </DetailFrame>

      <JoinSheet
        open={join}
        onClose={() => setJoin(false)}
        it={{ ...m, place: placeShown, party: false }}
        ask
        onJoin={() => {
          setJoin(false);
          askJoin(m.id);
          sfx('save');
          showToast('참여를 신청했어요 · 호스트가 수락하면 알려 드려요');
        }}
      />
      <AskSheet
        open={cancel}
        onClose={() => setCancel(false)}
        title={asked ? '신청을 취소할까요?' : '참여를 취소할까요?'}
        desc={`${m.title} · ${MONTHS.indexOf(m.mon) + 1}월 ${Number(m.day)}일${asked ? '' : ' · 다시 참여하려면 신청부터 다시 해요'}`}
        button={asked ? '신청 취소' : '참여 취소'}
        onConfirm={() => {
          setCancel(false);
          leaveMeet(m.id);
          showToast(asked ? '신청을 취소했어요' : '참여를 취소했어요');
        }}
      />
      <RejectSheet
        name={rejectFor}
        onClose={() => setRejectFor(null)}
        onReject={(phrase) => {
          if (rejectFor) decideReq(m.id, rejectFor, false);
          setRejectFor(null);
          showToast(`거절했어요 · 신청자에게는 '${phrase}' 로 보여요`);
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

const NO_REQS: string[] = [];
const kick = { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 19, color: Colors.purple };

// 프로토타입 LG_CMTS 앞 두 줄 (지난 번개 후기 예시)
const REVIEW_SEED: Comment[] = [
  { id: 'r1', author: '민준', text: '오 저도 이 표현 써봤어요!', time: '14시간', likes: 3 },
  { id: 'r2', author: '소라', text: '다음 번개는 꼭 갈게요', time: '12시간', likes: 1 },
];
