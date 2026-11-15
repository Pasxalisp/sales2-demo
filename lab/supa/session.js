/* «SERVER» του demo στη βάση Supabase (db.html· πρόβα μετακόμισης 15/11/2026). Παίρνει τη θέση του lab/team/session.js:
   ίδια «org» (χρήστες, ομάδες, ποιος βλέπει ποιον, χρήση) και ίδια μορφή δεδομένων για τον adapter, μόνο που
   - η είσοδος γίνεται με τον λογαριασμό του χρήστη στο Supabase (email + κωδικός),
   - τα δεδομένα έρχονται από τη βάση και κάθε αλλαγή γράφεται εκεί (PL_LOCAL.remote), με ζωντανή ενημέρωση από άλλη συσκευή,
   - το ποιος βλέπει τι το αποφασίζουν οι κανόνες της βάσης (RLS)· εδώ απλώς ζητάμε ό,τι μας δίνει.
   Πίνακες: profiles (χρήστες), teams, shared_docs (κοινά, μόνο ανάγνωση), docs (έγγραφα κάθε χρήστη· data null = σβησμένο), usage.
   Η εφαρμογή ξεκινά όταν φορτώσουν τα δεδομένα (window.PL_BOOT, βλ. db.html).
   Λογαριασμοί (εργασίες του server, lab/supa/api.js): η είσοδος περνά από το login (κλείδωμα μετά από 5 λάθος κωδικούς),
   ο χρήστης βάζει δικό του κωδικό με το setPassword (me.mustChange = πρέπει να βάλει πριν δουλέψει) και ο διαχειριστής
   έχει τα org.accounts (κατάσταση, ξεκλείδωμα, προσωρινός κωδικός, νέος χρήστης). Κωδικούς δεν βλέπει κανείς. */
