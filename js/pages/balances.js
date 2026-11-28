/* Σελίδα «Υπόλοιπα πελατών»: τι χρωστάει ο καθένας, υπέρβαση, διαμαρτυρημένα και «Ενημέρωση» (πότε θα πληρώσει / λόγος).
   Η ενημέρωση περνάει πρώτα από ουρά στο κινητό (localStorage 'bnq') και ξαναδοκιμάζεται μόνη της αν δεν υπάρχει σύνδεση.
   PL.balnotes = {get, put, drop, state, on}: η ίδια ουρά για τη λίστα και το «Φύλλο είσπραξης» (debt.js, τάμπλετ).
   Τάμπλετ: πάτημα σε πελάτη → φύλλο είσπραξης δεξιά· χωρίς πάτημα, δεξιά υποσχέσεις πληρωμής και ποιοι θέλουν ενημέρωση. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, D = PL.dlg, esc = u.esc, money = u.money, db = () => PL.adapter.db;
  const COLS = ['clients', 'prospects', 'balances', 'balnotes', 'notes'];
  const st = { all: false, over: false, nonote: false, edit: null };
  const { v: bv, big } = M.bal;   // υπόλοιπα: από το μοντέλο
  const fdd = (d) => (d ? String(d).split('-').reverse().join('/') : '');
  const SV = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const PEN = SV('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'), LENS = SV('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>');

  /* ουρά αποθήκευσης: {id: {v|del, st:'saving'|'err'}} */
  let Q = {}; try { Q = JSON.parse(localStorage.getItem('bnq') || '{}') || {}; } catch (e) { Q = {}; }
  const qsave = () => { try { localStorage.setItem('bnq', JSON.stringify(Q)); } catch (e) { /* χωρίς αποθήκευση στο κινητό */ } };
  const withTO = (pr, ms) => Promise.race([pr, new Promise((_, rej) => setTimeout(() => rej({ code: 'timeout' }), ms))]);
  let busy = false; const subs = new Set(), changed = () => subs.forEach((f) => f());
  async function flush() {
    if (busy) return; const ids = Object.keys(Q); if (!ids.length) return;
    busy = true;
    for (const id of ids) {
      const q = Q[id]; q.st = 'saving'; changed();
      try {
        if (q.del) { await withTO(db().remove('balnotes/' + id), 15000); S.drop('balnotes', id); }
        else { await withTO(db().set('balnotes/' + id, q.v), 15000); S.put('balnotes', id, q.v); }
        delete Q[id];
      } catch (e) { q.st = 'err'; }
    }
    qsave(); busy = false; changed();
    if (Object.keys(Q).length) setTimeout(flush, 20000);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) flush(); });
  const note = (id) => (Q[id] ? (Q[id].del ? null : Q[id].v) : S.get('balnotes', id));
  /* γράφει (ή σβήνει, αν δεν έχει ούτε ημερομηνία ούτε κείμενο) μέσω της ουράς */
  const put = (id, tx, pay) => {
    if (!tx && !pay) { if (note(id)) Q[id] = { del: true, st: 'saving' }; }
    else Q[id] = { v: Object.assign({}, note(id) || {}, { t: tx, pay, d: u.today(), name: (M.byId(id) || {}).name || '' }), st: 'saving' };
    qsave(); changed(); flush();
  };
  /* ο χρήστης σβήνει την ενημέρωση: στον κάδο, με «Αναίρεση» (js/trash.js) */
  const drop = async (id) => { delete Q[id]; qsave(); await PL.trash.doc('balnotes/' + id, 'Ενημέρωση υπολοίπου · ' + ((M.byId(id) || {}).name || '')); changed(); };
  /* κατάσταση αποθήκευσης για εμφάνιση: '' (αποθηκεύτηκε) | 'saving' | 'err' */
  const state = (id) => (Q[id] ? Q[id].st : '');
  PL.balnotes = { get: note, put, drop, state, on: (f) => { subs.add(f); return () => subs.delete(f); }, flush };

  function noteHtml(id) {
    const n = note(id);
    if (PL.WIDE.matches && st.edit !== id) { const n0 = note(id); return n0 && (n0.pay || n0.t) ? `<div class="bnn">${n0.pay ? `<b>Πληρωμή:</b> <span class="${n0.pay < u.today() ? 'late' : ''}">${fdd(n0.pay)}</span>${n0.t ? ' · ' : ''}` : ''}${esc(n0.t || '')}</div>` : ''; }   /* τάμπλετ: η ενημέρωση γίνεται στο φύλλο δεξιά */
    if (st.edit === id) return `<div class="bned"><label>Θα πληρώσει στις</label><input type="date" id="bnpay" value="${esc((n && n.pay) || '')}"><label>Λόγος καθυστέρησης / σημειώσεις</label><textarea id="bntx" rows="3" placeholder="π.χ. Περιμένει να πληρωθεί από ασφαλιστικό, είπε μέχρι τέλος του μήνα">${esc((n && n.t) || '')}</textarea><div class="bnr"><button class="pri" data-bnsave="${esc(id)}">Αποθήκευση</button><button data-bncancel="1">Άκυρο</button>${n ? `<button data-bndel="${esc(id)}" style="margin-left:auto;color:var(--rd)">Διαγραφή σημείωσης</button>` : ''}</div></div>`;
    const btn = `<button class="bnb" data-bned="${esc(id)}">${PEN}<span>${n && (n.t || n.pay) ? 'Αλλαγή' : 'Ενημέρωση'}</span></button>`;
    if (!n || (!n.t && !n.pay)) return `<div class="bnrow"><span></span>${btn}</div>`;
    const late = n.pay && n.pay < u.today(), q = Q[id], tone = late ? 'late' : n.pay ? 'soon' : '';
    const state = q ? (q.st === 'err' ? '<div class="bnm bnerr">⚠️ Δεν αποθηκεύτηκε ακόμα (σύνδεση). Το κρατάω στο κινητό και ξαναδοκιμάζω μόνο μου.</div>' : '<div class="bnm">⏳ Αποθηκεύεται…</div>') : '';
    return `<div class="bnrow"><div class="bnn ${tone}">${n.t ? `<div class="bnl"><span class="bni">${PL.icon.msg}</span><span>${esc(n.t)}</span></div>` : ''}` +
      `${n.pay ? `<div class="bnl"><span class="bni">${PL.icon.cal}</span><span>${fdd(n.pay)}${late ? ' · πέρασε' : ''}</span></div>` : ''}${state}</div>${btn}</div>`;
  }

  PL.register('balances', {
    title: 'Υπόλοιπα',
    split: ['client', 'debt'],
    aside: (el) => PL.debt.aside(el),   /* debt.js: υποσχέσεις, χωρίς ενημέρωση, υπερβάσεις */
    render(el) {
      /* εμφάνιση 28/11/2026: κάρτα συνόλων, φίλτρα με αριθμούς, κάρτα πελάτη με κουτάκι ενημέρωσης (κόκκινο: υπέρβαση) */
      el.innerHTML = `<h2 class="pgh"><span class="pghi">${PL.icon.euro}</span>Υπόλοιπα πελατών</h2><div id="bsum"></div><div id="bchips" class="bchips"></div>
<div class="bsrch"><span>${LENS}</span><input id="bq" placeholder="Αναζήτηση πελάτη ή πόλης…"></div><div id="bl"></div><div id="bsmall"></div>`;
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      const paint = () => {
        const all = M.bal.ids(), f = u.nn($('#bq').value);
        if (!all.length) { $('#bsum').textContent = ''; $('#bchips').innerHTML = ''; $('#bl').innerHTML = '<div class="card" style="cursor:default">Δεν έχουν καταχωρηθεί ακόμα υπόλοιπα.</div>'; return; }
        const sm = (k) => all.reduce((a, id) => a + bv(id, k), 0), dt = all.map((id) => S.get('balances', id).d || '').sort().pop(), small = all.filter((id) => !big(id)).length;
        $('#bsum').innerHTML = `<div class="bsum"><div class="bsg"><div><span>Συνολικό υπόλοιπο</span><b>${money(sm('amount'))}</b></div><div class="bsr"><span>Υπέρβαση</span><b class="dn">${money(sm('over'))}</b></div></div>` +
          `${sm('bounced') ? `<div class="bsb">Διαμαρτυρημένα <b class="dn">${money(sm('bounced'))}</b></div>` : ''}<div class="bsf">${all.length} πελάτες${dt ? ' · ενημέρωση ' + fdd(dt) : ''}</div></div>`;
        /* φίλτρα: Όλοι · Με υπέρβαση · Χωρίς ενημέρωση (με αριθμούς)· τα «ψιλά» με κουμπί κάτω από τη λίστα */
        const vis = all.filter((id) => st.all || big(id)), noNote = (id) => { const n = note(id); return !n || (!n.t && !n.pay); };
        const nO = vis.filter((id) => bv(id, 'over') > 0).length, nN = vis.filter(noNote).length;
        $('#bchips').innerHTML = `<button class="chip ${!st.over && !st.nonote ? 'on' : ''}" data-bf="">Όλοι (${vis.length})</button><button class="chip ${st.over ? 'on' : ''}" data-bf="over">Υπέρβαση (${nO})</button><button class="chip ${st.nonote ? 'on' : ''}" data-bf="nonote">Χωρίς ενημέρωση (${nN})</button>`;
        $('#bsmall').innerHTML = small ? `<button class="shlink" data-ba="1">${st.all ? 'Κρύψε τα μικρά υπόλοιπα' : 'Δείξε και τα μικρά υπόλοιπα (' + small + ')'}</button>` : '';
        const L = vis.filter((id) => (!st.over || bv(id, 'over') > 0) && (!st.nonote || noNote(id)) && (!f || u.nn(M.byId(id).name + ' ' + M.byId(id).city + ' ' + M.byId(id).code).includes(f)))
          .sort((a, b) => bv(b, 'amount') - bv(a, 'amount') || bv(b, 'bounced') - bv(a, 'bounced'));
        $('#bl').innerHTML = L.map((id) => {
          const c = M.byId(id), o = bv(id, 'over'), w = bv(id, 'warn'), d = bv(id, 'bounced');
          return `<div class="card bcd${o > 0 ? ' bover' : ''}" data-id="${esc(id)}"><div class="bct"><div class="bcl"><div class="nm">${esc(c.name)}</div><div class="bci"><span class="bni">${PL.icon.pin}</span>${esc(c.city)}</div></div>` +
            `<div class="bcv"><b class="${o > 0 ? 'dn' : ''}">${money(bv(id, 'amount'))}</b>${o > 0 ? `<small class="dn">υπέρβαση ${money(o)}</small>` : ''}${w > 0 && w !== o ? `<small>προειδοπ. ${money(w)}</small>` : ''}${d ? `<small class="dn">διαμαρτ. ${money(d)}</small>` : ''}</div></div>${noteHtml(id)}</div>`;
        }).join('') || '<p class="mu">Κανένας πελάτης.</p>';
      };
      const repaint = () => { if (!st.edit && el.isConnected) paint(); }, offQ = PL.balnotes.on(repaint);
      paint();
      const offs = COLS.map((c) => S.on(c, () => { if (!busy) setTimeout(flush, 500); repaint(); }));
      $('#bq').addEventListener('input', paint);
      $('#bchips').addEventListener('click', (ev) => { const b = ev.target.closest('[data-bf]'); if (!b) return; st.over = b.dataset.bf === 'over'; st.nonote = b.dataset.bf === 'nonote'; paint(); });
      $('#bsmall').addEventListener('click', (ev) => { if (ev.target.closest('[data-ba]')) { st.all = !st.all; paint(); } });
      $('#bl').addEventListener('click', async (ev) => {
        const t = ev.target;
        if (t.closest('.bned') && !t.dataset.bnsave && !t.dataset.bncancel && !t.dataset.bndel) return;
        const be = t.closest('[data-bned]'); if (be) { st.edit = be.dataset.bned; paint(); setTimeout(() => { const x = $('#bntx'); if (x) x.focus(); }, 50); return; }
        if (t.dataset.bncancel) { st.edit = null; paint(); return; }
        if (t.dataset.bnsave) {
          const id = t.dataset.bnsave; st.edit = null; put(id, $('#bntx').value.trim(), $('#bnpay').value || ''); return;
        }
        if (t.dataset.bndel) {
          const id = t.dataset.bndel;
          if (!(await D.confirm('Να διαγραφεί η ενημέρωση για «' + ((M.byId(id) || {}).name || '') + '»;'))) return;
          try { st.edit = null; await drop(id); } catch (e) { D.toast('Δεν διαγράφηκε'); }
          return;
        }
        const c = t.closest('[data-id]'); if (c) PL.nav.push(PL.WIDE.matches ? 'debt' : 'client', { id: c.dataset.id });
      });
      flush();
      return () => { offQ(); offs.forEach((f) => f()); };
    },
  });
})();
