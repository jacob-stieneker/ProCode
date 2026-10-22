import ts from 'typescript';
import { analyzeJavaScript } from '../../../../scripts/clean-runtime/analyzer.mjs';
import { cleanExercises } from './catalog';
import { equal, gradeStructure } from './runner';
import { cleanSolutions } from '../../../../tests/fixtures/clean-solutions';
function evaluate(id: string, source: string) {
  const exercise = cleanExercises.find((e) => e.id === id)!;
  const solve = new Function(source + '\nreturn ' + exercise.signature.javascript)();
  const behavior = [],
    preserved = [];
  for (const check of [...exercise.examples, ...exercise.additional]) {
    const input = structuredClone(check.input);
    behavior.push(equal(solve(...input), check.expected));
    preserved.push(equal(input, check.input));
  }
  return {
    behavior,
    preserved,
    cleanup: gradeStructure(exercise, analyzeJavaScript(ts, source, exercise.signature.javascript)),
  };
}
describe('Additional Clean code grading', () => {
  it('accepts an alternative imperative tag normalizer without requiring exact source', () => {
    const result = evaluate(
      'cc-tags',
      `function normalizeTags(records){const output=[];for(const record of records){const tags=[];for(const original of record.tags){const tag=original.trim().toLowerCase();if(tag&&!tags.includes(tag))tags.push(tag);}tags.sort();output.push({id:record.id,tags});}return output;}`,
    );
    expect(result.behavior.every(Boolean)).toBe(true);
    expect(result.preserved.every(Boolean)).toBe(true);
  });
  it('rejects nested tag mutation despite correct returned values', () => {
    const result = evaluate(
      'cc-tags',
      `function normalizeTags(records){return records.map(record=>{const tags=[...new Set(record.tags.map(tag=>tag.trim().toLowerCase()).filter(Boolean))].sort();record.tags.splice(0,record.tags.length,...tags);return {id:record.id,tags:record.tags};});}`,
    );
    expect(result.behavior.every(Boolean)).toBe(true);
    expect(result.preserved.every(Boolean)).toBe(false);
  });
  it('checks coupon cleanup independently of correct behavior and of each other', () => {
    const flatButLiteral = cleanSolutions['cc-coupon'].javascript.replace(
      'order.subtotalCents<MINIMUM_SUBTOTAL',
      'order.subtotalCents<2000',
    );
    const result = evaluate('cc-coupon', flatButLiteral);
    expect(result.behavior.every(Boolean)).toBe(true);
    expect(result.cleanup.map((c) => c.pass)).toEqual([true, false]);
  });
  it('rejects priority, capping, threshold and default-policy regressions after cleanup', () => {
    const cases: [string, string][] = [
      [
        'cc-pagination',
        cleanSolutions['cc-pagination'].javascript.replace(
          'Math.ceil(total/pageSize)',
          'Math.floor(total/pageSize)',
        ),
      ],
      [
        'cc-retry',
        cleanSolutions['cc-retry'].javascript.replace(
          'Math.min(MAX_DELAY_MS,Math.max(BASE_DELAY_MS*2**attempt,retryAfterMs??0))',
          'Math.max(Math.min(MAX_DELAY_MS,BASE_DELAY_MS*2**attempt),retryAfterMs??0)',
        ),
      ],
      [
        'cc-coupon',
        cleanSolutions['cc-coupon'].javascript.replace(
          "if(!order.active)return 'inactive';",
          "if(order.existingDiscount)return 'exclusive';if(!order.active)return 'inactive';",
        ),
      ],
      [
        'cc-logs',
        cleanSolutions['cc-logs'].javascript.replace(
          'event.durationMs>=SLOW_THRESHOLD',
          'event.durationMs>SLOW_THRESHOLD',
        ),
      ],
      [
        'cc-roles',
        cleanSolutions['cc-roles'].javascript.replace(
          'NO_PERMISSIONS=[false,false,false]',
          'NO_PERMISSIONS=[true,false,false]',
        ),
      ],
    ];
    for (const [id, source] of cases) {
      expect(source).not.toBe(cleanSolutions[id].javascript);
      const result = evaluate(id, source);
      expect(
        result.cleanup.every((c) => c.pass),
        id,
      ).toBe(true);
      expect(result.behavior.every(Boolean), id).toBe(false);
    }
  });
});
