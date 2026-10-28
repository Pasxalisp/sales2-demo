/* ΠΡΟΣΑΡΜΟΓΕΑΣ — το ΜΟΝΟ σημείο που μιλάει με βάση, Claude, αρχεία και χρήστη.
   Όλο το υπόλοιπο πρόγραμμα καλεί PL.adapter.* και δεν ξέρει πού ζουν τα δεδομένα.
   Σήμερα: claude.ai (db / sample / downloads / user). Αύριο: αλλάζει μόνο αυτό το αρχείο
   (π.χ. Supabase + δικό μας server για το Claude). Αν δεν υπάρχει claude.ai → τοπική μνήμη (δοκιμές).
   Δοκιμαστική έκδοση σε δική της σελίδα: το js/demo-seed.js ορίζει window.PL_LOCAL = {key, seed:{path: doc}}.
   Τότε η τοπική μνήμη ξεκινά από τα ψεύτικα δεδομένα και οι αλλαγές του χρήστη φυλάγονται στη συσκευή (localStorage). */
(function () {
  const PL = (window.PL = window.PL || {});
  let db = null, user = null, sample = null, dl = null, uid = null, mode = 'local';
  const mem = new Map();            // path -> object   (μόνο για τοπική λειτουργία)
  const memWatch = new Set();       // {col, cb}

  const parts = (p) => p.split('/');
  const colOf = (p) => parts(p).slice(0, -1).join('/');
  const snapDocs = (s) => s.docs.map((d) => Object.assign({ id: d.id }, d.data()));

  /* Τοπική έκδοση με αποθήκευση: κρατάμε μόνο τις αλλαγές πάνω από τα ψεύτικα δεδομένα (path -> doc | null). */
  const LOCAL = window.PL_LOCAL || null;
  let over = {};
  const loadLocal = () => {
    Object.entries(LOCAL.seed || {}).forEach(([p, v]) => mem.set(p, v));
    try { over = JSON.parse(localStorage.getItem(LOCAL.key) || '{}') || {}; } catch (e) { over = {}; }
    Object.entries(over).forEach(([p, v]) => { if (v === null) mem.delete(p); else mem.set(p, v); });
  };
  const keep = (path) => {
    if (!LOCAL) return;
    over[path] = mem.has(path) ? mem.get(path) : null;
    try { localStorage.setItem(LOCAL.key, JSON.stringify(over)); } catch (e) { /* γεμάτη ή κλειστή μνήμη: μένει μόνο για αυτή τη συνεδρία */ }
  };

  const memList = (col) => [...mem.entries()]
    .filter(([p]) => colOf(p) === col)
    .map(([p, v]) => Object.assign({ id: parts(p).pop() }, v));
  const memChanged = (path) => { keep(path); memWatch.forEach((w) => { if (w.col === colOf(path)) w.cb(memList(w.col)); }); };

  const ready = (async () => {
    try {
      if (window.claude && claude.use) {
        db = await claude.use('db');
        user = await claude.use('user');
        sample = await claude.use('sample');
        dl = await claude.use('downloads');
        uid = user ? await user.id() : null;
      }
    } catch (e) { /* μένει τοπικά */ }
    mode = db ? 'cloud' : 'local';
    if (!db && LOCAL) loadLocal();
    PL.bus && PL.bus.emit('adapter', mode);
    return mode;
  })();

  PL.adapter = {
    ready,
    mode: () => mode,
    userId: () => uid,
    isAdmin: async () => (user ? !!(await user.isOwner()) : false),

    db: {
      async get(path) {
        if (!db) return mem.has(path) ? mem.get(path) : null;
        const s = await db.doc(path).get();
        return s.exists ? s.data() : null;
      },
      async set(path, obj) {
        if (!db) { mem.set(path, JSON.parse(JSON.stringify(obj))); memChanged(path); return; }
        await db.doc(path).set(obj);
      },
      async merge(path, obj) {
        if (!db) { mem.set(path, Object.assign({}, mem.get(path) || {}, obj)); memChanged(path); return; }
        await db.doc(path).update(obj);
      },
      async remove(path) {
        if (!db) { mem.delete(path); memChanged(path); return; }
        await db.doc(path).delete();
      },
      async list(col) {
        if (!db) return memList(col);
        return snapDocs(await db.collection(col).get());
      },
      /* Συνδρομή: μία φορά ανά συλλογή, επιστρέφει συνάρτηση διακοπής. */
      watch(col, cb, err) {
        if (!db) { const w = { col, cb }; memWatch.add(w); cb(memList(col)); return () => memWatch.delete(w); }
        return db.collection(col).onSnapshot((s) => cb(snapDocs(s)), err || (() => {}));
      },
      /* Εξαγωγή / εισαγωγή όλης της βάσης ως ένα αρχείο (όπως το dedomena.json) — προστίθεται στο βήμα 2. */
    },

    ai: {
      available: () => !!sample,
      async ask(input, opts) {
        if (!sample) throw { code: 'not_granted', message: 'Το Claude δεν είναι διαθέσιμο εδώ.' };
        return sample(input, opts);
      },
      async json(input, opts) {
        if (!sample) throw { code: 'not_granted', message: 'Το Claude δεν είναι διαθέσιμο εδώ.' };
        return sample.json(input, opts);
      },
      limits: async () => (sample && sample.limits ? sample.limits() : null),
    },

    /* Λήψη αρχείου: στο claude.ai μέσω downloads· σε δική μας σελίδα με απλή λήψη του browser. */
    files: {
      available: () => !!dl || mode === 'local',
      async save(filename, data) {
        if (dl) return dl.save({ filename, data });
        if (mode !== 'local') throw { code: 'not_granted', message: 'Η λήψη αρχείων δεν είναι διαθέσιμη εδώ.' };
        const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data]));
        const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
    },
  };
})();
