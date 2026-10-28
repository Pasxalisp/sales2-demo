/* «Φύλλο εκκρεμότητας» (τάμπλετ, δεξιά από τις Εκκρεμότητες): τι εκκρεμεί και από πότε, Κλήση / Μήνυμα / ✓ Έγινε,
   μετάθεση με ένα πάτημα, προαιρετική σημείωση (μπαίνει στην καρτέλα), με μια ματιά (Goldwell, χρέος, συμφωνία) και τελευταία επαφή.
   params: {key} όπως το PL.tasks.keyOf (ραντεβού A|…, πληρωμή P|…, εκκρεμότητα T|…, επόμενη επαφή πελάτης|θέση). */
(function () {
  const PL = window.PL, u = PL.u, S = PL.store, D = PL.dlg, H = PL.sheet, esc = u.esc;
  const COLS = ['clients', 'prospects', 'notes', 'tasks', 'balnotes', 'balances', 'plans', 'deals'];
  const plus = (n) => new Date(Date.parse(u.today()) + n * 864e5).toISOString().slice(0, 10);

  PL.register('task', {
    title: 'Εκκρεμότητα',
    render(el, params) {
      const key = params.key, appt = key.startsWith('A|');
      COLS.forEach((c) => S.use(c));
      el.innerHTML = '<div id="tktop"></div>' +
        (appt ? '<div class="shbox"><h3>Μετάθεση</h3><span class="mu">Το ραντεβού αλλάζει από το πρόγραμμα.</span></div>'
          : '<div class="shbox"><h3>Μετάθεση</h3><div class="shrow" style="margin:0"><button class="chip" data-tkm="1">Αύριο</button><button class="chip" data-tkm="3">Σε 3 μέρες</button><button class="chip" data-tkm="7">Σε μία εβδομάδα</button><input type="date" id="tkd" style="width:auto"><button data-tkm="d">Μετάθεση</button></div></div>') +
        '<div class="shbox" id="tknb"><h3>Σημείωση (προαιρετικά)</h3><textarea id="tknote" placeholder="π.χ. Είπε να τον πάρω μετά τις 6"></textarea></div><div id="tkbot"></div><div class="mu" id="tkmsg"></div>';
      const $ = (s) => el.querySelector(s);
      const paint = () => {
        const x = PL.tasks.find(key);
        if (!x) { if (S.loaded('notes')) { $('#tktop').innerHTML = '<p class="mu">Η εκκρεμότητα έκλεισε.</p>'; $('#tkbot').innerHTML = ''; } return; }
        const c = x.c, t = u.today(), late = x.e.next < t;
        $('#tknb').hidden = !c;
        const when = (x.e.next === t ? 'Σήμερα' : (late ? 'Από ' : 'Στις ') + esc(u.fd(x.e.next))) + (x.e.nt ? ' ' + esc(x.e.nt) : '') + (late ? ' · <span class="dn">καθυστέρηση</span>' : '');
        $('#tktop').innerHTML = (c ? H.head(c, esc(c.city) + ' · ' + when) : `<div class="shh"><div><h2>📝 Εκκρεμότητα</h2><div class="mu">${when}</div></div></div>`) +
          `<div class="shbox hi" style="margin-top:12px"><h3>Τι εκκρεμεί</h3><div style="font-size:18px">${esc(x.e.todo || '—')}</div></div>` +
          H.acts(H.call(c), H.sms(c), '<button class="shdone" id="tkdone">✓ Έγινε</button>');
        $('#tkbot').innerHTML = (c ? H.facts(c) + H.last(c.i) : '') + H.nav(c && c.i, 'Ημερολόγιο');
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      /* η σημείωση (αν γράφτηκε) μπαίνει στην καρτέλα πριν το ✓ ή τη μετάθεση */
      const saveNote = async () => { const x = PL.tasks.find(key), n = $('#tknote').value.trim(); if (x && x.c && n) { await PL.notes.add(x.c.i, { d: u.today(), products: '', text: n, todo: '', next: '' }); $('#tknote').value = ''; } };
      el.addEventListener('click', async (ev) => {
        const b = ev.target.closest('#tkdone,[data-tkm]'); if (!b) return;
        try {
          if (b.id === 'tkdone') { b.disabled = true; await saveNote(); await PL.tasks.done(key); D.toast('✓ Έγινε'); PL.nav.back(); }
          else if (b.dataset.tkm) {
            const d = b.dataset.tkm === 'd' ? $('#tkd').value : plus(+b.dataset.tkm);
            if (!d) { $('#tkmsg').textContent = 'Διάλεξε ημερομηνία.'; return; }
            b.disabled = true; await saveNote(); await PL.tasks.move(key, d); D.toast('Μετατέθηκε για ' + u.fd(d)); PL.nav.back();
          }
        } catch (x) { $('#tkmsg').textContent = 'Δεν αποθηκεύτηκε: ' + ((x && x.message) || x); b.disabled = false; }
      });
      return () => offs.forEach((f) => f());
    },
  });
})();
