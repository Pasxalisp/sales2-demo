/* ΕΟΡΤΟΛΟΓΙΟ: όλες οι μέρες του χρόνου με όλα τα επίσημα ονόματα (απόφαση Πασχάλη 16/11/2026: μόνο το επίσημο όνομα,
   χωρίς παραλλαγές, αλλά όλα τα ονόματα), και ποιος πελάτης γιορτάζει. Μέσα στην εφαρμογή (δουλεύει χωρίς σύνδεση).
   Δεδομένα: js/namedays-data.js (PL_ND, παράγεται από το nd_src/build_nd.py). Κινητές γιορτές από το ορθόδοξο Πάσχα.
   Γιορτή = μία σταθερή μέρα (κλειδί «ΜΜ-ΗΗ») ή μία κινητή (κλειδί «E-43», «george» κ.λπ.): {k, t (τίτλος ή ''), s: [ονόματα]}.
   Αναγνώριση πελάτη: μόνο το ΜΙΚΡΟ όνομα — παραλείπεται η πρώτη λέξη (το επώνυμο), π.χ. «ΝΙΚΟΛΑΟΥ ΜΑΡΙΑ» → Μαρία.
     - τα κοινά ονόματα των ελεγμένων γιορτών (C) γιορτάζουν μόνο εκείνη τη μέρα (Μαρία μόνο 15/8, όχι 21/11)·
     - τα άλλα σε κάθε μέρα που υπάρχει το όνομα (π.χ. Διονύσιος: 4 μέρες, «πιθανόν να γιορτάζει»)·
     - υποκοριστικά/παραλλαγές (V) αναγνωρίζονται, αλλά δεν εμφανίζονται· τα αμφίσημα (Τάκης, Τούλα…) δεν αναγνωρίζονται.
   Ευχή: WhatsApp με έτοιμο κείμενο (μέσα στην εφαρμογή Claude ανοίγει μόνο αυτό), ή αντιγραφή για Viber/SMS.
   «✓ ευχήθηκες» φυλάγεται στο wish/{ημερομηνία} = {ids: [...]}.
   Διόρθωση με το χέρι (από την καρτέλα, «✎ Αλλαγή γιορτής»): ndfix/{id πελάτη} = {f: κλειδί γιορτής ή '-' (δεν γιορτάζει), name}.
   Παλιές διορθώσεις (πριν τις 16/11/2026) έχουν στο f τον τίτλο της γιορτής: ισχύουν κι αυτές (ο τίτλος → κλειδί από το T).
   Η διόρθωση μετράει πριν από το όνομα· χωρίς αυτήν ισχύει η αναγνώριση από το όνομα. */
