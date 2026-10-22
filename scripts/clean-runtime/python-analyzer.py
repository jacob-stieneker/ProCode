import ast

def analyze_clean_code(source, entry):
    tree = ast.parse(source, filename="solution.py")
    result = {"shortNames": [], "branchDepth": 0, "inlineNumbers": [], "inlineStrings": [], "helpers": [], "entryStatements": 0}
    functions = {}
    def binding(name):
        if len(name.replace("_", "")) < 3:
            result["shortNames"].append(name)
    def visit(node, inside=False, depth=0):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            functions[node.name] = node
            binding(node.name)
            for argument in ast.walk(node.args):
                if isinstance(argument, ast.arg): binding(argument.arg)
            for child in node.body: visit(child, True, 0)
            for default in node.args.defaults + node.args.kw_defaults:
                if default is not None: visit(default, True, 0)
            return
        if isinstance(node, ast.Lambda):
            for argument in ast.walk(node.args):
                if isinstance(argument, ast.arg): binding(argument.arg)
            visit(node.body, True, 0)
            return
        if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store): binding(node.id)
        if inside and isinstance(node, ast.Constant):
            if type(node.value) in (int, float): result["inlineNumbers"].append(node.value)
            if isinstance(node.value, str): result["inlineStrings"].append(node.value)
        if inside and isinstance(node, (ast.If, ast.IfExp, ast.Match)):
            result["branchDepth"] = max(result["branchDepth"], depth + 1)
            if isinstance(node, ast.If):
                visit(node.test, True, depth + 1)
                for child in node.body: visit(child, True, depth + 1)
                for child in node.orelse: visit(child, True, depth if isinstance(child, ast.If) else depth + 1)
            else:
                for child in ast.iter_child_nodes(node): visit(child, True, depth + 1)
            return
        for child in ast.iter_child_nodes(node): visit(child, inside, depth)
    visit(tree)
    def inspect(function):
        statements, calls = [], []
        def walk(node):
            if node is not function and isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda)): return
            if isinstance(node, ast.stmt) and node is not function: statements.append(node)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name): calls.append(node.func.id)
            for child in ast.iter_child_nodes(node): walk(child)
        walk(function)
        return len(statements), calls
    seen, queue = {entry}, [entry]
    while queue:
        name = queue.pop(0)
        if name not in functions: continue
        count, calls = inspect(functions[name])
        if name == entry: result["entryStatements"] = count
        for called in calls:
            if called in functions and called not in seen:
                seen.add(called)
                queue.append(called)
                result["helpers"].append(called)
    result["shortNames"] = list(dict.fromkeys(result["shortNames"]))
    return result
