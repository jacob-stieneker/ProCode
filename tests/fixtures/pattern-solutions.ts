export const patternSolutions: Record<string, { javascript: string; python: string }> = {
  'stock-profit': {
    javascript: `function maxProfit(prices) { let best = 0, min = Infinity; for (const p of prices) { best = Math.max(best, p - min); min = Math.min(min, p); } return best; }`,
    python: `def max_profit(prices):\n    best, lowest = 0, float('inf')\n    for price in prices:\n        best = max(best, price - lowest)\n        lowest = min(lowest, price)\n    return best`,
  },
  'move-zeroes': {
    javascript: `function moveZeroes(nums) { let k = 0; for (let i = 0; i < nums.length; i++) if (nums[i] !== 0) nums[k++] = nums[i]; while (k < nums.length) nums[k++] = 0; return nums; }`,
    python: `def move_zeroes(nums):\n    k = 0\n    for i in range(len(nums)):\n        if nums[i] != 0:\n            nums[k] = nums[i]\n            k += 1\n    for i in range(k, len(nums)):\n        nums[i] = 0\n    return nums`,
  },
  'remove-sorted-duplicates': {
    javascript: `function removeDuplicates(nums) { let k = 0; for (const n of nums) if (k === 0 || nums[k-1] !== n) nums[k++] = n; return nums.slice(0, k); }`,
    python: `def remove_duplicates(nums):\n    k = 0\n    for n in nums:\n        if k == 0 or nums[k-1] != n:\n            nums[k] = n\n            k += 1\n    return nums[:k]`,
  },
  'first-unique-character': {
    javascript: `function firstUniqueChar(text) { const counts = new Map(); for (const c of text) counts.set(c, (counts.get(c) || 0) + 1); return [...text].findIndex(c => counts.get(c) === 1); }`,
    python: `def first_unique_char(text):\n    counts = {}\n    for c in text:\n        counts[c] = counts.get(c, 0) + 1\n    return next((i for i, c in enumerate(text) if counts[c] == 1), -1)`,
  },
  'longest-common-prefix': {
    javascript: `function longestCommonPrefix(words) { if (!words.length) return ''; let p = words[0]; for (const word of words) while (!word.startsWith(p)) p = p.slice(0, -1); return p; }`,
    python: `def longest_common_prefix(words):\n    if not words:\n        return ''\n    prefix = words[0]\n    for word in words:\n        while not word.startswith(prefix):\n            prefix = prefix[:-1]\n    return prefix`,
  },
  'reverse-linked-list': {
    javascript: `function reverseList(head) { let prev = null; while (head) { const next = head.next; head.next = prev; prev = head; head = next; } return prev; }`,
    python: `def reverse_list(head):\n    previous = None\n    while head is not None:\n        head.next, previous, head = previous, head, head.next\n    return previous`,
  },
  'merge-sorted-lists': {
    javascript: `function mergeTwoLists(first, second) { const dummy = new ListNode(); let tail = dummy; while (first || second) { if (!second || (first && first.val <= second.val)) { tail.next = new ListNode(first.val); first = first.next; } else { tail.next = new ListNode(second.val); second = second.next; } tail = tail.next; } return dummy.next; }`,
    python: `def merge_two_lists(first, second):\n    dummy = ListNode()\n    tail = dummy\n    while first is not None or second is not None:\n        if second is None or (first is not None and first.val <= second.val):\n            tail.next = ListNode(first.val)\n            first = first.next\n        else:\n            tail.next = ListNode(second.val)\n            second = second.next\n        tail = tail.next\n    return dummy.next`,
  },
  'linked-list-cycle': {
    javascript: `function hasCycle(head) { let slow = head, fast = head; while (fast && fast.next) { slow = slow.next; fast = fast.next.next; if (slow === fast) return true; } return false; }`,
    python: `def has_cycle(head):\n    slow = fast = head\n    while fast is not None and fast.next is not None:\n        slow = slow.next\n        fast = fast.next.next\n        if slow is fast:\n            return True\n    return False`,
  },
  'tree-max-depth': {
    javascript: `function maxDepth(root) { let level = root ? [root] : [], depth = 0; while (level.length) { level = level.flatMap(node => [node.left, node.right].filter(n => n !== null)); depth++; } return depth; }`,
    python: `def max_depth(root):\n    level = [root] if root is not None else []\n    depth = 0\n    while level:\n        level = [child for node in level for child in (node.left, node.right) if child is not None]\n        depth += 1\n    return depth`,
  },
  'same-tree': {
    javascript: `function isSameTree(a, b) { if (a === null || b === null) return a === b; return a.val === b.val && isSameTree(a.left, b.left) && isSameTree(a.right, b.right); }`,
    python: `def is_same_tree(first, second):\n    if first is None or second is None:\n        return first is second\n    return first.val == second.val and is_same_tree(first.left, second.left) and is_same_tree(first.right, second.right)`,
  },
};
