/* Λήψη ενός προγράμματος: «📴 Για χωρίς σήμα» (μία σελίδα HTML με τικ και σημειώσεις που μένουν στο κινητό) και «📤 Excel».
   E.exportOffline(πρόγραμμα) / E.exportXlsx(πρόγραμμα) → μήνυμα για τον πωλητή. Η λήψη γίνεται μέσω PL.adapter.files. */
(function () {
  const PL = window.PL, M = PL.model, S = PL.store, E = PL.plans, money = PL.u.money;
  const fname = (p, ext) => 'Programma ' + p.cities.join('-').replace(/[\\/:*?"<>|]/g, '-') + ' ' + p.created + ext;
  const NOFILES = 'Η λήψη δουλεύει μόνο μέσα στο claude.ai.';

  E.exportOffline = async (p) => {
    const e = (x) => String(x ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
    const key = 'off_' + (p.id || 'x'); let h = '', cc = '';
    p.stops.forEach((x, k) => {
      const c = M.byId(x.id); if (!c) return;
      if (c.city !== cc) { cc = c.city; h += `<h2>${e(cc)}</h2>`; }
      const tels = [c.t1, c.t2].concat(c.more || []).filter(Boolean), b = S.get('balances', x.id) || {}, es = M.entries(x.id).slice(0, 2);
      h += `<div class="c${x.done ? ' d' : ''}"><label><input type="checkbox" data-k="${k}" ${x.done ? 'checked' : ''}> <b>${e(c.name)}</b>${x.sos ? ' <span class="r">SOS</span>' : ''}</label>
  <div class="m">${e(c.addr)}${c.area ? ' · ' + e(c.area) : ''}${M.tz(c) > 0 ? ' · τζίρος ' + e(money(M.tz(c))) : ''}</div>
  ${tels.length ? `<div>${tels.map((t) => `<a href="tel:${e(String(t).replace(/[^\d+]/g, ''))}">📞 ${e(t)}</a>`).join(' ')}</div>` : ''}
  ${(+b.amount || 0) >= 1 ? `<div class="r">💶 Χρέος ${e(money(+b.amount))}${(+b.over || 0) > 0 ? ' · υπέρβαση ' + e(money(+b.over)) : ''}</div>` : ''}
  ${x.why ? `<div>${e(x.why)}</div>` : ''}${(x.say || []).length ? `<ul>${x.say.map((y) => `<li>${e(y)}</li>`).join('')}</ul>` : ''}
  ${es.map((n) => `<div class="m">[${e(n.d)}] ${e(n.text || '')}${n.todo ? ' — Να πω: ' + e(n.todo) : ''}</div>`).join('')}
  <textarea data-n="${k}" placeholder="Σημείωση (θα την περάσεις μετά με υπαγόρευση)"></textarea></div>`;
    });
    const html = `<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Πρόγραμμα ${e(p.cities.join(' + '))}</title><style>body{font:16px -apple-system,sans-serif;margin:0;padding:14px;background:#f6f4ef;color:#1f2421}h1{font-size:20px;margin:0 0 4px}h2{font-size:17px;margin:20px 0 6px;color:#2f6f5e}.c{background:#fff;border:1px solid #e2ded4;border-radius:12px;padding:10px;margin:8px 0}.d{opacity:.55}.m{color:#6b716c;font-size:14px;margin:3px 0}.r{color:#b3402e;font-weight:600}a{display:inline-block;margin:4px 6px 4px 0;color:#2f6f5e;font-weight:600}ul{margin:4px 0;padding-left:20px}textarea{width:100%;box-sizing:border-box;margin-top:6px;font:inherit;border:1px solid #e2ded4;border-radius:8px;padding:6px;min-height:40px}input[type=checkbox]{width:20px;height:20px;vertical-align:-4px}</style></head><body>
 <h1>${e(p.cities.join(' + '))}</h1><div class="m">Αντίγραφο για χωρίς σήμα · ${e(p.created)} · τα τικ και οι σημειώσεις εδώ ΔΕΝ περνάνε στο Πελατολόγιο· πέρασέ τα μετά με υπαγόρευση.</div>${h}
 <script>try{var K=${JSON.stringify(key)},S=JSON.parse(localStorage.getItem(K)||'{}');document.querySelectorAll('[data-k]').forEach(function(b){var k='t'+b.dataset.k;if(k in S)b.checked=S[k];b.closest('.c').classList.toggle('d',b.checked);b.onchange=function(){S[k]=b.checked;b.closest('.c').classList.toggle('d',b.checked);localStorage.setItem(K,JSON.stringify(S))}});document.querySelectorAll('[data-n]').forEach(function(t){var k='n'+t.dataset.n;if(S[k])t.value=S[k];t.oninput=function(){S[k]=t.value;localStorage.setItem(K,JSON.stringify(S))}})}catch(e){}<\/script></body></html>`;
    if (!PL.adapter.files.available()) return NOFILES;
    try { await PL.adapter.files.save(fname(p, '.html'), html); return '✓ Αποθηκεύτηκε. Άνοιξέ το από τα Αρχεία του iPhone όταν δεν έχεις σήμα.'; }
    catch (err) { const c = err && err.code; return c === 'declined' ? 'Ακυρώθηκε.' : 'Δεν έγινε η λήψη (' + (c || 'σφάλμα') + ').'; }
  };

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
    const a = E.area.stats(p.cities);
    const ss = XLSX.utils.aoa_to_sheet([['Πρόγραμμα', p.cities.join(' + ')], ['Ημερομηνία', p.created], ['Επισκέψεις', p.stops.filter((x) => x.done).length + ' / ' + p.stops.length], [],
      ['Τζίρος περιοχής φέτος', r2(a.tz)], ['Goldwell φέτος', r2(a.ty)], ['Goldwell πέρσι ίδια περίοδο', r2(a.ly)], ['Διαφορά %', a.pct == null ? '' : Math.round(a.pct)], ['Goldwell όλο το περσινό', r2(a.lf)],
      ['Πελάτες που αγόρασαν φέτος', a.nT], ['Πελάτες που αγόρασαν πέρσι', a.nL], ['Ανεβαίνουν', a.up], ['Πέφτουν', a.dn], ['Χρέη περιοχής', r2(a.debt)], ['Υπέρβαση', r2(a.over)]]);
    ss['!cols'] = [{ wch: 30 }, { wch: 30 }];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Πρόγραμμα'); XLSX.utils.book_append_sheet(wb, ss, 'Σύνοψη');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    if (!PL.adapter.files.available()) return NOFILES;
    try { await PL.adapter.files.save(fname(p, '.xlsx'), new Blob([buf])); return '✓ Έτοιμο. Από το αρχείο πάτα Κοινοποίηση για να το στείλεις.'; }
    catch (e) { const c = e && e.code; return c === 'declined' ? 'Ακυρώθηκε.' : 'Δεν έγινε η λήψη (' + (c || 'σφάλμα') + '). Πες στη συνομιλία του project «στείλε μου σε Excel το πρόγραμμα ' + p.cities.join(' + ') + '» και θα σου το στείλω από εκεί.'; }
  };
})();
