/* «Φύλλο αγοράς» (τάμπλετ, δεξιά από το «Ποιος αγόρασε…» και τις «Πωλήσεις»): τι πήρε ο πελάτης από το προϊόν που ψάχνεις
   (τεμάχια πέρσι → φέτος, αξία), τι άλλο παίρνει φέτος, Κλήση / Οδηγίες / Παραγγελία. Μόνο ανάγνωση.
   params: {id, q} = αναζήτηση όπως στο «Ποιος αγόρασε» (δέχεται παρατσούκλια) ή {id, n} = ακριβώς ένα είδος (Πωλήσεις). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, H = PL.sheet, esc = u.esc, nn = u.nn;
  const COLS = ['items', 'clients', 'prospects', 'notes', 'balances', 'deals'];
  const tok = (s) => nn(s).replace(/[()/,+&]/g, ' ').split(/\s+/).filter(Boolean);

  PL.register('buyer', {
    title: 'Αγορές πελάτη',
    render(el, params) {
      const { id, q, n } = params;
      let all = false;   // «Δείξε όλα» για αναζήτηση με πολλά είδη
      COLS.forEach((c) => S.use(c));
      const paint = () => {
        const c = M.byId(id); if (!c || !S.loaded('items')) { el.innerHTML = '<p class="mu">Φορτώνω…</p>'; return; }
        const it = ((S.get('items', id) || {}).it || []).filter((x) => (+x.qc || 0) || (+x.qp || 0)), qs = q ? tok(q) : [];
        const hit = it.filter((x) => (n ? x.n === n : qs.length && PL.wb.match(x.n, x.g, qs)));
        const sum = (L, k) => L.reduce((a, x) => a + (+x[k] || 0), 0), qc = sum(hit, 'qc'), qp = sum(hit, 'qp'), tc = sum(hit, 'tc');
        const row = (x) => `<div class="shr"><span>${esc(x.n)}</span><span class="${!(+x.qc) ? 'dn' : ''}" style="white-space:nowrap">${+x.qp || 0} → <b>${+x.qc || 0}</b>${+x.tc ? ' · ' + u.money(+x.tc) : ''}</span></div>`;
        const stop = hit.filter((x) => !(+x.qc) && +x.qp > 0).sort((a, b) => (+b.qp || 0) - (+a.qp || 0)), now = hit.filter((x) => +x.qc > 0).sort((a, b) => (+b.qc || 0) - (+a.qc || 0));
        const other = it.filter((x) => !hit.includes(x) && +x.qc > 0).sort((a, b) => (+b.tc || 0) - (+a.tc || 0)).slice(0, 6);
        el.innerHTML = H.head(c, esc(c.city) + (c.area ? ' · ' + esc(c.area) : '') + (c.code ? ' · κωδ. ' + esc(c.code) : '')) +
          H.acts(H.call(c), H.map(c), '<button id="byord">🛒 Παραγγελία</button>') +
          H.box(esc(n || '«' + (q || '') + '»') + ' <span style="text-transform:none;font-weight:400">· τεμ. πέρσι → φέτος</span>',
            hit.length === 1 ? row(hit[0]) + (stop.length ? '<div class="dn" style="margin-top:6px">⚠️ Πέρσι το έπαιρνε, φέτος όχι</div>' : '')
            : hit.length ? `<div class="shr" style="font-size:17px;padding-bottom:6px"><b>${hit.length} είδη</b><span>${qp} → <b>${qc}</b>${tc ? ' · ' + u.money(tc) : ''}</span></div>` +
              (stop.length ? `<div class="dn" style="margin:6px 0 2px">⚠️ Πέρσι ναι, φέτος όχι (${stop.length}):</div>` + stop.map(row).join('') : '') +
              (now.length ? (stop.length ? '<div class="mu" style="margin:8px 0 2px">Φέτος:</div>' : '') + now.slice(0, all ? 999 : 10).map(row).join('') +
                (now.length > 10 && !all ? `<button class="shlink" id="byall">Δείξε όλα (${now.length}) ▾</button>` : '') : '')
              : '<span class="mu">Δεν το έχει πάρει φέτος ή πέρσι.</span>', 'hi') +
          (other.length ? H.box('Τι άλλο παίρνει φέτος', other.map(row).join('')) : '') +
          H.facts(c) + H.last(id) +
          H.nav(id, 'Λίστα', n ? `<button class="shlink" data-byitem="${esc(n)}">‹ ${esc(n.length > 28 ? n.slice(0, 27) + '…' : n)}</button>` : '') +
          `<p class="mu" style="font-size:12px">Περίοδος: 1/1 έως ${esc(u.fd((S.get('items', id) || {}).d || ''))}, φέτος και ίδια περίοδος πέρσι (orders).</p>`;
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      el.addEventListener('click', async (ev) => {
        const t = ev.target;
        if (t.id === 'byord') await PL.orders.openFor(id);
        else if (t.id === 'byall') { all = true; paint(); }
        else if (t.closest('[data-byitem]')) PL.nav.push('salesitem', { key: t.closest('[data-byitem]').dataset.byitem });
      });
      return () => offs.forEach((f) => f());
    },
  });
})();