(function () {
  const PL = window.PL, u = PL.u, S = PL.store, M = PL.model, ND = window.PL_ND;
  const TEXT = 'Χρόνια πολλά!! Εύχομαι ό,τι επιθυμείς με υγεία!';
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/ς/g, 'Σ');
  const words = (s) => norm(s).split(/[^A-ZΑ-Ω]+/).filter(Boolean);

  /* ---------- Γιορτές ---------- */
  const F = Object.keys(ND.D).map((k) => ({ k, d: k, t: ND.T[k] || '', s: ND.D[k].split(' ') }))
    .concat(ND.M.map((m) => Object.assign({}, m, { t: ND.T[m.k] || m.t, s: m.s.split(' ') })));
  const BYK = {}, IDX = {}, ACC = {}, LEG = {}, VAR = {};
  F.forEach((f) => { BYK[f.k] = f; f.s.forEach((n) => { const w = norm(n); (IDX[w] = IDX[w] || []).push(f); ACC[w] = ACC[w] || n; }); });
  Object.entries(ND.V).forEach(([v, o]) => { const w = norm(v); VAR[w] = o; ACC[w] = ACC[w] || v; });
  ND.W.split(' ').filter(Boolean).forEach((n) => { ACC[norm(n)] = ACC[norm(n)] || n; });
  Object.entries(ND.T).forEach(([k, t]) => { LEG[t] = k; });
  /* τίτλος για τις μπάρες: ο τίτλος της γιορτής, αλλιώς τα πρώτα ονόματα */
  const label = (f) => f.t || f.s.slice(0, 3).join(', ') + (f.s.length > 3 ? '…' : '');

  /* ---------- Ημερομηνίες ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  /* ορθόδοξο Πάσχα (Meeus, ιουλιανό + 13 μέρες· ισχύει 1900–2099) */
  function easter(y) {
    const a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7, m = Math.floor((d + e + 114) / 31), day = ((d + e + 114) % 31) + 1;
    const t = new Date(y, m - 1, day); t.setDate(t.getDate() + 13); return t;
  }
  /* η πρώτη Κυριακή από τη μέρα (μ: 0 = Ιανουάριος) και μετά — η ίδια αν είναι Κυριακή */
  const sundayFrom = (y, m, d) => { const x = new Date(y, m, d); return addDays(x, (7 - x.getDay()) % 7); };
  /* η ημερομηνία μιας γιορτής για το έτος y (ΕΕΕΕ-ΜΜ-ΗΗ) */
  function dateOf(f, y) {
    if (f.d) return y + '-' + f.d;
    const E = easter(y);
    if (f.e != null) return ymd(addDays(E, f.e));
    if (f.g === 'george') { const g = new Date(y, 3, 23); return ymd(g <= E ? addDays(E, 1) : g); }   // μετά το Πάσχα, αλλιώς Δευτέρα του Πάσχα
    if (f.g === 'mark') { const k = new Date(y, 3, 25); return ymd(k <= E ? addDays(E, 2) : k); }
    if (f.g === 'chloe') return ymd(sundayFrom(y, 1, 13));          // Κυριακή 13–19 Φεβρουαρίου
    if (f.g === 'forefathers') return ymd(sundayFrom(y, 11, 11));   // Κυριακή 11–17 Δεκεμβρίου
    return '';
  }
  const tomorrow = (day) => ymd(addDays(new Date(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)), 1));
  /* όλες οι γιορτές ενός έτους ανά ημερομηνία (μία φορά για κάθε έτος) */
  const BYDAY = {};
  function daysOf(y) {
    if (!BYDAY[y]) { const m = {}; F.forEach((f) => { const d = dateOf(f, y); (m[d] = m[d] || []).push(f); }); BYDAY[y] = m; }
    return BYDAY[y];
  }
  const feastsOn = (day) => daysOf(+day.slice(0, 4))[day] || [];
  /* όλες οι γιορτές με την ημερομηνία τους, κατά σειρά ημερομηνίας (για τη διόρθωση) */
  const year = (y) => F.map((f) => ({ f, day: dateOf(f, y) })).sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));

  /* ---------- Ποιος γιορτάζει ---------- */
  /* αναγνώριση από το όνομα: το πρώτο γνωστό μικρό όνομα → {w, fs: [γιορτές]} ή null */
  function autoOf(c) {
    if (!c || !c.name) return null;
    for (const w of words(c.name).slice(1)) {
      const k = ND.C[w]; if (k && BYK[k]) return { w, fs: [BYK[k]] };
      const o = IDX[w] ? w : VAR[w]; if (o && IDX[o]) return { w, fs: IDX[o] };
    }
    return null;
  }
  /* η διόρθωση με το χέρι: κλειδί γιορτής, '-' (δεν γιορτάζει) ή '' (καμία διόρθωση) */
  const fixOf = (id) => { const x = S.get('ndfix', id), f = x && x.f; return f === '-' || BYK[f] ? f : LEG[f] || ''; };
  /* οι γιορτές του πελάτη: πρώτα η διόρθωση, αλλιώς από το όνομα ([] = καμία) */
  function feastsOf(c) {
    if (!c) return [];
    const f = fixOf(c.i);
    if (f) return f === '-' ? [] : [BYK[f]];
    const a = autoOf(c); return a ? a.fs : [];
  }
  /* οι γιορτές του πελάτη με την ημερομηνία τους, από τη day και για έναν χρόνο, η πιο κοντινή πρώτη */
  function upcoming(c, day) {
    const y = +day.slice(0, 4);
    return feastsOf(c).map((f) => { let d = dateOf(f, y); if (d < day) d = dateOf(f, y + 1); return { f, day: d }; })
      .sort((a, b) => (a.day < b.day ? -1 : 1));
  }
  /* γιορτή → πελάτες: φτιάχνεται μία φορά και ξαναφτιάχνεται μόνο όταν αλλάξουν πελάτες, διορθώσεις ή «εκτός» */
  let WHO = null;
  ['clients', 'prospects', 'ndfix', 'xout'].forEach((col) => S.on(col, () => { WHO = null; }));
  function who() {
    if (!WHO) { WHO = {}; M.live().forEach((c) => feastsOf(c).forEach((f) => { (WHO[f.k] = WHO[f.k] || []).push(c); })); }
    return WHO;
  }
  /* γιορτές μιας μέρας και πελάτες που γιορτάζουν */
  function celebrants(day) {
    const fs = feastsOn(day); if (!fs.length) return { feasts: [], list: [] };
    const W = who(), seen = new Set(), list = [];
    fs.forEach((f) => (W[f.k] || []).forEach((c) => { if (!seen.has(c.i)) { seen.add(c.i); list.push(c); } }));
    return { feasts: fs, list };
  }
  /* η επόμενη μέρα μετά τη day όπου γιορτάζει κάποιος πελάτης (έως έναν χρόνο μπροστά): {day, feasts, list} ή null */
  function next(day) {
    let d = day;
    for (let k = 0; k < 366; k++) { d = tomorrow(d); const g = celebrants(d); if (g.list.length) return Object.assign({ day: d }, g); }
    return null;
  }
  /* f: κλειδί γιορτής, '-' ή '' (επιστροφή στην αναγνώριση από το όνομα) */
  async function setFix(c, f) {
    if (!f) { await PL.adapter.db.remove('ndfix/' + c.i); S.drop('ndfix', c.i); return; }
    const doc = { f, name: c.name }; await PL.adapter.db.set('ndfix/' + c.i, doc); S.put('ndfix', c.i, doc);
  }
  /* σύντομο όνομα για τη μπάρα γιορτών: το μικρό όνομα που αναγνωρίστηκε, με τόνους («ΦΩΤΙΑΔΟΥ ΜΙΧΑΛΗΣ» → Μιχάλης)·
     με διόρθωση από το χέρι ή χωρίς γνωστό όνομα, ολόκληρο το όνομα */
  function given(c) {
    const a = !fixOf(c.i) && autoOf(c); if (!a) return c.name;
    return ACC[a.w] || a.w.charAt(0) + a.w.slice(1).toLowerCase().replace(/σ$/, 'ς');
  }

  /* ---------- Ευχή ---------- */
  const mobile = (c) => [c.t2, c.t1].concat(c.more || []).map((x) => String(x || '').replace(/[^\d+]/g, '').replace(/^(\+|00)?30(?=69\d{8}$)/, '')).find((x) => /^69\d{8}$/.test(x)) || '';
  const wished = (day, id) => ((S.get('wish', day) || {}).ids || []).includes(id);
  async function markWished(day, id) {
    const cur = S.get('wish', day) || { ids: [] }; if (cur.ids.includes(id)) return;
    const doc = { ids: cur.ids.concat([id]) }; S.put('wish', day, doc);
    try { await PL.adapter.db.set('wish/' + day, doc); } catch (e) { /* μένει τοπικά */ }
  }

  PL.names = {
    TEXT, F, norm, easter, dateOf, label, byKey: (k) => BYK[k] || null, autoOf, fixOf, feastsOf, upcoming, setFix, year,
    feastsOn, celebrants, tomorrow, next, given, mobile, wished, markWished,
    today: () => u.today(),
    /* 🎉 δίπλα στο όνομα όποιου γιορτάζει σήμερα */
    badge: (c) => { const t = PL.names.today(), y = +t.slice(0, 4); return feastsOf(c).some((f) => dateOf(f, y) === t) ? '🎉 ' : ''; },
    wa: (c) => { const m = mobile(c); return m ? 'https://wa.me/30' + m + '?text=' + encodeURIComponent(TEXT) : ''; },
  };
})();
