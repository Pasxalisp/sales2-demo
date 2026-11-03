/* ΔΟΚΙΜΑΣΤΙΚΟ «Χρήστες και ρόλοι» (lab/team/, μόνο στη δοκιμαστική έκδοση — όχι στο Sales 2.0).
   Παίζει τον ρόλο του SERVER μέσα στη συσκευή: είσοδος, ποιος βλέπει τι, ποια δεδομένα δίνονται σε κάθε χρήστη.
   Τρέχει ΠΡΙΝ από τον adapter. Στην κανονική έκδοση τα ίδια τα κάνει ο server (π.χ. Supabase με κανόνες πρόσβασης):
   αλλάζει μόνο αυτό το αρχείο και ο adapter· οι σελίδες και οι υπολογισμοί μένουν ίδιοι.

   Κανόνες (ίδιοι με του server):
   - Κάθε πελάτης ανήκει σε έναν πωλητή: owner = κωδικός πωλητή (όπως στο orders). Ο πωλητής παίρνει μόνο τους δικούς του
     και ό,τι κρέμεται από αυτούς (σημειώσεις, επισκέψεις, υπόλοιπα, συμφωνίες, τζίροι, είδη, προγράμματα, εκκρεμότητες…).
   - Προσωπικά έγγραφα (πρόγραμμα μήνα, λιανικές, διαδρομές, ρυθμίσεις) είναι του κάθε χρήστη.
   - Υπεύθυνος ομάδας: διαβάζει (μόνο ανάγνωση) τα δεδομένα των πωλητών της ομάδας του. Διευθυντής: όλων. Πωλητής: μόνο τα δικά του.
   - Διαχειριστής: αλλάζει χρήστες (ρόλος, ομάδα, κωδικός πωλητή, ενεργός).
   Αποθήκευση στη συσκευή: αλλαγές κάθε χρήστη στο localStorage '<key>:<id>', αλλαγές χρηστών στο '<key>:org', είσοδος στο '<key>:session'. */
(function () {
  const BASE = window.PL_LOCAL; if (!BASE || !BASE.seed) return;
  const SEED = BASE.seed, NS = BASE.key || 'sales2-demo', PASS = 'demo';
  const ls = {
    get: (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* χωρίς αποθήκευση: μένει για αυτή τη συνεδρία */ } },
    del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* τίποτα */ } },
  };
  const col = (p) => p.slice(0, p.lastIndexOf('/')), idOf = (p) => p.slice(p.lastIndexOf('/') + 1);
  const ROLES = { director: 'Διευθυντής', lead: 'Υπεύθυνος ομάδας', sales: 'Πωλητής' };

  /* ---- πίνακες χρηστών και ομάδων (σπόρος + αλλαγές του διαχειριστή) ---- */
  const table = (c) => Object.entries(SEED).filter(([p]) => col(p) === c).map(([p, d]) => Object.assign({ id: idOf(p) }, d));
  const TEAMS = table('teams');
  const users = () => { const ch = (ls.get(NS + ':org') || {}).users || {};
    return table('users').map((x) => Object.assign(x, ch[x.id] || {}))
      .concat(Object.entries(ch).filter(([id]) => !SEED['users/' + id]).map(([id, d]) => Object.assign({ id }, d))); };
  const user = (id) => users().find((x) => x.id === id) || null;

  /* ---- τι δικαιούται κάθε χρήστης ---- */
  const KEYED = new Set(['clients', 'prospects', 'notes', 'balances', 'balnotes', 'items', 'manual', 'visits', 'xout', 'zskip', 'tech', 'sos', 'dealmsg', 'geo']);
  const MAPS = new Set(['deals/all', 'cats/all', 'brands/all']);
  const PERSONAL = new Set(['month', 'extra', 'route', 'wish', 'pdrafts']);   // του αρχικού χρήστη των ψεύτικων δεδομένων
  const SERVER = new Set(['users', 'teams']);                                   // μόνο μέσω της «org» παρακάτω
  const FIRST = (table('users').find((x) => x.admin) || {}).id;                 // σε αυτόν ανήκουν τα προσωπικά έγγραφα του σπόρου

  function seedFor(uid) {
    const u = user(uid), out = {}, mine = new Set();
    if (!u) return out;
    Object.entries(SEED).forEach(([p, d]) => { const c = col(p); if ((c === 'clients' || c === 'prospects') && u.code && d.owner === u.code) mine.add(idOf(p)); });
    Object.entries(SEED).forEach(([p, d]) => {
      const c = col(p);
      if (SERVER.has(c)) return;
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
  /* ποιους πωλητές βλέπει ο συνδεδεμένος (ο κανόνας του server) */
  const visible = () => (!me ? [] : users().filter((x) => x.active && x.role !== 'director' &&
    (me.role === 'director' || x.id === me.id || (me.role === 'lead' && x.team === me.team))));

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
    /* ---- διαχειριστής ---- */
    users: () => (me && me.admin ? users() : []),
    clientCounts: () => { const n = {}; Object.entries(SEED).forEach(([p, d]) => { const c = col(p); if ((c === 'clients' || c === 'prospects') && d.owner) n[d.owner] = (n[d.owner] || 0) + 1; }); return n; },
    saveUser: (x) => {
      if (!me || !me.admin) throw new Error('Μόνο ο διαχειριστής αλλάζει χρήστες.');
      const o = ls.get(NS + ':org') || {}, d = Object.assign({}, x); delete d.id;
      o.users = Object.assign({}, o.users, { [x.id]: d }); ls.set(NS + ':org', o);
    },
    resetUsers: () => { const o = ls.get(NS + ':org') || {}; delete o.users; ls.set(NS + ':org', o); location.reload(); },
    /* ---- είσοδος (όλοι οι δοκιμαστικοί λογαριασμοί έχουν κωδικό «demo») ---- */
    quick: () => ['u3', 'u2', 'u1', FIRST].map(user).filter((x) => x && x.active),
    check: (email, pass) => { const x = users().find((z) => z.email.toLowerCase() === String(email).trim().toLowerCase()); return x && x.active && pass === PASS ? x : null; },
    login: (uid) => { ls.set(NS + ':session', uid); location.reload(); },
    logout: () => { ls.del(NS + ':session'); location.reload(); },
  };
  /* ο adapter θα φορτώσει μόνο τα δεδομένα του συνδεδεμένου (χωρίς σύνδεση: τίποτα) */
  window.PL_LOCAL = me ? { key: NS + ':' + me.id, seed: seedFor(me.id), org } : { key: NS + ':none', seed: {}, org };
})();
