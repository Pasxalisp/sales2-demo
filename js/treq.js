/* ΑΙΤΗΜΑΤΑ ΕΠΙΣΚΕΨΗΣ ΤΕΧΝΙΚΟΥ (απόφαση Πασχάλη 27/11/2026, «προφίλ τεχνικού»). Το μόνο σημείο που γράφει αιτήματα.
   Ροή: ο πωλητής βάζει πελάτη στη λίστα «Τεχνική υποστήριξη» (tech/{πελάτης}) και γράφει σημείωμα· όσο δεν έχει σταλεί ο τεχνικός
   δεν βλέπει τίποτα. «Ολοκληρώθηκε – Στείλε στον τεχνικό» → νέο αίτημα treq/{id} στον συνεργαζόμενο τεχνικό (settings/techmate).
   Ο τεχνικός: Αποδοχή → Ραντεβού (μέρα/ώρα) / Αναβολή → Ολοκληρώθηκε με υποχρεωτική αναφορά. Ο πωλητής βλέπει κάθε βήμα.
   treq/{id} = {sid, sname, tid, tname, cid, st, sent, note, c: στοιχεία πελάτη ΧΩΡΙΣ ποσά (snap), appt 'ΕΕΕΕ-ΜΜ-ΗΗTΩΩ:ΛΛ',
   rep: {t, at}, log: [{st, at, by}], upd, by}. Τι επιτρέπεται σε ποιον το ελέγχει ο server (lab/team/session.js treqOk, βάση).
   Χωρίς λογαριασμούς (Sales 2.0 στο claude.ai) δεν υπάρχει τεχνικός: PL.treq.on() = false και οι σελίδες δείχνουν τη λίστα όπως πριν. */
