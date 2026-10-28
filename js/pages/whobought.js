/* «Ποιος αγόρασε…»: προϊόν (δέχεται παρατσούκλια) + περιοχές → πελάτες με τεμάχια φέτος/πέρσι και αξία.
   Τάμπλετ: πάτημα σε πελάτη → φύλλο αγοράς δεξιά (buyer.js)· χωρίς πάτημα, όσοι το έπαιρναν πέρσι και φέτος όχι.
   Εκθέτει PL.wb.query για την Υπαγόρευση. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, esc = u.esc, nn = u.nn;
  const AL = { βαφη: ['topchic', 'tc'], βαφες: ['topchic', 'tc'], βαφειο: ['topchic', 'tc'], ρεφλε: ['colorance', 'col'], gloss: ['gloss'], ντεκαπαζ: ['silklift', 'ld'], ξανοιγμα: ['silklift', 'ld'], πλεξ: ['bond'], οξυζενε: ['developer', 'dev', 'lotion'], λουτηρα: ['ds'], μεταπωληση: ['ds'], σαμπουαν: ['sh', 'shampoo'], μασκα: ['mask', 'trt'], λακ: ['lacquer'], κερι: ['wax', 'pomade'], δοχειο: ['can', 'δοχειο', '250ml', '120ml'], σωληναριο: ['60ml', 'tb'] };
  const tk = (s) => nn(s).replace(/[()/,+&]/g, ' ').split(/\s+/).filter(Boolean);
  function match(name, g, qs) { const H = tk(name + ' ' + (g || '')); for (const t of qs) { const A = AL[t]; const m = A ? H.some((w) => A.includes(w)) : H.some((w) => w === t || w.startsWith(t)); if (!m) return false; } return true; }
  /* cities: Set ονομάτων πόλης (κενό = όλες). sort: c (φέτος) | p (πέρσι) | v (αξία). */
  function query(q, cities, sort) {
    const qs = tk(q); if (!qs.length) return null; const rows = [], names = {}; let d = '';
    const IT = S.all('items');
    for (const cid in IT) { const c = M.byId(cid); if (!c) continue; if (cities && cities.size && !cities.has(c.city)) continue; const X = IT[cid]; if (X.d && X.d > d) d = X.d;
      const its = (X.it || []).filter((x) => match(x.n, x.g, qs) && ((+x.qc || 0) || (+x.qp || 0))); if (!its.length) continue;
      let qp = 0, qc = 0, tc = 0; its.forEach((x) => { qp += +x.qp || 0; qc += +x.qc || 0; tc += +x.tc || 0; names[x.n] = (names[x.n] || 0) + 1; }); rows.push({ c, its, qp, qc, tc }); }
    const k = sort === 'p' ? 'qp' : sort === 'v' ? 'tc' : 'qc';
    rows.sort((a, b) => b[k] - a[k] || b.qc - a.qc || a.c.name.localeCompare(b.c.name, 'el')); return { rows, names, d };
  }
  PL.wb = { query, match };
  const st = { q: '', sel: new Set(), sort: 'c', cq: '' };
  let asidePaint = () => {};   // το δεξί μέρος (τάμπλετ) ακολουθεί την αναζήτηση της λίστας

  /* Δεξί μέρος χωρίς επιλογή: όσοι το έπαιρναν πέρσι και φέτος όχι (για τηλέφωνο), και οι μεγαλύτεροι φέτος. */
  function asideHtml() {
    const H = PL.sheet, r = query(st.q, st.sel, 'c');
    if (!S.loaded('items')) return '<p class="mu">Φορτώνω…</p>';
    if (!r) return '<h2 style="margin-top:0">Ποιος αγόρασε</h2><p class="mu">Γράψε ένα προϊόν αριστερά. Εδώ θα δεις ποιοι το έπαιρναν πέρσι και φέτος όχι, και τους μεγαλύτερους φέτος. Πάτα έναν πελάτη για τι ακριβώς πήρε.</p>';
    const row = (x, right, cls) => ({ attr: `data-byo="${esc(x.c.i)}"`, name: esc(x.c.name), sub: esc(x.c.city) + (x.c.area ? ' · ' + esc(x.c.area) : ''), right, cls });
    const lost = r.rows.filter((x) => x.qp && !x.qc).sort((a, b) => b.qp - a.qp), top = r.rows.filter((x) => x.qc).slice(0, 8);
    return `<h2 style="margin-top:0">«${esc(st.q)}»</h2><p class="mu" style="margin-top:-6px">${r.rows.length} πελάτες${st.sel.size ? ' σε ' + esc([...st.sel].join(', ')) : ''}. Πάτα έναν για τι ακριβώς πήρε.</p>` +
      H.box(`⚠️ Πέρσι το έπαιρναν, φέτος όχι (${lost.length})`, H.list(lost.slice(0, 12).map((x) => row(x, 'πέρσι ' + x.qp + ' τεμ.', 'dn')), 'Κανένας. 👌')) +
      H.box(`Οι μεγαλύτεροι φέτος`, H.list(top.map((x) => row(x, x.qc + ' τεμ.' + (x.tc ? ' · ' + u.money(Math.round(x.tc)) : ''), 'up')), 'Κανένας φέτος.'));
  }

  PL.register('whobought', {
    title: 'Ποιος αγόρασε',
    split: ['client', 'buyer'],
    aside(el) {
      const paint = () => { el.innerHTML = asideHtml(); };
      asidePaint = paint; paint();
      const offs = ['items', 'clients'].map((c) => S.on(c, paint));
      el.addEventListener('click', (ev) => { const r = ev.target.closest('[data-byo]'); if (r) PL.nav.push('buyer', { id: r.dataset.byo, q: st.q }); });
      return () => { asidePaint = () => {}; offs.forEach((f) => f()); };
    },
    render(el) {
      el.classList.add('wb');
      el.innerHTML = `<h2>🔎 Ποιος αγόρασε…</h2>
        <label>Προϊόν</label><input id="wbq" placeholder="π.χ. ρεφλέ 5na, βαφή 7n, silklift strong, lagoom" autocomplete="off">
        <label>Περιοχές <span id="wbcn" class="mu"></span></label><input id="wbcq" placeholder="Αναζήτηση περιοχής…" autocomplete="off" style="margin-bottom:6px"><div class="cts" id="wbc"></div>
        <div style="display:flex;gap:6px;margin-top:8px"><button id="wbclr" style="flex:none">Όλες οι περιοχές</button><select id="wbs" style="flex:1;min-width:0"><option value="c">Ταξινόμηση: φέτος</option><option value="p">Ταξινόμηση: πέρσι</option><option value="v">Ταξινόμηση: αξία φέτος</option></select></div>
        <div id="wbr"></div><p class="mu" style="font-size:12px;margin-top:14px" id="wbn"></p>`;
      ['items', 'clients', 'prospects'].forEach((c) => S.use(c));
      const $ = (s) => el.querySelector(s);
      $('#wbq').value = st.q; $('#wbs').value = st.sort;
      const renderC = () => { const f = nn($('#wbcq').value), cm = {}; M.clients().forEach((c) => { if (!c.prospect) cm[c.city] = (cm[c.city] || 0) + 1; });
        $('#wbc').innerHTML = Object.keys(cm).sort((a, b) => (st.sel.has(b) - st.sel.has(a)) || a.localeCompare(b, 'el')).filter((k) => !f || nn(k).includes(f) || st.sel.has(k)).map((k) => `<button class="${st.sel.has(k) ? 'on' : ''}" data-c="${esc(k)}">${st.sel.has(k) ? '✓ ' : ''}${esc(k)} <span style="opacity:.6">${cm[k]}</span></button>`).join('');
        $('#wbcn').textContent = st.sel.size ? '· ' + st.sel.size + ' επιλεγμένες' : '· όλες'; };
      const render = () => {
        asidePaint();
        const r = query($('#wbq').value, st.sel, st.sort), box = $('#wbr');
        if (!S.loaded('items')) { box.innerHTML = '<p class="mu">Φορτώνω…</p>'; return; }
        if (!r) { box.innerHTML = '<p class="mu">Γράψε ένα προϊόν. Καταλαβαίνω και τα παρατσούκλια: βαφή, ρεφλέ, ντεκαπάζ, οξυζενέ, πλεξ, λουτήρα.</p>'; $('#wbn').textContent = ''; return; }
        const N = Object.keys(r.names).sort((a, b) => r.names[b] - r.names[a]), tq = r.rows.reduce((s, x) => s + x.qc, 0), tp = r.rows.reduce((s, x) => s + x.qp, 0);
        box.innerHTML = `<div class="sum"><b>${r.rows.length}</b> πελάτες${st.sel.size ? ' σε ' + esc([...st.sel].join(', ')) : ''} · φέτος <b>${tq}</b> τεμ. · πέρσι ${tp} τεμ.</div>` +
          (N.length ? `<div class="it">Είδη που ταιριάζουν: ${N.slice(0, 8).map(esc).join(' · ')}${N.length > 8 ? ' · +' + (N.length - 8) + ' ακόμα' : ''}</div>` : '') +
          (r.rows.length ? r.rows.slice(0, 200).map((x) => { const stp = x.qp && !x.qc;
            return `<div class="wr" data-open="${esc(x.c.i)}"><div><div class="n">${esc(x.c.name)}</div><div class="c">${esc(x.c.city)}${x.c.area ? ' · ' + esc(x.c.area) : ''} · ${esc(x.c.code || '')}</div></div><div class="q">φέτος <b>${x.qc}</b><br>πέρσι ${x.qp}${x.tc ? '<br>' + u.money(Math.round(x.tc * 100) / 100) : ''}</div>${!PL.WIDE.matches && (x.its.length > 1 || N.length > 1) ? `<div class="d">${x.its.map((i) => esc(i.n) + ' (' + (+i.qc || 0) + '/' + (+i.qp || 0) + ')').join(' · ')}</div>` : ''}${stp ? '<div class="d stop">⚠️ Πέρσι το έπαιρνε, φέτος όχι</div>' : ''}</div>`; }).join('') : '<p class="mu">Κανένας πελάτης δεν το πήρε φέτος ή πέρσι στις περιοχές αυτές.</p>');
        $('#wbn').textContent = 'Περίοδος: 1/1 έως ' + u.fd(r.d) + ', φέτος και ίδια περίοδος πέρσι (σύστημα). Οι ποσότητες είναι τεμάχια· ημερομηνία κάθε αγοράς δεν υπάρχει στην αναφορά.';
      };
      renderC(); render();
      const offs = ['items', 'clients'].map((c) => S.on(c, () => { renderC(); render(); }));
      el.addEventListener('input', (e) => { if (e.target.id === 'wbq') { st.q = e.target.value; render(); } else if (e.target.id === 'wbcq') renderC(); });
      el.addEventListener('change', (e) => { if (e.target.id === 'wbs') { st.sort = e.target.value; render(); } });
      el.addEventListener('click', (e) => {
        const t = e.target, b = t.closest('[data-c]'), o = t.closest('[data-open]');
        if (b) { const k = b.dataset.c; st.sel.has(k) ? st.sel.delete(k) : st.sel.add(k); renderC(); render(); }
        else if (t.id === 'wbclr') { st.sel.clear(); $('#wbcq').value = ''; renderC(); render(); }
        else if (o) PL.nav.push(PL.WIDE.matches ? 'buyer' : 'client', PL.WIDE.matches ? { id: o.dataset.open, q: st.q } : { id: o.dataset.open });   /* τάμπλετ: φύλλο αγοράς δεξιά */
      });
      return () => offs.forEach((f) => f());
    },
  });
})();
