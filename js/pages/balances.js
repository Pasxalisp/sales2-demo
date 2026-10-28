/* Σελίδα «Υπόλοιπα πελατών»: τι χρωστάει ο καθένας, υπέρβαση, διαμαρτυρημένα και «Ενημέρωση» (πότε θα πληρώσει / λόγος).
   Η ενημέρωση περνάει πρώτα από ουρά στο κινητό (localStorage 'bnq') και ξαναδοκιμάζεται μόνη της αν δεν υπάρχει σύνδεση. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, D = PL.dlg, esc = u.esc, money = u.money, db = () => PL.adapter.db;
  const COLS = ['clients', 'prospects', 'balances', 'balnotes', 'notes'];
  const st = { all: false, over: false, edit: null };
  const bv = (id, k) => +((S.get('balances', id) || {})[k] || 0);
  const has = (id) => M.byId(id) && (bv(id, 'amount') !== 0 || bv(id, 'over') !== 0 || bv(id, 'bounced') !== 0);
  const big = (id) => Math.abs(bv(id, 'amount')) >= 1 || bv(id, 'over') >= 1 || bv(id, 'bounced') !== 0;
  const fdd = (d) => (d ? String(d).split('-').reverse().join('/') : '');

  /* ουρά αποθήκευσης: {id: {v|del, st:'saving'|'err'}} */
  let Q = {}; try { Q = JSON.parse(localStorage.getItem('bnq') || '{}') || {}; } catch (e) { Q = {}; }
  const qsave = () => { try { localStorage.setItem('bnq', JSON.stringify(Q)); } catch (e) { /* χωρίς αποθήκευση στο κινητό */ } };
  const withTO = (pr, ms) => Promise.race([pr, new Promise((_, rej) => setTimeout(() => rej({ code: 'timeout' }), ms))]);
  let busy = false, repaint = () => {};
  async function flush() {
    if (busy) return; const ids = Object.keys(Q); if (!ids.length) return;
    busy = true;
    for (const id of ids) {
      const q = Q[id]; q.st = 'saving'; repaint();
      try {
        if (q.del) { await withTO(db().remove('balnotes/' + id), 15000); S.drop('balnotes', id); }
        else { await withTO(db().set('balnotes/' + id, q.v), 15000); S.put('balnotes', id, q.v); }
        delete Q[id];
      } catch (e) { q.st = 'err'; }
    }
    qsave(); busy = false; repaint();
    if (Object.keys(Q).length) setTimeout(flush, 20000);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) flush(); });
  const note = (id) => (Q[id] ? (Q[id].del ? null : Q[id].v) : S.get('balnotes', id));

  function noteHtml(id) {
    const n = note(id);
    if (st.edit === id) return `<div class="bned"><label>Θα πληρώσει στις</label><input type="date" id="bnpay" value="${esc((n && n.pay) || '')}"><label>Λόγος καθυστέρησης / σημειώσεις</label><textarea id="bntx" rows="3" placeholder="π.χ. Περιμένει να πληρωθεί από ασφαλιστικό, είπε μέχρι τέλος του μήνα">${esc((n && n.t) || '')}</textarea><div class="bnr"><button class="pri" data-bnsave="${esc(id)}">Αποθήκευση</button><button data-bncancel="1">Άκυρο</button>${n ? `<button data-bndel="${esc(id)}" style="margin-left:auto;color:var(--rd)">Διαγραφή σημείωσης</button>` : ''}</div></div>`;
    const btn = `<button class="bnb" data-bned="${esc(id)}">✏️ ${n ? 'Αλλαγή ενημέρωσης' : 'Ενημέρωση'}</button>`;
    if (!n || (!n.t && !n.pay)) return btn;
    const late = n.pay && n.pay < u.today(), q = Q[id];
    const state = q ? (q.st === 'err' ? ' · <span style="color:var(--rd);font-weight:600">⚠️ Δεν αποθηκεύτηκε ακόμα (σύνδεση). Το κρατάω στο κινητό και ξαναδοκιμάζω μόνο μου.</span>' : ' · ⏳ Αποθηκεύεται…') : ' · ✓ Αποθηκεύτηκε';
    return `<div class="bnn">${n.pay ? `<div><b>Πληρωμή:</b> <span class="${late ? 'late' : ''}">${fdd(n.pay)}${late ? ' · πέρασε η ημερομηνία' : ''}</span></div>` : ''}${n.t ? esc(n.t) : ''}<div class="bnm">Ενημέρωση ${fdd(n.d)}${state}</div></div>` + btn;
  }

  PL.register('balances', {
    title: 'Υπόλοιπα',
    split: ['client'],
    render(el) {
      el.innerHTML = `<h2>Υπόλοιπα πελατών</h2><div id="bsum" class="warn"></div><div id="bchips" style="display:flex;gap:6px;flex-wrap:wrap"></div>
<input id="bq" placeholder="Αναζήτηση πελάτη ή πόλης…" style="margin:8px 0"><div id="bl"></div>`;
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      const paint = () => {
        const all = Object.keys(S.all('balances')).filter(has), f = u.nn($('#bq').value);
        if (!all.length) { $('#bsum').textContent = ''; $('#bchips').innerHTML = ''; $('#bl').innerHTML = '<div class="card" style="cursor:default">Δεν έχουν καταχωρηθεί ακόμα υπόλοιπα.</div>'; return; }
        const sm = (k) => all.reduce((a, id) => a + bv(id, k), 0), dt = all.map((id) => S.get('balances', id).d || '').sort().pop(), small = all.filter((id) => !big(id)).length;
        $('#bsum').innerHTML = `<div class="row"><span>Υπόλοιπο</span><b>${money(sm('amount'))}</b></div><div class="row"><span>Υπέρβαση</span><b class="dn">${money(sm('over'))}</b></div>${sm('bounced') ? `<div class="row"><span>Διαμαρτυρημένα</span><b class="dn">${money(sm('bounced'))}</b></div>` : ''}<div style="margin-top:4px">${all.length} πελάτες${dt ? ' · ενημέρωση ' + dt : ''}</div>`;
        $('#bchips').innerHTML = `<button class="chip ${st.over ? 'on' : ''}" data-bo="1">Μόνο με υπέρβαση</button> <button class="chip ${st.all ? 'on' : ''}" data-ba="1">${st.all ? 'Κρύψε τα ψιλά' : 'Δείξε και τα ψιλά (' + small + ')'}</button>`;
        const L = all.filter((id) => (st.all || big(id)) && (!st.over || bv(id, 'over') > 0) && (!f || u.nn(M.byId(id).name + ' ' + M.byId(id).city + ' ' + M.byId(id).code).includes(f)))
          .sort((a, b) => bv(b, 'amount') - bv(a, 'amount') || bv(b, 'bounced') - bv(a, 'bounced'));
        $('#bl').innerHTML = L.map((id) => {
          const c = M.byId(id), o = bv(id, 'over'), w = bv(id, 'warn'), d = bv(id, 'bounced');
          return `<div class="card" data-id="${esc(id)}"><div class="row"><span class="nm">${esc(c.name)}</span><span class="tz">${money(bv(id, 'amount'))}</span></div><div class="mu">${esc(c.city)}${o > 0 ? ` · <span class="dn">Υπέρβαση ${money(o)}</span>` : ''}${w > 0 && w !== o ? ' · Προειδοποίηση ' + money(w) : ''}${d ? ` · <span class="dn">Διαμαρτυρημένα ${money(d)}</span>` : ''}</div>${noteHtml(id)}</div>`;
        }).join('') || '<p class="mu">Κανένας πελάτης.</p>';
      };
      repaint = () => { if (!st.edit && el.isConnected) paint(); };
      paint();
      const offs = COLS.map((c) => S.on(c, () => { if (!busy) setTimeout(flush, 500); repaint(); }));
      $('#bq').addEventListener('input', paint);
      $('#bchips').addEventListener('click', (ev) => { const t = ev.target; if (t.dataset.ba) { st.all = !st.all; paint(); } else if (t.dataset.bo) { st.over = !st.over; paint(); } });
      $('#bl').addEventListener('click', async (ev) => {
        const t = ev.target;
        if (t.closest('.bned') && !t.dataset.bnsave && !t.dataset.bncancel && !t.dataset.bndel) return;
        if (t.dataset.bned) { st.edit = t.dataset.bned; paint(); setTimeout(() => { const x = $('#bntx'); if (x) x.focus(); }, 50); return; }
        if (t.dataset.bncancel) { st.edit = null; paint(); return; }
        if (t.dataset.bnsave) {
          const id = t.dataset.bnsave, tx = $('#bntx').value.trim(), pay = $('#bnpay').value || '';
          if (!tx && !pay) { if (note(id)) Q[id] = { del: true, st: 'saving' }; }
          else Q[id] = { v: { t: tx, pay, d: u.today(), name: (M.byId(id) || {}).name || '' }, st: 'saving' };
          qsave(); st.edit = null; paint(); flush(); return;
        }
        if (t.dataset.bndel) {
          const id = t.dataset.bndel;
          if (!(await D.confirm('Να διαγραφεί η ενημέρωση για «' + ((M.byId(id) || {}).name || '') + '»;'))) return;
          try { delete Q[id]; qsave(); await db().remove('balnotes/' + id); S.drop('balnotes', id); st.edit = null; paint(); } catch (e) { D.toast('Δεν διαγράφηκε'); }
          return;
        }
        const c = t.closest('[data-id]'); if (c) PL.nav.push('client', { id: c.dataset.id });
      });
      flush();
      return () => { repaint = () => {}; offs.forEach((f) => f()); };
    },
  });
})();
