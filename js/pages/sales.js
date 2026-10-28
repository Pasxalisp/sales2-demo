/* «Πωλήσεις ανά κατηγορία»: σύνολα όλων των πελατών, επιλογή κατηγορίας/περιοχής, λίστα ειδών, πάτημα σε είδος → πελάτες.
   Τάμπλετ: πάτημα σε είδος → «Φύλλο είδους» δεξιά (salesitem: ποιοι το πήραν, ποιοι σταμάτησαν) → πελάτης → φύλλο αγοράς
   (buyer.js)· χωρίς πάτημα, δεξιά τα είδη που χάνεις και τα νέα φέτος (με τα φίλτρα της λίστας). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, esc = u.esc, eur = u.eur, nn = u.nn;
  const n0 = (v) => Math.round(v).toLocaleString('el-GR');
  const pc = (a, b) => (a > 0 ? Math.round((b - a) / a * 100) : (b > 0 ? null : 0));
  const pct = (a, b) => { const p = pc(a, b); return p == null ? '<span class="up">νέο</span>' : `<span class="${p >= 0 ? 'up' : 'dn'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p)}%</span>`; };
  const st = { g: '', city: '', sort: 'tc', open: null, q: '' };
  const SORTS = { tc: ['Αξία φέτος', (a, b) => b.tc - a.tc], qc: ['Τεμάχια φέτος', (a, b) => b.qc - a.qc], df: ['Μεγαλύτερη πτώση', (a, b) => (a.qc - a.qp) - (b.qc - b.qp)], up: ['Μεγαλύτερη άνοδος', (a, b) => (b.qc - b.qp) - (a.qc - a.qp)], nm: ['Όνομα', (a, b) => a.n.localeCompare(b.n)] };

  function rows() { const out = []; let dd = ''; const IT = S.all('items');
    for (const id in IT) { const c = M.byId(id); if (!c) continue; if (st.city && c.city !== st.city) continue; const d = IT[id]; if (!d || !Array.isArray(d.it)) continue; if (d.d && d.d > dd) dd = d.d; d.it.forEach((x) => out.push([id, x])); }
    return [out, dd]; }
  let asidePaint = () => {};
  const items = () => { const [L0, dd] = rows(); return [agg(st.g ? L0.filter(([, x]) => (x.g || 'Άλλα') === st.g) : L0), dd]; };
  function asideHtml() {
    const H = PL.sheet; if (!S.loaded('items')) return '<p class="mu">Φορτώνω…</p>';
    const [A] = items(), row = (o, right, cls) => ({ attr: `data-sli2="${esc(o.n)}"`, name: esc(o.n), sub: esc(o.g) + ' · ' + o.cc.size + ' πελάτες φέτος · ' + o.cp.size + ' πέρσι', right, cls });
    const drop = A.filter((o) => o.qp > o.qc).sort((a, b) => (b.qp - b.qc) - (a.qp - a.qc)).slice(0, 8), nw = A.filter((o) => !o.qp && o.qc > 0).sort((a, b) => b.tc - a.tc).slice(0, 6);
    const flt = [st.g, st.city].filter(Boolean).map(esc).join(' · ') || 'όλες οι κατηγορίες και περιοχές';
    return `<h2 style="margin-top:0;color:#2f6f5e">Πού χάνεις, τι κερδίζεις</h2><p class="mu" style="margin-top:-6px">${flt}. Πάτα ένα είδος για ποιοι το πήραν και ποιοι σταμάτησαν.</p>` +
      H.box('▼ Μεγαλύτερη πτώση (τεμ. πέρσι → φέτος)', H.list(drop.map((o) => row(o, o.qp + ' → ' + o.qc, 'dn')), 'Καμία πτώση. 👌')) +
      H.box('Νέα φέτος', H.list(nw.map((o) => row(o, eur(o.tc), 'up')), 'Κανένα νέο είδος φέτος.'));
  }
  function agg(list) { const m = {};
    list.forEach(([id, x]) => { const o = m[x.n] || (m[x.n] = { n: x.n, g: x.g || 'Άλλα', qc: 0, qp: 0, qf: 0, tc: 0, tp: 0, tf: 0, cc: new Set(), cp: new Set(), who: [] });
      o.qc += +x.qc || 0; o.qp += +x.qp || 0; o.qf += +x.qf || 0; o.tc += +x.tc || 0; o.tp += +x.tp || 0; o.tf += +x.tf || 0; if ((+x.qc || 0) > 0) o.cc.add(id); if ((+x.qp || 0) > 0) o.cp.add(id); o.who.push([id, x]); });
    return Object.values(m); }

  PL.register('sales', {
    title: 'Πωλήσεις ανά κατηγορία',
    split: ['client', 'salesitem', 'buyer'],
    aside(el) {
      const paint = () => { el.innerHTML = asideHtml(); };
      asidePaint = paint; paint();
      const offs = ['items', 'clients'].map((c) => S.on(c, paint));
      el.addEventListener('click', (ev) => { const r = ev.target.closest('[data-sli2]'); if (r) PL.nav.push('salesitem', { key: r.dataset.sli2 }); });
      return () => { asidePaint = () => {}; offs.forEach((f) => f()); };
    },
    render(el, params) {
      if (params && params.g != null) { st.g = params.g; st.open = null; }
      el.innerHTML = '<h2 style="color:#2f6f5e">📊 Πωλήσεις ανά κατηγορία</h2><div style="display:flex;gap:6px;margin:4px 0 8px"><select id="slg" style="flex:1;min-width:0" aria-label="Κατηγορία"></select><select id="slc" style="flex:1;min-width:0" aria-label="Περιοχή"></select></div><div id="slsum"></div><div id="slbody"></div><p class="mu" id="slsrc" style="font-size:12px"></p>';
      ['items', 'clients', 'prospects'].forEach((c) => S.use(c));
      const $ = (s) => el.querySelector(s);
      const fillSel = () => { const [L] = rows(), gs = {}; L.forEach(([, x]) => { const g = x.g || 'Άλλα'; gs[g] = (gs[g] || 0) + (+x.tc || 0) + (+x.tp || 0) * 0.001; });
        $('#slg').innerHTML = '<option value="">Όλες οι κατηγορίες</option>' + Object.keys(gs).sort((a, b) => gs[b] - gs[a]).map((g) => `<option ${g === st.g ? 'selected' : ''}>${esc(g)}</option>`).join('');
        const IT = S.all('items'), cs = [...new Set(Object.keys(IT).map((id) => (M.byId(id) || {}).city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'el'));
        $('#slc').innerHTML = '<option value="">Όλες οι περιοχές</option>' + cs.map((c) => `<option ${c === st.city ? 'selected' : ''}>${esc(c)}</option>`).join(''); };
      const render = () => {
        asidePaint();
        if (!S.loaded('items')) { $('#slbody').innerHTML = '<p class="mu">Φορτώνω…</p>'; return; }
        const [L0, dd] = rows(), L = st.g ? L0.filter(([, x]) => (x.g || 'Άλλα') === st.g) : L0, A = agg(L);
        const T = A.reduce((t, o) => { ['qc', 'qp', 'qf', 'tc', 'tp', 'tf'].forEach((k) => { t[k] += o[k]; }); return t; }, { qc: 0, qp: 0, qf: 0, tc: 0, tp: 0, tf: 0 });
        const cN = new Set(), cP = new Set(); L.forEach(([id, x]) => { if ((+x.qc || 0) > 0) cN.add(id); if ((+x.qp || 0) > 0) cP.add(id); });
        $('#slsum').innerHTML = `<div class="slk"><div><div class="l">Αξία φέτος</div><div class="v">${eur(T.tc)}</div><div class="l">πέρσι ίδια περίοδο ${eur(T.tp)} · ${pct(T.tp, T.tc)}</div></div><div><div class="l">Τεμάχια φέτος</div><div class="v">${n0(T.qc)}</div><div class="l">πέρσι ίδια περίοδο ${n0(T.qp)} · ${pct(T.qp, T.qc)}</div></div><div><div class="l">Πέρσι όλο το έτος</div><div class="v" style="font-size:17px">${eur(T.tf)}</div><div class="l">${n0(T.qf)} τεμ. · φέτος έχεις πιάσει ${T.tf > 0 ? Math.round(T.tc / T.tf * 100) : 0}%</div></div><div><div class="l">Πελάτες που αγόρασαν</div><div class="v" style="font-size:17px">${cN.size} φέτος</div><div class="l">${cP.size} πέρσι ίδια περίοδο</div></div></div>`;
        let h = '';
        if (!st.g) { const gm = {}; A.forEach((o) => { const t = gm[o.g] || (gm[o.g] = { g: o.g, tc: 0, tp: 0, qc: 0, qp: 0 }); t.tc += o.tc; t.tp += o.tp; t.qc += o.qc; t.qp += o.qp; });
          h += `<h3 style="margin:14px 0 4px">Ανά κατηγορία</h3><p class="mu" style="margin:0 0 6px;font-size:13px">Πάτα μια κατηγορία για να δεις ποια είδη ακριβώς.</p><table class="slt"><tr><th>Κατηγορία</th><th>Πέρσι ίδια περ.</th><th>Φέτος</th><th>%</th></tr>${Object.values(gm).sort((a, b) => b.tc - a.tc).map((t) => `<tr class="cl" data-slg="${esc(t.g)}"><td><b>${esc(t.g)}</b><div class="mu" style="font-size:12px">${n0(t.qp)} → ${n0(t.qc)} τεμ.</div></td><td>${eur(t.tp)}</td><td><b>${eur(t.tc)}</b></td><td>${pct(t.tp, t.tc)}</td></tr>`).join('')}</table>`; }
        const q = nn(st.q), IL = A.filter((o) => (o.qc || o.qp || o.qf) && (!q || nn(o.n).includes(q))).sort(SORTS[st.sort][1]);
        h += `<h3 style="margin:16px 0 4px">${st.g ? esc(st.g) + ' · ' : ''}Είδη (${IL.length})</h3><input id="slq" placeholder="Αναζήτηση είδους…" value="${esc(st.q)}" style="margin:4px 0"><div class="slsort">${Object.entries(SORTS).map(([k, [l]]) => `<button class="chip${k === st.sort ? ' on' : ''}" data-sls="${k}">${l}</button>`).join('')}</div>
          <div style="overflow-x:auto"><table class="slt"><tr><th>Είδος</th><th>Πέρσι<br>ίδια περ.</th><th>Πέρσι<br>όλο</th><th>Φέτος</th><th>Αξία<br>φέτος</th></tr>${IL.slice(0, 400).map((o) => { const cls = o.qc === 0 && o.qp > 0 ? 'color:var(--rd);font-weight:700' : o.qc > 0 && o.qp === 0 ? 'color:var(--ac);font-weight:700' : 'font-weight:700', op = !PL.WIDE.matches && st.open === o.n;   /* τάμπλετ: οι πελάτες στο φύλλο είδους δεξιά */
            return `<tr class="cl" data-sli="${esc(o.n)}"><td>${op ? '▾' : '▸'} ${esc(o.n)}${st.g ? '' : `<div class="mu" style="font-size:11.5px">${esc(o.g)}</div>`}<div class="mu" style="font-size:11.5px">${o.cc.size} πελάτες φέτος · ${o.cp.size} πέρσι</div></td><td style="color:var(--mu)">${o.qp || '—'}</td><td style="color:var(--mu)">${o.qf || '—'}</td><td style="${cls}">${o.qc || '—'}</td><td>${o.tc ? eur(o.tc) : '—'}</td></tr>` +
              (op ? `<tr class="sub"><td colspan="5">${o.who.filter(([, x]) => (+x.qc || 0) || (+x.qp || 0) || (+x.qf || 0)).sort((a, b) => (+b[1].qc || 0) - (+a[1].qc || 0) || (+b[1].qp || 0) - (+a[1].qp || 0)).map(([id, x]) => `<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px dashed var(--bd);cursor:pointer" data-slo="${esc(id)}"><span><b>${esc((M.byId(id) || {}).name)}</b> <span class="mu">· ${esc((M.byId(id) || {}).city)}</span></span><span style="white-space:nowrap"><span class="mu">${+x.qp || 0} →</span> <b style="${(+x.qc || 0) === 0 ? 'color:var(--rd)' : ''}">${+x.qc || 0}</b></span></div>`).join('')}</td></tr>` : ''); }).join('')}</table></div>${IL.length > 400 ? '<p class="mu">Εμφανίζονται τα 400 πρώτα.</p>' : ''}`;
        $('#slbody').innerHTML = h;
        $('#slsrc').textContent = 'Πηγή: orders, «Πελάτες με πωλήσεις είδους» (' + dd + '). Τεμάχια και αξία χωρίς ΦΠΑ. Κόκκινο: το έπαιρναν πέρσι, φέτος όχι · Πράσινο: νέο φέτος.';
      };
      fillSel(); render();
      const offs = ['items', 'clients'].map((c) => S.on(c, () => { fillSel(); render(); }));
      el.addEventListener('change', (e) => { if (e.target.id === 'slg') { st.g = e.target.value; st.open = null; render(); } else if (e.target.id === 'slc') { st.city = e.target.value; st.open = null; fillSel(); render(); } });
      el.addEventListener('input', (e) => { if (e.target.id === 'slq') { st.q = e.target.value; const p = e.target.selectionStart; render(); const i = $('#slq'); i.focus(); try { i.setSelectionRange(p, p); } catch (x) { /* τίποτα */ } } });
      el.addEventListener('click', (e) => {
        const t = e.target, o = t.closest('[data-slo]'), g = t.closest('[data-slg]'), s = t.closest('[data-sls]'), i = t.closest('[data-sli]');
        if (o) PL.nav.push('client', { id: o.dataset.slo });
        else if (g) { st.g = g.dataset.slg; st.open = null; fillSel(); render(); PL.scroller(el).scrollTop = 0; }
        else if (s) { st.sort = s.dataset.sls; render(); }
        else if (i && PL.WIDE.matches) PL.nav.push('salesitem', { key: i.dataset.sli });   /* τάμπλετ: φύλλο είδους δεξιά */
        else if (i) { st.open = st.open === i.dataset.sli ? null : i.dataset.sli; render(); }
      });
      return () => offs.forEach((f) => f());
    },
  });
  /* «Φύλλο είδους» (τάμπλετ): ένα είδος με τα φίλτρα περιοχής της λίστας — σύνολα, ποιοι το πήραν φέτος, ποιοι σταμάτησαν.
     params: {key: όνομα είδους}. Πάτημα σε πελάτη → φύλλο αγοράς (buyer.js). */
  PL.register('salesitem', {
    title: 'Είδος',
    render(el, params) {
      const n = params.key, H = PL.sheet;
      ['items', 'clients', 'prospects'].forEach((c) => S.use(c));
      const paint = () => {
        if (!S.loaded('items')) { el.innerHTML = '<p class="mu">Φορτώνω…</p>'; return; }
        const [L] = rows(), o = agg(L.filter(([, x]) => x.n === n))[0];
        if (!o) { el.innerHTML = '<p class="mu">Δεν βρέθηκε το είδος' + (st.city ? ' στην περιοχή ' + esc(st.city) : '') + '.</p>' + H.nav(); return; }
        const W = o.who.filter(([id]) => M.byId(id)), row = ([id, x], cls) => ({ attr: `data-slb="${esc(id)}"`, name: esc(M.byId(id).name), sub: esc(M.byId(id).city), right: (+x.qp || 0) + ' → ' + (+x.qc || 0) + (+x.tc ? ' · ' + eur(+x.tc) : ''), cls });
        const now = W.filter(([, x]) => +x.qc > 0).sort((a, b) => (+b[1].qc || 0) - (+a[1].qc || 0)), stop = W.filter(([, x]) => !(+x.qc) && +x.qp > 0).sort((a, b) => (+b[1].qp || 0) - (+a[1].qp || 0));
        const k = (l, v, cls) => `<div><span>${l}</span><b class="${cls || ''}">${v}</b></div>`;
        el.innerHTML = `<div class="shh"><div><h2>${esc(n)}</h2><div class="mu">${esc(o.g)}${st.city ? ' · ' + esc(st.city) : ' · όλες οι περιοχές'}</div></div></div>` +
          `<div class="shk" style="margin-top:12px">${k('Φέτος', n0(o.qc) + ' τεμ. <small style="font-size:14px">' + pct(o.qp, o.qc) + '</small>')}${k('Πέρσι ίδια περ.', n0(o.qp) + ' τεμ.')}${k('Πέρσι όλο', n0(o.qf) + ' τεμ.')}${k('Αξία φέτος', eur(o.tc))}</div>` +
          H.box(`Πέρσι το έπαιρναν, φέτος όχι (${stop.length})`, H.list(stop.map((r) => row(r, 'dn')), 'Κανένας. 👌'), stop.length ? 'hi' : '') +
          H.box(`Το πήραν φέτος (${now.length})`, H.list(now.map((r) => row(r)), 'Κανένας φέτος.')) +
          H.nav() + '<p class="mu" style="font-size:12px">Τεμάχια πέρσι (ίδια περίοδο) → φέτος. Πάτα πελάτη για όλα όσα παίρνει.</p>';
      };
      paint();
      const offs = ['items', 'clients'].map((c) => S.on(c, paint));
      el.addEventListener('click', (ev) => { const r = ev.target.closest('[data-slb]'); if (r) PL.nav.push('buyer', { id: r.dataset.slb, n }); });
      return () => offs.forEach((f) => f());
    },
  });
})();
