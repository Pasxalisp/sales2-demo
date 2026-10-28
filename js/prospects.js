/* Προσωρινοί πελάτες («🆕 Όχι στο orders»): σήμα, αναγνώριση όταν περάσουν στο orders, ένωση με τον κανονικό.
   matches(): για κάθε προσωρινό ο πιο πιθανός κανονικός πελάτης (τηλέφωνο, όνομα, πόλη, διεύθυνση).
   merge(pid, cid): περνά ΟΛΑ του προσωρινού στον κανονικό (σημειώσεις, επισκέψεις, προγράμματα, ραντεβού, SOS,
   τεχνικός, σεμινάρια, εκκρεμότητες, παραγγελίες…) και μετά σβήνει τον προσωρινό. Μόνο με έγκριση του πωλητή.
   Γράφει μόνο μέσω του adapter. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, db = () => PL.adapter.db;
  const P = (PL.prospects = {});
  /* συλλογές με εγγραφές ανά πελάτη (κλειδί = id πελάτη) και συλλογές που αναφέρουν πελάτη μέσα τους */
  const BYID = ['manual', 'xout', 'zskip', 'sos', 'tech', 'balnotes'];
  P.COLS = ['clients', 'prospects', 'notes', 'visits', 'plans', 'pdrafts', 'route', 'tasks', 'seminars', 'orders', 'extra'].concat(BYID);
  P.use = () => Promise.all(P.COLS.map((c) => S.use(c)));

  /* σήμα δίπλα στο όνομα, σε κάθε σελίδα */
  P.tag = (c) => (c && c.prospect ? '<span class="notord">🆕 Όχι στο orders</span> ' : '');

  /* ---- αναγνώριση ---- */
  const digits = (t) => { let d = String(t || '').replace(/\D/g, ''); if (d.startsWith('0030')) d = d.slice(4); else if (d.length === 12 && d.startsWith('30')) d = d.slice(2); return d.length >= 10 ? d.slice(-10) : ''; };
  const phones = (c) => [c.t1, c.t2].concat(c.more || []).map(digits).filter(Boolean);
  /* λέξεις που δεν ξεχωρίζουν ένα κομμωτήριο από άλλο */
  const STOP = new Set(['κομμωτηριο', 'κομμωτηρια', 'κομμωτικη', 'κομμωσεισ', 'κομμωσισ', 'hair', 'salon', 'studio', 'beauty', 'ομορφια', 'art', 'design', 'team', 'the', 'and', 'και', 'ικε', 'οε', 'εε', 'αε', 'ike']);
  const words = (s) => u.nn(s).split(/[^a-zα-ω0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w));
  const wmatch = (a, b) => a === b || (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a)));   // και κομμένα ονόματα του orders
  /* πόσες από τις λέξεις του μικρότερου ονόματος ταιριάζουν (0…1), φωνητικά και σε οποιαδήποτε σειρά */
  const nameScore = (x, y) => {
    const A = words(x).map(PL.nameKey), B = words(y).map(PL.nameKey); if (!A.length || !B.length) return { s: 0, n: 0 };
    const [Sh, Lo] = A.length <= B.length ? [A, B] : [B, A], used = new Set(); let m = 0;
    Sh.forEach((w) => { const k = Lo.findIndex((v, i) => !used.has(i) && wmatch(w, v)); if (k >= 0) { used.add(k); m++; } });
    return { s: m / Sh.length, n: Sh.length };
  };
  const street = (c) => words(String(c.addr || '').replace(/\d+/g, ' '));
  const sameAddr = (a, b) => { const A = street(a), B = street(b); return A.some((w) => B.some((v) => wmatch(PL.nameKey(w), PL.nameKey(v)))); };
  const sameCity = (a, b) => !!a.city && u.nn(a.city) === u.nn(b.city);

  /* πόσο σίγουρα ο προσωρινός p είναι ο κανονικός c: 0 = όχι */
  P.score = (p, c) => {
    const pp = phones(p);
    if (pp.length && phones(c).some((x) => pp.includes(x))) return { v: 3, why: 'ίδιο τηλέφωνο' };
    const ns = nameScore(p.name, c.name), city = sameCity(p, c), addr = (p.addr || '') && sameAddr(p, c);
    if (ns.s === 1 && ns.n >= 2 && city) return { v: 2, why: 'ίδιο όνομα και πόλη' };
    if (ns.s === 1 && addr) return { v: 2, why: 'ίδιο όνομα και διεύθυνση' };
    if (ns.s >= 0.5 && city && addr) return { v: 1, why: 'όμοιο όνομα, ίδια πόλη και διεύθυνση' };
    return { v: 0, why: '' };
  };
  /* [{ pid, cid, why }]: ο καλύτερος υποψήφιος για κάθε προσωρινό (όσους δεν έχεις απορρίψει) */
  P.matches = () => {
    if (!S.loaded('clients') || !S.loaded('prospects')) return [];
    const C = M.clients().filter((c) => !c.prospect), out = [];
    Object.keys(S.all('prospects')).forEach((pid) => {
      const p = M.byId(pid), no = new Set((S.get('prospects', pid) || {}).notMatch || []); if (!p) return;
      let best = null;
      C.forEach((c) => { if (no.has(c.i)) return; const r = P.score(p, c); if (r.v && (!best || r.v > best.v)) best = { pid, cid: c.i, why: r.why, v: r.v }; });
      if (best) out.push(best);
    });
    return out;
  };
  /* «Όχι, άλλος»: δεν τον ξαναπροτείνει γι' αυτόν τον προσωρινό */
  P.dismiss = async (pid, cid) => {
    const x = S.get('prospects', pid); if (!x) return;
    const doc = Object.assign({}, x, { notMatch: [...new Set((x.notMatch || []).concat([cid]))] });
    await db().set('prospects/' + pid, doc); S.put('prospects', pid, doc);
  };

  /* ---- ένωση ---- */
  const put = async (col, id, doc) => { await db().set(col + '/' + id, doc); S.put(col, id, doc); };
  const drop = async (col, id) => { await db().remove(col + '/' + id); S.drop(col, id); };
  const swap = (L, pid, cid) => [...new Set((L || []).map((x) => (x === pid ? cid : x)))];
  /* στάσεις προγράμματος: ο προσωρινός γίνεται ο κανονικός. Αν υπάρχουν και οι δύο, μένει η στάση του κανονικού
     (✓ αν ήταν ✓ η μία, το ραντεβού του προσωρινού μόνο αν ο κανονικός δεν είχε, SOS αν είχε η μία). */
  const swapStops = (stops, pid, cid) => {
    const a = (stops || []).find((s) => s.id === pid), b = (stops || []).find((s) => s.id === cid);
    if (!a) return stops;
    if (!b) return stops.map((s) => (s.id === pid ? Object.assign({}, s, { id: cid }) : s));
    const m = Object.assign({}, a, b, { id: cid, sos: !!(a.sos || b.sos) });
    if (a.done || b.done) { m.done = true; m.doneDate = b.doneDate || a.doneDate || ''; }
    if (!b.appt && a.appt) { m.appt = a.appt; m.apptD = a.apptD; }
    return stops.filter((s) => s.id !== pid).map((s) => (s.id === cid ? m : s));
  };

  P.merge = async (pid, cid) => {
    await P.use();
    const p = M.byId(pid), c = M.byId(cid);
    if (!p || !p.prospect) throw new Error('Δεν βρέθηκε ο προσωρινός πελάτης.');
    if (!c || c.prospect) throw new Error('Διάλεξε κανονικό πελάτη.');
    const W = [];
    /* σημειώσεις: όλες οι καταχωρήσεις μαζί, η πιο πρόσφατη πρώτη· «Δουλεύει ήδη» ενωμένο */
    const na = S.get('notes', pid);
    if (na) {
      W.push(PL.notes.update(cid, (d) => {
        d.code = c.code || d.code; d.name = c.name; d.works = [...new Set(d.works.concat(na.works || []))];
        d.entries = (na.entries || []).concat(d.entries).sort((x, y) => (x.d < y.d ? 1 : x.d > y.d ? -1 : 0));
      }).then(() => drop('notes', pid)));
    }
    /* επισκέψεις */
    const va = S.get('visits', pid);
    if (va) { const vb = S.get('visits', cid) || {}; W.push(put('visits', cid, { name: c.name, dates: [...new Set((vb.dates || []).concat(va.dates || []))].sort().slice(-60) }).then(() => drop('visits', pid))); }
    /* εγγραφές ανά πελάτη: αν ο κανονικός δεν έχει, περνά του προσωρινού */
    BYID.forEach((col) => { const a = S.get(col, pid); if (!a) return; W.push((S.get(col, cid) ? Promise.resolve() : put(col, cid, Object.assign({}, a, a.name !== undefined ? { name: c.name } : {}))).then(() => drop(col, pid))); });
    /* προγράμματα και πρόχειρα */
    ['plans', 'pdrafts'].forEach((col) => Object.entries(S.all(col)).forEach(([id, x]) => { if (!(x.stops || []).some((s) => s.id === pid)) return; W.push(put(col, id, Object.assign({}, x, { stops: swapStops(x.stops, pid, cid) }))); }));
    /* σειρά διαδρομής ανά πόλη */
    Object.entries(S.all('route')).forEach(([id, x]) => { if (!(x.order || []).includes(pid)) return; W.push(put('route', id, Object.assign({}, x, { order: swap(x.order, pid, cid) }))); });
    /* εκκρεμότητες, παραγγελίες, λιανικές */
    Object.entries(S.all('tasks')).forEach(([id, x]) => { if (x.cid === pid) W.push(put('tasks', id, Object.assign({}, x, { cid }))); });
    Object.entries(S.all('orders')).forEach(([id, x]) => { if (x.cid === pid) W.push(put('orders', id, Object.assign({}, x, { cid, code: c.code || '', name: c.name }))); });
    Object.entries(S.all('extra')).forEach(([id, x]) => { if (x.cid === pid) W.push(put('extra', id, Object.assign({}, x, { cid, cname: c.name }))); });
    /* σεμινάρια */
    Object.entries(S.all('seminars')).forEach(([id, x]) => { if (!(x.cust || []).includes(pid) && !(x.conf || []).includes(pid)) return; W.push(put('seminars', id, Object.assign({}, x, { cust: swap(x.cust, pid, cid), conf: swap(x.conf, pid, cid) }))); });
    await Promise.all(W);
    /* στο τέλος, αφού πέρασαν όλα: σβήνει ο προσωρινός */
    await drop('prospects', pid);
    return c;
  };
})();
