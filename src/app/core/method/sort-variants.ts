export type Compare = (a: number, b: number) => number;
export type Sort = (values: number[], compare: Compare) => void;
type Scan = { maximum: boolean; backwards: boolean };
type Bubble = { reverse: boolean; bounded: boolean; early: boolean; extra: number };
const flags = [false, true];
const swap = (a: number[], i: number, j: number) => {
  [a[i], a[j]] = [a[j], a[i]];
};
function selectionIndex(a: number[], cmp: Compare, start: number, end: number, scan: Scan) {
  let chosen = scan.backwards ? end : start;
  const indices = Array.from({ length: end - start }, (_, j) =>
    scan.backwards ? end - 1 - j : start + 1 + j,
  );
  for (const j of indices)
    if (scan.maximum ? cmp(a[j], a[chosen]) > 0 : cmp(a[j], a[chosen]) < 0) chosen = j;
  return chosen;
}
function selection(scan: Scan): Sort {
  return (a, cmp) => {
    for (let step = 0; step < a.length - 1; step++) {
      const start = scan.maximum ? 0 : step;
      const end = scan.maximum ? a.length - 1 - step : a.length - 1;
      swap(a, scan.maximum ? end : start, selectionIndex(a, cmp, start, end, scan));
    }
  };
}
function bubblePass(a: number[], cmp: Compare, start: number, end: number, reverse: boolean) {
  let changed = false;
  const indices = Array.from({ length: Math.max(0, end - start) }, (_, j) =>
    reverse ? end - 1 - j : start + j,
  );
  for (const j of indices)
    if (cmp(a[j], a[j + 1]) > 0) {
      swap(a, j, j + 1);
      changed = true;
    }
  return changed;
}
function bubble(options: Bubble): Sort {
  return (a, cmp) => {
    for (let pass = 0; pass < a.length - 1 + options.extra; pass++) {
      const start = options.reverse && options.bounded ? pass : 0;
      const end = !options.reverse && options.bounded ? a.length - 1 - pass : a.length - 1;
      const changed = bubblePass(a, cmp, start, end, options.reverse);
      if (options.early && !changed) break;
    }
  };
}
const lastSwapBubble: Sort = (a, cmp) => {
  let end = a.length;
  while (end > 1) {
    let lastSwap = 0;
    for (let j = 1; j < end; j++)
      if (cmp(a[j - 1], a[j]) > 0) {
        swap(a, j - 1, j);
        lastSwap = j;
      }
    end = lastSwap;
  }
};
function insert(a: number[], cmp: Compare, i: number, forward: boolean) {
  const value = a[i];
  let j = forward ? 0 : i;
  if (forward) {
    while (j < i && cmp(a[j], value) <= 0) j++;
    a.splice(i, 1);
    a.splice(j, 0, value);
    return;
  }
  while (j > 0 && cmp(a[j - 1], value) > 0) {
    a[j] = a[j - 1];
    j--;
  }
  a[j] = value;
}
function merge(left: number[], right: number[], cmp: Compare) {
  const out: number[] = [];
  let i = 0,
    j = 0;
  while (i < left.length && j < right.length)
    out.push(cmp(left[i], right[j]) <= 0 ? left[i++] : right[j++]);
  return out.concat(left.slice(i), right.slice(j));
}
function divide(a: number[], cmp: Compare, ceil: boolean, rightFirst: boolean): number[] {
  if (a.length < 2) return a;
  const mid = (ceil ? Math.ceil : Math.floor)(a.length / 2);
  const halves = [a.slice(0, mid), a.slice(mid)];
  const order = rightFirst ? [1, 0] : [0, 1];
  for (const index of order) halves[index] = divide(halves[index], cmp, ceil, rightFirst);
  return merge(halves[0], halves[1], cmp);
}
const bottomUpMerge: Sort = (a, cmp) => {
  for (let width = 1; width < a.length; width *= 2)
    for (let start = 0; start < a.length; start += 2 * width) {
      const left = a.slice(start, start + width),
        right = a.slice(start + width, start + 2 * width);
      a.splice(start, left.length + right.length, ...merge(left, right, cmp));
    }
};
const selections = flags.flatMap((maximum) =>
  flags.map((backwards) => selection({ maximum, backwards })),
);
const bubbles = flags.flatMap((reverse) =>
  flags.flatMap((bounded) =>
    flags.flatMap((early) => [0, 1].map((extra) => bubble({ reverse, bounded, early, extra }))),
  ),
);
const insertions: Sort[] = flags.map((forward) => (a, cmp) => {
  for (let i = 1; i < a.length; i++) insert(a, cmp, i, forward);
});
const merges: Sort[] = flags.flatMap((ceil) =>
  flags.map((rightFirst) => (a, cmp) => {
    divide(a, cmp, ceil, rightFirst);
  }),
);
export const sortVariants: Record<string, Sort[]> = {
  'selection-sort': selections,
  'bubble-sort': [lastSwapBubble, ...bubbles],
  'insertion-sort': insertions,
  'merge-sort': [...merges, bottomUpMerge],
};
