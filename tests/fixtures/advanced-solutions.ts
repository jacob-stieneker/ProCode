export const advancedSolutions: Record<string, { javascript: string; python: string }> = {
  'merge-intervals': {
    javascript: `function mergeIntervals(intervals){const out=[];for(const [a,b] of intervals.sort((x,y)=>x[0]-y[0])){const last=out.at(-1);if(last&&a<=last[1])last[1]=Math.max(last[1],b);else out.push([a,b]);}return out;}`,
    python: `def merge_intervals(intervals):
    out = []
    for a, b in sorted(intervals):
        if out and a <= out[-1][1]:
            out[-1][1] = max(out[-1][1], b)
        else:
            out.append([a, b])
    return out`,
  },
  'product-except-self': {
    javascript: `function productExceptSelf(nums){const out=Array(nums.length).fill(1);let p=1;for(let i=0;i<nums.length;i++){out[i]=p;p*=nums[i];}p=1;for(let i=nums.length-1;i>=0;i--){out[i]*=p;p*=nums[i];}return out;}`,
    python: `def product_except_self(nums):
    out = []
    for i in range(len(nums)):
        product = 1
        for j, value in enumerate(nums):
            if i != j:
                product *= value
        out.append(product)
    return out`,
  },
  'three-sum': {
    javascript: `function threeSum(nums){const found=new Map();for(let i=0;i<nums.length;i++)for(let j=i+1;j<nums.length;j++)for(let k=j+1;k<nums.length;k++)if(nums[i]+nums[j]+nums[k]===0){let a=[nums[i],nums[j],nums[k]].sort((a,b)=>a-b);found.set(a.join(','),a);}return [...found.values()].reverse().map(a=>a.reverse());}`,
    python: `def three_sum(nums):
    nums = sorted(nums)
    result = set()
    for i in range(len(nums) - 2):
        left, right = i + 1, len(nums) - 1
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total == 0:
                result.add((nums[i], nums[left], nums[right]))
                left += 1
                right -= 1
            elif total < 0:
                left += 1
            else:
                right -= 1
    return [list(row) for row in result]`,
  },
  'number-of-islands': {
    javascript: `function numIslands(grid){if(!grid.length)return 0;let count=0;for(let r=0;r<grid.length;r++)for(let c=0;c<grid[r].length;c++)if(grid[r][c]){count++;let stack=[[r,c]];grid[r][c]=0;while(stack.length){const [x,y]=stack.pop();for(const [a,b] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(grid[a]?.[b]===1){grid[a][b]=0;stack.push([a,b]);}}}return count;}`,
    python: `def num_islands(grid):
    count = 0
    for r in range(len(grid)):
        for c in range(len(grid[r])):
            if not grid[r][c]:
                continue
            count += 1
            grid[r][c] = 0
            stack = [(r,c)]
            while stack:
                x,y = stack.pop()
                for a,b in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                    if 0 <= a < len(grid) and 0 <= b < len(grid[a]) and grid[a][b] == 1:
                        grid[a][b] = 0
                        stack.append((a,b))
    return count`,
  },
  'coin-change': {
    javascript: `function coinChange(coins,amount){const dp=Array(amount+1).fill(Infinity);dp[0]=0;for(let n=1;n<=amount;n++)for(const c of coins)if(c<=n)dp[n]=Math.min(dp[n],dp[n-c]+1);return Number.isFinite(dp[amount])?dp[amount]:-1;}`,
    python: `def coin_change(coins, amount):
    dp = [amount + 1] * (amount + 1)
    dp[0] = 0
    for n in range(1, amount + 1):
        for c in coins:
            if c <= n:
                dp[n] = min(dp[n], dp[n-c] + 1)
    return dp[amount] if dp[amount] <= amount else -1`,
  },
  'daily-temperatures': {
    javascript: `function dailyTemperatures(temperatures){const result=Array(temperatures.length).fill(0),stack=[];for(let i=0;i<temperatures.length;i++){while(stack.length&&temperatures[i]>temperatures[stack.at(-1)]){let j=stack.pop();result[j]=i-j;}stack.push(i);}return result;}`,
    python: `def daily_temperatures(temperatures):
    result = [0] * len(temperatures)
    for i in range(len(temperatures)):
        for j in range(i+1, len(temperatures)):
            if temperatures[j] > temperatures[i]:
                result[i] = j - i
                break
    return result`,
  },
  'tree-level-order': {
    javascript: `function levelOrder(tree){if(!tree)return [];let queue=[tree],out=[];while(queue.length){out.push(queue.map(n=>n[0]));queue=queue.flatMap(n=>[n[1],n[2]].filter(Boolean));}return out;}`,
    python: `def level_order(tree):
    if tree is None:
        return []
    queue = [tree]
    out = []
    while queue:
        out.append([node[0] for node in queue])
        queue = [child for node in queue for child in node[1:] if child is not None]
    return out`,
  },
  'edit-distance': {
    javascript: `function editDistance(first,second){let row=Array.from({length:second.length+1},(_,i)=>i);for(let i=1;i<=first.length;i++){let next=[i];for(let j=1;j<=second.length;j++)next[j]=first[i-1]===second[j-1]?row[j-1]:1+Math.min(row[j],next[j-1],row[j-1]);row=next;}return row[second.length];}`,
    python: `def edit_distance(first, second):
    dp = [[0] * (len(second)+1) for _ in range(len(first)+1)]
    for i in range(len(first)+1):
        dp[i][0] = i
    for j in range(len(second)+1):
        dp[0][j] = j
    for i in range(1,len(first)+1):
        for j in range(1,len(second)+1):
            dp[i][j] = dp[i-1][j-1] if first[i-1] == second[j-1] else 1 + min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1])
    return dp[-1][-1]`,
  },
  'trapping-rain-water': {
    javascript: `function trapWater(heights){let sum=0;for(let i=0;i<heights.length;i++)sum+=Math.min(Math.max(...heights.slice(0,i+1)),Math.max(...heights.slice(i)))-heights[i];return sum;}`,
    python: `def trap_water(heights):
    left, right = 0, len(heights)-1
    lm = rm = total = 0
    while left <= right:
        if lm <= rm:
            lm = max(lm, heights[left])
            total += lm - heights[left]
            left += 1
        else:
            rm = max(rm, heights[right])
            total += rm - heights[right]
            right -= 1
    return total`,
  },
  'sliding-window-maximum': {
    javascript: `function windowMax(nums,size){return Array.from({length:nums.length-size+1},(_,i)=>Math.max(...nums.slice(i,i+size)));}`,
    python: `def window_max(nums, size):
    from collections import deque
    queue = deque()
    out = []
    for i, value in enumerate(nums):
        while queue and queue[0] <= i-size:
            queue.popleft()
        while queue and nums[queue[-1]] < value:
            queue.pop()
        queue.append(i)
        if i >= size-1:
            out.append(nums[queue[0]])
    return out`,
  },
  'median-sorted-arrays': {
    javascript: `function findMedian(first,second){const a=[...first,...second].sort((a,b)=>a-b),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}`,
    python: `def find_median(first, second):
    if len(first) > len(second):
        return find_median(second, first)
    m,n = len(first), len(second)
    lo,hi = 0,m
    while lo <= hi:
        i = (lo+hi)//2
        j = (m+n+1)//2-i
        al = first[i-1] if i else float('-inf')
        ar = first[i] if i<m else float('inf')
        bl = second[j-1] if j else float('-inf')
        br = second[j] if j<n else float('inf')
        if al <= br and bl <= ar:
            return max(al,bl) if (m+n)%2 else (max(al,bl)+min(ar,br))/2
        if al > br:
            hi = i-1
        else:
            lo = i+1`,
  },
  'course-order': {
    javascript: `function courseOrder(count,prerequisites){const degree=Array(count).fill(0),next=Array.from({length:count},()=>[]),order=[];for(const [c,p] of prerequisites){degree[c]++;next[p].push(c);}let ready=Array.from({length:count},(_,i)=>i).filter(i=>degree[i]===0);while(ready.length){const n=ready.pop();order.push(n);for(const c of next[n])if(--degree[c]===0)ready.push(c);}return order.length===count?order:[];}`,
    python: `def course_order(count, prerequisites):
    next_nodes = [[] for _ in range(count)]
    indegree = [0]*count
    for course, prerequisite in prerequisites:
        next_nodes[prerequisite].append(course)
        indegree[course] += 1
    ready = [i for i in range(count) if indegree[i] == 0]
    order = []
    while ready:
        node = ready.pop()
        order.append(node)
        for child in next_nodes[node]:
            indegree[child] -= 1
            if indegree[child] == 0:
                ready.append(child)
    return order if len(order) == count else []`,
  },
  'shortest-paths': {
    javascript: `function shortestPaths(count,edges,source){
      const distances=Array(count).fill(Infinity), visited=new Set();
      distances[source]=0;
      for(let step=0;step<count;step++) {
        let vertex=-1;
        for(let i=0;i<count;i++) if(!visited.has(i)&&(vertex<0||distances[i]<distances[vertex])) vertex=i;
        if(vertex<0||distances[vertex]===Infinity) break;
        visited.add(vertex);
        for(const [from,to,weight] of edges) if(from===vertex && distances[from]+weight<distances[to]) distances[to]=distances[from]+weight;
      }
      return distances.map(value=>Number.isFinite(value)?value:-1);
}`,
    python: `def shortest_paths(count, edges, source):
    import heapq
    graph = [[] for _ in range(count)]
    for a,b,w in edges:
        graph[a].append((b,w))
    dist = [float('inf')]*count
    dist[source] = 0
    queue = [(0,source)]
    while queue:
        cost,node = heapq.heappop(queue)
        if cost != dist[node]:
            continue
        for child,w in graph[node]:
            if cost+w < dist[child]:
                dist[child] = cost+w
                heapq.heappush(queue,(dist[child],child))
    return [int(d) if d != float('inf') else -1 for d in dist]`,
  },
  'tree-max-path': {
    javascript: `function maxPathSum(tree){if(!tree)return 0;let best=-Infinity;function visit(node){if(!node)return 0;const l=Math.max(0,visit(node[1])),r=Math.max(0,visit(node[2]));best=Math.max(best,node[0]+l+r);return node[0]+Math.max(l,r);}visit(tree);return best;}`,
    python: `def max_path_sum(tree):
    if tree is None:
        return 0
    best = float('-inf')
    def visit(node):
        nonlocal best
        if node is None:
            return 0
        left = max(0, visit(node[1]))
        right = max(0, visit(node[2]))
        best = max(best, node[0]+left+right)
        return node[0]+max(left,right)
    visit(tree)
    return best`,
  },
};