(function () {
  const PL = window.PL, u = PL.u, S = PL.store, esc = u.esc, db = () => PL.adapter.db;
  const org = () => PL.adapter.org, me = () => { const o = org(); return (o && o.me) || null; };
  const ST = { new: 'Νέο', acc: 'Το είδε', appt: 'Ραντεβού', post: 'Αναβολή', done: 'Ολοκληρώθηκε', cancel: 'Ακυρώθηκε' };
  /* κατηγορίες που βλέπει ο τεχνικός: μόνο αν δουλεύει (φέτος) / δούλευε (πέρσι) — ΚΑΝΕΝΑ ποσό */
  const CATS = [['Topchic', 'Topchic'], ['Colorance', 'Colorance'], ['Silklift', 'Silklift'], ['Elumen', 'Elumen'], ['Subbrand', 'Subbrand'], ['DS', 'Dualsenses'], ['SS', 'Styling'], ['Kerasilk', 'Kerasilk']];
  const DAYS = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];
  /* ώρα με δευτερόλεπτα: για τη σειρά των βημάτων και το «τι άλλαξε από τότε που το είδες» (δύο βήματα στο ίδιο λεπτό) */
  const nowIso = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return u.today() + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); };
  const all = () => S.all('treq');

  /* «Τρι 2/12, 11:00» */
  const when = (a) => { if (!a) return ''; const [d, t] = a.split('T'), x = new Date(d + 'T12:00'); return DAYS[x.getDay()] + ' ' + d.slice(8).replace(/^0/, '') + '/' + d.slice(5, 7).replace(/^0/, '') + (t ? ', ' + t : ''); };
  /* στοιχεία πελάτη για τον τεχνικό τη στιγμή της αποστολής (ίδιος κανόνας με το demo/tech_seed.py) */
  function snap(cid) {
    const c = PL.model.byId(cid) || {}, k = (S.get('cats', 'all') || {})[cid] || {}, cats = {};
    CATS.forEach(([key, l]) => { const v = k[key]; if (v) cats[l] = [(+v[1] || 0) > 0 ? 1 : 0, (+v[2] || 0) > 0 ? 1 : 0]; });
    return { name: c.name || '', code: c.code || '', addr: c.addr || '', city: c.city || '', area: c.area || '', zip: c.zip || '', t1: c.t1 || '', t2: c.t2 || '', cats };
  }
  const put = async (id, r) => { await db().set('treq/' + id, r); S.put('treq', id, r); return r; };
  const step = (r, st, extra) => { const at = nowIso(), by = me().id; return Object.assign({}, r, extra || {}, { st, upd: at, by, log: (r.log || []).concat([{ st, at, by }]) }); };

  PL.treq = {
    ST, CATS, when,
    /* υπάρχει τεχνικός μόνο όταν ο server τον υποστηρίζει (λογαριασμοί + org.techs: demo· η βάση μόλις αποκτήσει τους κανόνες) */
    on: () => !!me() && typeof org().techs === 'function',
    isTech: () => !!me() && me().role === 'tech',
    /* ο συνεργαζόμενος τεχνικός του πωλητή: {id, name} ή null */
    mate() {
      const o = org(), s = S.get('settings', 'techmate'), L = (o && o.techs) ? o.techs() : [];
      return (s && L.find((x) => x.id === s.tid)) || null;
    },
    techs: () => { const o = org(); return o && o.techs ? o.techs() : []; },
    async setMate(tid) { const d = { tid }; await db().set('settings/techmate', d); S.put('settings', 'techmate', d); },
    get: (id) => all()[id] || null,
    /* όλα [id, αίτημα], πιο πρόσφατα πρώτα */
    list: () => Object.entries(all()).sort((a, b) => ((b[1].upd || b[1].sent || '') > (a[1].upd || a[1].sent || '') ? 1 : -1)),
    /* το τελευταίο αίτημα ενός πελάτη (για τη λίστα του πωλητή και την καρτέλα) */
    ofClient: (cid) => PL.treq.list().filter(([, r]) => r.cid === cid),
    open: (r) => !!r && r.st !== 'done' && r.st !== 'cancel',
    /* μία φράση για την κατάσταση: «📅 Τρι 2/12, 11:00», «Αναβολή», «✓ 24/11» */
    label(r) {
      if (!r) return '';
      if (r.st === 'appt') return '📅 ' + when(r.appt);
      if (r.st === 'done') return '✓ ' + u.fd(((r.rep && r.rep.at) || r.upd || '').slice(0, 10)).slice(0, 5);
      if (r.st === 'new') return PL.treq.isTech() ? 'Νέο' : 'Στάλθηκε ' + u.fd(r.sent).slice(0, 5);
      return ST[r.st] || r.st;
    },
    cls: (r) => (!r ? '' : r.st === 'appt' || r.st === 'acc' ? 'ap' : r.st === 'post' || r.st === 'cancel' ? 'pp' : r.st === 'done' ? 'ok' : ''),
    /* πρόοδος: Στάλθηκε → Το είδε → Ραντεβού → Ολοκλήρωση (πόσα έγιναν) */
    stage: (r) => (!r ? 0 : { new: 1, acc: 2, post: 2, appt: 3, done: 4, cancel: 1 }[r.st] || 1),
    steps(r) {
      const n = PL.treq.stage(r);
      return `<div class="trst"><i class="${n > 0 ? 'd' : ''}"></i><i class="${n > 1 ? 'd' : ''}"></i><i class="${n > 2 ? 'd' : ''}"></i><i class="${n > 3 ? 'd' : ''}"></i></div>` +
        '<div class="trsl"><span>Στάλθηκε</span><span>Το είδε</span><span>Ραντεβού</span><span>Ολοκλήρωση</span></div>';
    },
    /* κατηγορίες ✓ φέτος / ✓ πέρσι */
    catsTable(c) {
      const L = Object.entries((c && c.cats) || {}); if (!L.length) return '<p class="mu">Δεν υπάρχουν στοιχεία κατηγοριών.</p>';
      const ck = (v) => (v ? '<b class="up">✓</b>' : '<span class="mu">—</span>');
      return '<table class="trcat"><tr><th></th><th>Φέτος</th><th>Πέρσι</th></tr>' + L.map(([k, [y, l]]) => `<tr><td>${esc(k)}${!y && l ? ' <span class="trlost">σταμάτησε</span>' : ''}</td><td>${ck(y)}</td><td>${ck(l)}</td></tr>`).join('') + '</table>';
    },

    /* ---- πωλητής ---- */
    async send(cid, note) {
      const m = PL.treq.mate(); if (!m) throw new Error('Διάλεξε πρώτα συνεργαζόμενο τεχνικό στις Ρυθμίσεις.');
      const id = 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36), at = nowIso(), my = me();
      const r = { sid: my.id, sname: my.name, tid: m.id, tname: m.name, cid, st: 'new', sent: u.today(), note: note || '', c: snap(cid), log: [{ st: 'new', at, by: my.id }], upd: at, by: my.id };
      await put(id, r);
      const t = Object.assign({}, S.get('tech', cid) || { d: u.today() }, { note: note || '', rid: id });
      await db().set('tech/' + cid, t); S.put('tech', cid, t);
      return id;
    },
    cancel: async (id) => put(id, step(PL.treq.get(id), 'cancel')),

    /* ---- τεχνικός ---- */
    accept: async (id) => put(id, step(PL.treq.get(id), 'acc')),
    appoint: async (id, d, t) => { if (!d) throw new Error('Διάλεξε μέρα.'); return put(id, step(PL.treq.get(id), 'appt', { appt: d + 'T' + (t || '10:00') })); },
    postpone: async (id) => put(id, step(PL.treq.get(id), 'post')),
    async finish(id, text) {
      const t = String(text || '').trim(); if (!t) throw new Error('Γράψε πρώτα τι έγινε στην επίσκεψη.');
      return put(id, step(PL.treq.get(id), 'done', { rep: { t, at: nowIso() } }));
    },

    /* ---- ειδοποιήσεις μέσα στην εφαρμογή: ό,τι άλλαξε ο ΑΛΛΟΣ από την τελευταία φορά που είδες τη λίστα ---- */
    seenKey: () => 'pl.treqSeen.' + ((me() || {}).id || ''),
    seen() { try { return localStorage.getItem(PL.treq.seenKey()) || ''; } catch (e) { return ''; } },
    markSeen() { try { localStorage.setItem(PL.treq.seenKey(), nowIso()); } catch (e) { /* τίποτα */ } PL.treq.badge(); },
    fresh() { const my = me(); if (!my) return []; const s = PL.treq.seen(); return PL.treq.list().filter(([, r]) => r.by && r.by !== my.id && (r.upd || '') > s); },
    /* σήμα στη μπάρα: τεχνικός στα «Αιτήματα», πωλητής στις «Ενέργειες» */
    badge() { if (!PL.treq.on()) return; PL.bar.setBadge(PL.treq.fresh().length, PL.treq.isTech() ? 'treqs' : 'tech'); },
    /* ρυθμίσεις ειδοποιήσεων (settings/tnotify· τις χρησιμοποιεί και η αποστολή στο κινητό με βάση) */
    NOTIFY: { sales: [['acc', 'το δει'], ['appt', 'κλείσει ραντεβού'], ['post', 'αναβάλει'], ['done', 'ολοκληρώσει (με την αναφορά)']], tech: [['new', 'μου στέλνουν νέο αίτημα'], ['cancel', 'ο πωλητής ακυρώνει αίτημα'], ['soon', 'πλησιάζει ραντεβού (1 ώρα πριν)']] },
    notifyOn: (k) => { const s = S.get('settings', 'tnotify') || {}; return s[k] !== false; },
    async setNotify(k, on) { const d = Object.assign({}, S.get('settings', 'tnotify') || {}, { [k]: !!on }); await db().set('settings/tnotify', d); S.put('settings', 'tnotify', d); },
    /* μήνυμα για ό,τι άλλαξε ο άλλος: «🧰 Στέλιος: Ραντεβού Τρι 2/12, 11:00 · ΒΑΣΙΛΕΙΑΔΟΥ» */
    say(r) {
      const who = PL.treq.isTech() ? (r.sname || 'Πωλητής') : (r.tname || 'Τεχνικός'), first = who.split(' ')[0];
      const what = r.st === 'appt' ? 'ραντεβού ' + when(r.appt) : r.st === 'new' ? 'νέο αίτημα' : r.st === 'acc' ? 'το είδε' : r.st === 'done' ? 'ολοκληρώθηκε' : (ST[r.st] || '').toLowerCase();
      return '🧰 ' + first + ': ' + what + ' · ' + ((r.c && r.c.name) || '');
    },
  };

  /* Μία φορά στην εκκίνηση και σε κάθε αλλαγή: σήμα στη μπάρα και μήνυμα για ό,τι άλλαξε ο άλλος (μόνο όσα θέλει στις Ρυθμίσεις) */
  let told = '';
  function watch() {
    if (!PL.treq.on()) return;
    S.use('settings'); S.use('treq').then(() => {
      const tell = () => {
        PL.treq.badge();
        const L = PL.treq.fresh().filter(([, r]) => PL.treq.notifyOn(r.st)), top = L[0];
        if (!top || (top[1].upd || '') <= told) return;
        told = top[1].upd || ''; PL.dlg.toast(PL.treq.say(top[1]) + (L.length > 1 ? ' (+' + (L.length - 1) + ')' : ''));
      };
      tell(); S.on('treq', tell);
    });
  }
  PL.bus.on('started', watch);
})();
