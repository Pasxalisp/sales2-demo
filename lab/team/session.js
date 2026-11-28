/* ΔΟΚΙΜΑΣΤΙΚΟ «Χρήστες και ρόλοι» (lab/team/, μόνο στη δοκιμαστική έκδοση — όχι στο Sales 2.0).
   Παίζει τον ρόλο του SERVER μέσα στη συσκευή: είσοδος, ποιος βλέπει τι, ποια δεδομένα δίνονται σε κάθε χρήστη.
   Τρέχει ΠΡΙΝ από τον adapter. Στην κανονική έκδοση τα ίδια τα κάνει ο server (π.χ. Supabase με κανόνες πρόσβασης):
   αλλάζει μόνο αυτό το αρχείο και ο adapter· οι σελίδες και οι υπολογισμοί μένουν ίδιοι.

   Κανόνες (ίδιοι με του server):
   - Κάθε πελάτης ανήκει σε έναν πωλητή: owner = κωδικός πωλητή (όπως στο orders). Ο πωλητής παίρνει μόνο τους δικούς του
     και ό,τι κρέμεται από αυτούς (σημειώσεις, επισκέψεις, υπόλοιπα, συμφωνίες, τζίροι, είδη, προγράμματα, εκκρεμότητες…).
   - Προσωπικά έγγραφα (πρόγραμμα μήνα, λιανικές, διαδρομές, ρυθμίσεις) είναι του κάθε χρήστη.
   - Υπεύθυνος ομάδας: διαβάζει (μόνο ανάγνωση) τα δεδομένα των πωλητών της ομάδας του. Διευθυντής και διαχειριστής (18/11): όλων.
     Πωλητής: μόνο τα δικά του.
   - Διαχειριστής: αλλάζει χρήστες (ρόλος, ομάδα, κωδικός πωλητή, ενεργός).
   - Τεχνικός (27/11/2026): δεν έχει πελάτες, ποσά, παραγγελίες, προγράμματα ή καμπάνιες. Παίρνει ΜΟΝΟ τα αιτήματα επίσκεψης που του
     έστειλαν (treq, με τα στοιχεία του πελάτη χωρίς ποσά) και από αυτά «πελάτες» (μόνο όνομα, διεύθυνση, τηλέφωνα), τις δικές του
     σημειώσεις, τα σεμινάρια μόνο με τους δικούς του πελάτες. Ο πωλητής βλέπει τις σημειώσεις του τεχνικού για τους πελάτες του (tnotes).
   - Αιτήματα τεχνικού (treq) είναι ΚΟΙΝΑ: τα βλέπουν και τα γράφουν μόνο ο πωλητής (sid) και ο τεχνικός (tid) του αιτήματος·
     ο τεχνικός αλλάζει μόνο κατάσταση, ραντεβού, αναφορά (treqOk). Εδώ φυλάγονται στο '<key>:shared' (ίδια συσκευή, όλοι οι χρήστες).
   - Υπεύθυνος τεχνικών (28/11/2026, πάντα ένας): βλέπει (μόνο ανάγνωση) ΟΛΑ τα αιτήματα όλων των τεχνικών, χωρίς ποσά.
   - Στοιχεία πελάτη και υπόλοιπα (clients, balances, 28/11): ΚΑΝΕΝΑΣ χρήστης δεν τα αλλάζει. Μόνο ο διαχειριστής, για διόρθωση
     λάθους (fixClient), και αυτόματα το λογιστήριο (στην κανονική έκδοση· εδώ «Κατάθεση» από τη Διαχείριση για δοκιμή).
   - Δικαιώματα (28/11, users.perms): τα δίνουν ο διευθυντής και ο διαχειριστής (PERMS). «Δημιουργία σεμιναρίων» έχει ΕΝΑΣ:
     αν το δώσεις σε άλλον, φεύγει από τον προηγούμενο. Σεμινάρια φτιάχνουν/αλλάζουν/σβήνουν αυτός, ο διευθυντής και ο διαχειριστής.
   - Σεμινάρια (28/11) είναι ΚΟΙΝΑ για όλους (στο '<key>:shared', seminars/{id} = {title, date, time, notes, created, by, reg:
     {πελάτης: {sid, sname, name, city, t, n: άτομα, st: pend|conf}}}). Κάθε πωλητής γράφει μόνο τις δικές του δηλώσεις.
     Ο καθένας παίρνει τη δική του «όψη» (semView): cust/conf/n για τους δικούς του πελάτες όπως πριν, και others = των άλλων
     ΜΟΝΟ όνομα, άτομα, πωλητής. Πλήρη (πόλη, τηλέφωνο, κατάσταση): ο υπεύθυνος για την ομάδα του, ο διευθυντής/διαχειριστής για όλους.
   Αποθήκευση στη συσκευή: αλλαγές κάθε χρήστη στο localStorage '<key>:<id>', αλλαγές χρηστών στο '<key>:org', είσοδος στο '<key>:session',
   κοινά έγγραφα (αιτήματα τεχνικού) στο '<key>:shared'. */
