/* «Φύλλο είσπραξης» (τάμπλετ, δεξιά από τα Υπόλοιπα): πόσα χρωστάει, υπόσχεση πληρωμής, Κλήση / Υπενθύμιση με SMS /
   ✓ Πλήρωσε, ενημέρωση (πότε θα πληρώσει, λόγος) με ένα πάτημα. Τα ποσά έρχονται από το orders (μόνο ανάγνωση)·
   η ενημέρωση γράφεται μέσω PL.balnotes (ίδια ουρά με τη λίστα). params: {id}.
   Και το δεξί μέρος των Υπολοίπων όταν δεν έχεις πατήσει πελάτη: PL.debt.aside(el). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, D = PL.dlg, H = PL.sheet, esc = u.esc, money = u.money;
  const COLS = ['clients', 'prospects', 'balances', 'balnotes', 'notes', 'deals'];
  const fdd = (d) => (d ? String(d).split('-').reverse().join('/') : '');
  const ymd = (d) => d.getFullYear() + '-' + u.pad(d.getMonth() + 1) + '-' + u.pad(d.getDate());
  /* γρήγορες ημερομηνίες: σήμερα, αύριο, την (επόμενη) Παρασκευή, τέλος του μήνα */
  const QUICK = [['0', 'Σήμερα'], ['1', 'Αύριο'], ['fri', 'Παρασκευή'], ['eom', 'Τέλος μήνα']];
  const quick = (k) => { const d = new Date(Date.parse(u.today()) + 12 * 36e5);
    if (k === 'fri') { d.setDate(d.getDate() + (((5 - d.getDay() + 7) % 7) || 7)); } else if (k === 'eom') { d.setMonth(d.getMonth() + 1, 0); } else d.setDate(d.getDate() + +k);
    return ymd(d); };
  const bv = (id, k) => +((S.get('balances', id) || {})[k] || 0);
  const open = (n) => n && n.pay && n.pdone !== n.pay;   // υπόσχεση που δεν έχει κλείσει
  const reminder = (id) => PL.sheet.greet() + '\nΜια φιλική υπενθύμιση για το υπόλοιπο του λογαριασμού σας, ' + money(bv(id, 'amount')) + '.\nΕυχαριστώ πολύ!';

  PL.register('debt', {
    title: 'Είσπραξη',
    render(el, params) {
      const id = params.id;
      COLS.forEach((c) => S.use(c));
      el.innerHTML = '<div id="dbtop"></div><div class="shbox"><h3>Ενημέρωση</h3><label style="margin-top:0">Θα πληρώσει</label><div class="shrow" style="margin:0">' +
        QUICK.map(([k, l]) => `<button class="chip" data-dbd="${k}">${l}</button>`).join('') + '<input type="date" id="dbpay" style="width:auto"></div>' +
        '<label>Λόγος καθυστέρησης / σημειώσεις</label><textarea id="dbtx" placeholder="π.χ. Περιμένει πληρωμή από ασφαλιστικό, είπε μέχρι τέλος του μήνα"></textarea>' +
        '<div class="shrow"><button class="pri" id="dbsave" style="flex:1">Αποθήκευση</button><button id="dbdel" hidden style="color:var(--rd)">Σβήσε την ενημέρωση</button></div><div class="mu" id="dbmsg"></div></div><div id="dbbot"></div>';
      const $ = (s) => el.querySelector(s);
      let filled = false;
      const paint = () => {
        const c = M.byId(id); if (!c) { $('#dbtop').innerHTML = '<p class="mu">Φορτώνω…</p>'; return; }
        const b = S.get('balances', id) || {}, n = PL.balnotes.get(id), stt = PL.balnotes.state(id), late = n && n.pay && n.pay < u.today();
        if (!filled && S.loaded('balnotes')) { filled = true; $('#dbpay').value = (n && n.pay) || ''; $('#dbtx').value = (n && n.t) || ''; }
        $('#dbdel').hidden = !n;
        const k = (l, v, cls) => `<div><span>${l}</span><b class="${cls || ''}">${money(v)}</b></div>`;
        $('#dbtop').innerHTML = H.head(c, esc(c.city) + (c.code ? ' · κωδ. ' + esc(c.code) : ''), b.d ? 'ενημέρωση orders ' + esc(fdd(b.d)) : '') +
          `<div class="shk">${k('Υπόλοιπο', bv(id, 'amount'), bv(id, 'amount') >= 1 ? 'dn' : '')}${bv(id, 'over') ? k('Υπέρβαση', bv(id, 'over'), 'dn') : ''}${bv(id, 'bounced') ? k('Διαμαρτυρημένα', bv(id, 'bounced'), 'dn') : ''}${bv(id, 'warn') && bv(id, 'warn') !== bv(id, 'over') ? k('Προειδοποίηση', bv(id, 'warn')) : ''}</div>` +
          H.acts(H.call(c), H.sms(c, reminder(id), 'Υπενθύμιση'), open(n) ? '<button class="shdone" id="dbpaid">✓ Πλήρωσε</button>' : '') +
          H.facts(c, { debt: true }) +
          (n && (n.pay || n.t) ? H.box('Υπόσχεση πληρωμής', `${n.pay ? `<div style="font-size:18px"><b class="${late && open(n) ? 'dn' : ''}">${esc(fdd(n.pay))}</b>${late && open(n) ? ' <span class="dn">· πέρασε η ημερομηνία</span>' : ''}${n.pdone === n.pay ? ' <span class="up">· ✓ πλήρωσε</span>' : ''}</div>` : ''}${n.t ? `<div>${esc(n.t)}</div>` : ''}` +
            `<div class="mu" style="font-size:13px;margin-top:4px">Ενημέρωση ${esc(fdd(n.d))} · ${stt === 'err' ? '<span class="dn">⚠️ Δεν αποθηκεύτηκε ακόμα (σύνδεση). Ξαναδοκιμάζω μόνο μου.</span>' : stt ? '⏳ Αποθηκεύεται…' : '✓ Αποθηκεύτηκε'}</div>`, 'hi') : '');
        $('#dbbot').innerHTML = H.last(id) + H.nav(id);
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint)).concat(PL.balnotes.on(paint));
      el.addEventListener('click', async (ev) => {
        const b = ev.target.closest('[data-dbd],#dbsave,#dbdel,#dbpaid'); if (!b) return;
        try {
          if (b.dataset.dbd) { $('#dbpay').value = quick(b.dataset.dbd); $('#dbpay').dispatchEvent(new Event('input', { bubbles: true })); }
          else if (b.id === 'dbsave') { PL.balnotes.put(id, $('#dbtx').value.trim(), $('#dbpay').value || ''); D.toast('✓ Η ενημέρωση κρατήθηκε'); }
          else if (b.id === 'dbdel') {
            if (!(await D.confirm('Να σβηστεί η ενημέρωση για «' + ((M.byId(id) || {}).name || '') + '»;', 'Ναι, σβήσ\' την'))) return;
            await PL.balnotes.drop(id); $('#dbpay').value = ''; $('#dbtx').value = '';
          } else if (b.id === 'dbpaid') { b.disabled = true; await PL.tasks.done('P|' + id); D.toast('✓ Πλήρωσε'); }
        } catch (x) { $('#dbmsg').textContent = 'Δεν αποθηκεύτηκε: ' + ((x && x.message) || x); b.disabled = false; }
      });
      return () => offs.forEach((f) => f());
    },
  });

  /* Δεξί μέρος των Υπολοίπων χωρίς επιλογή: υποσχέσεις (πρώτα όσες πέρασαν), μεγάλα χωρίς ενημέρωση, υπερβάσεις. */
  function asideHtml() {
    if (!S.loaded('balances')) return '<p class="mu">Φορτώνω…</p>';
    const B = PL.balances, t = u.today(), ids = Object.keys(S.all('balances')).filter(B.has), name = (id) => esc(M.byId(id).name);
    const P = ids.filter((id) => open(PL.balnotes.get(id))).sort((a, b) => PL.balnotes.get(a).pay.localeCompare(PL.balnotes.get(b).pay));
    const row = (id, right, cls, sub) => ({ attr: `data-dbo="${esc(id)}"`, name: name(id), sub: esc(M.byId(id).city) + (sub ? ' · ' + sub : ''), right, cls });
    const noNote = ids.filter((id) => B.big(id) && bv(id, 'amount') >= 1 && !PL.balnotes.get(id)).sort((a, b) => bv(b, 'amount') - bv(a, 'amount'));
    const over = ids.filter((id) => bv(id, 'over') >= 1).sort((a, b) => bv(b, 'over') - bv(a, 'over'));
    const late = P.filter((id) => PL.balnotes.get(id).pay < t).length;
    return `<h2 style="margin-top:0">Τι να κυνηγήσεις</h2><p class="mu" style="margin-top:-6px">Πάτα έναν πελάτη για το φύλλο είσπραξης.</p>` +
      H.box(`Υποσχέθηκαν πληρωμή (${P.length}${late ? ' · <span class="dn">' + late + ' άργησαν</span>' : ''})`, H.list(P.map((id) => { const n = PL.balnotes.get(id), lt = n.pay < t;
        return row(id, (lt ? 'από ' : n.pay === t ? 'σήμερα ' : '') + fdd(n.pay).slice(0, 5), lt ? 'dn' : 'up', money(bv(id, 'amount')) + (n.t ? ' · ' + esc(n.t) : '')); }), 'Καμία υπόσχεση πληρωμής.')) +
      H.box(`Χωρίς ενημέρωση (${noNote.length})`, H.list(noNote.slice(0, 8).map((id) => row(id, money(bv(id, 'amount')), 'dn'))) + (noNote.length > 8 ? `<div class="mu" style="margin-top:6px">+${noNote.length - 8} ακόμα στη λίστα</div>` : '')) +
      (over.length ? H.box(`Με υπέρβαση (${over.length})`, H.list(over.slice(0, 5).map((id) => row(id, money(bv(id, 'over')), 'dn', 'υπόλοιπο ' + money(bv(id, 'amount')))))) : '');
  }
  PL.debt = {
    aside(el) {
      COLS.forEach((c) => S.use(c));
      const paint = () => { el.innerHTML = asideHtml(); };
      paint();
      const offs = COLS.map((c) => S.on(c, paint)).concat(PL.balnotes.on(paint));
      el.addEventListener('click', (ev) => { const r = ev.target.closest('[data-dbo]'); if (r) PL.nav.push('debt', { id: r.dataset.dbo }); });
      return () => offs.forEach((f) => f());
    },
  };
})();