(function () {
  const CFG = window.PL_SUPA; if (!CFG || !window.supabase) return;
  const NS = 'sales2-db';
  const ls = {
    get: (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* τίποτα */ } },
    del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* τίποτα */ } },
  };
  const sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: NS + ':auth' } });
  const api = window.PL_SUPA_API(sb);
  const PASSWORD_MIN = 8, MAX_FAILS = 5;   // ίδια με τον server (supabase/functions/_shared/util.ts)
  /* απαντήσεις του server → μήνυμα για τον χρήστη */
  const MSG = {
    net: 'Δεν συνδέθηκα με τον server. Έλεγξε το ίντερνετ και ξαναδοκίμασε.',
    invalid: 'Λάθος email ή κωδικός. Μετά από ' + MAX_FAILS + ' λάθος προσπάθειες ο λογαριασμός κλειδώνει.',
    locked: 'Ο λογαριασμός κλειδώθηκε μετά από ' + MAX_FAILS + ' λάθος κωδικούς. Ζήτα από τον διαχειριστή να τον ξεκλειδώσει.',
    inactive: 'Ο λογαριασμός είναι ανενεργός. Μίλα με τον διαχειριστή.',
    short: 'Ο κωδικός θέλει τουλάχιστον ' + PASSWORD_MIN + ' χαρακτήρες.',
    weak: 'Ο κωδικός είναι πολύ εύκολος. Διάλεξε άλλον.',
    auth: 'Η σύνδεση έληξε. Βγες και μπες ξανά.',
    forbidden: 'Μόνο ο διαχειριστής.',
    exists: 'Υπάρχει ήδη λογαριασμός με αυτό το email.',
    fields: 'Λείπει το όνομα, σωστό email ή ο ρόλος.',
    nouser: 'Δεν βρέθηκε ο χρήστης.',
    server: 'Κάτι πήγε στραβά στον server. Ξαναδοκίμασε.',
  };
  const msg = (code) => MSG[code] || MSG.server;
  const ROLES = { director: 'Διευθυντής', lead: 'Υπεύθυνος ομάδας', sales: 'Πωλητής' };
  const col = (p) => p.slice(0, p.lastIndexOf('/')), idOf = (p) => p.slice(p.lastIndexOf('/') + 1);
  /* γραμμή profiles → χρήστης της εφαρμογής (id = το id του demo, π.χ. u7· uuid = ο λογαριασμός στη βάση) */
  const toUser = (p) => ({ id: p.demo_id, uuid: p.id, name: p.name, email: p.email, role: p.role, team: p.team || '', code: p.code || '', admin: !!p.admin, active: p.active !== false });
  /* όλες οι γραμμές ενός ερωτήματος, ανά 1000 */
  async function rows(make) {
    const out = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await make().range(from, from + 999);
      if (error) throw error;
      out.push(...data); if (data.length < 1000) return out;
    }
  }

  let PROFILES = [], TEAMS = [], USAGE = [], COUNTS = {};
  const STATUS = {};   // κατάσταση λογαριασμών (μόνο για τον διαχειριστή): demo id → { locked, fails, must_change, last }
  const SRC = {}, listeners = new Set();
  const cached = ls.get(NS + ':me'), me = cached && cached.active ? toUser(cached) : null;
  const users = () => PROFILES.map(toUser);
  /* ποιους πωλητές δείχνουμε (ίδιος κανόνας με τη βάση· η βάση ούτως ή άλλως δεν δίνει δεδομένα για άλλους) */
  const visible = () => (!me ? [] : users().filter((x) => x.active && x.role !== 'director' &&
    (me.role === 'director' || x.id === me.id || (me.role === 'lead' && x.team === me.team))));
  const source = (docs) => { const m = {}; Object.entries(docs).forEach(([p, d]) => { (m[col(p)] = m[col(p)] || {})[idOf(p)] = d; });
    return { all: (c) => m[c] || {}, get: (c, id) => (m[c] || {})[id], loaded: () => true }; };
  const layer = (base, list) => { const o = Object.assign({}, base); list.forEach((r) => { if (r.data === null) delete o[r.path]; else o[r.path] = r.data; }); return o; };

  /* Εργαλεία διαχειριστή για λογαριασμούς. Λάθος → Error με μήνυμα για τον χρήστη. */
  async function admin(action, extra) {
    let r; try { r = await api.admin(action, extra); } catch (e) { throw new Error(MSG.net); }
    if (r.error) throw new Error(msg(r.error));
    return r;
  }
  const accounts = {
    max: MAX_FAILS,
    status: (id) => STATUS[id] || null,
    async refresh() { const r = await admin('status'); Object.keys(STATUS).forEach((k) => delete STATUS[k]); Object.assign(STATUS, r.status || {}); },
    async unlock(id) { await admin('unlock', { id }); await accounts.refresh().catch(() => {}); },
    /* νέος προσωρινός κωδικός (ξεκλειδώνει κιόλας)· τον βλέπει μόνο ο διαχειριστής, μία φορά, για να τον δώσει */
    async temp(id) { const r = await admin('temp', { id }); await accounts.refresh().catch(() => {}); return r.temp; },
    /* νέος χρήστης: λογαριασμός + προφίλ στον server· επιστρέφει { id, temp } */
    async create(user) {
      const r = await admin('create', { user });
      const { data: p } = await sb.from('profiles').select('*').eq('demo_id', r.id).maybeSingle();
      if (p) PROFILES.push(p);
      await accounts.refresh().catch(() => {});
      return { id: r.id, temp: r.temp };
    },
  };

  const org = {
    ROLES,
    me,
    db: true,   // συνδεδεμένο με βάση (για την οθόνη εισόδου)
    teams: () => TEAMS.slice(),
    team: (id) => TEAMS.find((t) => t.id === id) || null,
    sellers: (tid) => visible().filter((x) => !tid || x.team === tid)
      .sort((a, b) => (a.role === 'lead') !== (b.role === 'lead') ? (a.role === 'lead' ? -1 : 1) : a.name.localeCompare(b.name, 'el')),
    data: (uid) => (visible().some((x) => x.id === uid) ? SRC[uid] || null : null),
    usage: {
      record(delta) { if (me) sb.rpc('usage_add', { day: delta.d, delta }).then(() => {}, () => {}); },
      all: () => (me && me.admin ? USAGE.slice() : []),
    },
    users: () => (me && me.admin ? users() : []),
    clientCounts: () => Object.assign({}, COUNTS),
    saveUser(x) {
      if (!me || !me.admin) throw new Error('Μόνο ο διαχειριστής αλλάζει χρήστες.');
      const p = PROFILES.find((z) => z.demo_id === x.id);
      if (!p) throw new Error('Νέος χρήστης: στην πρόβα φτιάχνεται μόνο από τη βάση.');
      const v = { name: x.name, role: x.role, team: x.role === 'director' ? null : x.team || null, code: x.code || '', active: x.active !== false, admin: !!x.admin };
      Object.assign(p, v);
      sb.from('profiles').update(v).eq('id', p.id).then(({ error }) => { if (error && PL.dlg) PL.dlg.toast('Δεν αποθηκεύτηκε ο χρήστης στη βάση.'); });
    },
    resetUsers: () => location.reload(),
    quick: () => [],
    hint: 'Συνδεδεμένο με τη βάση (Supabase). Μπαίνεις με το email και τον κωδικό που σου έδωσαν.',
    /* είσοδος μέσω του server (μετρά τα λάθη)· επιστρέφει τον χρήστη ή { error: μήνυμα } */
    async check(email, pass) {
      let r; try { r = await api.login(String(email).trim(), String(pass)); } catch (e) { return { error: MSG.net }; }
      if (r.error || !r.session) return { error: msg(r.error || 'invalid') };
      const { data, error } = await sb.auth.setSession(r.session);
      if (error || !data.user) return { error: MSG.server };
      const { data: p } = await sb.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
      if (!p || !p.active) { await sb.auth.signOut(); return { error: MSG.inactive }; }
      ls.set(NS + ':me', p);
      return toUser(p);
    },
    passwordMin: PASSWORD_MIN,
    /* ο συνδεδεμένος βάζει δικό του κωδικό· { ok } ή { error: μήνυμα } */
    async setPassword(pw) {
      let r; try { r = await api.setPassword(String(pw)); } catch (e) { return { error: MSG.net }; }
      if (r.error) return { error: msg(r.error) };
      await sb.auth.refreshSession().catch(() => {});   // νέο κλειδί συνεδρίας χωρίς το «πρέπει να αλλάξει»
      if (me) me.mustChange = false;
      return { ok: true };
    },
    get accounts() { return me && me.admin ? accounts : null; },
    login: () => location.reload(),
    async logout() { try { await sb.auth.signOut(); } catch (e) { /* τίποτα */ } ls.del(NS + ':me'); location.reload(); },
  };

  /* για τον adapter: κάθε αλλαγή γράφεται στη βάση· αλλαγές από άλλη συσκευή έρχονται στο listen */
  const remote = {
    async put(path, data) {
      const { error } = await sb.from('docs').upsert({ uid: me.uuid, path, data: data === undefined ? null : data, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    listen: (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
  };
  window.PL_LOCAL = { key: NS + ':' + (me ? me.id : 'none'), seed: {}, org, remote: me ? remote : null };
  if (me) me.mustChange = false;

  window.PL_BOOT = (async () => {
    if (!me) return;
    const { data: { session } } = await sb.auth.getSession();
    if (!session || session.user.id !== me.uuid) { ls.del(NS + ':me'); location.reload(); return new Promise(() => {}); }
    const [prof, teams, shared, own] = await Promise.all([
      rows(() => sb.from('profiles').select('*').order('demo_id')),
      rows(() => sb.from('teams').select('id,name').order('id')),
      rows(() => sb.from('shared_docs').select('path,data').order('path')),
      rows(() => sb.from('docs').select('path,data').eq('uid', me.uuid).order('path')),
    ]);
    PROFILES = prof; TEAMS = teams;
    const mine = PROFILES.find((p) => p.id === me.uuid);
    if (!mine || !mine.active) { await org.logout(); return new Promise(() => {}); }
    Object.assign(me, toUser(mine)); ls.set(NS + ':me', mine);
    me.mustChange = !!(session.user.app_metadata && session.user.app_metadata.must_change);
    const base = {}; shared.forEach((r) => { base[r.path] = r.data; });
    const seed = layer(base, own);
    window.PL_LOCAL.seed = seed;
    SRC[me.id] = source(seed);
    /* υπεύθυνος / διευθυντής: τα δεδομένα των πωλητών που δικαιούται (η βάση δίνει μόνο αυτά) */
    const others = visible().filter((x) => x.id !== me.id);
    if (others.length) {
      const all = await rows(() => sb.from('docs').select('uid,path,data').in('uid', others.map((x) => x.uuid)).order('uid').order('path'));
      others.forEach((x) => { SRC[x.id] = source(layer(base, all.filter((r) => r.uid === x.uuid))); });
    }
    if (me.admin) {
      const byUuid = Object.fromEntries(PROFILES.map((p) => [p.id, p.demo_id]));
      USAGE = (await rows(() => sb.from('usage').select('uid,d,data').order('d'))).map((r) => ({ u: byUuid[r.uid] || r.uid, d: r.d, p: r.data.p || {}, a: r.data.a || {}, last: r.data.last || '' }));
      const { data: cc } = await sb.rpc('client_counts'); (cc || []).forEach((r) => { COUNTS[r.owner] = +r.n; });
      await accounts.refresh().catch(() => {});   // χωρίς κατάσταση λογαριασμών η εφαρμογή δουλεύει κανονικά
    }
    /* ζωντανές αλλαγές των δικών μου εγγράφων (π.χ. από το τάμπλετ) */
    sb.channel('docs-' + me.uuid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'docs', filter: 'uid=eq.' + me.uuid }, (ev) => {
        const r = ev.eventType === 'DELETE' ? ev.old : ev.new; if (!r || !r.path) return;
        const d = ev.eventType === 'DELETE' ? (base[r.path] === undefined ? null : base[r.path]) : r.data === null ? null : r.data;
        listeners.forEach((f) => f(r.path, d));
      })
      .subscribe();
  })();
  org.ready = window.PL_BOOT;   // για όσα θέλουν τα στοιχεία από τη βάση (π.χ. me.mustChange)
})();
