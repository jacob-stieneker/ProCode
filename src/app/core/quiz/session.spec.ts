import { questions, questionById } from './questions';
import { quizTopics } from './model';
import {
  createAttempt,
  finishAttempt,
  score,
  shuffled,
  readQuizState,
  saveQuizState,
  QUIZ_KEY,
  QuizState,
} from './session';
describe('Question quality contracts', () => {
  it('has 20 distinct questions per topic, four distinct choices, explanations, and HTTPS references', () => {
    expect(questions.length).toBe(200);
    expect(new Set(questions.map((q) => q.id)).size).toBe(200);
    expect(new Set(questions.map((q) => q.prompt)).size).toBe(200);
    for (const topic of quizTopics)
      expect(questions.filter((q) => q.topic === topic.id)).toHaveLength(20);
    for (const q of questions) {
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(4);
      expect(q.explanation.length).toBeGreaterThan(35);
      expect(new URL(q.source).protocol).toBe('https:');
      expect([q.prompt, ...q.choices, q.explanation].join('')).not.toMatch(
        /—|\p{Extended_Pictographic}/u,
      );
    }
  });
});
describe('Quiz sessions', () => {
  beforeEach(() => localStorage.clear());
  it('creates exact topic-specific sizes without repeats and balanced mixed quizzes', () => {
    for (const count of [10, 20] as const)
      for (const t of [...quizTopics.map((t) => t.id), 'all'] as const) {
        const a = createAttempt(t, count);
        expect(a.items).toHaveLength(count);
        expect(new Set(a.items.map((q) => q.id)).size).toBe(count);
        if (t !== 'all')
          expect(a.items.every((i) => questionById.get(i.id)!.topic === t)).toBe(true);
        else
          for (const topic of quizTopics)
            expect(a.items.filter((i) => questionById.get(i.id)!.topic === topic.id)).toHaveLength(
              count / 10,
            );
        for (const i of a.items) expect([...i.order].sort()).toEqual([0, 1, 2, 3]);
      }
  });
  it('shuffles without changing the input', () => {
    const source = [0, 1, 2, 3];
    expect(shuffled(source, () => 0)).toEqual([1, 2, 3, 0]);
    expect(source).toEqual([0, 1, 2, 3]);
  });
  it('grades by choice identity, blocks unfinished submission, and records completion once', () => {
    const a = createAttempt('javascript', 10);
    let s: QuizState = { schema: 1, active: a, history: [] };
    expect(finishAttempt(s)).toBe(s);
    a.items.forEach((item, i) => (item.answer = i < 7 ? questionById.get(item.id)!.correct : 1));
    expect(score(a)).toBe(7);
    s = finishAttempt(s);
    expect(s.history).toHaveLength(1);
    expect(finishAttempt(s)).toBe(s);
    expect(s.active?.completedAt).toBeTruthy();
  });
  it('restores question order, choice order, answers, and current position', () => {
    const a = createAttempt('python', 20);
    a.current = 4;
    a.items[4].answer = 2;
    const s: QuizState = { schema: 1, active: a, history: [] };
    expect(saveQuizState(s)).toBe(true);
    expect(readQuizState().data).toEqual(s);
  });
  it('recovers corrupt or outdated sessions without affecting algorithm storage', () => {
    localStorage.setItem('procode.workspace.v1', 'keep-me');
    localStorage.setItem(QUIZ_KEY, '{bad');
    expect(readQuizState().warning).toBeTruthy();
    expect(readQuizState().data.active).toBeNull();
    const a = createAttempt('html', 10);
    a.items[0].id = 'removed-question';
    localStorage.setItem(QUIZ_KEY, JSON.stringify({ schema: 1, active: a, history: [] }));
    expect(readQuizState().data.active).toBeNull();
    expect(localStorage.getItem('procode.workspace.v1')).toBe('keep-me');
  });
  it('rejects invalid choice permutations and answers', () => {
    const a = createAttempt('css', 10);
    a.items[0].order = [0, 0, 1, 2];
    localStorage.setItem(QUIZ_KEY, JSON.stringify({ schema: 1, active: a, history: [] }));
    expect(readQuizState().data.active).toBeNull();
    a.items[0].order = [0, 1, 2, 3];
    a.items[0].answer = 4;
    localStorage.setItem(QUIZ_KEY, JSON.stringify({ schema: 1, active: a, history: [] }));
    expect(readQuizState().data.active).toBeNull();
  });
});