(function () {
  const BASE = window.PL_LOCAL; if (!BASE || !BASE.seed) return;
  const SEED = BASE.seed, NS = BASE.key || 'sales2-demo', PASS = 'demo';
  const ls = {
    get: (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* χωρίς αποθήκευση: μένει για αυτή τη συνεδρία */ } },
    del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* τίποτα */ } },
  };
  const col = (p) => p.slice(0, p.lastIndexOf('/')), idOf = (p) => p.slice(p.lastIndexOf('/') + 1);
  const ROLES = { director: 'Διευθυντής', lead: 'Υπεύθυνος ομάδας', sales: 'Πωλητής', tech: 'Τεχνικός', techlead: 'Υπεύθυνος τεχνικών' };
  const TECHS = new Set(['tech', 'techlead']);                                  // χωρίς πελάτες, ποσά, παραγγελίες
  /* δικαιώματα που δίνουν ο διευθυντής και ο διαχειριστής· one: το έχει μόνο ένας κάθε φορά */
  const PERMS = [
    { k: 'sem', t: 'Δημιουργία σεμιναρίων', d: 'Φτιάχνει, αλλάζει και σβήνει τα σεμινάρια που βλέπουν όλοι. Οι πωλητές απλώς δηλώνουν κομμωτήρια και άτομα.', one: true },
    { k: 'usage', t: 'Χρήση εφαρμογής', d: 'Βλέπει στη Διαχείριση ποιος μπαίνει, πότε και τι χρησιμοποιεί.' },
  ];

  /* ---- πίνακες χρηστών και ομάδων (σπόρος + αλλαγές του διαχειριστή) ---- */
  const table = (c) => Object.entries(SEED).filter(([p]) => col(p) === c).map(([p, d]) => Object.assign({ id: idOf(p) }, d));
  const TEAMS = table('teams');
  const users = () => { const ch = (ls.get(NS + ':org') || {}).users || {};
    return table('users').map((x) => Object.assign(x, ch[x.id] || {}))
      .concat(Object.entries(ch).filter(([id]) => !SEED['users/' + id]).map(([id, d]) => Object.assign({ id }, d))); };
  const user = (id) => users().find((x) => x.id === id) || null;

  /* ---- τι δικαιούται κάθε χρήστης ---- */
  const KEYED = new Set(['clients', 'prospects', 'notes', 'balances', 'balnotes', 'items', 'manual', 'visits', 'xout', 'ndfix', 'zskip', 'tech', 'sos', 'dealmsg', 'geo']);
  const MAPS = new Set(['deals/all', 'cats/all', 'brands/all']);
  const PERSONAL = new Set(['month', 'extra', 'route', 'wish', 'pdrafts']);   // του αρχικού χρήστη των ψεύτικων δεδομένων
  const SERVER = new Set(['users', 'teams', 'usage']);                          // μόνο μέσω της «org» παρακάτω
  const FIRST = (table('users').find((x) => x.admin) || {}).id;                 // σε αυτόν ανήκουν τα προσωπικά έγγραφα του σπόρου
  const SHARED = new Set(['treq', 'seminars']);                                 // κοινά (στο '<key>:shared')
  const LOCKED = new Set(['clients', 'balances']);                              // μόνο διαχειριστής (fixClient) και λογιστήριο
  const TECH_CHANGE = ['st', 'appt', 'rep', 'log', 'upd', 'by'];                // ό,τι αλλάζει ο τεχνικός σε ένα αίτημα

  /* ---- αιτήματα τεχνικού: σπόρος + κοινές αλλαγές όλων των χρηστών σε αυτή τη συσκευή ---- */
  const treqAll = () => { const m = {}; Object.entries(SEED).forEach(([p, d]) => { if (col(p) === 'treq') m[idOf(p)] = d; });
    Object.entries(ls.get(NS + ':shared') || {}).forEach(([p, d]) => { if (col(p) !== 'treq') return; if (d === null) delete m[idOf(p)]; else m[idOf(p)] = d; });
    return m; };
  const treqMine = (uid) => { const x = user(uid); return Object.entries(treqAll()).filter(([, d]) => (x && x.role === 'techlead') || d.sid === uid || d.tid === uid); };
  /* ο κανόνας του server για κάθε εγγραφή αιτήματος: μόνο πωλητής και τεχνικός του· νέο μόνο από πωλητή προς τεχνικό·
     ο τεχνικός δεν αλλάζει πελάτη, σημείωμα ή πωλητή· κανείς δεν το σβήνει (ακύρωση = κατάσταση «cancel») */
  function treqOk(prev, next, uid) {
    if (!next) return false;
    const me0 = user(uid), t = user(next.tid);
    if (!prev) return next.sid === uid && !!t && t.role === 'tech' && t.active && me0 && !TECHS.has(me0.role);
    if (prev.sid !== next.sid || prev.tid !== next.tid || prev.cid !== next.cid) return false;
    if (uid === prev.sid) return true;
    if (uid === prev.tid) return Object.keys(Object.assign({}, prev, next)).every((k) => TECH_CHANGE.includes(k) || JSON.stringify(prev[k]) === JSON.stringify(next[k]));
    return false;
  }
  /* ο τεχνικός «βλέπει» τον πελάτη μόνο μέσα από τα αιτήματά του: στοιχεία από το πιο πρόσφατο αίτημα, χωρίς ποσά */
  const techClient = (cid, r) => ({ i: cid, code: r.c.code || '', name: r.c.name, addr: r.c.addr || '', city: r.c.city || '', area: r.c.area || '', zip: r.c.zip || '', t1: r.c.t1 || '', t2: r.c.t2 || '', owner: '' });
  /* σημειώσεις ενός τεχνικού για έναν πελάτη: σπόρος (tnseed) + ό,τι έγραψε ο ίδιος σε αυτή τη συσκευή */
  const techNotes = (tid, cid) => { const ch = ls.get(NS + ':' + tid) || {}, k = 'notes/' + cid;
    return k in ch ? ch[k] : SEED['tnseed/' + tid + '_' + cid] || null; };

  /* ---- σεμινάρια: σπόρος (cust/conf όλων) → κοινά έγγραφα με δηλώσεις ανά πελάτη· + αλλαγές στο '<key>:shared' ---- */
  const byCode = (code) => users().find((x) => x.code && x.code === code && !TECHS.has(x.role)) || null;
  const cliOf = (uid, cid) => { const ch = ls.get(NS + ':' + uid) || {}, k = (c) => c + '/' + cid; return ch[k('clients')] || SEED[k('clients')] || ch[k('prospects')] || SEED[k('prospects')] || null; };
  const regOf = (sid, cid, n, st) => { const x = user(sid) || {}, c = cliOf(sid, cid) || {}; return { sid, sname: x.name || '', name: c.name || '', city: c.city || '', t: c.t2 || c.t1 || '', n: Math.max(1, +n || 1), st }; };
  function semAll() {
    const m = {};
    Object.entries(SEED).forEach(([p, d]) => { if (col(p) !== 'seminars') return; const reg = {};
      (d.cust || []).forEach((cid) => { const o = byCode((SEED['clients/' + cid] || SEED['prospects/' + cid] || {}).owner); if (o) reg[cid] = regOf(o.id, cid, (d.n || {})[cid], (d.conf || []).includes(cid) ? 'conf' : 'pend'); });
      const x = Object.assign({}, d, { reg }); delete x.cust; delete x.conf; delete x.n; m[idOf(p)] = x; });
    Object.entries(ls.get(NS + ':shared') || {}).forEach(([p, d]) => { if (col(p) !== 'seminars') return; if (d === null) delete m[idOf(p)]; else m[idOf(p)] = d; });
    return m;
  }
  const semOk = (uid) => { const x = user(uid); return !!x && !TECHS.has(x.role) && (x.admin || x.role === 'director' || (x.perms || []).includes('sem')); };
  /* τι βλέπει ο uid από ένα σεμινάριο· mineFn(cid, δήλωση) = «δικός του» (πωλητής: ό,τι δήλωσε· τεχνικός: πελάτες των αιτημάτων του) */
  function semView(uid, x, mineFn) {
    const me0 = user(uid) || {}, full = (r) => me0.admin || me0.role === 'director' || (me0.role === 'lead' && (user(r.sid) || {}).team === me0.team);
    const v = { title: x.title || '', date: x.date || '', time: x.time || '', notes: x.notes || '', created: x.created || '', by: x.by || '', cust: [], conf: [], n: {}, others: [] };
    Object.entries(x.reg || {}).forEach(([cid, r]) => {
      if (mineFn(cid, r)) { v.cust.push(cid); if (r.st === 'conf') v.conf.push(cid); v.n[cid] = r.n || 1; return; }
      v.others.push(full(r) ? { name: r.name, n: r.n || 1, sname: r.sname, city: r.city, t: r.t, st: r.st, full: 1 } : { name: r.name, n: r.n || 1, sname: r.sname });
    });
    v.others.sort((a, b) => String(a.city || '').localeCompare(String(b.city || ''), 'el') || String(a.name).localeCompare(String(b.name), 'el'));
    return v;
  }
  /* εγγραφή σεμιναρίου από τον uid (d = η όψη του, null = διαγραφή): στοιχεία/νέο/διαγραφή μόνο με δικαίωμα· δηλώσεις μόνο οι δικές του */
  function semPut(uid, id, d) {
    const sh = ls.get(NS + ':shared') || {}, prev = semAll()[id] || null, x = user(uid);
    if (!x || TECHS.has(x.role)) throw new Error('Δεν επιτρέπεται αυτή η αλλαγή.');
    const NOPE = 'Σεμινάρια φτιάχνει και αλλάζει ' + (semBy() ? 'μόνο ' + semBy() : 'όποιος έχει το δικαίωμα') + '.';
    if (d === null) { if (!prev) return; if (!semOk(uid)) throw new Error(NOPE); sh['semgone/' + id] = prev; sh['seminars/' + id] = null; ls.set(NS + ':shared', sh); return; }
    const base = prev || sh['semgone/' + id] || null;   // επαναφορά από τον κάδο: γυρνούν και οι δηλώσεις των άλλων
    const F = ['title', 'date', 'time', 'notes'];
    if (!prev && !semOk(uid)) throw new Error(NOPE);
    if (prev && F.some((k) => (prev[k] || '') !== (d[k] || '')) && !semOk(uid)) throw new Error(NOPE);
    const reg = {}; Object.entries((base && base.reg) || {}).forEach(([cid, r]) => { if (r.sid !== uid) reg[cid] = r; });
    (d.cust || []).forEach((cid) => { reg[cid] = regOf(uid, cid, (d.n || {})[cid], (d.conf || []).includes(cid) ? 'conf' : 'pend'); });
    const out = { title: d.title || '', date: d.date || '', time: d.time || '', notes: d.notes || '', created: (base && base.created) || d.created || '', by: (base && base.by) || uid, reg };
    sh['seminars/' + id] = out; delete sh['semgone/' + id]; ls.set(NS + ':shared', sh);
  }
  const semBy = () => { const x = users().find((z) => z.active && (z.perms || []).includes('sem')); return x ? x.name : ''; };

  function techSeed(u) {
    const out = {}, cids = new Map();
    treqMine(u.id).sort((a, b) => ((a[1].sent || '') < (b[1].sent || '') ? -1 : 1)).forEach(([rid, r]) => { out['treq/' + rid] = r; cids.set(r.cid, r); });
    cids.forEach((r, cid) => { out['clients/' + cid] = techClient(cid, r); const n = SEED['tnseed/' + u.id + '_' + cid]; if (n) out['notes/' + cid] = n; });
    Object.entries(semAll()).forEach(([id, x]) => { out['seminars/' + id] = semView(u.id, x, (cid) => cids.has(cid)); });
    if (SEED['settings/card']) out['settings/card'] = Object.assign({}, SEED['settings/card'], { name: u.name, email: u.email, title: ROLES[u.role] });
    return out;
  }

  function seedFor(uid) {
    const u = user(uid), out = {}, mine = new Set();
    if (!u) return out;
    if (TECHS.has(u.role)) return techSeed(u);
    Object.entries(SEED).forEach(([p, d]) => { const c = col(p); if ((c === 'clients' || c === 'prospects') && u.code && d.owner === u.code) mine.add(idOf(p)); });
    Object.entries(SEED).forEach(([p, d]) => {
      const c = col(p);
      if (SERVER.has(c) || SHARED.has(c) || c === 'tnseed') return;   /* κοινά: παρακάτω, με τον κανόνα τους */
      if (KEYED.has(c)) { if (mine.has(idOf(p))) out[p] = d; return; }
      if (MAPS.has(p)) { const m = {}; Object.entries(d).forEach(([k, v]) => { if (k[0] === '_' || mine.has(k)) m[k] = v; }); out[p] = m; return; }
      if (c === 'tasks' || c === 'orders') { if (mine.has(d.cid)) out[p] = d; return; }
      if (c === 'plans') { const stops = (d.stops || []).filter((s) => mine.has(s.id)); if (stops.length) out[p] = Object.assign({}, d, { stops }); return; }
      if (c === 'campaigns') { const cu = {}; Object.entries(d.cust || {}).forEach(([k, v]) => { if (mine.has(k)) cu[k] = v; }); out[p] = Object.assign({}, d, { cust: cu }); return; }
      if (PERSONAL.has(c)) { if (uid === FIRST) out[p] = d; return; }
      if (p === 'settings/card') { out[p] = Object.assign({}, d, { name: u.name, email: u.email }); return; }
      if (p === 'settings/trips') { out[p] = uid === FIRST ? d : Object.assign({}, d, { base: cityOf(mine) || d.base }); return; }
      if (c === 'flash') { out[p] = Object.assign({}, d, { me: u.code || '' }); return; }
      out[p] = d;   /* κοινά για όλους: κατάλογος ειδών, στόχοι, FLASH της εταιρείας */
    });
    /* αιτήματα τεχνικού του πωλητή, ο συνεργαζόμενος τεχνικός του και οι σημειώσεις των τεχνικών για τους πελάτες του */
    treqMine(uid).forEach(([rid, r]) => { out['treq/' + rid] = r; });
    Object.entries(semAll()).forEach(([id, x]) => { out['seminars/' + id] = semView(uid, x, (cid, r) => r.sid === uid); });
    if (u.tmate) out['settings/techmate'] = { tid: u.tmate };
    const tids = new Set(treqMine(uid).map(([, r]) => r.tid));
    mine.forEach((cid) => { tids.forEach((tid) => { const n = techNotes(tid, cid); if (n && (n.entries || []).length) out['tnotes/' + cid] = { tid, tname: (user(tid) || {}).name || '', entries: n.entries }; }); });
    return out;
  }
  /* η πόλη με τους περισσότερους πελάτες του (αφετηρία ταξιδιών) */
  function cityOf(mine) { const n = {}; mine.forEach((id) => { const c = SEED['clients/' + id]; if (c && c.city) n[c.city] = (n[c.city] || 0) + 1; });
    return Object.keys(n).sort((a, b) => n[b] - n[a])[0] || ''; }
  /* όλα τα δεδομένα ενός χρήστη, μαζί με τις αλλαγές του σε αυτή τη συσκευή → πηγή {all, get} όπως το PL.store */
  function source(uid) {
    const m = {}, put = (p, d) => { (m[col(p)] = m[col(p)] || {})[idOf(p)] = d; };
    Object.entries(seedFor(uid)).forEach(([p, d]) => put(p, d));
    Object.entries(ls.get(NS + ':' + uid) || {}).forEach(([p, d]) => { if (d !== null) put(p, d); else if (m[col(p)]) delete m[col(p)][idOf(p)]; });
    return { all: (c) => m[c] || {}, get: (c, id) => (m[c] || {})[id], loaded: () => true };
  }

  const sid = ls.get(NS + ':session'), me = sid && user(sid) && user(sid).active ? user(sid) : null;
  /* ποιους πωλητές βλέπει ο συνδεδεμένος (ο κανόνας του server): διευθυντής και διαχειριστής όλους, υπεύθυνος την ομάδα του */
  const visible = () => (!me ? [] : users().filter((x) => x.active && x.role !== 'director' && !TECHS.has(x.role) &&
    (me.role === 'director' || me.admin || x.id === me.id || (me.role === 'lead' && x.team === me.team))));

  /* ---- χρήση εφαρμογής: ένα έγγραφο ανά χρήστη και μέρα {u, d, p: {σελίδα: [φορές, δευτερόλεπτα]}, a: {ενέργεια: φορές}, last}.
     Ο server τα κρατά USAGE_DAYS μέρες· μόνο ο διαχειριστής τα διαβάζει. Εδώ: σπόρος + ό,τι μετρήθηκε σε αυτή τη συσκευή. */
  const USAGE_DAYS = 90;
  const addUse = (x, y) => {
    const o = { u: x.u, d: x.d, p: Object.assign({}, x.p), a: Object.assign({}, x.a), last: x.last > y.last ? x.last : y.last, away: (x.away || '') > (y.away || '') ? x.away || '' : y.away || '' };
    Object.entries(y.p || {}).forEach(([k, [n, s]]) => { const c = o.p[k] || [0, 0]; o.p[k] = [c[0] + n, c[1] + s]; });
    Object.entries(y.a || {}).forEach(([k, n]) => { o.a[k] = (o.a[k] || 0) + n; });
    return o;
  };
  const usage = {
    record(delta) {
      if (!me) return;
      const all = ls.get(NS + ':usage') || {}, k = me.id + '_' + delta.d, lim = new Date(Date.now() - USAGE_DAYS * 864e5).toISOString().slice(0, 10);
      all[k] = addUse(all[k] || { u: me.id, d: delta.d, p: {}, a: {}, last: '' }, delta);
      Object.keys(all).forEach((x) => { if (all[x].d < lim) delete all[x]; });
      ls.set(NS + ':usage', all);
    },
    all() {
      if (!me || !(me.admin || (me.perms || []).includes('usage'))) return [];
      const m = {}; table('usage').forEach((x) => { m[x.u + '_' + x.d] = x; });
      Object.entries(ls.get(NS + ':usage') || {}).forEach(([k, x]) => { m[k] = m[k] ? addUse(m[k], x) : x; });
      return Object.values(m);
    },
  };

  /* Η «org»: ό,τι στην κανονική έκδοση θα ζητούσε ο adapter από τον server. Ο adapter την εκθέτει ως PL.adapter.org. */
  const org = {
    ROLES,
    me,
    teams: () => TEAMS.slice(),
    team: (id) => TEAMS.find((t) => t.id === id) || null,
    /* πωλητές που βλέπει ο συνδεδεμένος (υπεύθυνος πρώτος, μετά αλφαβητικά)· με tid: μόνο αυτής της ομάδας */
    sellers: (tid) => visible().filter((x) => !tid || x.team === tid)
      .sort((a, b) => (a.role === 'lead') !== (b.role === 'lead') ? (a.role === 'lead' ? -1 : 1) : a.name.localeCompare(b.name, 'el')),
    /* δεδομένα ενός πωλητή, μόνο αν τα δικαιούται ο συνδεδεμένος (αλλιώς null) */
    data: (uid) => (visible().some((x) => x.id === uid) ? source(uid) : null),
    /* τεχνικοί (για τον «συνεργαζόμενο τεχνικό» του πωλητή) */
    techs: () => users().filter((x) => x.active && x.role === 'tech').map((x) => ({ id: x.id, name: x.name })),
    /* ---- δικαιώματα (διευθυντής και διαχειριστής) ---- */
    PERMS,
    has: (k) => !!me && (me.perms || []).includes(k),
    semOk: () => !!me && semOk(me.id),
    semBy,
    /* ποιοι μπορούν να πάρουν δικαιώματα (όχι τεχνικοί) και ποιοι τα έχουν */
    permUsers: () => (me && (me.admin || me.role === 'director') ? users().filter((x) => x.active && !TECHS.has(x.role)) : []),
    setPerm(uid, k, on) {
      if (!me || !(me.admin || me.role === 'director')) throw new Error('Δικαιώματα δίνουν ο διευθυντής και ο διαχειριστής.');
      const P = PERMS.find((z) => z.k === k), x = user(uid); if (!P || !x || TECHS.has(x.role)) throw new Error('Δεν γίνεται.');
      const o = ls.get(NS + ':org') || {}, ch = Object.assign({}, o.users), put = (y, perms) => { const d = Object.assign({}, y, { perms }); delete d.id; ch[y.id] = d; };
      if (on && P.one) users().forEach((y) => { if (y.id !== uid && (y.perms || []).includes(k)) put(y, y.perms.filter((z) => z !== k)); });
      const cur = (x.perms || []).filter((z) => z !== k); put(x, on ? cur.concat([k]) : cur);
      o.users = ch; ls.set(NS + ':org', o);
    },
    /* ---- στοιχεία πελάτη: μόνο ο διαχειριστής (διόρθωση λάθους)· το λογιστήριο αλλάζει τα υπόλοιπα αυτόματα ---- */
    fixClient(uid, cid, patch) {
      if (!me || !me.admin) throw new Error('Αλλαγές στα στοιχεία πελάτη κάνει μόνο ο διαχειριστής.');
      const src = source(uid), o = ls.get(NS + ':' + uid) || {};
      if (patch.client) { const c = src.get('clients', cid); if (!c) throw new Error('Δεν βρέθηκε ο πελάτης.'); o['clients/' + cid] = Object.assign({}, c, patch.client); }
      if (patch.balance) o['balances/' + cid] = Object.assign({}, src.get('balances', cid) || {}, patch.balance);
      ls.set(NS + ':' + uid, o);
    },
    /* ---- διαχειριστής ---- */
    usage,
    users: () => (me && (me.admin || (me.perms || []).includes('usage')) ? users() : []),   // + «Χρήση εφαρμογής» (μόνο ανάγνωση)
    clientCounts: () => { const n = {}; Object.entries(SEED).forEach(([p, d]) => { const c = col(p); if ((c === 'clients' || c === 'prospects') && d.owner) n[d.owner] = (n[d.owner] || 0) + 1; }); return n; },
    saveUser: (x) => {
      if (!me || !me.admin) throw new Error('Μόνο ο διαχειριστής αλλάζει χρήστες.');
      const o = ls.get(NS + ':org') || {}, d = Object.assign({}, x); delete d.id;
      o.users = Object.assign({}, o.users, { [x.id]: d }); ls.set(NS + ':org', o);
    },
    resetUsers: () => { const o = ls.get(NS + ':org') || {}; delete o.users; ls.set(NS + ':org', o); location.reload(); },
    /* ---- είσοδος (όλοι οι δοκιμαστικοί λογαριασμοί έχουν κωδικό «demo») ---- */
    quick: () => ['u3', 'u2', 'u1', FIRST, 'u14', 'u16'].map(user).filter((x) => x && x.active),
    hint: 'Όλοι οι δοκιμαστικοί λογαριασμοί έχουν κωδικό <b>demo</b>.',
    check: (email, pass) => { const x = users().find((z) => z.email.toLowerCase() === String(email).trim().toLowerCase()); return x && x.active && pass === PASS ? x : null; },
    login: (uid) => { ls.set(NS + ':session', uid); location.reload(); },
    logout: () => { ls.del(NS + ':session'); location.reload(); },
  };
  /* Εγγραφές (ρόλος του server): τα κοινά στο '<key>:shared' με τον κανόνα τους (treqOk, semPut), στοιχεία πελάτη και υπόλοιπα
     κανείς (LOCKED), τα υπόλοιπα στις αλλαγές του χρήστη.
     Αλλαγή από άλλη καρτέλα του browser (π.χ. πωλητής εδώ, τεχνικός ή διαχειριστής εκεί): φτάνει με το «storage» → listen. */
  const remote = me && {
    async put(path, d) {
      if (LOCKED.has(col(path))) throw new Error('Τα στοιχεία πελάτη αλλάζουν μόνο από το λογιστήριο ή τον διαχειριστή (για διόρθωση λάθους).');
      if (col(path) === 'seminars') { semPut(me.id, idOf(path), d === undefined ? null : d); return; }
      if (SHARED.has(col(path))) {
        const sh = ls.get(NS + ':shared') || {}, prev = treqAll()[idOf(path)] || null;
        if (!treqOk(prev, d, me.id)) throw new Error('Δεν επιτρέπεται αυτή η αλλαγή.');
        sh[path] = d; ls.set(NS + ':shared', sh); return;
      }
      const o = ls.get(NS + ':' + me.id) || {}; o[path] = d === undefined ? null : d; ls.set(NS + ':' + me.id, o);
    },
    listen(cb) {
      window.addEventListener('storage', (e) => {
        if (e.key === NS + ':' + me.id) {   /* διόρθωση ή κατάθεση από τη Διαχείριση (άλλη καρτέλα): στοιχεία πελάτη και υπόλοιπα */
          Object.entries(JSON.parse(e.newValue || '{}') || {}).forEach(([p, d]) => { if (LOCKED.has(col(p))) cb(p, d); });
          return;
        }
        if (e.key !== NS + ':shared') return;
        const T = TECHS.has(me.role), cids = new Set();
        treqMine(me.id).forEach(([rid, r]) => { cb('treq/' + rid, r); cids.add(r.cid); if (T) cb('clients/' + r.cid, techClient(r.cid, r)); });
        const prev = new Set(Object.keys(JSON.parse(e.oldValue || '{}') || {}).filter((p) => col(p) === 'seminars'));
        const all = semAll(); Object.entries(all).forEach(([id, x]) => { prev.delete('seminars/' + id); cb('seminars/' + id, semView(me.id, x, T ? (cid) => cids.has(cid) : (cid, r) => r.sid === me.id)); });
        prev.forEach((p) => cb(p, null));   /* σβησμένα */
      });
    },
  };
  /* ο adapter θα φορτώσει μόνο τα δεδομένα του συνδεδεμένου (χωρίς σύνδεση: τίποτα) */
  window.PL_LOCAL = me ? { key: NS + ':' + me.id, seed: seedFor(me.id), org, remote } : { key: NS + ':none', seed: {}, org };
})();
