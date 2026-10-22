// Independent implementations used only by tests, never shipped in the app.
export const solutions: Record<string, { javascript: string; python: string }> = {
  'selection-sort': {
    javascript: `function selectionSort(nums) { for(let i=0;i<nums.length;i++){let min=i;for(let j=i+1;j<nums.length;j++)if(nums[j]<nums[min])min=j;[nums[i],nums[min]]=[nums[min],nums[i]];} return nums; }`,
    python: `def selection_sort(nums):
    for i in range(len(nums)):
        smallest = i
        for j in range(i + 1, len(nums)):
            if nums[j] < nums[smallest]:
                smallest = j
        nums[i], nums[smallest] = nums[smallest], nums[i]
    return nums`,
  },
  'bubble-sort': {
    javascript: `function bubbleSort(nums) { for(let end=nums.length-1;end>0;end--){let changed=false;for(let i=0;i<end;i++)if(nums[i]>nums[i+1]){[nums[i],nums[i+1]]=[nums[i+1],nums[i]];changed=true;}if(!changed)break;}return nums; }`,
    python: `def bubble_sort(nums):
    for end in range(len(nums) - 1, 0, -1):
        changed = False
        for i in range(end):
            if nums[i] > nums[i + 1]:
                nums[i], nums[i + 1] = nums[i + 1], nums[i]
                changed = True
        if not changed:
            break
    return nums`,
  },
  'insertion-sort': {
    javascript: `function insertionSort(nums) { for(let i=1;i<nums.length;i++){const value=nums[i];let j=i-1;while(j>=0&&nums[j]>value){nums[j+1]=nums[j];j--;}nums[j+1]=value;}return nums; }`,
    python: `def insertion_sort(nums):
    for i in range(1, len(nums)):
        value = nums[i]
        j = i - 1
        while j >= 0 and nums[j] > value:
            nums[j + 1] = nums[j]
            j -= 1
        nums[j + 1] = value
    return nums`,
  },
  'merge-sort': {
    javascript: `function mergeSort(nums) { if(nums.length<2)return nums;const mid=Math.floor(nums.length/2),a=mergeSort(nums.slice(0,mid)),b=mergeSort(nums.slice(mid));let i=0,j=0,out=[];while(i<a.length&&j<b.length)out.push(a[i]<=b[j]?a[i++]:b[j++]);return out.concat(a.slice(i),b.slice(j)); }`,
    python: `def merge_sort(nums):
    if len(nums) < 2:
        return nums
    mid = len(nums) // 2
    left, right = merge_sort(nums[:mid]), merge_sort(nums[mid:])
    i = j = 0
    out = []
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i])
            i += 1
        else:
            out.append(right[j])
            j += 1
    return out + left[i:] + right[j:]`,
  },
  'linear-search': {
    javascript: `function linearSearch(nums,target) { for(let i=0;i<nums.length;i++)if(nums[i]===target)return i;return -1; }`,
    python: `def linear_search(nums, target):
    for i, value in enumerate(nums):
        if value == target:
            return i
    return -1`,
  },
  'binary-search': {
    javascript: `function binarySearch(nums,target) { let l=0,r=nums.length-1;while(l<=r){let m=Math.floor((l+r)/2);if(nums[m]===target)return m;if(nums[m]<target)l=m+1;else r=m-1;}return -1; }`,
    python: `def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
  },
  'reverse-string': {
    javascript: `function reverseString(text) { let out=[];for(let i=text.length-1;i>=0;i--)out.push(text[i]);return out.join(''); }`,
    python: `def reverse_string(text):
    return text[::-1]`,
  },
  'valid-palindrome': {
    javascript: `function isPalindrome(text) { const s=text.toLowerCase().replace(/[^a-z0-9]/g,'');let l=0,r=s.length-1;while(l<r)if(s[l++]!==s[r--])return false;return true; }`,
    python: `def is_palindrome(text):
    text = ''.join(c.lower() for c in text if c.isalnum())
    return text == text[::-1]`,
  },
  'valid-anagram': {
    javascript: `function isAnagram(first,second) { const counts=new Map();for(const c of first)counts.set(c,(counts.get(c)||0)+1);for(const c of second)counts.set(c,(counts.get(c)||0)-1);return [...counts.values()].every(n=>n===0); }`,
    python: `def is_anagram(first, second):
    counts = {}
    for c in first:
        counts[c] = counts.get(c, 0) + 1
    for c in second:
        counts[c] = counts.get(c, 0) - 1
    return all(n == 0 for n in counts.values())`,
  },
  'contains-duplicate': {
    javascript: `function containsDuplicate(nums) { const seen=new Set();for(const n of nums){if(seen.has(n))return true;seen.add(n);}return false; }`,
    python: `def contains_duplicate(nums):
    return len(set(nums)) != len(nums)`,
  },
  'maximum-subarray': {
    javascript: `function maxSubarray(nums) { let ending=nums[0],best=ending;for(let i=1;i<nums.length;i++){ending=Math.max(nums[i],ending+nums[i]);best=Math.max(best,ending);}return best; }`,
    python: `def max_subarray(nums):
    best = nums[0]
    for i in range(len(nums)):
        total = 0
        for value in nums[i:]:
            total += value
            best = max(best, total)
    return best`,
  },
  'valid-parentheses': {
    javascript: `function validParentheses(text) { const stack=[],pairs={')':'(',']':'[','}':'{'};for(const c of text){if('([{'.includes(c))stack.push(c);else if(stack.pop()!==pairs[c])return false;}return stack.length===0; }`,
    python: `def valid_parentheses(text):
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    for c in text:
        if c in '([{':
            stack.append(c)
        elif not stack or stack.pop() != pairs[c]:
            return False
    return not stack`,
  },
  'climbing-stairs': {
    javascript: `function climbStairs(steps) { let a=1,b=1;for(let i=2;i<=steps;i++)[a,b]=[b,a+b];return b; }`,
    python: `def climb_stairs(steps):
    memo = {0: 1, 1: 1}
    def ways(n):
        if n not in memo:
            memo[n] = ways(n - 1) + ways(n - 2)
        return memo[n]
    return ways(steps)`,
  },
};
