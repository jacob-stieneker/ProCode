const TRACE_LIMIT = 12000;
const OPERATIONS = {
  '+': (a, b) => a + b,
  '<': (a, b) => a < b,
  '>': (a, b) => a > b,
  '<=': (a, b) => a <= b,
  '>=': (a, b) => a >= b,
  '==': (a, b) => a == b,
  '!=': (a, b) => a != b,
  '===': (a, b) => a === b,
  '!==': (a, b) => a !== b,
};
function numeric(value) {
  if (typeof value !== 'number') return undefined;
  if (Number.isFinite(value)) return value;
  return value < 0 ? '-inf' : 'inf';
}
export class Capture {
  events = [];
  identities = new WeakMap();
  nextIdentity = 0;
  identity(obj) {
    if (!this.identities.has(obj)) this.identities.set(obj, ++this.nextIdentity);
    return this.identities.get(obj);
  }
  read(obj, key, result) {
    if (
      obj &&
      typeof obj === 'object' &&
      !Array.isArray(obj) &&
      result &&
      typeof result === 'object'
    )
      this.events.push(['edge', this.identity(obj), String(key), this.identity(result)]);
    if (Array.isArray(obj) && key === 0 && obj.length === 3 && Number.isInteger(obj[0]))
      this.events.push(['visit', obj[0]]);
    return result;
  }
  relax(side, values) {
    const [candidate, previous] = side === 'relax-left' ? values : [...values].reverse();
    if (numeric(candidate) !== undefined && numeric(previous) !== undefined)
      this.events.push(['relax', numeric(candidate), numeric(previous)]);
  }
  call(obj, method, args) {
    if (method === 'sort' || method === 'toSorted') this.events.push(['builtin']);
    if (method === 'min' && args.length === 2)
      this.events.push(['min', numeric(args[0]), numeric(args[1])]);
    const result = obj[method](...args);
    return method === 'get' || method === 'setdefault' ? this.read(obj, args[0], result) : result;
  }
  trace(kind, a, b, args) {
    if (this.events.length > TRACE_LIMIT) throw Error('Method trace limit reached.');
    const [operation, side] = kind.split(':');
    if (side) this.relax(side, operation === 'call' ? args : [a, b]);
    if (operation === 'read') return this.read(a, b, a[b]);
    if (operation === 'call') return this.call(a, b, args);
    if (numeric(a) !== undefined && numeric(b) !== undefined)
      this.events.push([operation, numeric(a), numeric(b)]);
    return OPERATIONS[operation](a, b);
  }
}
