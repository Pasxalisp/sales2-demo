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
  const ROLES = { director: 'Διευθυντής', lead: 'Υπεύθυνος ομάδας', sales: 'Πωλητής', tech: 'Τεχνικός' };

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
  const SHARED = new Set(['treq']);                                             // κοινά πωλητή–τεχνικού (στο '<key>:shared')
  const TECH_CHANGE = ['st', 'appt', 'rep', 'log', 'upd', 'by'];                // ό,τι αλλάζει ο τεχνικός σε ένα αίτημα

  /* ---- αιτήματα τεχνικού: σπόρος + κοινές αλλαγές όλων των χρηστών σε αυτή τη συσκευή ---- */
  const treqAll = () => { const m = {}; Object.entries(SEED).forEach(([p, d]) => { if (col(p) === 'treq') m[idOf(p)] = d; });
    Object.entries(ls.get(NS + ':shared') || {}).forEach(([p, d]) => { if (col(p) !== 'treq') return; if (d === null) delete m[idOf(p)]; else m[idOf(p)] = d; });
    return m; };
  const treqMine = (uid) => Object.entries(treqAll()).filter(([, d]) => d.sid === uid || d.tid === uid);
  /* ο κανόνας του server για κάθε εγγραφή αιτήματος: μόνο πωλητής και τεχνικός του· νέο μόνο από πωλητή προς τεχνικό·
     ο τεχνικός δεν αλλάζει πελάτη, σημείωμα ή πωλητή· κανείς δεν το σβήνει (ακύρωση = κατάσταση «cancel») */
  function treqOk(prev, next, uid) {
    if (!next) return false;
    const me0 = user(uid), t = user(next.tid);
    if (!prev) return next.sid === uid && !!t && t.role === 'tech' && t.active && me0 && me0.role !== 'tech';
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

  function techSeed(u) {
    const out = {}, cids = new Map();
    treqMine(u.id).sort((a, b) => ((a[1].sent || '') < (b[1].sent || '') ? -1 : 1)).forEach(([rid, r]) => { out['treq/' + rid] = r; cids.set(r.cid, r); });
    cids.forEach((r, cid) => { out['clients/' + cid] = techClient(cid, r); const n = SEED['tnseed/' + u.id + '_' + cid]; if (n) out['notes/' + cid] = n; });
    Object.entries(SEED).forEach(([p, d]) => {
      if (col(p) === 'seminars') out[p] = Object.assign({}, d, { cust: (d.cust || []).filter((x) => cids.has(x)), conf: (d.conf || []).filter((x) => cids.has(x)) });
      if (p === 'settings/card') out[p] = Object.assign({}, d, { name: u.name, email: u.email, title: 'Τεχνικός' });
    });
    return out;
  }

  function seedFor(uid) {
    const u = user(uid), out = {}, mine = new Set();
    if (!u) return out;
    if (u.role === 'tech') return techSeed(u);
    Object.entries(SEED).forEach(([p, d]) => { const c = col(p); if ((c === 'clients' || c === 'prospects') && u.code && d.owner === u.code) mine.add(idOf(p)); });
    Object.entries(SEED).forEach(([p, d]) => {
      const c = col(p);
      if (SERVER.has(c) || SHARED.has(c) || c === 'tnseed') return;
      if (KEYED.has(c)) { if (mine.has(idOf(p))) out[p] = d; return; }
      if (MAPS.has(p)) { const m = {}; Object.entries(d).forEach(([k, v]) => { if (k[0] === '_' || mine.has(k)) m[k] = v; }); out[p] = m; return; }
      if (c === 'tasks' || c === 'orders') { if (mine.has(d.cid)) out[p] = d; return; }
      if (c === 'plans') { const stops = (d.stops || []).filter((s) => mine.has(s.id)); if (stops.length) out[p] = Object.assign({}, d, { stops }); return; }
      if (c === 'campaigns') { const cu = {}; Object.entries(d.cust || {}).forEach(([k, v]) => { if (mine.has(k)) cu[k] = v; }); out[p] = Object.assign({}, d, { cust: cu }); return; }
      if (c === 'seminars') { out[p] = Object.assign({}, d, { cust: (d.cust || []).filter((x) => mine.has(x)), conf: (d.conf || []).filter((x) => mine.has(x)) }); return; }
      if (PERSONAL.has(c)) { if (uid === FIRST) out[p] = d; return; }
      if (p === 'settings/card') { out[p] = Object.assign({}, d, { name: u.name, email: u.email }); return; }
      if (p === 'settings/trips') { out[p] = uid === FIRST ? d : Object.assign({}, d, { base: cityOf(mine) || d.base }); return; }
      if (c === 'flash') { out[p] = Object.assign({}, d, { me: u.code || '' }); return; }
      out[p] = d;   /* κοινά για όλους: κατάλογος ειδών, στόχοι, FLASH της εταιρείας */
    });
    /* αιτήματα τεχνικού του πωλητή, ο συνεργαζόμενος τεχνικός του και οι σημειώσεις των τεχνικών για τους πελάτες του */
    treqMine(uid).forEach(([rid, r]) => { out['treq/' + rid] = r; });
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
  const visible = () => (!me ? [] : users().filter((x) => x.active && x.role !== 'director' && x.role !== 'tech' &&
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
      if (!me || !me.admin) return [];
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
    /* ---- διαχειριστής ---- */
    usage,
    users: () => (me && me.admin ? users() : []),
    clientCounts: () => { const n = {}; Object.entries(SEED).forEach(([p, d]) => { const c = col(p); if ((c === 'clients' || c === 'prospects') && d.owner) n[d.owner] = (n[d.owner] || 0) + 1; }); return n; },
    saveUser: (x) => {
      if (!me || !me.admin) throw new Error('Μόνο ο διαχειριστής αλλάζει χρήστες.');
      const o = ls.get(NS + ':org') || {}, d = Object.assign({}, x); delete d.id;
      o.users = Object.assign({}, o.users, { [x.id]: d }); ls.set(NS + ':org', o);
    },
    resetUsers: () => { const o = ls.get(NS + ':org') || {}; delete o.users; ls.set(NS + ':org', o); location.reload(); },
    /* ---- είσοδος (όλοι οι δοκιμαστικοί λογαριασμοί έχουν κωδικό «demo») ---- */
    quick: () => ['u3', 'u2', 'u1', FIRST, 'u14'].map(user).filter((x) => x && x.active),
    hint: 'Όλοι οι δοκιμαστικοί λογαριασμοί έχουν κωδικό <b>demo</b>.',
    check: (email, pass) => { const x = users().find((z) => z.email.toLowerCase() === String(email).trim().toLowerCase()); return x && x.active && pass === PASS ? x : null; },
    login: (uid) => { ls.set(NS + ':session', uid); location.reload(); },
    logout: () => { ls.del(NS + ':session'); location.reload(); },
  };
  /* Εγγραφές (ρόλος του server): τα κοινά (αιτήματα) στο '<key>:shared' με τον κανόνα treqOk, τα υπόλοιπα στις αλλαγές του χρήστη.
     Αλλαγή κοινού από άλλη καρτέλα του browser (π.χ. πωλητής εδώ, τεχνικός εκεί): φτάνει με το «storage» → listen. */
  const remote = me && {
    async put(path, d) {
      if (SHARED.has(col(path))) {
        const sh = ls.get(NS + ':shared') || {}, prev = treqAll()[idOf(path)] || null;
        if (!treqOk(prev, d, me.id)) throw new Error('Δεν επιτρέπεται αυτή η αλλαγή.');
        sh[path] = d; ls.set(NS + ':shared', sh); return;
      }
      const o = ls.get(NS + ':' + me.id) || {}; o[path] = d === undefined ? null : d; ls.set(NS + ':' + me.id, o);
    },
    listen(cb) {
      window.addEventListener('storage', (e) => {
        if (e.key !== NS + ':shared') return;
        treqMine(me.id).forEach(([rid, r]) => { cb('treq/' + rid, r); if (me.role === 'tech') cb('clients/' + r.cid, techClient(r.cid, r)); });
      });
    },
  };
  /* ο adapter θα φορτώσει μόνο τα δεδομένα του συνδεδεμένου (χωρίς σύνδεση: τίποτα) */
  window.PL_LOCAL = me ? { key: NS + ':' + me.id, seed: seedFor(me.id), org, remote } : { key: NS + ':none', seed: {}, org };
})();
