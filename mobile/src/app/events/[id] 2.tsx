import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CommentsSheet, type Comment } from '@/components/common/comments-sheet';
import { SheetDesc } from '@/components/common/sheet-parts';
import { guardMember } from '@/components/common/trial-guide';
import { NumberCard } from '@/components/event/account-card';
import { accountOf, eventAddr, eventDesc, findEvent, surveyOf } from '@/components/event/event-model';
import { MyApplication } from '@/components/event/my-application';
import { surveyAnswerLines } from '@/components/event/survey';
import { DetailFrame } from '@/components/meet/detail/detail-frame';
import { CopyBtn, Desc, DSec, FeeBlock, InfoRow, InfoRows, infoStyles, MainBtn, MemberSection, SaveBtn } from '@/components/meet/detail/detail-parts';
import { AskSheet, JoinSheet } from '@/components/meet/detail/sheets';
import { Icon } from '@/components/meet/icons';
import { setAnswers, setText, toggleIn, useMeetStore } from '@/components/meet/meet-store';
import { membersOf } from '@/components/meet/model';
import { CapBar } from '@/components/meet/parts';
import { Sheet } from '@/components/ui/sheet';
import { EmptyState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { eventContact } from '@/data/events';
import { dday, isPast, MONTHS, won } from '@/data/meet';
import { sfx } from '@/lib/feedback';
import { useMe } from '@/state/me';

/**
 * 이벤트 상세 (docs/pages/06-event.md '이벤트 상세' — 라운지 상세 공통 틀 + 차이).
 * 정보 줄: 날짜 · 장소(복사) · 참가비 · 인원 · 신청 설문 · 주최 · 문의(문자 버튼) → 소개 → 함께하는 멤버 → 아래 고정 [찜][참가비][참여하기].
 * 신청하면 제목 바로 아래 '내 신청' 카드가 떠요.
 * 맞는 API: 86 `/events/:id` · 88 `/events/:id/applications` · 89 `/event-applications/:id` · 찜 `/events/:id/save`
 */
export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const e = findEvent(String(id));
  const me = useMe();
  const key = String(id);
  const joined = useMeetStore((s) => !!s.joined[key]);
  const saved = useMeetStore((s) => !!s.saved[key]);
  const vac = useMeetStore((s) => !!s.vac[key]);
  const myHi = useMeetStore((s) => s.mhi[key] ?? '');
  const ans = useMeetStore((s) => s.ans[key]);
  const [join, setJoin] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [sms, setSms] = useState(false);
  const [reviews, setReviews] = useState(false);
  const [cmts, setCmts] = useState<Comment[]>([]);

  if (!e) return <EmptyState title="이벤트를 찾을 수 없어요" />;
  const past = isPast(e);
  const cur = e.cur + (joined ? 1 : 0);
  const full = cur >= e.max && !joined;
  const Q = surveyOf(e);
  const tel = eventContact(e);
  const dd = dday(e);
  const addr = eventAddr(e);
  const members = membersOf(e, cur, joined, myHi, { name: me.name, branch: me.branch });

  const main = past ? (
    <MainBtn label="후기 보기" variant="wh" grow={false} onPress={() => setReviews(true)} />
  ) : full ? (
    <MainBtn
      label={vac ? '알림 받는 중' : '빈자리 알림 받기'}
      variant={vac ? 'on' : 'wh'}
      onPress={() =>
        guardMember(() => {
          toggleIn('vac', e.id);
          showToast(vac ? '빈자리 알림을 껐어요' : '자리가 나면 바로 알려 드릴게요');
        }, '빈자리 알림을 받으려면')
      }
    />
  ) : (
    <MainBtn label={joined ? '참여 완료' : `참여하기 · 남은 자리 ${e.max - cur}`} variant={joined ? 'done' : 'y'} onPress={() => (joined ? setCancel(true) : guardMember(() => setJoin(true), '파티에 가려면'))} />
  );

  return (
    <>
      <DetailFrame
        id={e.id}
        title={e.title}
        heading={e.title}
        kicker={
          <PText style={styles.kick}>
            {e.kind} · {e.br || '전 지점'}
          </PText>
        }
        cta={
          <>
            <SaveBtn
              on={saved}
              onPress={() => {
                sfx('toggle');
                toggleIn('saved', e.id);
                showToast(saved ? '저장을 취소했어요' : '저장했어요');
              }}
            />
            <FeeBlock fee={e.fee} fee0={e.fee0 ? won(e.fee0) : undefined} />
            {main}
          </>
        }>
        {joined && !past ? <MyApplication e={e} answers={ans ? surveyAnswerLines(Q, ans) : []} /> : null}
        <InfoRows>
          <InfoRow first icon="cal" main={`${MONTHS.indexOf(e.mon) + 1}월 ${Number(e.day)}일 ${e.wd}`} sub={past ? '끝난 모임이에요' : dd + (dd === 'D-DAY' ? ' · 오늘이에요' : ' 남았어요')} />
          <InfoRow icon="pin" main={e.place} sub={addr !== e.place ? addr : ''} end={<CopyBtn text={addr} />} />
          {e.fee ? (
            <InfoRow
              icon="heart"
              main={
                <PText style={infoStyles.main}>
                  참가비 {won(e.fee)}
                  {e.fee0 ? ' ' : ''}
                  {e.fee0 ? <PText style={infoStyles.fee0}>{won(e.fee0)}</PText> : null}
                </PText>
              }
              sub={joined ? '입금 계좌는 위 ‘내 신청’에 있어요' : '신청하면 입금 계좌를 알려 드려요. 입금이 확인되면 확정됩니다.'}
            />
          ) : (
            <InfoRow icon="heart" main="참가비 무료" sub="신청만 하면 바로 확정돼요" />
          )}
          <InfoRow icon="users" main={`${cur} / ${e.max}명 ${cur >= e.max ? '· 마감' : `· 남은 자리 ${e.max - cur}`}`} sub={<CapBar cur={cur} max={e.max} width={140} />} />
          {Q.length && !joined ? <InfoRow icon="check" main={`신청 설문 ${Q.length}개`} sub="신청할 때 주최가 준비한 질문에 답해요" /> : null}
          <InfoRow
            icon="crown"
            main={`주최 ${tel[0]}`}
            sub={`${tel[1]}\n${tel[2].replace(' ~ ', '~')}${tel[0].includes(e.host) ? '' : ' · 담당 ' + e.host}`}
            end={
              <View style={styles.ctbW}>
                <View style={styles.ctbS} />
                <Pressable onPress={() => setSms(true)} accessibilityRole="button" accessibilityLabel={`${tel[0]}에 문자로 문의하기`} style={styles.ctb}>
                  <Icon name="sms" size={16} />
                </Pressable>
              </View>
            }
          />
        </InfoRows>
        <DSec>소개</DSec>
        <Desc text={eventDesc(e)} />
        <MemberSection
          title="함께하는 멤버"
          members={members}
          onHi={(t) => {
            setText('mhi', e.id, t);
            showToast('인사를 남겼어요');
          }}
          onHiDel={() => {
            const keep = myHi;
            setText('mhi', e.id, null);
            showToast('인사를 지웠어요', { label: '되돌리기', onPress: () => setText('mhi', e.id, keep) });
          }}
        />
      </DetailFrame>

      <JoinSheet
        open={join}
        onClose={() => setJoin(false)}
        it={{ ...e, party: true }}
        questions={Q}
        acct={accountOf(e)}
        onJoin={(a) => {
          setJoin(false);
          if (a) setAnswers(e.id, a);
          toggleIn('joined', e.id);
          sfx('save');
          showToast(`${e.title} 참여했어요 · ${e.wd}`);
        }}
      />
      <AskSheet
        open={cancel}
        onClose={() => setCancel(false)}
        title="참여를 취소할까요?"
        desc={`${e.title} · ${MONTHS.indexOf(e.mon) + 1}월 ${Number(e.day)}일${e.fee ? '\n입금한 참가비는 환불 규정에 따라 돌려드려요.' : ''}`}
        button="참여 취소"
        onConfirm={() => {
          setCancel(false);
          toggleIn('joined', e.id);
          setAnswers(e.id, null);
          showToast('참여를 취소했어요');
        }}
      />
      {/* 문자: 번호를 보여 주고 복사 (화면을 떠나지 않아요) */}
      <Sheet open={sms} onClose={() => setSms(false)} title="문자로 문의하기" label="문자 문의">
        <SheetDesc>아래 번호로 문자를 보내 주세요. {tel[2]}에 답해 드려요.</SheetDesc>
        <NumberCard top={`${tel[0]}${tel[0].includes(e.host) ? '' : ' · 담당 ' + e.host}`} no={tel[1]} note="번호를 복사해 문자로 보내 주세요" />
      </Sheet>
      <CommentsSheet
        open={reviews}
        onClose={() => setReviews(false)}
        title="후기"
        comments={cmts}
        onSend={(t) => guardMember(() => setCmts((L) => [...L, { id: 'me' + Date.now(), author: me.name, text: t, time: '방금', mine: true }]), '댓글을 달려면')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  kick: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 19, color: Colors.purple },
  ctbW: { width: 38, height: 38 },
  ctbS: { position: 'absolute', top: 2, left: 2, width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.ink },
  ctb: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
});
