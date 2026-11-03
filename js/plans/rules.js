/* Σημειώσεις προγράμματος («Γιατί πας» / «Τι να πεις»).
   Ποιοι πελάτες μπαίνουν το αποφασίζει η μηχανή (engine.js). Τις σημειώσεις τις γράφουν ΚΑΝΟΝΕΣ πάνω στα πραγματικά
   στοιχεία (χρέος, συμφωνία, Goldwell, κατηγορίες, είδη, «Να πω», καμπάνιες), άμεσα και χωρίς σύνδεση.
   Όπου υπάρχει Claude (claude.ai), γράφει εκείνο πιο πλούσια κείμενα (ai.js)· αν δεν απαντήσει, μένουν οι κανόνες.
   E.generate(πόλεις, πελάτες, ctx, onProgress) → {stops, note} · E.suggestOne(πελάτης) → {why, say}. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, E = PL.plans, eur = u.eur;
  /* σειρά κατηγοριών για «πρότεινε»: η πρώτη που δεν παίρνει */
  const NEXT = ['Topchic', 'Colorance', 'Silklift', 'Subbrand', 'DS', 'Elumen', 'SS'];
  const lbl = (k) => M.CATL[k] || k;
  /* ομάδες ειδών που δεν είναι προϊόν για πρόταση (σακούλες, δείγματα, μεταφορικά) */
  const SKIP = new Set(['Goldwell αξεσουάρ & δείγματα', 'Αναλώσιμα', 'Άλλα']);

  /* κατηγορίες: {k, a: πέρσι ίδια περίοδο, b: φέτος, f: πέρσι όλο} */
  const cats = (id) => { const d = M.catAll()[id] || {}; return M.CATN.filter((k) => Array.isArray(d[k])).map((k) => { const [a, b, f] = d[k].map((x) => +x || 0); return { k, a, b, f }; }); };

  /* ctx (προαιρετικό): zset = πελάτες χωρίς τζίρο του προγράμματος, touch/recentTouch = πρόσφατη επαφή (E.candidates) */
  E.ruleNote = (c, ctx) => {
    ctx = ctx || {}; const id = c.i, t = u.today(), why = [], say = [];
    const sos = !!S.get('sos', id), b = E.owB(id), owes = E.owes(id), dl = M.dealsAll()[id], di = dl && dl.goal ? M.deal(dl) : null;
    const tc = S.get('tech', id), nx = M.nextOf(id), y = M.yoy(c), C = cats(id), zero = !(M.tz(c) > 0);
    const todo = (M.entries(id)[0] || {}).todo;   /* «Να πω» μόνο από την τελευταία καταγραφή (οι παλιότερες μπορεί να έγιναν) */

    /* ---- Γιατί πας: οι δύο πρώτοι λόγοι κατά σειρά σημασίας ---- */
    if (sos) why.push('Τον σημείωσες SOS');
    if (owes) why.push('Χρωστάει ' + eur(b.a) + (b.o >= 1 ? ' (ληξιπρόθεσμα ' + eur(b.o) + ')' : '') + (b.x > 0 ? ' · διαμαρτυρημένα' : ''));
    if (di && !di.done) why.push('Συμφωνία ' + eur(dl.goal) + ': στο ' + Math.round(di.pct) + '%' + (di.ahead < 0 ? ', πίσω από τον ρυθμό' : ''));
    if (nx && nx <= t) why.push('Είχες σημειώσει επόμενη επαφή ' + u.fd(nx));
    if (tc) why.push('Περιμένει τεχνικό');
    if (c.prospect) why.push('Νέος πελάτης, όχι ακόμα στο orders');
    else if (ctx.recentTouch && ctx.recentTouch.has(id)) why.push('Χωρίς αγορές, αλλά τον είδες στις ' + u.fd(ctx.touch[id]));
    else if (zero) why.push('Χωρίς αγορές φέτος');
    if (y && y.ly > 0 && y.ty > 0) why.push('Goldwell φέτος ' + eur(y.ty) + ' έναντι ' + eur(y.ly) + ' πέρσι (' + y.txt.replace(/^[▲▼] /, '') + ')');
    else if (y && y.ly <= 0) why.push('Goldwell φέτος ' + eur(y.ty) + ', πέρσι τίποτα');
    else if (y && y.ty <= 0) why.push('Goldwell φέτος τίποτα, πέρσι ίδια περίοδο ' + eur(y.ly));
    if (!why.length) why.push('Τζίρος φέτος ' + eur(M.tz(c)));

    /* ---- Τι να πεις: έως τέσσερα σημεία ---- */
    if (todo) say.push('Να πω: ' + todo);
    if (owes) say.push('Ζήτα την εξόφληση του υπολοίπου');
    if (di && !di.done) say.push('Για τη συμφωνία μένουν ' + eur(di.left) + ' (~' + eur(di.perM) + ' τον μήνα)');
    M.campsInt(id).forEach((x) => say.push('Θύμισέ του την καμπάνια «' + x + '»'));
    C.filter((x) => Math.max(x.a, x.f) >= M.WORKED && x.b <= 0).sort((p, q) => q.f - p.f).slice(0, 2).forEach((x) => say.push('Ρώτα γιατί σταμάτησε ' + lbl(x.k) + ' (πέρσι ' + eur(Math.max(x.a, x.f)) + ')'));
    C.filter((x) => x.a >= M.WORKED && x.b > 0 && x.b < x.a / 2).slice(0, 1).forEach((x) => say.push('Πέφτει ' + lbl(x.k) + ': ' + eur(x.b) + ' έναντι ' + eur(x.a) + ' πέρσι'));
    const it = (S.get('items', id) || {}).it || [], lost = it.filter((x) => !SKIP.has(x.g) && (+x.tc || 0) <= 0 && (+x.tp || 0) >= 20).sort((p, q) => q.tp - p.tp).slice(0, 2).map((x) => x.n);
    if (lost.length) say.push('Πέρσι πήρε, φέτος όχι: ' + lost.join(', '));
    if (tc) say.push('Τεχνικός' + (tc.note ? ': ' + tc.note : ': κανόνισε επίσκεψη'));
    if (c.prospect) say.push('Κλείσε ραντεβού για παρουσίαση');
    else {
      const buys = new Set(C.filter((x) => x.b > 0).map((x) => x.k).concat(M.works(id).map((w) => (w === 'Dualsenses' ? 'DS' : w === 'Styling' ? 'SS' : w))));
      const nk = NEXT.find((k) => !buys.has(k));
      if (zero && !buys.size) say.push('Πρότεινε δοκιμή Topchic ή Colorance');
      else if (nk) say.push('Δεν παίρνει ' + lbl(nk) + ': πρότεινέ το');
    }
    return { why: why.slice(0, 2).join(' · ') + '.', say: say.slice(0, 4) };
  };

  const stopOf = (c, n, ctx) => ({ id: c.i, why: n.why, say: n.say, done: false, zero: !!(ctx.zset && ctx.zset.has(c.i)), sos: !!S.get('sos', c.i) });

  E.generate = async (cities, all, ctx, onProgress) => {
    const byRules = (note) => ({ stops: E.routeSort(all.map((c) => stopOf(c, E.ruleNote(c, ctx), ctx))), note: note || '' });
    if (!PL.adapter.ai.available()) return byRules();
    let r;
    try { r = await E.aiNotes(cities, all, ctx, onProgress); } catch (e) { return byRules('Οι σημειώσεις γράφτηκαν από τους κανόνες (το Claude δεν απάντησε).'); }
    /* όσους παρέλειψε το Claude τους συμπληρώνουν οι κανόνες */
    return { stops: E.routeSort(all.map((c) => stopOf(c, r.notes[c.i] || E.ruleNote(c, ctx), ctx))), note: r.note || '' };
  };

  E.suggestOne = async (c) => {
    if (PL.adapter.ai.available()) { try { const r = await E.aiOne(c); if (r.why) return r; } catch (e) { /* κανόνες */ } }
    return E.ruleNote(c, { zset: new Set([c.i]) });
  };
})();
