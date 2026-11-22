import type { Unit34 } from '@/data/lessons34';

import type { StepCtx } from '../finish';
import { DailyTalk } from './dtalk';
import { FreeTalk1 } from './free2';
import { BeforeAfter, Pick6, TopicRead } from './l3';
import { SpeakQuiz } from './quiz';
import { StudyShell } from './study-shell';

/** 진행기가 아닌 단계 화면 (프로토타입 STEP_VIEW): 지문 읽기 · 질문 별표 · AI 대화 · Before/After · 스피킹 퀴즈 · FREE TALK 1:1 */
export function StepPage({ ctx, u }: { ctx: StepCtx; u: Unit34 }) {
  return (
    <StudyShell ctx={ctx} title={ctx.step.t}>
      {(api) => {
        if (u.lv === 4) return ctx.step.id === 'free2' ? <FreeTalk1 ctx={ctx} D={u.D} api={api} /> : null;
        const p = { ctx, D: u.D, api };
        if (ctx.step.id === 'tread') return <TopicRead {...p} />;
        if (ctx.step.id === 'pick6') return <Pick6 {...p} />;
        if (ctx.step.id === 'dtalk') return <DailyTalk {...p} />;
        if (ctx.step.id === 'ba') return <BeforeAfter {...p} />;
        if (ctx.step.id === 'quiz') return <SpeakQuiz ctx={ctx} items={u.sq} api={api} />;
        return null;
      }}
    </StudyShell>
  );
}
