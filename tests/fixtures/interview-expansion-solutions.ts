export const expansionSolutions: Record<string, { javascript: string; python: string }> = {
  'min-stack': {
    javascript: `function minStack(operations) { const stack=[]; return operations.map(([op,value])=>{ if(op==='push'){stack.push([value,stack.length?Math.min(value,stack.at(-1)[1]):value]);return null;} if(op==='pop'){stack.pop();return null;} return stack.length?stack.at(-1)[op==='top'?0:1]:null; }); }`,
    python: `def min_stack(operations):
    stack = []
    result = []
    for operation in operations:
        op = operation[0]
        if op == "push":
            value = operation[1]
            stack.append((value, min(value, stack[-1][1]) if stack else value))
            result.append(None)
        elif op == "pop":
            if stack: stack.pop()
            result.append(None)
        else:
            result.append(stack[-1][0 if op == "top" else 1] if stack else None)
    return result`,
  },
  'validate-bst': {
    javascript: `function isValidBst(tree) { function walk(node,low,high){if(node===null)return true;const [value,left,right]=node;return value>low&&value<high&&walk(left,low,value)&&walk(right,value,high);}return walk(tree,-Infinity,Infinity); }`,
    python: `def is_valid_bst(tree):
    def walk(node, lower, upper):
        if node is None: return True
        value, left, right = node
        return lower < value < upper and walk(left, lower, value) and walk(right, value, upper)
    return walk(tree, float("-inf"), float("inf"))`,
  },
  'merge-k-lists': {
    javascript: `function mergeSortedLists(lists) { function merge(left,right){let a=0,b=0,result=[];while(a<left.length&&b<right.length)result.push(left[a]<=right[b]?left[a++]:right[b++]);return result.concat(left.slice(a),right.slice(b));}let work=lists.map(list=>list.slice());while(work.length>1){const next=[];for(let i=0;i<work.length;i+=2)next.push(merge(work[i],work[i+1]||[]));work=next;}return work[0]||[]; }`,
    python: `import heapq

def merge_sorted_lists(lists):
    return list(heapq.merge(*lists))`,
  },
};
