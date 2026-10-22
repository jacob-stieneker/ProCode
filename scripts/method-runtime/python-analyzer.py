import ast
import operator

TRACE_LIMIT = 12000
OPERATIONS = {'<': operator.lt, '>': operator.gt, '<=': operator.le,
              '>=': operator.ge, '==': operator.eq, '!=': operator.ne, '+': operator.add}
COMPARISON_NAMES = {ast.Lt: '<', ast.Gt: '>', ast.LtE: '<=', ast.GtE: '>=',
                    ast.Eq: '==', ast.NotEq: '!='}


def is_sum(node):
    return isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add)


def candidate_names(tree):
    names = set()
    for node in ast.walk(tree):
        if not isinstance(node, (ast.Assign, ast.NamedExpr)) or not is_sum(node.value):
            continue
        targets = node.targets if isinstance(node, ast.Assign) else [node.target]
        names.update(target.id for target in targets if isinstance(target, ast.Name))
    return names


class Instrument(ast.NodeTransformer):
    def __init__(self, hook, candidates):
        self.hook = hook
        self.candidates = candidates

    def event(self, node, kind, args):
        event = ast.Call(func=ast.Name(id=self.hook, ctx=ast.Load()),
                         args=[ast.Constant(kind)] + args, keywords=[])
        return ast.copy_location(event, node)

    def candidate(self, node):
        return is_sum(node) or isinstance(node, ast.Name) and node.id in self.candidates

    def suffix(self, left, right):
        if self.candidate(left):
            return ':relax-left'
        return ':relax-right' if self.candidate(right) else ''

    def visit_Compare(self, node):
        suffix = self.suffix(node.left, node.comparators[0]) if len(node.ops) == 1 else ''
        self.generic_visit(node)
        if len(node.ops) != 1 or type(node.ops[0]) not in COMPARISON_NAMES:
            return node
        return self.event(node, COMPARISON_NAMES[type(node.ops[0])] + suffix,
                          [node.left, node.comparators[0]])

    def visit_BinOp(self, node):
        self.generic_visit(node)
        return self.event(node, '+', [node.left, node.right]) if is_sum(node) else node

    def visit_Subscript(self, node):
        self.generic_visit(node)
        if isinstance(node.ctx, ast.Load) and not isinstance(node.slice, ast.Slice):
            return self.event(node, 'read', [node.value, node.slice])
        return node

    def visit_Attribute(self, node):
        self.generic_visit(node)
        if isinstance(node.ctx, ast.Load) and not getattr(node, '_method_receiver', False):
            return self.event(node, 'attribute', [node.value, ast.Constant(node.attr)])
        return node

    def call_suffix(self, node):
        if isinstance(node.func, ast.Name) and node.func.id == 'min' and len(node.args) == 2:
            return self.suffix(*node.args)
        return ''

    def instrument_call(self, node, suffix):
        args = ast.List(elts=node.args, ctx=ast.Load())
        if isinstance(node.func, ast.Name) and node.func.id == 'sorted' and node.keywords:
            return self.event(node, 'builtin-result', [node])
        if isinstance(node.func, ast.Name) and node.func.id in ('sorted', 'min') and not node.keywords:
            return self.event(node, 'native' + suffix, [node.func, ast.Constant(node.func.id), args])
        if isinstance(node.func, ast.Attribute) and node.func.attr in ('sort', 'get', 'setdefault') and not node.keywords:
            return self.event(node, 'call', [node.func.value, ast.Constant(node.func.attr), args])
        return node

    def visit_Call(self, node):
        if isinstance(node.func, ast.Attribute):
            node.func._method_receiver = True
        suffix = self.call_suffix(node)
        self.generic_visit(node)
        return self.instrument_call(node, suffix)


def number(value):
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        return None
    return str(value) if value in (float('inf'), -float('inf')) else value


def node_object(value):
    return isinstance(value, dict) or hasattr(value, '__dict__')


class Capture:
    def __init__(self):
        self.events = []
        self.objects = {}  # Hold references so object ids cannot be recycled.

    def identity(self, value):
        self.objects[id(value)] = value
        return str(id(value))

    def read(self, value, key, result):
        if node_object(value) and isinstance(key, str) and node_object(result) and not callable(result):
            self.events.append(['edge', self.identity(value), key, self.identity(result)])
        if isinstance(value, list) and key == 0 and len(value) == 3 and isinstance(value[0], int):
            self.events.append(['visit', value[0]])
        return result

    def trace(self, kind, a, b=None):
        if len(self.events) > TRACE_LIMIT:
            raise ValueError('Method trace limit reached.')
        if kind == 'read':
            return self.read(a, b, a[b])
        if kind == 'attribute':
            return self.read(a, b, getattr(a, b))
        if number(a) is not None and number(b) is not None:
            self.events.append([kind, number(a), number(b)])
        return OPERATIONS[kind](a, b)

    def relax(self, side, values):
        left, right = values if side == 'relax-left' else reversed(values)
        if number(left) is not None and number(right) is not None:
            self.events.append(['relax', number(left), number(right)])

    def call(self, kind, obj, method, values):
        if method in ('sort', 'sorted'):
            self.events.append(['builtin'])
        if method == 'min' and len(values) == 2:
            self.events.append(['min', number(values[0]), number(values[1])])
        result = obj(*values) if kind == 'native' else getattr(obj, method)(*values)
        if kind == 'call' and method in ('get', 'setdefault') and values:
            self.read(obj, values[0], result)
        return result

    def dispatch(self, kind, *args):
        if kind == 'builtin-result':
            self.events.append(['builtin'])
            return args[0]
        if ':' in kind:
            kind, side = kind.split(':')
            self.relax(side, args[2] if kind in ('call', 'native') else args)
        if kind in ('call', 'native'):
            return self.call(kind, *args)
        return self.trace(kind, *args)


def run_probe(code, hook, entry, probe):
    capture = Capture()
    namespace = {'__name__': '__main__', hook: capture.dispatch}
    try:
        exec(code, namespace)
        value = namespace[entry](*probe)
        return {'events': capture.events, 'value': value}
    except Exception:
        return {'events': [], 'error': True}


def trace_method(source, entry, probes):
    hook = '_procode_method_hook_' + str(id(probes))
    tree = ast.parse(source)
    tree = Instrument(hook, candidate_names(tree)).visit(tree)
    code = compile(ast.fix_missing_locations(tree), 'method.py', 'exec')
    return [run_probe(code, hook, entry, probe) for probe in probes]
