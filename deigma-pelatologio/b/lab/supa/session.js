/* «SERVER» του demo στη βάση Supabase (db.html· πρόβα μετακόμισης 15/11/2026). Παίρνει τη θέση του lab/team/session.js:
   ίδια «org» (χρήστες, ομάδες, ποιος βλέπει ποιον, χρήση) και ίδια μορφή δεδομένων για τον adapter, μόνο που
   - η είσοδος γίνεται με τον λογαριασμό του χρήστη στο Supabase (email + κωδικός),
   - τα δεδομένα έρχονται από τη βάση και κάθε αλλαγή γράφεται εκεί (PL_LOCAL.remote), με ζωντανή ενημέρωση από άλλη συσκευή,
   - η συσκευή κρατά αντίγραφο (lab/supa/cache.js, απόφαση 18/11/2026): ανοίγει αμέσως από αυτό, και χωρίς ίντερνετ, και μετά
     φέρνει από τη βάση μόνο ό,τι άλλαξε· οι αλλαγές χωρίς ίντερνετ φυλάγονται και στέλνονται μόλις έρθει σύνδεση,
   - το ποιος βλέπει τι το αποφασίζουν οι κανόνες της βάσης (RLS)· εδώ απλώς ζητάμε ό,τι μας δίνει.
   Πίνακες: profiles (χρήστες), teams, shared_docs (κοινά, μόνο ανάγνωση), docs (έγγραφα κάθε χρήστη· data null = σβησμένο), usage.
   Η εφαρμογή ξεκινά όταν φορτώσουν τα δεδομένα (window.PL_BOOT, βλ. db.html): από τη συσκευή αμέσως, ή από τη βάση την πρώτη φορά.
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
  const PASSWORD_MIN = 8, MAX_FAILS = 5, ADMIN_LOCK_MIN = 15;   // ίδια με τον server (supabase/functions/_shared/util.ts)
  /* απαντήσεις του server → μήνυμα για τον χρήστη */
  const MSG = {
    net: 'Δεν συνδέθηκα με τον server. Έλεγξε το ίντερνετ και ξαναδοκίμασε.',
    invalid: 'Λάθος email ή κωδικός.',
    locked: 'Ο λογαριασμός κλειδώθηκε μετά από ' + MAX_FAILS + ' λάθος κωδικούς. Ζήτα από τον διαχειριστή να τον ξεκλειδώσει. (Ο λογαριασμός του διαχειριστή ξεκλειδώνει μόνος του σε ' + ADMIN_LOCK_MIN + ' λεπτά.)',
    inactive: 'Ο λογαριασμός είναι ανενεργός. Μίλα με τον διαχειριστή.',
    short: 'Ο κωδικός θέλει τουλάχιστον ' + PASSWORD_MIN + ' χαρακτήρες.',
    weak: 'Ο κωδικός είναι πολύ εύκολος. Διάλεξε άλλον.',
    auth: 'Η σύνδεση έληξε. Βγες και μπες ξανά.',
    later: 'Ζητήθηκαν πολλοί σύνδεσμοι. Δοκίμασε ξανά σε λίγα λεπτά.',
    link: 'Ο σύνδεσμος από το email έληξε ή χρησιμοποιήθηκε ήδη. Ζήτα νέο με «Ξέχασα τον κωδικό».',
    forbidden: 'Μόνο ο διαχειριστής.',
    exists: 'Υπάρχει ήδη λογαριασμός με αυτό το email.',
    fields: 'Λείπει το όνομα, σωστό email ή ο ρόλος.',
    nouser: 'Δεν βρέθηκε ο χρήστης.',
    server: 'Κάτι πήγε στραβά στον server. Ξαναδοκίμασε.',
  };
  const msg = (code) => MSG[code] || MSG.server;
  /* λάθος κωδικός: πόσες προσπάθειες μένουν (ο server μετρά ανά email, ίδιο μήνυμα για όλους) */
  const invalid = (left) => MSG.invalid + (left > 0 ? (left === 1 ? ' Μένει 1 προσπάθεια' : ' Μένουν ' + left + ' προσπάθειες') + ' πριν κλειδώσει ο λογαριασμός.' : '');
  const ROLES = { director: 'Διευθυντής', lead: 'Υπεύθυνος ομάδας', sales: 'Πωλητής', tech: 'Τεχνικός', techlead: 'Υπεύθυνος τεχνικών' };
  const col = (p) => p.slice(0, p.lastIndexOf('/')), idOf = (p) => p.slice(p.lastIndexOf('/') + 1);
  /* γραμμή profiles → χρήστης της εφαρμογής (id = το id του demo, π.χ. u7· uuid = ο λογαριασμός στη βάση) */
  const toUser = (p) => ({ id: p.demo_id, uuid: p.id, name: p.name, email: p.email, role: p.role, team: p.team || '', code: p.code || '', admin: !!p.admin, active: p.active !== false });
  /* Όλες οι γραμμές ενός ερωτήματος. Η βάση δίνει έως 1000 τη φορά: η πρώτη σελίδα λέει και πόσες είναι συνολικά,
     οι υπόλοιπες ζητιούνται μαζί (όχι η μία μετά την άλλη). more(q) = φίλτρα και σειρά. */
  const PAGE = 1000;
  async function rows(table, cols, more) {
    const ask = (o) => more(sb.from(table).select(cols, o));
    const first = await ask({ count: 'exact' }).range(0, PAGE - 1);
    if (first.error) throw first.error;
    const n = first.count == null ? 0 : first.count, from = [];
    for (let f = PAGE; f < n && first.data.length === PAGE; f += PAGE) from.push(f);
    const rest = await Promise.all(from.map((f) => ask().range(f, f + PAGE - 1).then((r) => { if (r.error) throw r.error; return r.data; })));
    return first.data.concat(...rest);
  }
  /* πόσες γραμμές βλέπω σε έναν πίνακα (μόνο ο αριθμός)· more(q) = φίλτρα */
  async function countOf(table, more) {
    const { count, error } = await (more || ((q) => q))(sb.from(table).select('path', { count: 'exact', head: true }));
    if (error) throw error;
    return count || 0;
  }

  let PROFILES = [], TEAMS = [], USAGE = [], COUNTS = {};
  const STATUS = {};   // κατάσταση λογαριασμών (μόνο για τον διαχειριστή): demo id → { locked, fails, must_change, last }
  const usageListeners = new Set();
  /* γραμμή usage → { u: id του demo, d, p, a, last, away }· με το τωρινό PROFILES, ώστε να ισχύει και για νέους χρήστες */
  const toUse = (r) => { const p = PROFILES.find((z) => z.id === r.uid), x = r.data || {}; return { u: p ? p.demo_id : r.uid, d: r.d, p: x.p || {}, a: x.a || {}, last: x.last || '', away: x.away || '' }; };
  const SRC = {}, listeners = new Set();
  const cached = ls.get(NS + ':me'), me = cached && cached.active ? toUser(cached) : null;
  const users = () => PROFILES.map(toUser);
  /* ποιους πωλητές δείχνουμε: διευθυντής και διαχειριστής όλους, υπεύθυνος την ομάδα του (ίδιος κανόνας με τη βάση· η βάση ούτως ή άλλως δεν δίνει δεδομένα για άλλους) */
  const visible = () => (!me ? [] : users().filter((x) => x.active && x.role !== 'director' && x.role !== 'tech' && x.role !== 'techlead' &&
    (me.role === 'director' || me.admin || x.id === me.id || (me.role === 'lead' && x.team === me.team))));

  /* ---------- Τα δεδομένα, όπως τα κρατά η μνήμη της συσκευής (lab/supa/cache.js) ----------
     S = { v, since, sinceShared, profiles, teams, shared: {path: έγγραφο}, docs: {uuid χρήστη: {path: έγγραφο | null}}, team }
     team = φορτώθηκαν και τα δεδομένα των πωλητών που βλέπω (υπεύθυνος, διευθυντής, διαχειριστής): την πρώτη φορά έρχονται μετά
     το άνοιγμα, όχι πριν (απόφαση 18/11, Α4)· μετά, όπως όλα, μόνο οι αλλαγές.
     docs = οι γραμμές της βάσης όπως είναι (null = σβησμένο, κρύβει το κοινό). since = η πιο πρόσφατη ώρα αλλαγής που έχουμε
     δει (ώρα της βάσης): την επόμενη φορά ζητάμε μόνο ό,τι άλλαξε μετά. */
  const V = 1, STORE = window.PL_SUPA_STORE || { get: async () => null, set: async () => false, del: async () => false };
  const KEY = me ? { state: NS + ':' + me.uuid + ':state', out: NS + ':' + me.uuid + ':out' } : null;
  const blank = () => ({ v: V, since: '', sinceShared: '', profiles: [], teams: [], shared: {}, docs: {}, team: false });
  let S = blank();
  const docsOf = (uuid) => S.docs[uuid] || (S.docs[uuid] = {});
  /* τα έγγραφα ενός χρήστη όπως τα βλέπει η εφαρμογή: τα κοινά, και από πάνω τα δικά του */
  function merged(uuid) {
    const o = Object.assign({}, S.shared);
    Object.entries(S.docs[uuid] || {}).forEach(([p, d]) => { if (d === null) delete o[p]; else o[p] = d; });
    return o;
  }
  /* ένα έγγραφο του συνδεδεμένου όπως το βλέπει η εφαρμογή (null = δεν υπάρχει) */
  function eff(path) {
    const o = S.docs[me.uuid] || {};
    return path in o ? o[path] : path in S.shared ? S.shared[path] : null;
  }
  /* Τα δεδομένα ενός πωλητή για τον υπεύθυνο/διευθυντή (org.data): πάντα τα τωρινά — ξαναχτίζονται μόνο όταν άλλαξε κάτι
     (VER: μετρητής αλλαγών ανά χρήστη και για τα κοινά). */
  const VER = { shared: 0 };
  const bump = (uuid) => { VER[uuid] = (VER[uuid] || 0) + 1; };
  function sourceOf(uuid) {
    let at = '', m = {};
    const map = () => {
      const now = (VER[uuid] || 0) + ':' + VER.shared;
      if (now !== at) { at = now; m = {}; Object.entries(merged(uuid)).forEach(([p, d]) => { (m[col(p)] = m[col(p)] || {})[idOf(p)] = d; }); }
      return m;
    };
    return { all: (c) => map()[c] || {}, get: (c, id) => (map()[c] || {})[id], loaded: () => true };
  }
  /* μετά από νέους χρήστες/ομάδες: ποιων τα δεδομένα δείχνουμε */
  function place() {
    Object.keys(SRC).forEach((k) => delete SRC[k]);
    visible().concat(users().filter((x) => me && x.id === me.id)).forEach((x) => { SRC[x.id] = SRC[x.id] || sourceOf(x.uuid); });
  }

  /* Εργαλεία διαχειριστή για λογαριασμούς. Λάθος → Error με μήνυμα για τον χρήστη. */
  async function admin(action, extra) {
    let r; try { r = await api.admin(action, extra); } catch (e) { throw new Error(MSG.net); }
    if (r.error) throw new Error(msg(r.error));
    return r;
  }
  const accounts = {
    max: MAX_FAILS,
    adminLockMin: ADMIN_LOCK_MIN,
    status: (id) => STATUS[id] || null,
    async refresh() { const r = await admin('status'); Object.keys(STATUS).forEach((k) => delete STATUS[k]); Object.assign(STATUS, r.status || {}); },
    async unlock(id) { await admin('unlock', { id }); await accounts.refresh().catch(() => {}); },
    /* έξοδος ενός χρήστη από όλες τις συσκευές του (π.χ. χάθηκε το κινητό)· επιστρέφει από πόσες βγήκε */
    async signout(id) { const r = await admin('signout', { id }); await accounts.refresh().catch(() => {}); return r.ended || 0; },
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
      /* διαχειριστής: ειδοποίηση όταν αλλάζει η χρήση κάποιου (online, στατιστικά), ζωντανά από τη βάση */
      onChange(f) { usageListeners.add(f); return () => usageListeners.delete(f); },
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
      if (r.error === 'invalid' || (!r.error && !r.session)) return { error: invalid(r.left) };
      if (r.error) return { error: msg(r.error) };
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
      if (me) { me.mustChange = false; me.mustReason = ''; }
      ls.del(RECOVER);
      return { ok: true };
    },
    /* «Ξέχασα τον κωδικό» (απόφαση 18/11): η βάση στέλνει στο email του χρήστη σύνδεσμο που ανοίγει αυτή τη σελίδα·
       εκεί ο χρήστης βάζει νέο κωδικό (me.mustReason = 'reset'). Ίδια απάντηση είτε υπάρχει το email είτε όχι.
       Θέλει αληθινά email και αποστολή email (SMTP) στη Supabase, και τη διεύθυνση της σελίδας στις επιτρεπτές της. */
    async resetPassword(email) {
      const to = location.href.split('#')[0].split('?')[0];
      let r; try { r = await sb.auth.resetPasswordForEmail(String(email).trim().toLowerCase(), { redirectTo: to }); } catch (e) { return { error: MSG.net }; }
      if (r && r.error) return { error: r.error.status === 429 ? MSG.later : netError(r.error) ? MSG.net : MSG.server };
      return { ok: true };
    },
    notice: '',   // μήνυμα για την οθόνη εισόδου (π.χ. σύνδεσμος που έληξε)
    get accounts() { return me && me.admin ? accounts : null; },
    login: () => location.reload(),
    /* Έξοδος. Κανονικά μόνο από αυτή τη συσκευή (οι άλλες μένουν συνδεδεμένες)· everywhere: από ΟΛΕΣ τις συσκευές
       (απόφαση 18/11, θέλει ίντερνετ — χωρίς αυτό επιστρέφει { error } και δεν βγαίνει από πουθενά).
       Σβήνει τα δεδομένα από τη μνήμη της συσκευής· μένουν μόνο όσες αλλαγές δεν πρόλαβαν να σταλούν (χωρίς ίντερνετ),
       για να σταλούν την επόμενη φορά που θα μπει ο ίδιος. */
    everywhere: true,
    async logout(everywhere) {
      leaving = true;
      if (everywhere) {
        let r; try { r = await sb.auth.signOut({ scope: 'global' }); } catch (e) { r = { error: e }; }
        if (r && r.error) { leaving = false; return { error: MSG.net }; }
        await org.push.forget();   // η συνδρομή καταργείται· τη γραμμή της τη σβήνει η βάση στην επόμενη αποστολή
      } else {
        await org.push.forget();   // πριν βγει: με τη σύνδεση σβήνει και τη γραμμή της συσκευής από τη βάση
        try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* τίποτα */ }
      }
      keeping = false; clearTimeout(saveT);
      ls.del(NS + ':me'); ls.del(RECOVER); if (KEY) await STORE.del(KEY.state); location.reload();
    },
  };

  /* ---------- Φύλαξη στη συσκευή ---------- */
  let saveT = 0, keeping = true;   // keeping = false μετά την «Έξοδο»: τίποτα δεν ξαναγράφεται στη συσκευή
  const saveNow = () => { clearTimeout(saveT); saveT = 0; if (!keeping) return Promise.resolve(false); S.profiles = PROFILES; S.teams = TEAMS; return STORE.set(KEY.state, S); };
  const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(saveNow, 800); };
  addEventListener('pagehide', () => { if (saveT) saveNow(); });
  /* OUT: αλλαγές μου που δεν έφτασαν ακόμη στη βάση (χωρίς ίντερνετ). path → { data, at: ώρα της αλλαγής }.
     Φυλάγεται αμέσως σε κάθε αλλαγή (όχι αργότερα): αν κλείσει η εφαρμογή, δεν χάνεται τίποτα. */
  let OUT = {};
  const saveOut = () => STORE.set(KEY.out, OUT);

  /* αλλαγή σε έγγραφό μου που ήρθε από τη βάση → η μνήμη της εφαρμογής (adapter) */
  const early = [];
  const tell = (path) => { const d = eff(path); if (listeners.size) listeners.forEach((f) => f(path, d)); else early.push(path); };
  const setMine = (path, d) => { docsOf(me.uuid)[path] = d; bump(me.uuid); };

  /* μήνυμα στον χρήστη (όταν η εφαρμογή έχει ξεκινήσει) */
  const say = (t) => { if (PL.dlg && PL.dlg.toast) PL.dlg.toast(t); };
  const plural = (n, one, many) => (n === 1 ? one : n + ' ' + many);
  /* λάθος δικτύου (όχι «η βάση δεν το δέχτηκε») */
  const offline = (e) => !navigator.onLine || (!!e && !e.code && /fetch|network|load failed/i.test(String(e.message || '')));
  /* το κλειδί της συνεδρίας έληξε και δεν έχει ανανεωθεί ακόμη (π.χ. μόλις ήρθε ίντερνετ): ξαναδοκιμάζουμε, δεν είναι απόρριψη */
  const stale = (e) => !!e && (/^PGRST30/.test(String(e.code || '')) || /jwt/i.test(String(e.message || '')));
  const later = (e) => offline(e) || stale(e);
  let toldOff = false;
  const offNotice = () => { if (toldOff) return; toldOff = true; say('Χωρίς ίντερνετ: οι αλλαγές φυλάγονται στη συσκευή και στέλνονται μόλις έρθει σύνδεση.'); };

  /* για τον adapter: κάθε αλλαγή γράφεται στη συσκευή αμέσως και στη βάση μόλις γίνεται· αλλαγές από άλλη συσκευή έρχονται στο listen.
     Χωρίς ίντερνετ η αλλαγή μένει (OUT) και στέλνεται αργότερα. Λάθος → μόνο αν η βάση την απέρριψε (τότε ο adapter τη γυρνά πίσω).
     Οι αλλαγές του ίδιου εγγράφου στέλνονται με τη σειρά που έγιναν (lane). */
  const lane = {};
  const send = (path, data) => sb.from('docs').upsert({ uid: me.uuid, path, data }).then((r) => r.error || null, (e) => e || { message: 'fetch' });
  const remote = {
    put(path, data) {
      const v = data === undefined ? null : data, before = (S.docs[me.uuid] || {})[path], had = path in (S.docs[me.uuid] || {});
      const job = { data: v, at: new Date().toISOString() };
      OUT[path] = job; saveOut(); setMine(path, v); saveSoon();
      const go = async () => {
        if (OUT[path] !== job) return;   // ήρθε νεότερη αλλαγή του ίδιου εγγράφου: στέλνεται εκείνη
        if (!navigator.onLine) { offNotice(); retry(); return; }
        const error = await send(path, v);
        if (!error) { if (OUT[path] === job) { delete OUT[path]; saveOut(); } if (Object.keys(OUT).length) sync(); return; }
        if (later(error)) { if (offline(error)) offNotice(); retry(); return; }
        if (OUT[path] === job) { delete OUT[path]; saveOut(); if (had) setMine(path, before); else { delete docsOf(me.uuid)[path]; bump(me.uuid); } saveSoon(); }
        throw error;
      };
      return (lane[path] = (lane[path] || Promise.resolve()).catch(() => {}).then(go));
    },
    listen: (cb) => { listeners.add(cb); early.splice(0).forEach((p) => cb(p, eff(p))); return () => listeners.delete(cb); },
  };
  window.PL_LOCAL = { key: NS + ':' + (me ? me.id : 'none'), seed: {}, org, remote: me ? remote : null };
  const RECOVER = NS + ':recover';   // ήρθε από σύνδεσμο «Ξέχασα τον κωδικό»: πρώτα νέος κωδικός
  if (me) me.mustChange = false;

  /* Λάθος δικτύου (όχι «η συνεδρία δεν ισχύει»): π.χ. το κινητό μόλις ξύπνησε και δεν έχει ακόμη ίντερνετ. */
  const netError = (e) => !!e && ((window.supabase.isAuthRetryableFetchError && window.supabase.isAuthRetryableFetchError(e)) || e.name === 'AuthRetryableFetchError' || e.status === 0 || !navigator.onLine);
  const online = (ms) => new Promise((res) => { const done = () => { clearTimeout(t); removeEventListener('online', done); res(); }; const t = setTimeout(done, ms); addEventListener('online', done); });
  /* Η συνεδρία μου. Μένεις συνδεδεμένος μέχρι να πατήσεις «Έξοδος» (απόφαση Πασχάλη 15/11): χωρίς ίντερνετ ΔΕΝ σε βγάζει έξω,
     περιμένει τη σύνδεση και ξαναδοκιμάζει (wait: τι δείχνει στο μεταξύ). Έξω μόνο αν η βάση πει ότι η συνεδρία δεν ισχύει. */
  async function mySession(wait) {
    for (let i = 1; ; i++) {
      const { data, error } = await sb.auth.getSession();
      if (!(data && data.session) && !netError(error)) return null;
      if (data && data.session) {
        /* η βάση επιβεβαιώνει ότι η συνεδρία ισχύει ακόμα (π.χ. «Έξοδος από όλες τις συσκευές» από αλλού) */
        const u = await sb.auth.getUser();
        if (!u.error) return data.session;
        if (!netError(u.error)) return null;
      }
      if (wait) wait();
      await online(Math.min(15000, 2000 * i));
    }
  }
  /* η βάση είπε ότι δεν είσαι πια μέσα (συνεδρία που έληξε/σβήστηκε, ανενεργός): έξοδος */
  let leaving = false;
  const out = async () => { if (!leaving) await org.logout(); return new Promise(() => {}); };
  /* όσο δουλεύει η εφαρμογή: αν η βάση δεν δεχτεί πια τη συνεδρία (σβήστηκε από αλλού), έξοδος */
  sb.auth.onAuthStateChange((ev, s) => {
    if (ev === 'SIGNED_OUT' && me && live && !leaving) out();
    if (ev === 'PASSWORD_RECOVERY' && s && s.user) recovered(s.user);
  });

  /* ---------- Σύνδεσμος «Ξέχασα τον κωδικό» από το email ----------
     Η σελίδα ανοίγει με #…type=recovery: η βάση δίνει συνεδρία για αυτόν τον χρήστη (PASSWORD_RECOVERY). Γίνεται ο
     συνδεδεμένος της συσκευής και η εφαρμογή ξανανοίγει ζητώντας νέο κωδικό πριν από οτιδήποτε άλλο.
     Σύνδεσμος που έληξε (#error=…): μήνυμα στην οθόνη εισόδου. */
  const HASH = new URLSearchParams(location.hash.slice(1));
  const RECOVERING = HASH.get('type') === 'recovery' && !!HASH.get('access_token');
  org.busy = RECOVERING;   // η οθόνη εισόδου δεν χρειάζεται: η σελίδα ξανανοίγει με τον χρήστη του συνδέσμου
  if (HASH.get('error_code') || HASH.get('error')) { org.notice = MSG.link; history.replaceState(null, '', location.href.split('#')[0]); }
  async function recovered(u) {
    const { data: p } = await sb.from('profiles').select('*').eq('id', u.id).maybeSingle();
    if (!p || !p.active) { await sb.auth.signOut({ scope: 'local' }); org.notice = MSG.inactive; location.replace(location.href.split('#')[0]); return; }
    if (me && me.uuid !== p.id && KEY) await STORE.del(KEY.state);   // ήταν άλλος συνδεδεμένος σε αυτή τη συσκευή
    ls.set(NS + ':me', p); ls.set(RECOVER, 1);
    location.replace(location.href.split('#')[0]);   // χωρίς το κλειδί στη διεύθυνση
  }

  /* ---------- Συγχρονισμός με τη βάση ---------- */
  /* Στέλνει όσα έμειναν χωρίς ίντερνετ. Αν στο μεταξύ το ίδιο έγγραφο άλλαξε από άλλη συσκευή πιο πρόσφατα,
     κρατάμε το πιο πρόσφατο (εκείνο) και το λέμε. false = δεν υπάρχει ακόμη ίντερνετ. */
  async function flush() {
    const jobs = Object.entries(OUT); if (!jobs.length) return true;
    const now = {};
    for (let i = 0; i < jobs.length; i += 50) {
      const r = await sb.from('docs').select('path,data,updated_at').eq('uid', me.uuid).in('path', jobs.slice(i, i + 50).map(([p]) => p)).order('path');
      if (r.error) { if (later(r.error)) return false; throw r.error; }
      r.data.forEach((x) => { now[x.path] = x; });
    }
    let sent = 0, newer = 0, refused = 0;
    for (const [path, job] of jobs) {
      if (OUT[path] !== job) continue;   // άλλαξε ξανά όσο στέλναμε: θα σταλεί η νεότερη
      const there = now[path];
      if (there && Date.parse(there.updated_at) > Date.parse(job.at)) {
        newer++; delete OUT[path]; setMine(path, there.data); tell(path); continue;
      }
      const error = await send(path, job.data);
      if (error && later(error)) { saveOut(); return false; }
      if (OUT[path] === job) delete OUT[path];
      if (error) { refused++; if (there) setMine(path, there.data); else { delete docsOf(me.uuid)[path]; bump(me.uuid); } tell(path); } else sent++;
    }
    saveOut(); saveSoon(); toldOff = false;
    if (sent) say(sent === 1 ? 'Στάλθηκε η αλλαγή που έκανες χωρίς ίντερνετ.' : 'Στάλθηκαν ' + sent + ' αλλαγές που έκανες χωρίς ίντερνετ.');
    if (newer) say(plural(newer, 'Μία αλλαγή σου', 'αλλαγές σου') + ' χωρίς ίντερνετ δεν στάλθηκε: στο μεταξύ το ίδιο άλλαξε πιο πρόσφατα από άλλη συσκευή.');
    if (refused) say('Η βάση δεν δέχτηκε ' + plural(refused, 'μία αλλαγή', 'αλλαγές') + ' που έκανες χωρίς ίντερνετ.');
    return true;
  }

  /* Φέρνει από τη βάση ό,τι άλλαξε μετά το since (όλα, την πρώτη φορά) και το περνά στη μνήμη.
     Έλεγχος: αν ο αριθμός των εγγράφων δεν συμφωνεί με τη βάση (κάτι σβήστηκε εντελώς, νέος πωλητής στην ομάδα…),
     ξαναφέρνει όλα όσα αφορά. Οι αλλαγές στα δικά μου έγγραφα φτάνουν στην εφαρμογή (tell). */
  const OVERLAP = 120e3;   // ξαναρωτάμε και τα 2 τελευταία λεπτά: αλλαγή που γράφτηκε τη στιγμή του προηγούμενου ερωτήματος δεν χάνεται
  const after = (t) => (t ? new Date(Date.parse(t) - OVERLAP).toISOString() : '');
  const since = (q, t) => (t ? q.gt('updated_at', after(t)) : q);
  /* βλέπω και άλλους πωλητές εκτός από μένα; (αλλιώς δεν υπάρχει τίποτα να φορτωθεί μετά) */
  const others = () => visible().some((x) => x.id !== me.id);
  let teamDone; const teamReady = new Promise((res) => { teamDone = res; });
  const latest = (list, t) => list.reduce((m, r) => (r.updated_at && r.updated_at > m ? r.updated_at : m), t || '');
  const total = () => Object.values(S.docs).reduce((n, o) => n + Object.keys(o).length, 0);
  /* withTeam: να φορτωθούν και οι πωλητές, αν δεν έχουν φορτωθεί (όχι στο πρώτο άνοιγμα, που περιμένει ο χρήστης) */
  async function pull(withTeam) {
    const first = !S.since && !total();
    const scope = (q) => (S.team ? q : q.eq('uid', me.uuid));   // πριν φορτωθούν οι πωλητές: μόνο τα δικά μου
    const [prof, teams, shared, nShared, docs, nDocs] = await Promise.all([
      rows('profiles', '*', (q) => q.order('demo_id')),
      rows('teams', 'id,name', (q) => q.order('id')),
      rows('shared_docs', 'path,data,updated_at', (q) => since(q, S.sinceShared).order('path')),
      countOf('shared_docs'),
      rows('docs', 'uid,path,data,updated_at', (q) => since(scope(q), S.since).order('updated_at').order('uid').order('path')),
      countOf('docs', scope),
    ]);
    /* εγώ: ανενεργός → έξω· άλλαξε ο ρόλος ή η ομάδα μου → ξανανοίγει η εφαρμογή με τα νέα (άλλες οθόνες, άλλοι πωλητές) */
    const mine = prof.find((p) => p.id === me.uuid);
    if (!mine || !mine.active) return out();
    const was = PROFILES.find((p) => p.id === me.uuid);
    PROFILES = prof; TEAMS = teams;
    Object.assign(me, toUser(mine)); ls.set(NS + ':me', mine);
    if (was && ['role', 'team', 'admin'].some((k) => (was[k] || null) !== (mine[k] || null))) { await saveNow(); location.reload(); return new Promise(() => {}); }
    place();
    const mineChanged = new Set();
    /* κοινά */
    const keepShared = Object.assign({}, S.shared);
    if (S.sinceShared && Object.keys(S.shared).length + shared.filter((r) => !(r.path in S.shared)).length !== nShared) {
      S.shared = {}; S.sinceShared = '';
      (await rows('shared_docs', 'path,data,updated_at', (q) => q.order('path'))).forEach((r) => { S.shared[r.path] = r.data; S.sinceShared = latest([r], S.sinceShared); });
    } else { shared.forEach((r) => { S.shared[r.path] = r.data; }); S.sinceShared = latest(shared, S.sinceShared); }
    new Set(Object.keys(keepShared).concat(Object.keys(S.shared))).forEach((p) => { if (JSON.stringify(keepShared[p]) !== JSON.stringify(S.shared[p])) { VER.shared++; mineChanged.add(p); } });
    /* έγγραφα (δικά μου και όσων πωλητών βλέπω) */
    const keepMine = Object.assign({}, S.docs[me.uuid] || {});
    docs.forEach((r) => {
      if (r.uid === me.uuid && OUT[r.path]) return;   // δική μου αλλαγή που περιμένει να σταλεί: την κρίνει το flush
      docsOf(r.uid)[r.path] = r.data; bump(r.uid);
    });
    S.since = latest(docs, S.since);
    if (!first && total() !== nDocs) {
      const all = await rows('docs', 'uid,path,data,updated_at', (q) => scope(q).order('uid').order('path'));
      S.docs = {}; S.since = latest(all, '');
      all.forEach((r) => { docsOf(r.uid)[r.path] = r.data; bump(r.uid); });
      Object.entries(OUT).forEach(([p, j]) => { docsOf(me.uuid)[p] = j.data; });
    }
    const nowMine = S.docs[me.uuid] || {};
    new Set(Object.keys(keepMine).concat(Object.keys(nowMine))).forEach((p) => { if (JSON.stringify(keepMine[p]) !== JSON.stringify(nowMine[p])) mineChanged.add(p); });
    if (!first) mineChanged.forEach(tell);
    if (!S.team && !others()) S.team = true;
    if (!S.team && withTeam) await loadTeam();
    await saveNow();
    if (S.team) teamDone();
  }
  /* Τα δεδομένα των πωλητών που βλέπω, όλα μαζί (μία φορά σε κάθε συσκευή· μετά έρχονται μόνο οι αλλαγές με το pull).
     Το since δεν προχωρά εδώ: το επόμενο pull ζητά από την ίδια ώρα για όλους, ώστε να μη χαθεί καμία δική μου αλλαγή. */
  async function loadTeam() {
    const L = await rows('docs', 'uid,path,data,updated_at', (q) => q.neq('uid', me.uuid).order('uid').order('path'));
    L.forEach((r) => { docsOf(r.uid)[r.path] = r.data; bump(r.uid); });
    S.team = true;
  }

  /* ένας συγχρονισμός τη φορά· όποιος ζητηθεί στο μεταξύ γίνεται αμέσως μετά. live: μόνο αφού η βάση επιβεβαιώσει τη συνεδρία */
  let live = false, syncing = null, again = false, lastSync = 0, retryT = 0;
  function sync() {
    if (!live) return Promise.resolve();
    if (syncing) { again = true; return syncing; }
    syncing = (async () => {
      try { if (await flush()) { await pull(true); lastSync = Date.now(); } else retry(); }
      catch (e) { if (!later(e)) console.error(e); retry(); }
      finally { syncing = null; if (again) { again = false; sync(); } }
    })();
    return syncing;
  }
  /* χωρίς ίντερνετ: ξαναδοκιμάζει μόλις έρθει σύνδεση (ή σε 30″, αν ο browser δεν το πει) */
  function retry() { if (retryT) return; retryT = setTimeout(() => { retryT = 0; sync(); }, 30000); }
  addEventListener('online', () => { clearTimeout(retryT); retryT = 0; sync(); });
  /* η εφαρμογή ξαναφαίνεται (π.χ. ξεκλείδωσε το κινητό): ό,τι άλλαξε στο μεταξύ, αν πέρασε μισό λεπτό */
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastSync > 30000) sync(); });

  /* ---------- Ζωντανά, όσο είναι ανοιχτή ---------- */
  function startLive() {
    live = true;
    /* οι δικές μου αλλαγές από άλλη συσκευή (π.χ. το τάμπλετ), αμέσως */
    sb.channel('docs-' + me.uuid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'docs', filter: 'uid=eq.' + me.uuid }, (ev) => {
        const r = ev.eventType === 'DELETE' ? ev.old : ev.new; if (!r || !r.path || OUT[r.path]) return;
        if (ev.eventType === 'DELETE') { delete docsOf(me.uuid)[r.path]; bump(me.uuid); } else setMine(r.path, r.data === undefined ? null : r.data);
        saveSoon(); tell(r.path);
      })
      .subscribe();
    if (me.admin) adminData();
  }
  /* διαχειριστής: χρήση, πελάτες ανά πωλητή, κατάσταση λογαριασμών — μετά το άνοιγμα, όχι πριν. Οι οθόνες τους
     ενημερώνονται μόλις φτάσουν (usage.onChange). */
  const changed = (x) => usageListeners.forEach((f) => { try { f(x || null); } catch (e) { console.error(e); } });
  function adminData() {
    rows('usage', 'uid,d,data', (q) => q.order('d').order('uid')).then((L) => { USAGE = L.map(toUse); changed(); }, () => {});
    /* ζωντανά: κάθε αλλαγή στη χρήση ενός χρήστη (κάθε λεπτό όσο έχει την εφαρμογή ανοιχτή) */
    sb.channel('usage-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usage' }, (ev) => {
        const r = ev.new; if (!r || !r.uid) return;
        const x = toUse(r), i = USAGE.findIndex((z) => z.u === x.u && z.d === x.d);
        if (i >= 0) USAGE[i] = x; else USAGE.push(x);
        changed(x);
      })
      .subscribe();
    sb.rpc('client_counts').then(({ data }) => { (data || []).forEach((r) => { COUNTS[r.owner] = +r.n; }); changed(); }, () => {});
    accounts.refresh().then(() => changed(), () => {});   // χωρίς κατάσταση λογαριασμών η εφαρμογή δουλεύει κανονικά
  }

  /* ---------- Σφάλματα (απόφαση 18/11, Β11) ----------
     Ό,τι «σκάσει» στη συσκευή γράφεται στη βάση (πίνακας app_errors), για να το δει ο διαχειριστής χωρίς να περιμένει να του
     το πει ο πωλητής. Μόνο τι και πού: μήνυμα, αρχείο/γραμμή, σελίδα, έκδοση, συσκευή — όχι στοιχεία πελατών. Έως 10 ανά
     άνοιγμα, το ίδιο μία φορά· τα λάθη δικτύου (χωρίς ίντερνετ) δεν μετράνε. Η βάση δέχεται έως 30 την ώρα ανά χρήστη. */
  const ERR = { seen: new Set(), max: 10, ver: '' };
  const NET = /Failed to fetch|NetworkError|Load failed|network connection/i;
  if (window.caches) caches.keys().then((k) => { const v = k.find((x) => x.startsWith('sales2-app-')); ERR.ver = v ? v.slice(11) : ''; }, () => {});
  function report(msg, src, line) {
    const m = String(msg || '').trim().replace(/^Uncaught (\w*Error: )?/, '').slice(0, 300);   // ίδιο κείμενο από όποιον browser
    if (!me || !m || NET.test(m) || !navigator.onLine || ERR.seen.size >= ERR.max) return;
    const where = String(src || '').replace(location.origin, '').split('?')[0].slice(0, 200), key = m + '|' + where + '|' + (line || '');
    if (ERR.seen.has(key)) return; ERR.seen.add(key);
    const cur = PL.nav && PL.nav.current ? PL.nav.current() : null;
    sb.from('app_errors').insert({ page: String((cur && cur.id) || '').slice(0, 60), msg: m, src: where, line: +line || null, ver: ERR.ver, ua: navigator.userAgent.slice(0, 160) }).then(() => {}, () => {});
  }
  addEventListener('error', (e) => { if (e.message) report(e.message, e.filename, e.lineno); });
  addEventListener('unhandledrejection', (e) => { const r = e.reason;
    const at = r && r.stack ? (String(r.stack).split('\n').find((l) => /https?:\/\//.test(l)) || '') : '', m = at.match(/(https?:\/\/[^\s)]+?):(\d+):\d+/);
    report(r && (r.message || String(r)), m ? m[1] : '', m ? m[2] : null); });
  /* διαχειριστής: τα πιο πρόσφατα (έως 500), με το όνομα του χρήστη */
  org.errors = {
    async list() {
      if (!me || !me.admin) return [];
      const { data, error } = await sb.from('app_errors').select('id,at,uid,page,msg,src,line,ver,ua').order('at', { ascending: false }).limit(500);
      if (error) throw new Error(netError(error) ? MSG.net : MSG.server);
      return (data || []).map((r) => { const p = PROFILES.find((z) => z.id === r.uid); return Object.assign({}, r, { who: p ? p.name : '—', user: p ? p.demo_id : '' }); });
    },
  };

  /* Ιστορικό αλλαγών (απόφαση 18/11, Β9): κάθε αλλαγή εγγράφου τη γράφει η ίδια η βάση (doc_history). Διαχειριστής: οι πιο
     πρόσφατες (έως 400), με τα ονόματα (ποιανού το έγγραφο, ποιος το άλλαξε)· χωρίς το «πριν», για να έρχονται γρήγορα. */
  org.history = {
    async list() {
      if (!me || !me.admin) return [];
      const { data, error } = await sb.from('doc_history').select('id,at,uid,by,path,op').order('at', { ascending: false }).limit(400);
      if (error) throw new Error(netError(error) ? MSG.net : MSG.server);
      const P = (id) => PROFILES.find((z) => z.id === id);
      return (data || []).map((r) => { const o = P(r.uid), b = P(r.by);
        return Object.assign({}, r, { who: o ? o.name : '—', user: o ? o.demo_id : '', byName: b ? b.name : r.by ? '—' : 'σύστημα' }); });
    },
  };

  /* Ειδοποιήσεις με κλειστή εφαρμογή (απόφαση 19/11, Β5). Η συσκευή γράφεται στο push_subs· η εφαρμογή στέλνει στη βάση τις
     επόμενες υπενθυμίσεις του χρήστη (set_reminders) και τις στέλνει η ίδια η βάση την ώρα τους (εργασία push-send, κάθε λεπτό).
     Η οθόνη και ο συγχρονισμός είναι στο lab/push/push.js· εδώ μόνο η μεταφορά. */
  const fail = (error) => new Error(netError(error) ? MSG.net : MSG.server);
  org.push = {
    /* το δημόσιο κλειδί του server (null αν δεν έχει φτιαχτεί ακόμη: φτιάχνεται μόνο του μέσα σε ένα λεπτό) */
    async publicKey() { const { data, error } = await sb.rpc('push_public_key'); if (error) throw fail(error); return data || null; },
    /* η συσκευή (PushSubscription) στον χρήστη μου· false αν ανήκει ήδη σε άλλον χρήστη (τότε η σελίδα φτιάχνει νέα) */
    async save(sub) {
      const j = sub.toJSON(), row = { endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, ua: navigator.userAgent.slice(0, 160) };
      const { error } = await sb.from('push_subs').upsert(row, { onConflict: 'endpoint' });
      if (!error) return true;
      if (netError(error)) throw fail(error);
      return false;
    },
    async remove(endpoint) { const { error } = await sb.from('push_subs').delete().eq('endpoint', endpoint); if (error) throw fail(error); },
    /* όλες οι επόμενες υπενθυμίσεις μου [{key, at (ISO), title, body, url}]· όσες λείπουν σβήνονται */
    async setReminders(items) { const { error } = await sb.rpc('set_reminders', { items }); if (error) throw fail(error); },
    /* δοκιμαστική ειδοποίηση τώρα· { sent } ή { error: μήνυμα } */
    async test() {
      let r; try { r = await api.pushTest(); } catch (e) { return { error: MSG.net }; }
      if (r.error === 'nosub') return { error: 'Αυτή η συσκευή δεν έχει γραφτεί ακόμη για ειδοποιήσεις.' };
      if (r.error) return { error: msg(r.error) };
      return { sent: r.sent, failed: r.failed };
    },
    /* στην «Έξοδο»: η συσκευή παύει να δέχεται τις ειδοποιήσεις αυτού του χρήστη (ακόμη και χωρίς ίντερνετ: η διεύθυνσή της
       καταργείται και η βάση τη σβήνει μόνη της στην επόμενη αποστολή) */
    async forget() {
      const reg = navigator.serviceWorker ? await navigator.serviceWorker.getRegistration().catch(() => null) : null;
      const sub = reg && reg.pushManager ? await reg.pushManager.getSubscription().catch(() => null) : null;
      if (!sub) return;
      await sb.from('push_subs').delete().eq('endpoint', sub.endpoint).then(() => {}, () => {});
      await sub.unsubscribe().catch(() => {});
    },
  };

  /* ---------- Άνοιγμα ---------- */
  /* Με μνήμη στη συσκευή: η εφαρμογή ανοίγει αμέσως από αυτήν (και χωρίς ίντερνετ)· μετά, στο παρασκήνιο, ελέγχει τη συνεδρία,
     στέλνει ό,τι έμεινε και φέρνει μόνο τις αλλαγές. Πρώτη φορά σε αυτή τη συσκευή: φέρνει όλα όσα αφορούν τον χρήστη από τη βάση.
     Η εφαρμογή ξεκινά όταν τελειώσει το PL_BOOT (db.html)· το org.ready όταν η βάση επιβεβαιώσει τη συνεδρία (π.χ. me.mustChange). */
  let confirmed; const ready = new Promise((res) => { confirmed = res; });
  async function check(wait) {
    const session = await mySession(wait);
    if (!session || session.user.id !== me.uuid) return out();
    me.mustReason = ls.get(RECOVER) ? 'reset' : session.user.app_metadata && session.user.app_metadata.must_change ? 'temp' : '';
    me.mustChange = !!me.mustReason;
    return session;
  }
  function use(st) {
    S = st; PROFILES = S.profiles; TEAMS = S.teams;
    if (S.team === undefined) S.team = true;   // μνήμη από πριν τις 18/11: είχε φορτώσει όλους
    if (S.team || !others()) teamDone();
    Object.entries(OUT).forEach(([p, j]) => { docsOf(me.uuid)[p] = j.data; });   // όσα δεν είχαν σταλεί
    const mine = PROFILES.find((p) => p.id === me.uuid); if (mine) Object.assign(me, toUser(mine));
    place();
    window.PL_LOCAL.seed = merged(me.uuid);
  }
  window.PL_BOOT = (async () => {
    if (RECOVERING) { const app = document.getElementById('app'); if (app) app.textContent = 'Ανοίγω τον σύνδεσμο…'; return new Promise(() => {}); }   // ξανανοίγει μόνη της (recovered)
    if (!me) return;
    const [st, kept] = await Promise.all([STORE.get(KEY.state), STORE.get(KEY.out)]);
    OUT = kept || {};
    if (st && st.v === V && st.profiles && st.profiles.some((p) => p.id === me.uuid)) {
      use(st);
      check().then(() => { confirmed(); startLive(); sync(); });
      return;
    }
    await check(() => { const app = document.getElementById('app'); if (app) app.textContent = 'Δεν υπάρχει ίντερνετ. Μόλις έρθει σύνδεση, η εφαρμογή ανοίγει μόνη της…'; });
    for (let i = 1; ; i++) {   // πρώτη φορά: χωρίς τα δεδομένα δεν ανοίγει, οπότε περιμένει το ίντερνετ
      try { S = blank(); await pull(); break; } catch (e) { if (!offline(e)) throw e; await online(Math.min(15000, 2000 * i)); }
    }
    use(S); confirmed(); startLive();
    if (Object.keys(OUT).length || !S.team) sync();   // οι πωλητές (αν βλέπω) έρχονται τώρα, με την εφαρμογή ανοιχτή
  })();
  org.ready = ready;
  /* τα δεδομένα των πωλητών (οθόνες ομάδας, Διαχείριση): teamLoaded() τώρα, teamReady όταν φτάσουν */
  org.teamLoaded = () => !me || !!S.team || !others();
  org.teamReady = teamReady;   // για όσα θέλουν τα στοιχεία από τη βάση (π.χ. me.mustChange)
})();
