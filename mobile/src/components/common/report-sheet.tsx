import { useState } from 'react';

import { SheetButton, SheetDesc, SheetNote, SheetOptions, type SheetOption } from '@/components/common/sheet-parts';
import { Sheet } from '@/components/ui/sheet';
import { showToast } from '@/components/ui/toast';
import { createStore } from '@/lib/store';

export type ReportTarget = {
  kind: 'post' | 'comment' | 'story' | 'member' | 'meet' | 'club' | 'challenge' | 'event';
  /** 글쓴이 · 멤버 이름 ('하나') */
  name: string;
  /** 메뉴 제목 (기본 '하나의 글') */
  title?: string;
};

/** 메뉴에 더 넣는 줄 — 리더 · 매니저 도구 (공지로 고정 · 이 글 숨기기 · 신고함 보기) */
export type ReportMenuItem = { key: string; label: string; sub?: string; onPress: () => void };

type Stage = 'menu' | 'report' | 'block';

const REPORT_REASONS = ['스팸 · 광고', '불쾌하거나 무례한 말', '개인정보 노출', '모임에서 불편한 일이 있었어요', '기타'];
const BLOCK_REASONS = ['스팸 · 광고', '불쾌하거나 무례한 말', '개인정보를 물어봐요', '모임에서 불편한 일이 있었어요', '그냥 보고 싶지 않아요', '기타'];

/*
 * 차단한 멤버 · 내 신고 (가짜 저장소 · 기기에 남아요). 맞는 API: 75 `POST /reports` · 77 `POST / DELETE /blocks`.
 * 라운지는 useIsBlocked(이름)로 글을 숨기고, 설정 › 차단한 멤버 · 신고 내역은 useBlockedNames · useMyReports 로 읽어요.
 */
const blockStore = createStore<string[]>([], { persist: { key: 'blocks' } });
export type MyReport = { id: string; kind: ReportTarget['kind']; name: string; reason: string; at: string };
const reportStore = createStore<MyReport[]>([], { persist: { key: 'my-reports' } });

// React Compiler 가 x.use() 를 React use() 로 보지 않게 useXxx 이름으로 꺼내 써요
const useBlockStore = blockStore.use;
const useReportStore = reportStore.use;
export const useBlockedNames = () => useBlockStore();
export const useIsBlocked = (name: string) => useBlockStore((s) => s.includes(name));
export const isBlocked = (name: string) => blockStore.get().includes(name);
export const blockMember = (name: string) => blockStore.set((s) => (s.includes(name) ? s : [...s, name]));
export const unblockMember = (name: string) => blockStore.set((s) => s.filter((x) => x !== name));
export const useMyReports = () => useReportStore();

/**
 * 신고 · 차단 시트 (프로토타입 lgMore → lgReport · lgBlockSheet). 한 시트 안에서 메뉴 → 사유 고르기로 넘어가요.
 * - 신고하기: 사유 → [신고하기] → '신고했어요. 매니저가 24시간 안에 확인해요'. 신고한 사람은 상대에게 알려지지 않아요.
 * - 차단하기: 사유 → [차단하기] → 바로 숨김 + '○○님을 차단했어요' [되돌리기].
 * start 로 메뉴 없이 바로 신고 · 차단 사유부터 열 수 있어요 (멤버 프로필 [차단 · 신고]).
 * 담당: 공통 부품. props 는 바꾸지 않아요(늘리기만).
 */
export function ReportSheet({
  open,
  onClose,
  target,
  onBlocked,
  start = 'menu',
  link,
  extra = [],
  onReported,
  onUnblocked,
}: {
  open: boolean;
  onClose: () => void;
  target: ReportTarget;
  onBlocked?: () => void;
  /** 처음 보여 줄 단계 (기본 menu — 글 ⋯ 메뉴) */
  start?: Stage;
  /** 메뉴 맨 위 '링크 복사' (기본: 글 · 스토리 · 모임처럼 링크가 있는 것) */
  link?: boolean;
  /** 메뉴에 더 넣는 줄 (리더 · 매니저 도구) — 신고 · 차단 위에 들어가요 */
  extra?: ReportMenuItem[];
  /** 신고를 접수했을 때 (사유) */
  onReported?: (reason: string) => void;
  /** 차단을 되돌렸을 때 */
  onUnblocked?: () => void;
}) {
  const [stage, setStage] = useState<Stage>(start);
  const [reason, setReason] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStage(start);
      setReason(null);
    }
  }
  const who = target.name;

  const go = (s: Stage) => {
    setReason(null);
    setStage(s);
  };

  const sendReport = () => {
    if (!reason) return;
    reportStore.set((L) => [{ id: `r-${Date.now()}`, kind: target.kind, name: who, reason, at: '방금' }, ...L]);
    onClose();
    onReported?.(reason);
    showToast('신고했어요. 매니저가 24시간 안에 확인해요');
  };

  const sendBlock = () => {
    if (!reason) return;
    blockMember(who);
    onClose();
    onBlocked?.();
    showToast(`${who}님을 차단했어요`, {
      label: '되돌리기',
      onPress: () => {
        unblockMember(who);
        onUnblocked?.();
      },
    });
  };

  if (stage === 'report')
    return (
      <Sheet open={open} onClose={onClose} title="무엇이 문제인가요?" label="신고하기" scrollKey={stage}>
        <SheetDesc>신고한 사람은 {who}에게 알려지지 않아요.</SheetDesc>
        <SheetOptions radio items={REPORT_REASONS.map(asOption)} selected={reason} onPick={setReason} />
        <SheetNote>차단 · 신고 시 지점에도 보고돼요.</SheetNote>
        <SheetButton label="신고하기" size="inline" disabled={!reason} onPress={sendReport} />
      </Sheet>
    );

  if (stage === 'block')
    return (
      <Sheet open={open} onClose={onClose} title={`${who}님을 왜 차단하나요?`} label={`${who} 차단`} scrollKey={stage}>
        <SheetDesc>
          차단하면 서로의 글 · 댓글 · 스토리가 보이지 않아요. {who}님에게는 알려지지 않아요.
        </SheetDesc>
        <SheetOptions radio items={BLOCK_REASONS.map(asOption)} selected={reason} onPick={setReason} />
        <SheetNote>차단 · 신고 시 지점에도 보고돼요.</SheetNote>
        <SheetButton label="차단하기" tone="bad" size="inline" disabled={!reason} onPress={sendBlock} />
      </Sheet>
    );

  const rows: (SheetOption & { run: () => void })[] = [
    ...extra.map((x) => ({ key: x.key, label: x.label, sub: x.sub, run: x.onPress })),
    { key: 'report', label: '신고하기', sub: '매니저가 24시간 안에 확인해요', bad: true, run: () => go('report') },
    { key: 'block', label: `${who} 차단하기`, sub: '서로의 글이 더 이상 보이지 않아요', bad: true, run: () => go('block') },
  ];
  return (
    <Sheet open={open} onClose={onClose} title={target.title ?? (target.kind === 'member' ? who : `${who}의 글`)} label="글 메뉴" scrollKey={stage}>
      <SheetOptions items={rows} onPick={(k) => rows.find((r) => r.key === k)?.run()} />
      <SheetButton label="닫기" tone="white" size="inline" sound="back" onPress={onClose} />
    </Sheet>
  );
}

const asOption = (r: string): SheetOption => ({ key: r, label: r });
