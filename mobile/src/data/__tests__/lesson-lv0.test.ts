import { getLesson0, LESSONS0_ALL, STEP0_DEFS, step0Tasks } from '@/data/lesson-lv0';
import { STUDY_STEPS } from '@/data/library';
import { STUDY_LEVELS } from '@/data/library-lessons';
import { LISTEN_ITEMS } from '@/data/library-listen';

describe('Lv.0 HELLO ENGLISH', () => {
  it('1 · 2과 콘텐츠가 열리고 3과부터는 준비 중', () => {
    const L = STUDY_LEVELS.find((x) => x.lv === 0);
    expect(L?.lessons).toHaveLength(16);
    expect(L?.lessons.filter((ls) => ls.data).map((ls) => ls.no)).toEqual([1, 2]);
    expect(getLesson0(1)?.title).toBe('Nice to meet you!');
    expect(getLesson0(3)).toBeNull();
  });

  it('과마다 키워드 15 · Our Story 7 · 문장 연습 25', () => {
    for (const D of LESSONS0_ALL) {
      expect([...D.words.noun, ...D.words.verb, ...D.words.adj]).toHaveLength(15);
      expect(D.story).toHaveLength(7);
      expect(D.drill).toHaveLength(25);
      expect(D.free).toHaveLength(D.freeEx.length);
    }
  });

  it('단계 목록은 과 화면 · 레슨 화면이 같은 것', () => {
    expect(STEP0_DEFS.map((s) => s.id)).toEqual(['kw', 'puz', 'ours', 'self', 'drill', 'free']);
    expect(STUDY_STEPS.basic.pre.map((s) => s.id)).toEqual(['kw', 'puz']);
  });

  it('모든 단계에 문제가 있고 퍼즐 정답이 보기 안에 있어요', () => {
    for (const D of LESSONS0_ALL) {
      for (const s of STEP0_DEFS) {
        const tasks = step0Tasks(D, s.id, 'k');
        expect(tasks.length).toBeGreaterThan(0);
        for (const t of tasks) if (t.type === 'pick') expect(t.opts[t.ans]).toBeTruthy();
      }
      const puz = step0Tasks(D, 'puz', 'k').filter((t) => t.type === 'pick');
      expect(puz).toHaveLength(D.puzzles.reduce((n, p) => n + p.rows.length, 0));
    }
  });

  it('리스닝 룸에 기본 문장 + 문장 연습', () => {
    expect(LISTEN_ITEMS['0-1']).toHaveLength(28);
    expect(LISTEN_ITEMS['0-2']).toHaveLength(28);
  });
});
