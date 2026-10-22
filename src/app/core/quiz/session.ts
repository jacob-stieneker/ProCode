import { Topic, quizTopics } from './model';
import { questions, questionById } from './questions';
export type QuizTopic = Topic | 'all';
export interface QuizItem {
  id: string;
  order: number[];
  answer: number | null;
}
export interface Attempt {
  id: string;
  bankVersion: 1;
  topic: QuizTopic;
  count: 10 | 20;
  items: QuizItem[];
  current: number;
  startedAt: string;
  completedAt?: string;
}
export interface QuizState {
  schema: 1;
  active: Attempt | null;
  history: Attempt[];
}
export const QUIZ_KEY = 'procode.quizzes.v1';
export function shuffled<T>(values: readonly T[], random = Math.random): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function createAttempt(topic: QuizTopic, count: 10 | 20): Attempt {
  if (![10, 20].includes(count) || (topic !== 'all' && !quizTopics.some((t) => t.id === topic)))
    throw Error('Invalid quiz settings');
  const selected =
    topic === 'all'
      ? shuffled(
          quizTopics.flatMap((t) =>
            shuffled(questions.filter((q) => q.topic === t.id)).slice(0, count / quizTopics.length),
          ),
        )
      : shuffled(questions.filter((q) => q.topic === topic)).slice(0, count);
  if (selected.length !== count) throw Error('Not enough questions for this quiz');
  return {
    id: crypto.randomUUID(),
    bankVersion: 1,
    topic,
    count,
    current: 0,
    startedAt: new Date().toISOString(),
    items: selected.map((q) => ({ id: q.id, order: shuffled([0, 1, 2, 3]), answer: null })),
  };
}
export const answered = (a: Attempt) => a.items.filter((item) => item.answer !== null).length;
export const score = (a: Attempt) =>
  a.items.filter((item) => item.answer === questionById.get(item.id)?.correct).length;
export function finishAttempt(state: QuizState): QuizState {
  const active = state.active;
  if (!active || active.completedAt || answered(active) !== active.count) return state;
  const finished = { ...active, completedAt: new Date().toISOString() };
  return {
    ...state,
    active: finished,
    history: [finished, ...state.history.filter((a) => a.id !== finished.id)].slice(0, 20),
  };
}
function validAttempt(value: unknown): value is Attempt {
  if (!value || typeof value !== 'object') return false;
  const a = value as Attempt;
  if (
    a.bankVersion !== 1 ||
    typeof a.id !== 'string' ||
    !a.id ||
    ![10, 20].includes(a.count) ||
    (a.topic !== 'all' && !quizTopics.some((t) => t.id === a.topic)) ||
    !Array.isArray(a.items) ||
    a.items.length !== a.count ||
    !Number.isInteger(a.current) ||
    a.current < 0 ||
    a.current >= a.count ||
    typeof a.startedAt !== 'string' ||
    !Number.isFinite(Date.parse(a.startedAt))
  )
    return false;
  const ids = new Set<string>();
  for (const item of a.items) {
    if (!item || !questionById.has(item.id) || ids.has(item.id)) return false;
    ids.add(item.id);
    if (a.topic !== 'all' && questionById.get(item.id)!.topic !== a.topic) return false;
    if (
      !Array.isArray(item.order) ||
      !item.order.every(Number.isInteger) ||
      item.order.length !== 4 ||
      [...item.order].sort().join(',') !== '0,1,2,3'
    )
      return false;
    if (
      item.answer !== null &&
      (!Number.isInteger(item.answer) || item.answer < 0 || item.answer > 3)
    )
      return false;
  }
  return (
    a.completedAt === undefined ||
    (typeof a.completedAt === 'string' &&
      Number.isFinite(Date.parse(a.completedAt)) &&
      answered(a) === a.count)
  );
}
export function readQuizState(): { data: QuizState; warning: string } {
  const empty: QuizState = { schema: 1, active: null, history: [] };
  try {
    const raw = localStorage.getItem(QUIZ_KEY);
    if (!raw) return { data: empty, warning: '' };
    const parsed = JSON.parse(raw);
    if (parsed.schema !== 1 || !Array.isArray(parsed.history)) throw Error('Invalid quiz data');
    const active = validAttempt(parsed.active) ? parsed.active : null;
    const seen = new Set<string>();
    const history = parsed.history
      .filter((a: unknown): a is Attempt => {
        if (!validAttempt(a) || !a.completedAt || seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      })
      .slice(0, 20);
    return {
      data: { schema: 1, active, history },
      warning:
        (parsed.active && !active) || history.length !== parsed.history.length
          ? 'Some outdated quiz data could not be restored.'
          : '',
    };
  } catch {
    return {
      data: empty,
      warning: 'Saved quizzes could not be loaded. You can still practice in this session.',
    };
  }
}
export function saveQuizState(state: QuizState): boolean {
  try {
    localStorage.setItem(QUIZ_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
