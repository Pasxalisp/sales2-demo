/* «Φύλλο επίσκεψης» (τάμπλετ, δεξιά από το Πρόγραμμα): ό,τι χρειάζεσαι μπροστά στο κομμωτήριο για έναν πελάτη του προγράμματος.
   Κλήση, Οδηγίες, ✓ Έγινε · με μια ματιά Goldwell / χρέος / συμφωνία · γιατί πας, τι να πεις · τελευταία επαφή ·
   «Τι έγινε σήμερα» (προϊόντα, σημείωση, να πω) με «Αποθήκευση και ✓ Έγινε» · προηγούμενος / επόμενος.
   params: {pid: πρόγραμμα, id: πελάτης}. Γράφει μόνο μέσω PL.notes (σημειώσεις) και PL.plans (✓ στάσης). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, E = PL.plans, D = PL.dlg, esc = u.esc, money = u.money;
  const COLS = ['plans', 'clients', 'prospects', 'notes', 'balances', 'deals', 'sos', 'visits'];
  const PRODUCTS = ['Topchic', 'Colorance', 'Gloss tones', 'Elumen', 'Silklift', 'Subbrand', 'Dualsenses', 'Styling'];

  PL.register('visit', {
    title: 'Επίσκεψη',
    nova: (p) => PL.menu('Επίσκεψη', [{ e: '🎙', label: 'Υπαγόρευση', d: 'πες τι έγινε στον πελάτη', fn: () => { const c = M.byId(p.id); if (c) PL.dictation.open('Στον πελάτη ' + c.name + ' (' + c.city + '): '); } }]),
    render(el, params) {
      const { pid, id } = params;
      COLS.forEach((c) => S.use(c));
      el.innerHTML = '<div id="vstop"></div><div class="shbox"><h3>Τι έγινε σήμερα</h3><div class="shrow" id="vpr" style="margin:0">' +
        PRODUCTS.map((x) => `<button class="chip" data-vp="${esc(x)}">${esc(x)}</button>`).join('') +
        '</div><input id="vp" type="text" placeholder="Προϊόντα που συζητήθηκαν" style="margin-top:8px"><textarea id="vt" placeholder="Τι συζητήσατε…"></textarea><input id="vo" type="text" placeholder="Να πω την επόμενη φορά…">' +
        '<div class="shrow"><button class="pri" id="vsave" style="flex:1">Αποθήκευση και ✓ Έγινε</button><button id="vdict">🎙 Υπαγόρευση</button></div><div class="mu" id="vmsg"></div></div><div id="vbot"></div>';
      const $ = (s) => el.querySelector(s);

      const plan = () => S.get('plans', pid);
      const paint = () => {
        const p = plan(), c = M.byId(id);
        if (!p || !c) { $('#vstop').innerHTML = '<p class="mu">Φορτώνω…</p>'; return; }
        const stops = p.stops || [], k = stops.findIndex((s) => s.id === id), st = stops[k] || {}, done = stops.filter((s) => s.done).length;
        const g = M.gold(c), y = M.yoy(c), bal = S.get('balances', id) || {}, dl = (S.get('deals', 'all') || {})[id], e = M.entries(id)[0], map = PL.call.mapUrl(c);
        const chip = (t, cls) => `<span class="shchip ${cls || ''}">${t}</span>`;
        $('#vstop').innerHTML =
          `<div class="shh"><div><h2>${st.sos || S.get('sos', id) ? '⭐ ' : ''}${PL.prospects.tag(c)}${esc(c.name)}</h2><div class="mu">${esc(c.addr || '')}${c.addr ? ', ' : ''}${esc(c.city)}${st.appt && !st.done ? ` · <b style="color:var(--tx)">🕐 Ραντεβού ${esc(st.appt)}</b>` : ''}</div></div>` +
          `<div class="shstep">Στάση ${k + 1} από ${stops.length} · ✓ ${done}</div></div>` +
          `<div class="sha">${PL.call.tels(c).length ? `<button data-callc="${esc(id)}">${PL.icon.phone}Κλήση</button>` : `<button disabled>${PL.icon.phone}Κλήση</button>`}` +
          `${map ? `<a class="btn" href="${esc(map)}" target="_blank" rel="noopener">${PL.icon.pin}Οδηγίες</a>` : `<button disabled>${PL.icon.pin}Οδηγίες</button>`}` +
          `${st.done ? '<button class="shdone on" id="vundo">✓ Έγινε σήμερα · αναίρεση</button>' : '<button class="shdone" id="vdone">✓ Έγινε η επίσκεψη</button>'}</div>` +
          `<div class="shfacts">${g ? chip('Goldwell φέτος ' + money(g[1]) + (y ? ' · ' + y.txt : ''), y && y.cls === 'dn' ? 'dn' : 'up') : ''}${+bal.amount >= 1 ? chip('💶 Χρωστάει ' + money(+bal.amount), 'dn') : ''}` +
          `${dl ? chip('🤝 Συμφωνία ' + Math.round(M.deal(dl).pct) + '%', 'dl') : ''}${M.works(id).length ? chip('Δουλεύει: ' + esc(M.works(id).join(', '))) : ''}</div>` +
          `<div class="shbox hi"><h3>Γιατί πας</h3>${esc(st.why || '—')}</div>` +
          `<div class="shbox"><h3>Τι να πεις</h3>${(st.say || []).length ? '<ul style="margin:0;padding-left:20px">' + st.say.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<span class="mu">—</span>'}</div>` +
          `<div class="shbox"><h3>Τελευταία επαφή</h3>${e ? `<b>${esc(u.fd(e.d))}</b> ${esc(e.text || '')}${e.products ? ' <span class="mu">(' + esc(e.products) + ')</span>' : ''}${e.todo ? `<div><b>Να πω:</b> ${esc(e.todo)}</div>` : ''}` : '<span class="mu">Καμία σημείωση ακόμα</span>'}</div>`;
        const prev = stops[k - 1], next = stops[k + 1];
        $('#vbot').innerHTML = `<div class="shnav"><button data-vgo="${prev ? esc(prev.id) : ''}"${prev ? '' : ' disabled'}>‹ Προηγούμενος</button>` +
          `<span><button class="shlink" id="vcard">Όλη η καρτέλα ›</button> · <button class="shlink" id="vord">🛒 Παραγγελία</button></span>` +
          `<button data-vgo="${next ? esc(next.id) : ''}"${next ? '' : ' disabled'}>Επόμενος ›</button></div>`;
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));

      /* ✓ στάσης: ίδια διαδρομή με τις Εκκρεμότητες (E.doneStop)· αν ήταν η τελευταία, το εφέ «Ολοκληρώθηκε». */
      const markDone = async () => { const np = await E.doneStop(pid, id); if (np) D.celebrate(np, () => PL.nav.home()); };
      const nextOpen = () => { const s = (plan().stops || []), k = s.findIndex((x) => x.id === id); return s.slice(k + 1).concat(s.slice(0, k)).find((x) => !x.done); };
      el.addEventListener('click', async (ev) => {
        const t = ev.target, b = t.closest('[data-vp],[data-vgo],#vdone,#vundo,#vsave,#vdict,#vcard,#vord'); if (!b) return;
        try {
          if (b.dataset.vp) { const f = $('#vp'), a = f.value.split(',').map((x) => x.trim()).filter(Boolean); if (!a.includes(b.dataset.vp)) a.push(b.dataset.vp); f.value = a.join(', '); f.dispatchEvent(new Event('input', { bubbles: true })); }
          else if (b.dataset.vgo) PL.nav.push('visit', { pid, id: b.dataset.vgo });
          else if (b.id === 'vdone') { b.disabled = true; await markDone(); }
          else if (b.id === 'vundo') { b.disabled = true; await E.undoStop(pid, id); }
          else if (b.id === 'vdict') { const c = M.byId(id); PL.dictation.open('Στον πελάτη ' + c.name + ' (' + c.city + '): '); }
          else if (b.id === 'vcard') PL.nav.push('client', { id });
          else if (b.id === 'vord') await PL.orders.openFor(id);
          else if (b.id === 'vsave') {
            const pr = $('#vp').value.trim(), tx = $('#vt').value.trim(), todo = $('#vo').value.trim();
            b.disabled = true;
            if (pr || tx || todo) await PL.notes.add(id, { d: u.today(), products: pr, text: tx, todo, next: '' });
            ['#vp', '#vt', '#vo'].forEach((s) => { $(s).value = ''; });
            if (!(plan().stops || []).find((x) => x.id === id).done) await markDone();
            $('#vmsg').textContent = '';
            /* συνέχεια στον επόμενο ανοιχτό πελάτη του προγράμματος */
            const n = nextOpen(); if (n) PL.nav.push('visit', { pid, id: n.id }); else b.disabled = false;
          }
        } catch (x) { $('#vmsg').textContent = 'Δεν αποθηκεύτηκε: ' + ((x && x.message) || x); el.querySelectorAll('button').forEach((y) => { y.disabled = false; }); paint(); }
      });
      return () => offs.forEach((f) => f());
    },
  });
})();
