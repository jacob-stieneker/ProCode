export const structureSolutions: Record<string, { javascript: string; python: string }> = {
  'prefix-tree': {
    javascript: `function trieOperations(operations) {
  const root = { children: new Map(), terminal: false };
  return operations.map(([op, word]) => {
    let node = root;
    for (const char of word) {
      if (!node.children.has(char)) {
        if (op !== 'insert') return false;
        node.children.set(char, {children: new Map(), terminal: false});
      }
      node = node.children.get(char);
    }
    if (op === 'insert') { node.terminal = true; return null; }
    return op === 'startsWith' || node.terminal;
  });
}`,
    python: `def trie_operations(operations):
    root = {}
    results = []
    for op, word in operations:
        node = root
        for char in word:
            if char not in node:
                if op != 'insert':
                    node = None
                    break
                node[char] = {}
            node = node[char]
        if op == 'insert':
            node['$'] = True
            results.append(None)
        else:
            results.append(node is not None and (op == 'startsWith' or '$' in node))
    return results`,
  },
  'lru-cache': {
    javascript: `function lruCache(capacity, operations) {
  const cache = new Map();
  return operations.map(([op, key, value]) => {
    if (op === 'get' && !cache.has(key)) return -1;
    const result = op === 'get' ? cache.get(key) : value;
    cache.delete(key);
    cache.set(key, result);
    if (cache.size > capacity) cache.delete(cache.keys().next().value);
    return op === 'get' ? result : null;
  });
}`,
    python: `from collections import OrderedDict

def lru_cache(capacity, operations):
    cache = OrderedDict()
    results = []
    for operation in operations:
        op, key = operation[:2]
        if op == 'get' and key not in cache:
            results.append(-1)
            continue
        value = cache[key] if op == 'get' else operation[2]
        cache[key] = value
        cache.move_to_end(key)
        if len(cache) > capacity:
            cache.popitem(last=False)
        results.append(value if op == 'get' else None)
    return results`,
  },
  'streaming-median': {
    javascript: `function runningMedians(nums) {
  const lower = [], upper = [];
  function push(heap, value) {
    heap.push(value);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p] <= heap[i]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  }
  function pop(heap) {
    const first = heap[0], last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      while (true) {
        let next = i;
        for (const child of [i * 2 + 1, i * 2 + 2])
          if (child < heap.length && heap[child] < heap[next]) next = child;
        if (next === i) break;
        [heap[i], heap[next]] = [heap[next], heap[i]];
        i = next;
      }
    }
    return first;
  }
  return nums.map(value => {
    push(lower, -value);
    push(upper, -pop(lower));
    if (upper.length > lower.length) push(lower, -pop(upper));
    return lower.length > upper.length ? -lower[0] : (upper[0] - lower[0]) / 2;
  });
}`,
    python: `import heapq

def running_medians(nums):
    lower, upper, result = [], [], []
    for value in nums:
        heapq.heappush(lower, -value)
        heapq.heappush(upper, -heapq.heappop(lower))
        if len(upper) > len(lower):
            heapq.heappush(lower, -heapq.heappop(upper))
        result.append(-lower[0] if len(lower) > len(upper) else (upper[0] - lower[0]) / 2)
    return result`,
  },
};
