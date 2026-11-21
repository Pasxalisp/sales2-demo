/* Λήψη ενός προγράμματος σε «📤 Excel»: E.exportXlsx(πρόγραμμα) → μήνυμα για τον πωλητή. Η λήψη γίνεται μέσω PL.adapter.files.
   (Το «📴 Για χωρίς σήμα» αφαιρέθηκε 15/11/2026: αντίγραφο που δεν γύριζε πίσω στην εφαρμογή.) */
(function () {
  const PL = window.PL, M = PL.model, S = PL.store, E = PL.plans, money = PL.u.money;
  const fname = (p, ext) => 'Programma ' + E.planName(p).replace(/[\\/:*?"<>|]/g, '-') + ' ' + p.created + ext;
  const NOFILES = 'Η λήψη δουλεύει μόνο μέσα στο claude.ai.';

  /* η βιβλιοθήκη του Excel φορτώνει μόνο την πρώτη φορά που τη χρειαστείς */
  let XP = null;
  const loadXlsx = () => { if (window.XLSX) return Promise.resolve(); if (!XP) XP = new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; sc.onload = ok; sc.onerror = () => { XP = null; no(new Error('load')); }; document.head.appendChild(sc); }); return XP; };

  E.exportXlsx = async (p) => {
    try { await loadXlsx(); } catch (e) { return 'Δεν φόρτωσε το Excel. Έλεγξε τη σύνδεση και ξαναπάτα.'; }
    const r2 = (x) => Math.round((+x || 0) * 100) / 100;
    const rows = p.stops.map((s, k) => {
      const c = M.byId(s.id) || {}, g = (c.i && M.gold(c)) || [], b = S.get('balances', s.id) || {}, es = M.entries(s.id).filter((x) => x.d >= p.created), e = es[0] || {};
      return { '#': k + 1, 'Πόλη': c.city || '', 'Πελάτης': c.name || '', 'Κωδικός': c.code || '', 'Διεύθυνση': c.addr || '', 'Τηλέφωνο': [c.t1, c.t2].filter(Boolean).join(' / '), 'Επίσκεψη': s.done ? '✓' : '', 'Ημερομηνία': s.doneDate || '', 'Τι συζητήσαμε': es.map((x) => x.text).filter(Boolean).join(' | '), 'Προϊόντα': es.map((x) => x.products).filter(Boolean).join(', '),
        'Να πω': e.todo || '', 'Εκκρεμότητα για': e.next || '', 'Τζίρος φέτος': r2(c.i ? M.tz(c) : 0), 'Goldwell φέτος': r2(g[1]), 'Goldwell πέρσι ίδια περίοδο': r2(g[0]), 'Υπόλοιπο': r2(b.amount), 'Υπέρβαση': r2(b.over), 'SOS': s.sos ? 'SOS' : '', 'Χωρίς τζίρο': s.zero ? 'ναι' : '', 'Πρόταση': s.why || '' };
    });
    const ws = XLSX.utils.json_to_sheet(rows); ws['!cols'] = [4, 14, 28, 9, 26, 22, 9, 11, 40, 22, 30, 13, 12, 12, 14, 11, 11, 6, 10, 40].map((w) => ({ wch: w })); ws['!autofilter'] = { ref: ws['!ref'] };
    const a = E.area.stats([...E.selOf(p)]);
    const ss = XLSX.utils.aoa_to_sheet([['Πρόγραμμα', E.planName(p)], ['Ημερομηνία', p.created], ['Επισκέψεις', p.stops.filter((x) => x.done).length + ' / ' + p.stops.length], [],
      ['Τζίρος περιοχής φέτος', r2(a.tz)], ['Goldwell φέτος', r2(a.ty)], ['Goldwell πέρσι ίδια περίοδο', r2(a.ly)], ['Διαφορά %', a.pct == null ? '' : Math.round(a.pct)], ['Goldwell όλο το περσινό', r2(a.lf)],
      ['Πελάτες που αγόρασαν φέτος', a.nT], ['Πελάτες που αγόρασαν πέρσι', a.nL], ['Ανεβαίνουν', a.up], ['Πέφτουν', a.dn], ['Χρέη περιοχής', r2(a.debt)], ['Υπέρβαση', r2(a.over)]]);
    ss['!cols'] = [{ wch: 30 }, { wch: 30 }];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Πρόγραμμα'); XLSX.utils.book_append_sheet(wb, ss, 'Σύνοψη');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    if (!PL.adapter.files.available()) return NOFILES;
    try { await PL.adapter.files.save(fname(p, '.xlsx'), new Blob([buf])); return '✓ Έτοιμο. Από το αρχείο πάτα Κοινοποίηση για να το στείλεις.'; }
    catch (e) { const c = e && e.code; return c === 'declined' ? 'Ακυρώθηκε.' : 'Δεν έγινε η λήψη (' + (c || 'σφάλμα') + '). Πες στη συνομιλία του project «στείλε μου σε Excel το πρόγραμμα ' + E.planName(p) + '» και θα σου το στείλω από εκεί.'; }
  };
})();
