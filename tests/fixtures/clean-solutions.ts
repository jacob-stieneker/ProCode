import type { Language } from '../../src/app/core/exercises';
export const cleanSolutions: Record<string, Record<Language, string>> = {
  'cc-total': {
    javascript: `function orderTotal(lines) { return lines.reduce((total, line) => total + line.priceCents * line.quantity, 0); }`,
    python: `def order_total(lines):\n    return sum(line["priceCents"] * line["quantity"] for line in lines)\n`,
  },
  'cc-access': {
    javascript: `function accessLevel(user) { if (!user.signedIn) return 'sign-in'; if (!user.active) return 'inactive'; if (!user.editor) return 'read-only'; return 'edit'; }`,
    python: `def access_level(user):\n    if not user["signedIn"]: return "sign-in"\n    if not user["active"]: return "inactive"\n    if not user["editor"]: return "read-only"\n    return "edit"\n`,
  },
  'cc-shipping': {
    javascript: `const FREE_THRESHOLD=5000, STANDARD_FEE=499, EXPRESS_FEE=899;\nfunction shippingCost(subtotalCents, expedited) { const standard=subtotalCents >= FREE_THRESHOLD ? 0 : STANDARD_FEE; return standard + (expedited ? EXPRESS_FEE : 0); }`,
    python: `FREE_THRESHOLD = 5000\nSTANDARD_FEE = 499\nEXPRESS_FEE = 899\ndef shipping_cost(subtotal_cents, expedited):\n    standard = 0 if subtotal_cents >= FREE_THRESHOLD else STANDARD_FEE\n    return standard + (EXPRESS_FEE if expedited else 0)\n`,
  },
  'cc-ranking': {
    javascript: `function rankScores(records) { return [...records].sort((left,right) => right.score-left.score || left.id-right.id).map((record,index) => ({id:record.id,score:record.score,rank:index+1})); }`,
    python: `def rank_scores(records):\n    ordered = sorted(records, key=lambda record: (-record["score"],record["id"]))\n    return [{"id": record["id"], "score": record["score"], "rank": index + 1} for index, record in enumerate(ordered)]\n`,
  },
  'cc-invoice': {
    javascript: `const sumLines = lines => lines.reduce((total,line) => total + line.priceCents * line.quantity,0);\nfunction percentFloor(cents,percent) { return Math.floor(cents*percent/100); }\nfunction invoiceSummary(lines,member) { const subtotalCents=sumLines(lines); const discountCents=member ? percentFloor(subtotalCents,10) : 0; const taxCents=percentFloor(subtotalCents-discountCents,8); return {subtotalCents,discountCents,taxCents,totalCents:subtotalCents-discountCents+taxCents}; }`,
    python: `def sum_lines(lines):\n    return sum(line["priceCents"] * line["quantity"] for line in lines)\ndef percent_floor(cents, percent):\n    return cents * percent // 100\ndef invoice_summary(lines, member):\n    subtotal_cents = sum_lines(lines)\n    discount_cents = percent_floor(subtotal_cents, 10) if member else 0\n    tax_cents = percent_floor(subtotal_cents - discount_cents, 8)\n    return {"subtotalCents": subtotal_cents, "discountCents": discount_cents, "taxCents": tax_cents, "totalCents": subtotal_cents - discount_cents + tax_cents}\n`,
  },
  'cc-status': {
    javascript: `const RULES = new Map([['queued',{label:'Queued',retryable:false,priority:1}],['sent',{label:'Sent',retryable:false,priority:0}],['failed',{label:'Failed',retryable:true,priority:2}]]);\nconst UNKNOWN={label:'Unknown',retryable:false,priority:0};\nfunction deliverySummary(records) { return records.map(record => ({id:record.id,...(RULES.get(record.status) ?? UNKNOWN)})); }`,
    python: `RULES = {"queued": {"label": "Queued", "retryable": False, "priority": 1}, "sent": {"label": "Sent", "retryable": False, "priority": 0}, "failed": {"label": "Failed", "retryable": True, "priority": 2}}\nUNKNOWN = {"label": "Unknown", "retryable": False, "priority": 0}\ndef delivery_summary(records):\n    return [{"id": record["id"], **RULES.get(record["status"], UNKNOWN)} for record in records]\n`,
  },
};
Object.assign(cleanSolutions, {
  'cc-registration': {
    javascript: `function registrationResult(form){if(!form.name.trim())return 'name-required';if(form.age<18)return 'too-young';if(!form.accepted)return 'terms-required';return 'ready';}`,
    python: `def registration_result(form):
    if not form["name"].strip(): return "name-required"
    if form["age"] < 18: return "too-young"
    if not form["accepted"]: return "terms-required"
    return "ready"`,
  },
  'cc-discounts': {
    javascript: `function discountedCatalog(products,percent){return products.map(product=>({...product,priceCents:Math.floor(product.priceCents*(100-percent)/100)}));}`,
    python: `def discounted_catalog(products, percent):
    return [{**product, "priceCents": product["priceCents"] * (100-percent) // 100} for product in products]`,
  },
  'cc-report': {
    javascript: `function selectOpen(tickets){return tickets.filter(ticket=>ticket.status==='open');} function summarize(tickets){const totalMinutes=tickets.reduce((sum,ticket)=>sum+ticket.minutes,0);return {openIds:tickets.map(ticket=>ticket.id).sort((a,b)=>a-b),totalMinutes,averageMinutes:tickets.length?Math.floor(totalMinutes/tickets.length):0};} function ticketReport(tickets){return summarize(selectOpen(tickets));}`,
    python: `def select_open(tickets):
    return [ticket for ticket in tickets if ticket["status"] == "open"]
def summarize(tickets):
    total = sum(ticket["minutes"] for ticket in tickets)
    return {"openIds": sorted(ticket["id"] for ticket in tickets), "totalMinutes": total, "averageMinutes": total // len(tickets) if tickets else 0}
def ticket_report(tickets):
    return summarize(select_open(tickets))`,
  },
});
Object.assign(cleanSolutions, {
  'cc-pagination': {
    javascript: `function paginationWindow(total, pageSize, page) { const start=Math.min(total,(page-1)*pageSize); return {start,end:Math.min(total,start+pageSize),totalPages:Math.ceil(total/pageSize)}; }`,
    python: `def pagination_window(total, page_size, page):
    start = min(total, (page - 1) * page_size)
    return {"start": start, "end": min(total, start + page_size), "totalPages": (total + page_size - 1) // page_size}`,
  },
  'cc-retry': {
    javascript: `const BASE_DELAY_MS=500, MAX_DELAY_MS=30000; function retryDelay(attempt,retryAfterMs){return Math.min(MAX_DELAY_MS,Math.max(BASE_DELAY_MS*2**attempt,retryAfterMs??0));}`,
    python: `BASE_DELAY_MS = 500
MAX_DELAY_MS = 30000
def retry_delay(attempt, retry_after_ms):
    base_delay = BASE_DELAY_MS * 2 ** attempt
    requested_delay = 0 if retry_after_ms is None else retry_after_ms
    return min(MAX_DELAY_MS, max(base_delay, requested_delay))`,
  },
  'cc-tags': {
    javascript: `function normalizeTags(records){return records.map(record=>({id:record.id,tags:[...new Set(record.tags.map(tag=>tag.trim().toLowerCase()).filter(tag=>tag.length>0))].sort()}));}`,
    python: `def normalize_tags(records):
    return [{"id": record["id"], "tags": sorted({tag.strip().lower() for tag in record["tags"] if tag.strip()})} for record in records]`,
  },
  'cc-coupon': {
    javascript: `const MINIMUM_SUBTOTAL=2000;function couponResult(order){if(!order.active)return 'inactive';if(order.subtotalCents<MINIMUM_SUBTOTAL)return 'minimum';if(order.existingDiscount)return 'exclusive';if(order.firstOrderOnly&&!order.firstOrder)return 'new-customer-only';return 'eligible';}`,
    python: `MINIMUM_SUBTOTAL = 2000
def coupon_result(order):
    if not order["active"]: return "inactive"
    if order["subtotalCents"] < MINIMUM_SUBTOTAL: return "minimum"
    if order["existingDiscount"]: return "exclusive"
    if order["firstOrderOnly"] and not order["firstOrder"]: return "new-customer-only"
    return "eligible"`,
  },
  'cc-logs': {
    javascript: `const SLOW_THRESHOLD=1000;
function countLevels(events){const counts={info:0,warn:0,error:0};for(const event of events)counts[event.level]++;return counts;}
function slowServices(events){return [...new Set(events.filter(event=>event.durationMs>=SLOW_THRESHOLD).map(event=>event.service))].sort();}
function logReport(events){return {counts:countLevels(events),slowServices:slowServices(events),maxDurationMs:events.reduce((maximum,event)=>Math.max(maximum,event.durationMs),0)};}`,
    python: `SLOW_THRESHOLD = 1000
def count_levels(events):
    counts = {"info": 0, "warn": 0, "error": 0}
    for event in events: counts[event["level"]] += 1
    return counts
def slow_services(events):
    return sorted({event["service"] for event in events if event["durationMs"] >= SLOW_THRESHOLD})
def log_report(events):
    return {"counts": count_levels(events), "slowServices": slow_services(events), "maxDurationMs": max((event["durationMs"] for event in events), default=0)}`,
  },
  'cc-roles': {
    javascript: `const ROLE_RULES=new Map([['viewer',[true,false,false]],['editor',[true,true,false]],['admin',[true,true,true]]]);const NO_PERMISSIONS=[false,false,false];function rolePermissions(roles){return roles.map(role=>{const [read,write,manage]=ROLE_RULES.get(role)||NO_PERMISSIONS;return {role,read,write,manage};});}`,
    python: `ROLE_RULES = {"viewer": (True, False, False), "editor": (True, True, False), "admin": (True, True, True)}
NO_PERMISSIONS = (False, False, False)
def role_permissions(roles):
    results = []
    for role in roles:
        read, write, manage = ROLE_RULES.get(role, NO_PERMISSIONS)
        results.append({"role": role, "read": read, "write": write, "manage": manage})
    return results`,
  },
});
