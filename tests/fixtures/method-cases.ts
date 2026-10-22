import type { Language } from '../../src/app/core/exercises';
import { solutions as junior } from './junior-solutions';
import { advancedSolutions } from './advanced-solutions';
import { structureSolutions } from './structure-solutions';
export const solutions = { ...junior, ...advancedSolutions, ...structureSolutions };
export const variants: Record<Language, Record<string, string>> = {
  javascript: {
    'selection-sort': `function selectionSort(values) {const a=[...values];for(let end=a.length-1;end>0;end--){let largest=end;for(let at=end-1;at>=0;at--)if(a[at]>a[largest])largest=at;[a[end],a[largest]]=[a[largest],a[end]];}return a;}`,
    'bubble-sort': `function bubbleSort(values) {let end=values.length;while(end>1){let lastSwap=0;for(let at=1;at<end;at++)if(values[at-1]>values[at]){[values[at-1],values[at]]=[values[at],values[at-1]];lastSwap=at;}end=lastSwap;}return values;}`,
    'insertion-sort': `function insertionSort(values) {for(let outer=1;outer<values.length;outer++)for(let at=outer;at>0&&values[at-1]>values[at];at--)[values[at-1],values[at]]=[values[at],values[at-1]];return values;}`,
    'binary-search': `function binarySearch(values,target){function find(lo,hi){if(lo>hi)return -1;const mid=Math.ceil((lo+hi)/2);if(values[mid]===target)return mid;return values[mid]<target?find(mid+1,hi):find(lo,mid-1);}return find(0,values.length-1);}`,
  },
  python: {
    'selection-sort': `def selection_sort(values):\n    a = values[:]\n    for end in range(len(a)-1,0,-1):\n        largest = end\n        for at in range(end-1,-1,-1):\n            if a[at] > a[largest]: largest = at\n        a[end],a[largest] = a[largest],a[end]\n    return a`,
    'bubble-sort': `def bubble_sort(values):\n    end = len(values)\n    while end > 1:\n        last_swap = 0\n        for at in range(1,end):\n            if values[at-1] > values[at]:\n                values[at-1],values[at] = values[at],values[at-1]\n                last_swap = at\n        end = last_swap\n    return values`,
    'insertion-sort': `def insertion_sort(values):\n    for outer in range(1,len(values)):\n        at = outer\n        while at > 0 and values[at-1] > values[at]:\n            values[at-1],values[at] = values[at],values[at-1]\n            at -= 1\n    return values`,
    'binary-search': `def binary_search(values,target):\n    def find(lo,hi):\n        if lo > hi: return -1\n        mid = (lo+hi+1)//2\n        if values[mid] == target: return mid\n        return find(mid+1,hi) if values[mid] < target else find(lo,mid-1)\n    return find(0,len(values)-1)`,
  },
};
export const substitutes: Record<Language, Record<string, string>> = {
  javascript: {
    'shortest-paths': `function shortestPaths(count,edges,source){const d=Array(count).fill(Infinity);d[source]=0;for(let pass=0;pass<count-1;pass++)for(const [a,b,w] of edges)d[b]=Math.min(d[b],d[a]+w);return d.map(x=>Number.isFinite(x)?x:-1);}`,
    'prefix-tree': `function trieOperations(operations) { const words=new Set();return operations.map(([op,word])=> {if(op==='insert'){words.add(word);return null;}return op==='search'?words.has(word):[...words].some(value=>value.startsWith(word));}); }`,
    'tree-level-order': `function levelOrder(tree){const out=[];function visit(node,depth){if(!node)return;(out[depth]??=[]).push(node[0]);visit(node[1],depth+1);visit(node[2],depth+1);}visit(tree,0);return out;}`,
  },
  python: {
    'shortest-paths': `def shortest_paths(count, edges, source):\n    dist = [float('inf')]*count\n    dist[source] = 0\n    for _ in range(count-1):\n        for a,b,w in edges:\n            dist[b] = min(dist[b],dist[a]+w)\n    return [d if d != float('inf') else -1 for d in dist]`,
    'prefix-tree': `def trie_operations(operations):\n    words = set()\n    out = []\n    for op,word in operations:\n        if op == 'insert':\n            words.add(word)\n            out.append(None)\n        else:\n            out.append(word in words if op == 'search' else any(value.startswith(word) for value in words))\n    return out`,
    'tree-level-order': `def level_order(tree):\n    out = []\n    def visit(node, depth):\n        if node is None: return\n        if len(out) == depth: out.append([])\n        out[depth].append(node[0])\n        visit(node[1], depth+1)\n        visit(node[2], depth+1)\n    visit(tree,0)\n    return out`,
  },
};
const builtin: Record<Language, string> = {
  javascript: 'function selectionSort(nums) { return nums.sort((a,b)=>a-b); }',
  python: 'def selection_sort(nums):\n    return sorted(nums)',
};
const quick: Record<Language, string> = {
  javascript:
    'function selectionSort(nums) { if(nums.length<2)return nums;const [pivot,...rest]=nums;return [...selectionSort(rest.filter(x=>x<pivot)),pivot,...selectionSort(rest.filter(x=>x>=pivot))]; }',
  python:
    'def selection_sort(nums):\n    if len(nums) < 2: return nums\n    pivot = nums[0]\n    return selection_sort([x for x in nums[1:] if x < pivot]) + [pivot] + selection_sort([x for x in nums[1:] if x >= pivot])',
};
export function searchCases(language: Language) {
  const linear = junior['linear-search'][language].replaceAll(
    language === 'javascript' ? 'linearSearch' : 'linear_search',
    language === 'javascript' ? 'binarySearch' : 'binary_search',
  );
  return [
    ['binary-search', linear, 'Different method detected'],
    ['selection-sort', builtin[language], 'Different method detected'],
    ['selection-sort', quick[language], 'Method not verified'],
  ];
}
export function stalledSelection(language: Language) {
  return junior['selection-sort'][language].replace(
    language === 'javascript' ? '{' : ':',
    language === 'javascript'
      ? '{ if(nums[0] === 419) { while(true) {} }'
      : ':\n    if nums and nums[0] == 419:\n        while True: pass',
  );
}
