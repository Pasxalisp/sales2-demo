/* «Φύλλο επίσκεψης» (τάμπλετ, δεξιά από το Πρόγραμμα ή τα «Εκτός προγράμματος»): ό,τι χρειάζεσαι μπροστά στο κομμωτήριο.
   Κλήση, Οδηγίες, ✓ Έγινε · με μια ματιά Goldwell / χρέος / συμφωνία · γιατί πας, τι να πεις (πρόγραμμα) · τελευταία επαφή ·
   «Τι έγινε σήμερα» (προϊόντα, σημείωση, να πω) με «Αποθήκευση και ✓».
   params: {pid: πρόγραμμα, id: πελάτης} ή μόνο {id} = εκτός προγράμματος (το ✓ πάει στα «εκτός προγράμματος» της μέρας).
   Γράφει μόνο μέσω PL.notes (σημειώσεις) και PL.plans (✓). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, E = PL.plans, D = PL.dlg, H = PL.sheet, esc = u.esc;
  const COLS = ['plans', 'clients', 'prospects', 'notes', 'balances', 'deals', 'sos', 'visits', 'settings'];
  const PRODUCTS = ['Topchic', 'Colorance', 'Gloss tones', 'Elumen', 'Silklift', 'Subbrand', 'Dualsenses', 'Styling'];
  const fmt = (d) => (d ? String(d).split('-').reverse().slice(0, 2).join('/') : '');

  PL.register('visit', {
    title: 'Επίσκεψη',
    nova: (p) => PL.menu('Επίσκεψη', [{ e: '🎙', label: 'Υπαγόρευση', d: 'πες τι έγινε στον πελάτη', fn: () => { const c = M.byId(p.id); if (c) PL.dictation.open('Στον πελάτη ' + c.name + ' (' + c.city + '): '); } }]),
    render(el, params) {
      const { pid, id } = params, free = !pid;
      COLS.forEach((c) => S.use(c));
      el.innerHTML = '<div id="vstop"></div><div class="shbox"><h3>Τι έγινε σήμερα</h3><div class="shrow" id="vpr" style="margin:0">' +
        PRODUCTS.map((x) => `<button class="chip" data-vp="${esc(x)}">${esc(x)}</button>`).join('') +
        '</div><input id="vp" type="text" placeholder="Προϊόντα που συζητήθηκαν" style="margin-top:8px"><textarea id="vt" placeholder="Τι συζητήσατε…"></textarea><input id="vo" type="text" placeholder="Να πω την επόμενη φορά…">' +
        `<div class="shrow"><button class="pri" id="vsave" style="flex:1">Αποθήκευση και ✓ ${free ? 'Επίσκεψη' : 'Έγινε'}</button><button id="vdict">🎙 Υπαγόρευση</button></div><div class="mu" id="vmsg"></div></div><div id="vbot"></div>`;
      const $ = (s) => el.querySelector(s);
      const base = () => (S.get('settings', 'trips') || {}).base;
      const plan = () => (free ? null : S.get('plans', pid));
      const stop = () => ((plan() || {}).stops || []).find((s) => s.id === id) || {};
      const isDone = () => (free ? E.visitedToday(id) : !!stop().done);

      const paint = () => {
        const p = plan(), c = M.byId(id);
        if ((!free && !p) || !c) { $('#vstop').innerHTML = '<p class="mu">Φορτώνω…</p>'; return; }
        const stops = free ? [] : p.stops || [], k = stops.findIndex((s) => s.id === id), st = stops[k] || {}, done = isDone();
        const ap = free ? E.apptOf(id) : (st.appt ? { appt: st.appt } : null), lv = E.lastVisit(id);
        const right = free ? (lv ? 'Τελευταία επίσκεψη ' + fmt(lv) : 'Καμία επίσκεψη') : `Στάση ${k + 1} από ${stops.length} · ✓ ${stops.filter((s) => s.done).length}`;
        $('#vstop').innerHTML =
          H.head(c, `${esc(c.addr || '')}${c.addr ? ', ' : ''}${esc(c.city)}${ap && !done ? ` · <b style="color:var(--tx)">🕐 Ραντεβού ${ap.d && ap.d !== u.today() ? fmt(ap.d) + ' ' : ''}${esc(ap.appt)}</b>` : ''}`, right, st.sos || S.get('sos', id)) +
          H.acts(H.call(c), H.map(c), done ? `<button class="shdone on" id="vundo">✓ ${free ? 'Επίσκεψη' : 'Έγινε'} σήμερα · αναίρεση</button>` : `<button class="shdone" id="vdone">✓ ${free ? 'Επίσκεψη' : 'Έγινε η επίσκεψη'}</button>`) +
          H.facts(c) +
          (free ? '' : H.box('Γιατί πας', esc(st.why || '—'), 'hi') +
            H.box('Τι να πεις', (st.say || []).length ? '<ul style="margin:0;padding-left:20px">' + st.say.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<span class="mu">—</span>')) +
          H.last(id);
        const prev = stops[k - 1], next = stops[k + 1], mid = '<button class="shlink" id="vord">🛒 Παραγγελία</button>';
        $('#vbot').innerHTML = free ? H.nav(id, 'Λίστα', mid)
          : `<div class="shnav"><button data-vgo="${prev ? esc(prev.id) : ''}"${prev ? '' : ' disabled'}>‹ Προηγούμενος</button>` +
            `<span><button class="shlink" data-shcard="${esc(id)}">Όλη η καρτέλα ›</button> · ${mid}</span>` +
            `<button data-vgo="${next ? esc(next.id) : ''}"${next ? '' : ' disabled'}>Επόμενος ›</button></div>`;
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));

      /* ✓ στο πρόγραμμα: ίδια διαδρομή με τις Εκκρεμότητες (E.doneStop)· αν ήταν η τελευταία, το εφέ «Ολοκληρώθηκε».
         Εκτός προγράμματος: E.visit (ίδιο με το «✓ Επίσκεψη» της λίστας). */
      const markDone = async () => { if (free) { await E.visit(id, true, base()); return; } const np = await E.doneStop(pid, id); if (np) D.celebrate(np, () => PL.nav.home()); };
      const undo = () => (free ? E.visit(id, false, base()) : E.undoStop(pid, id));
      const nextOpen = () => { const s = (plan().stops || []), k = s.findIndex((x) => x.id === id); return s.slice(k + 1).concat(s.slice(0, k)).find((x) => !x.done); };
      el.addEventListener('click', async (ev) => {
        const t = ev.target, b = t.closest('[data-vp],[data-vgo],#vdone,#vundo,#vsave,#vdict,#vord'); if (!b) return;
        try {
          if (b.dataset.vp) { const f = $('#vp'), a = f.value.split(',').map((x) => x.trim()).filter(Boolean); if (!a.includes(b.dataset.vp)) a.push(b.dataset.vp); f.value = a.join(', '); f.dispatchEvent(new Event('input', { bubbles: true })); }
          else if (b.dataset.vgo) PL.nav.push('visit', { pid, id: b.dataset.vgo });
          else if (b.id === 'vdone') { b.disabled = true; await markDone(); }
          else if (b.id === 'vundo') { b.disabled = true; await undo(); }
          else if (b.id === 'vdict') { const c = M.byId(id); PL.dictation.open('Στον πελάτη ' + c.name + ' (' + c.city + '): '); }
          else if (b.id === 'vord') await PL.orders.openFor(id);
          else if (b.id === 'vsave') {
            const pr = $('#vp').value.trim(), tx = $('#vt').value.trim(), todo = $('#vo').value.trim();
            b.disabled = true;
            if (pr || tx || todo) await PL.notes.add(id, { d: u.today(), products: pr, text: tx, todo, next: '' });
            ['#vp', '#vt', '#vo'].forEach((s) => { $(s).value = ''; });
            if (!isDone()) await markDone();
            $('#vmsg').textContent = '';
            /* πρόγραμμα: συνέχεια στον επόμενο ανοιχτό πελάτη · εκτός προγράμματος: μένει εδώ */
            const n = free ? null : nextOpen(); if (n) PL.nav.push('visit', { pid, id: n.id }); else { b.disabled = false; D.toast('✓ Αποθηκεύτηκε'); }
          }
        } catch (x) { $('#vmsg').textContent = 'Δεν αποθηκεύτηκε: ' + ((x && x.message) || x); el.querySelectorAll('button').forEach((y) => { y.disabled = false; }); paint(); }
      });
      return () => offs.forEach((f) => f());
    },
  });
})();
