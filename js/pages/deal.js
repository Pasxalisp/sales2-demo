/* «Φύλλο συμφωνίας» (τάμπλετ, δεξιά από τις Συμφωνίες): πρόοδος με τη γραμμή «πού θα έπρεπε να είμαστε», πρόταση
   παραγγελιών, μήνυμα στον πελάτη έτοιμο να το διορθώσεις (SMS / αντιγραφή — το στέλνεις εσύ), ✓ Ενημερώθηκε, Αγνόηση,
   τι παίρνει φέτος (από τα είδη του orders), Κλήση / Οδηγίες / Παραγγελία. params: {id}.
   Και το δεξί μέρος των Συμφωνιών χωρίς επιλογή: PL.dealSheet.aside(el). Γράφει μόνο μέσω PL.deals (dealmsg). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, D = PL.dlg, H = PL.sheet, esc = u.esc, eur = u.eur;
  const COLS = ['deals', 'dealmsg', 'clients', 'prospects', 'notes', 'balances', 'items', 'cats'];
  const dmy = (d) => (d ? d.split('-').reverse().join('/') : '');
  const X = (id) => (S.get('deals', 'all') || {})[id];

  PL.register('deal', {
    title: 'Συμφωνία',
    render(el, params) {
      const id = params.id;
      COLS.forEach((c) => S.use(c));
      el.innerHTML = '<div id="dktop"></div><div class="shbox" id="dkmb"><h3>Μήνυμα στον πελάτη</h3><textarea id="dkmt" rows="8" style="min-height:170px;font-size:15px;line-height:1.4"></textarea>' +
        '<div class="mu" id="dkmn" style="font-size:12.5px"></div><div class="shrow"><a class="btn" id="dksms" href="#" target="_blank" rel="noopener" style="flex:1;text-align:center;background:#23875a;border-color:#23875a;color:#fff;font-weight:700">📱 Άνοιγμα SMS</a><button id="dkcp" style="flex:1">📋 Αντιγραφή</button><button id="dkre" title="Ξανά το αρχικό κείμενο">↺</button></div>' +
        '<div class="shrow" id="dkst"></div></div><div id="dkbot"></div>';
      const $ = (s) => el.querySelector(s);
      let filled = false;
      const link = () => { const c = M.byId(id); $('#dksms').href = PL.call.sms(c, $('#dkmt').value); $('#dkmn').textContent = c && PL.names.mobile(c) ? 'Θα ανοίξει το SMS προς ' + PL.names.mobile(c) + ' με το κείμενο έτοιμο. Το στέλνεις εσύ.' : 'Δεν βρήκα κινητό: το SMS θα ανοίξει χωρίς παραλήπτη.'; };
      const paint = () => {
        const c = M.byId(id), x = X(id);
        if (!c || !x) { $('#dktop').innerHTML = S.loaded('deals') && c ? '<p class="mu">Δεν υπάρχει συμφωνία για αυτόν τον πελάτη.</p>' : '<p class="mu">Φορτώνω…</p>'; $('#dkmb').hidden = !!(S.loaded('deals') && c); return; }
        $('#dkmb').hidden = false;
        if (!filled) { filled = true; $('#dkmt').value = PL.deals.text(id); link(); }
        const i = M.deal(x), P = i.done ? null : PL.deals.plan(id), ig = PL.deals.ignored(id), sd = PL.deals.sent(id);
        const k = (l, v, cls) => `<div><span>${l}</span><b class="${cls || ''}">${v}</b></div>`;
        $('#dktop').innerHTML = H.head(c, esc(c.city) + ' · συμφωνία ' + eur(x.goal) + (ig ? ' · <span class="mu">σε αγνόηση</span>' : ''), `<b style="font-size:26px;color:var(--tx)">${Math.round(i.pct)}%</b>`) +
          PL.deals.bar(x) +
          `<div class="shk">${k('Φέτος', eur(x.ty))}${k('Πέρσι', eur(x.ly))}${i.done ? k('Συμφωνία', '✓ Την έπιασε', 'up') : k('Μένουν', eur(i.left)) + k(i.ahead >= 0 ? 'Μπροστά από τον ρυθμό' : 'Πίσω από τον ρυθμό', (i.ahead >= 0 ? '▲ ' : '▼ ') + eur(Math.abs(i.ahead)), i.ahead >= 0 ? 'up' : 'dn')}</div>` +
          H.acts(H.call(c), H.map(c), '<button id="dkord">🛒 Παραγγελία</button>') +
          (P ? H.box('💡 Πρόταση', `<div style="font-size:17px">${esc(P.when)}.</div><div class="mu" style="margin-top:4px">Χρειάζεται ~${eur(i.perM)}/μήνα · συνήθως παίρνει ~${eur(P.avg)}/μήνα</div>`, 'hi') : '');
        $('#dkst').innerHTML = `<button class="dlsb${sd ? ' on' : ''}" data-dlsent="${esc(id)}" style="flex:1">✓ Ενημερώθηκε · ${sd ? dmy(sd) : 'όχι ακόμα'}</button><button data-dlign="${esc(id)}">${ig ? '↩ Επαναφορά' : '🚫 Αγνόηση'}</button>`;
        /* τι παίρνει φέτος: τα είδη με τη μεγαλύτερη αξία, και όσα έπαιρνε πέρσι αλλά φέτος όχι */
        const it = ((S.get('items', id) || {}).it || []).filter((y) => (+y.qc || 0) || (+y.qp || 0));
        const top = it.filter((y) => +y.qc > 0).sort((a, b) => (+b.tc || 0) - (+a.tc || 0)).slice(0, 6), lost = it.filter((y) => !(+y.qc) && +y.qp > 0).sort((a, b) => (+b.qp || 0) - (+a.qp || 0)).slice(0, 4);
        const li = (y, cls) => `<div class="shr"><span>${esc(y.n)}</span><span class="${cls || ''}">${+y.qp || 0} → <b>${+y.qc || 0}</b></span></div>`;
        $('#dkbot').innerHTML = (it.length ? H.box('Τι παίρνει φέτος <span style="text-transform:none;font-weight:400">(τεμ. πέρσι → φέτος)</span>', top.map((y) => li(y)).join('') + (lost.length ? '<div class="mu" style="margin:8px 0 2px">Πέρσι το έπαιρνε, φέτος όχι:</div>' + lost.map((y) => li(y, 'dn')).join('') : '')) : '') +
          H.facts(c, { deal: true }) + H.last(id) + H.nav(id);
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      $('#dkmt').addEventListener('input', link);
      el.addEventListener('click', async (ev) => {
        const t = ev.target;
        if (PL.deals.click(t)) return;   /* ✓ Ενημερώθηκε / Αγνόηση */
        if (t.id === 'dkord') await PL.orders.openFor(id);
        else if (t.id === 'dkre') { $('#dkmt').value = PL.deals.text(id); link(); }
        else if (t.id === 'dkcp') { let ok = false; try { await navigator.clipboard.writeText($('#dkmt').value); ok = true; } catch (x) { /* τίποτα */ } D.toast(ok ? '📋 Αντιγράφηκε: άνοιξε Viber ή Μηνύματα και κάνε Επικόλληση' : 'Δεν αντιγράφηκε. Επίλεξε το κείμενο και αντέγραψέ το.'); }
      });
      return () => offs.forEach((f) => f());
    },
  });

  /* Δεξί μέρος χωρίς επιλογή: ποιους να ενημερώσεις (πίσω από τον ρυθμό, δεν ενημερώθηκαν 30+ μέρες) και ποιοι είναι κοντά. */
  function asideHtml() {
    if (!S.loaded('deals')) return '<p class="mu">Φορτώνω…</p>';
    const L = PL.deals.list().filter(([id]) => !PL.deals.ignored(id)), m30 = new Date(Date.parse(u.today()) - 30 * 864e5).toISOString().slice(0, 10);
    const row = ([id, x], right, cls, sub) => ({ attr: `data-dko="${esc(id)}"`, name: esc(M.byId(id).name), sub: esc(M.byId(id).city) + ' · ' + sub, right, cls });
    const tell = L.filter(([id, x]) => !M.deal(x).done && M.deal(x).ahead < 0 && (PL.deals.sent(id) || '') < m30).sort((a, b) => M.deal(a[1]).ahead - M.deal(b[1]).ahead);
    const near = L.filter(([, x]) => !M.deal(x).done && M.deal(x).pct >= 80).sort((a, b) => M.deal(b[1]).pct - M.deal(a[1]).pct);
    const done = L.filter(([, x]) => M.deal(x).done);
    return `<h2 style="margin-top:0;color:#7a3fb8">Ποιους να ενημερώσεις</h2><p class="mu" style="margin-top:-6px">Πάτα μια συμφωνία για το φύλλο της με το μήνυμα έτοιμο.</p>` +
      H.box(`Πίσω από τον ρυθμό, χωρίς ενημέρωση 30+ μέρες (${tell.length})`, H.list(tell.slice(0, 10).map((r) => row(r, '▼ ' + eur(-M.deal(r[1]).ahead), 'dn', Math.round(M.deal(r[1]).pct) + '% · ' + (PL.deals.sent(r[0]) ? 'ενημ. ' + dmy(PL.deals.sent(r[0])) : 'δεν ενημερώθηκε'))), 'Όλοι ενημερωμένοι. 👌') + (tell.length > 10 ? `<div class="mu" style="margin-top:6px">+${tell.length - 10} ακόμα</div>` : '')) +
      H.box(`Κοντά στον στόχο (${near.length})`, H.list(near.slice(0, 6).map((r) => row(r, Math.round(M.deal(r[1]).pct) + '%', 'up', 'μένουν ' + eur(M.deal(r[1]).left))), 'Κανείς πάνω από 80% ακόμα.')) +
      (done.length ? H.box(`✓ Την έπιασαν (${done.length})`, H.list(done.slice(0, 6).map((r) => row(r, Math.round(M.deal(r[1]).pct) + '%', 'up', 'φέτος ' + eur(r[1].ty))))) : '');
  }
  PL.dealSheet = {
    aside(el) {
      COLS.forEach((c) => S.use(c));
      const paint = () => { el.innerHTML = asideHtml(); };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      el.addEventListener('click', (ev) => { const r = ev.target.closest('[data-dko]'); if (r) PL.nav.push('deal', { id: r.dataset.dko }); });
      return () => offs.forEach((f) => f());
    },
  };
})();
