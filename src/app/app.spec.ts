import { accepts, exercises } from './core/exercises';
import { draftKey, freshWorkspace, readWorkspace, saveWorkspace } from './core/storage';
describe('Behavioral grading', () => {
  it('accepts different valid pairs and their reversed order', () => {
    const exercise = exercises[0];
    const check = exercise.additional.find((c) => c.name === 'More than one valid pair')!;
    for (const pair of [
      [0, 1],
      [1, 0],
      [2, 3],
      [3, 2],
    ])
      expect(accepts(exercise, check, pair)).toBe(true);
  });
  it('rejects reused positions, non-integers, out-of-bounds indices and incorrect answers', () => {
    const e = exercises[0];
    const c = e.examples[0];
    for (const value of [[0, 0], [0, 8], [0.5, 1], [2, 3], [2, 7], ['0', '1'], null, [], [0, 1, 2]])
      expect(accepts(e, c, value)).toBe(false);
  });
  it('accepts any tied minimum window, but rejects insufficient character counts', () => {
    const e = exercises[2];
    const c = e.additional.find((c) => c.name === 'Equal shortest windows')!;
    expect(accepts(e, c, 'AB')).toBe(true);
    expect(accepts(e, c, 'BA')).toBe(true);
    expect(accepts(e, c, 'ABx')).toBe(false);
    const repeated = e.additional.find((c) => c.name === 'Repeated requirement')!;
    expect(accepts(e, repeated, 'ABC')).toBe(false);
    expect(accepts(e, repeated, 'AABBC')).toBe(true);
  });
  it('requires an actual integer result for substring length', () => {
    const e = exercises[1];
    const c = e.examples[0];
    expect(accepts(e, c, 3)).toBe(true);
    expect(accepts(e, c, '3')).toBe(false);
    expect(accepts(e, c, true)).toBe(false);
  });
});
describe('Local workspace', () => {
  beforeEach(() => localStorage.clear());
  it('round-trips language-specific drafts and earned completion', () => {
    const data = freshWorkspace();
    const e = exercises[0];
    const key = draftKey(e.id, e.version, 'python');
    data.drafts[key] = 'def two_sum(nums, target):\n    return [1, 0]';
    data.completions = [
      { key, title: e.title, language: 'python', completedAt: new Date().toISOString() },
    ];
    expect(saveWorkspace(data)).toBe(true);
    expect(readWorkspace().data).toEqual(data);
  });
  it('recovers from corrupted storage', () => {
    localStorage.setItem('procode.workspace.v1', '{broken');
    expect(readWorkspace().data).toEqual(freshWorkspace());
    expect(readWorkspace().warning).toBeTruthy();
  });
  it('drops unknown and duplicate completion records', () => {
    const data = freshWorkspace();
    const e = exercises[0];
    const completion = {
      key: draftKey(e.id, e.version, 'javascript'),
      title: e.title,
      language: 'javascript' as const,
      completedAt: new Date().toISOString(),
    };
    data.completions = [completion, completion, { ...completion, key: 'unknown' }];
    saveWorkspace(data);
    expect(readWorkspace().data.completions.length).toBe(1);
  });
});
