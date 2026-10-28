/* «Τζίρος» (κουμπί στο Πελατολόγιο): τζίρος φέτος σε σχέση με πέρσι (ίδια περίοδο), φίλτρα μάρκας/κατηγορίας και πόλης,
   στόχος χρονιάς με «πού πρέπει να είμαστε σήμερα» και λιανικές πωλήσεις (προσθήκη/διαγραφή). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, esc = u.esc, eur = u.eur, db = () => PL.adapter.db;
  const EXB = M.EXB;
  const st = { k: '', chosen: false, city: '', gEdit: false, xOpen: false, xList: false };
  /* οι τζίροι κατηγοριών είναι ΕΝΑ έγγραφο: cats/all = {πελάτης: {Goldwell:[…], Topchic:[…], d}} */
  const CAT0 = () => S.get('cats', 'all') || {};
  /* ημερομηνία δεδομένων: η πιο πρόσφατη ημερομηνία πελάτη μέσα στο cats/all (όπως στην παλιά) */
  const CATD = () => Object.values(CAT0()).map((x) => (x && x.d) || '').sort().pop() || '';
  const BRD = () => S.get('brands', 'all') || {};
  const year = () => { const d = CATD(); return /^\d{4}/.test(d) ? +d.slice(0, 4) : new Date().getFullYear(); };
  const hasBr = () => Object.keys(BRD()).some((k) => k[0] !== '_');
  const BRK = () => { const s = new Set(), B = BRD(); for (const id in B) { if (id[0] === '_') continue; for (const k in B[id]) if (Array.isArray(B[id][k])) s.add(k); } return [...s]; };
  const keys = () => { const CAT = CAT0(), cn = M.CATN.filter((k) => Object.values(CAT).some((d) => d && Array.isArray(d[k])));
    return [...(hasBr() ? ['ALL'] : []), 'Goldwell', ...cn, ...BRK().filter((b) => b !== 'GOLDWELL').sort((a, b) => EXB.includes(a) - EXB.includes(b) || a.localeCompare(b)).map((b) => 'B:' + b)]; };
  const lab = (k) => (k === 'ALL' ? 'Γενικός τζίρος' : k === 'Goldwell' ? 'Goldwell (σύνολο)' : k.startsWith('B:') ? (M.BRL[k.slice(2)] || k.slice(2)) + (EXB.includes(k.slice(2)) ? ' (εκτός γενικού)' : '') : (M.CATL[k] || k));
  const pc = (a, b) => (a > 0 ? (b - a) / a * 100 : null);
  const pTxt = (a, b) => { const p = pc(a, b); if (p == null) return b > 0 ? '<span class="up">▲ νέο</span>' : ''; return `<span class="${p >= 0 ? 'up' : 'dn'}">${p >= 0 ? '▲ +' : '▼ −'}${Math.abs(p).toFixed(0)}%</span>`; };
  const sum = (r, f) => r.reduce((s, x) => s + x[f], 0);

  function rows(k, city) {
    const out = [], cityOk = (c) => !city || (c && c.city === city);
    if (k === 'ALL' || k.startsWith('B:')) {
      const B = BRD(), bk = k.slice(2);
      for (const id in B) { if (id[0] === '_') continue; const d = B[id] || {}, c = M.byId(id); if (!cityOk(c)) continue; let a = 0, b = 0, any = false;
        for (const x in d) { if (!Array.isArray(d[x])) continue; if (k === 'ALL' ? EXB.includes(x) : x !== bk) continue; any = true; a += +d[x][0] || 0; b += +d[x][1] || 0; }
        if (any) out.push({ id, name: c ? c.name : id, city: c ? c.city : '', a, b, f: 0 }); }
      return out;
    }
    const CAT = CAT0();
    for (const id in CAT) { if (id[0] === '_') continue; const d = CAT[id], c = M.byId(id); if (!d || !Array.isArray(d[k]) || !cityOk(c)) continue; const [a, b, f] = d[k].map((x) => +x || 0); out.push({ id, name: c ? c.name : id, city: c ? c.city : '', a, b, f }); }
    return out;
  }
  const genTot = () => { if (hasBr()) { const r = rows('ALL', ''); return { b: sum(r, 'b'), has: true }; } const gw = rows('Goldwell', ''), ks = rows('Kerasilk', ''); return { b: sum(gw, 'b') - sum(ks, 'b'), has: false }; };
  const D = PL.dlg, money = u.money;
  const legend = '<div class="glg"><span><i style="background:var(--g1)"></i>Πέρσι, ίδια περίοδος</span><span><i style="background:var(--g2)"></i>Φέτος</span></div>';
  const pair = (name, a, b, mx, data) => { const w = (v) => Math.max(0, v) / mx * 100;
    return `<div class="grow" ${data}><div class="gnm">${esc(name)}</div><div><div class="gbars"><div class="gb" style="width:${w(a)}%;background:var(--g1)"></div><div class="gb" style="width:${w(b)}%;background:var(--g2)"></div></div><div class="gval"><b>${eur(b)}</b> · πέρσι ${eur(a)} ${pTxt(a, b)}</div></div></div>`; };

  /* Στόχος έτους με δείκτη «πού θα έπρεπε να είσαι σήμερα». */
  function goalHtml() {
    const GT = genTot(), B = GT.b, y = year(), G = S.get('settings', 'goal') || {}, g = +G['y' + y] || 0;
    const form = `<div class="gform"><input id="ginp" type="text" inputmode="numeric" placeholder="π.χ. 210000" value="${g ? Math.round(g) : ''}"><button class="pri" id="gsave">Αποθήκευση</button><button id="gcancel">Άκυρο</button></div><div id="gst" class="mu" style="font-size:13px"></div>`;
    if (!g) return `<div class="ggoal">${st.gEdit ? `<b>Στόχος ${y}</b> (γενικός τζίρος χωρίς Kerasilk & Moroccanoil, σε €)${form}` : `<button class="gbtn" id="gset">🎯 Ορισμός στόχου ${y}</button>`}</div>`;
    const pct = B / g * 100, d = CATD() ? new Date(CATD() + 'T12:00:00') : new Date(), y0 = new Date(y, 0, 1), y1 = new Date(y + 1, 0, 1), fr = Math.min(1, Math.max(0, (d - y0) / (y1 - y0))), diff = B - g * fr;
    return `<div class="ggoal"><div class="row"><b>🎯 Στόχος ${y}: ${eur(g)}</b><button class="gbtn" id="gset">Αλλαγή</button></div>${st.gEdit ? form : ''}<div class="mu" style="font-size:13px">Γενικός τζίρος χωρίς Kerasilk & Moroccanoil: <b style="color:var(--tx)">${eur(B)}</b>${GT.has ? '' : ' · προς το παρόν μόνο Goldwell, οι άλλες μάρκες θα προστεθούν μόλις τραβηχτούν από το σύστημα'}</div><div class="gtk" role="img" aria-label="${pct.toFixed(0)}% του στόχου"><div class="prog"><div style="width:${Math.min(100, pct)}%"></div></div><div class="mk" style="left:calc(${(fr * 100).toFixed(1)}% - 1px)" title="Πού θα έπρεπε να είσαι σήμερα"></div></div><div class="mu" style="font-size:13px"><b style="color:var(--tx)">${pct.toFixed(0)}%</b> του στόχου${B < g ? ' · λείπουν ' + eur(g - B) : ' · πέτυχες τον στόχο!'}</div><div style="font-size:13px;margin-top:2px">${diff >= 0 ? `<span class="up">▲ Μπροστά από τον ρυθμό κατά ${eur(diff)}</span>` : `<span class="dn">▼ Πίσω από τον ρυθμό κατά ${eur(-diff)}</span>`} <span class="mu">(η γραμμή | δείχνει πού θα έπρεπε να είσαι σήμερα)</span></div></div>`;
  }
  /* Λιανικές πωλήσεις (προσθήκη / λίστα / διαγραφή). */
  function extraHtml(B) {
    const y = year(), L = Object.entries(S.all('extra')).map(([id, x]) => Object.assign({ id }, x)).filter((x) => String(x.date || '').startsWith(String(y))).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const T = L.reduce((s, x) => s + (+x.amount || 0), 0);
    const form = st.xOpen ? `<div class="gxf"><input id="gxa" type="text" inputmode="decimal" placeholder="Ποσό €"><input id="gxdt" type="date" value="${u.today()}"><input id="gxc" class="w" list="dcl" placeholder="Πελάτης (προαιρετικό)"><input id="gxn" class="w" placeholder="Τι πούλησες (προαιρετικό)"><button class="pri" id="gxsave">Αποθήκευση</button><button id="gxcancel">Άκυρο</button><div id="gxst" class="mu w" style="font-size:13px"></div></div>` : '';
    return `<div class="ggoal"><div class="row" style="flex-wrap:wrap"><span style="font-size:13px;flex:1;min-width:150px">${T ? `<b>Λιανικές ${y}:</b> ${money(T)} <span class="mu">(${L.length}) · μαζί: <b style="color:var(--tx)">${eur(B + T)}</b></span>` : '<span class="mu">Τζίρος λιανικών πωλήσεων</span>'}</span><span style="display:flex;gap:6px">${L.length ? `<button class="gbtn" id="gxlist">${st.xList ? 'Κλείσιμο' : 'Λίστα'}</button>` : ''}<button class="gbtn" id="gxadd">＋ Προσθήκη</button></span></div>${form}${st.xList && L.length ? `<div class="gxl">${L.map((x) => `<div class="row"><span>${esc((x.date || '').split('-').reverse().join('/'))} · <b>${money(+x.amount || 0)}</b>${x.cname ? ' · ' + esc(x.cname) : ''}${x.note ? ' · <span class="mu">' + esc(x.note) + '</span>' : ''}</span><button class="gxd" data-xdel="${esc(x.id)}" aria-label="Διαγραφή">🗑</button></div>`).join('')}</div>` : ''}</div>`;
  }

  PL.register('charts', {
    title: 'Τζίρος',
    render(el) {
      el.classList.add('gv');
      el.innerHTML = '<h2>📊 Τζίρος</h2><button id="wbopen" style="width:100%;margin:2px 0 10px;padding:12px;border-color:var(--ac);color:var(--ac);font-weight:600">🔎 Ποιος αγόρασε… (προϊόν ανά περιοχή)</button><div class="gfl"><select id="gk" aria-label="Κατηγορία"></select><select id="gc" aria-label="Πόλη"></select></div><div id="gbody"></div><p class="mu" style="font-size:13px">Πάτα μια γραμμή για λεπτομέρειες. Πηγή: σύστημα παραγγελιών (<span id="gdt"></span>).</p><div class="gtip" id="gtip"></div><span id="dclh"></span>';
      ['cats', 'brands', 'clients', 'prospects', 'extra', 'settings'].forEach((c) => S.use(c));
      const $ = (q) => el.querySelector(q);
      const fill = () => {
        const ks = keys(); if (!st.chosen || !ks.includes(st.k)) st.k = ks[0] || 'Goldwell';
        $('#gk').innerHTML = ks.map((k) => `<option value="${esc(k)}"${k === st.k ? ' selected' : ''}>${esc(lab(k))}</option>`).join('');
        const cs = [...new Set(Object.keys(CAT0()).concat(Object.keys(BRD())).filter((i) => i[0] !== '_').map((i) => (M.byId(i) || {}).city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'el'));
        $('#gc').innerHTML = '<option value="">Όλες οι πόλεις</option>' + cs.map((c) => `<option${c === st.city ? ' selected' : ''}>${esc(c)}</option>`).join('');
      };
      const paint = () => {
        const k = st.k, city = st.city, r = rows(k, city), A = sum(r, 'a'), B = sum(r, 'b'), F = sum(r, 'f'), prog = F > 0 ? Math.min(100, B / F * 100) : 0; let h = '';
        h += `<div class="gcard"><div class="gsub">${esc(lab(k))}${city ? ' · ' + esc(city) : ''} · 1/1 έως σήμερα</div><div class="hero">${eur(B)}</div><div style="margin-top:4px">${pTxt(A, B)} <span class="mu">από ${eur(A)} πέρσι την ίδια περίοδο</span></div>${F > 0 ? `<div class="prog" role="img" aria-label="${prog.toFixed(0)}% του περσινού συνόλου"><div style="width:${prog}%"></div></div><div class="mu" style="font-size:13px"><b style="color:var(--tx)">${prog.toFixed(0)}%</b> του περσινού συνόλου (${eur(F)})${B < F ? ' · λείπουν ' + eur(F - B) : ' · το ξεπέρασες!'}</div>` : ''}${k === 'ALL' ? '<div class="mu" style="font-size:13px;margin-top:6px">Όλες οι μάρκες εκτός Kerasilk & Moroccanoil (σύστημα ' + esc(BRD()._d || '') + ')</div>' : ''}${(k === 'ALL' || (k === 'Goldwell' && !keys().includes('ALL'))) && !city ? goalHtml() + extraHtml(genTot().b) : ''}</div>`;
        if (k === 'ALL') { const cr = BRK().map((b) => { const x = rows('B:' + b, city); return { b, a: sum(x, 'a'), v: sum(x, 'b') }; }).filter((x) => x.a > 0 || x.v > 0).sort((x, y) => (EXB.includes(x.b) - EXB.includes(y.b)) || (y.v - x.v)); const mx = Math.max(1, ...cr.map((x) => Math.max(x.a, x.v)));
          h += `<div class="gcard"><h3>Ανά μάρκα</h3><div class="gsub">Πάτα μια μάρκα για να τη δεις αναλυτικά · Kerasilk & Moroccanoil δεν μετράνε στον γενικό τζίρο</div>${legend}${cr.map((x) => pair((M.BRL[x.b] || x.b) + (EXB.includes(x.b) ? ' ✕' : ''), x.a, x.v, mx, `data-gk="${esc(x.b === 'GOLDWELL' ? 'Goldwell' : 'B:' + x.b)}" data-tip="${esc(JSON.stringify({ n: M.BRL[x.b] || x.b, a: x.a, b: x.v }))}"`)).join('')}</div>`; }
        if (k === 'Goldwell') { const cr = M.CATN.map((c) => { const x = rows(c, city); return { c, a: sum(x, 'a'), b: sum(x, 'b') }; }).filter((x) => x.a > 0 || x.b > 0).sort((x, y) => y.b - x.b); const mx = Math.max(1, ...cr.map((x) => Math.max(x.a, x.b)));
          h += `<div class="gcard"><h3>Ανά κατηγορία</h3><div class="gsub">Πάτα μια κατηγορία για να τη δεις αναλυτικά</div>${legend}${cr.map((x) => pair(lab(x.c), x.a, x.b, mx, `data-gk="${esc(x.c)}" data-tip="${esc(JSON.stringify({ n: lab(x.c), a: x.a, b: x.b }))}"`)).join('')}</div>`; }
        if (!city) { const m = {}; r.forEach((x) => { const c = x.city || '—'; m[c] = m[c] || { a: 0, b: 0, n: 0 }; m[c].a += x.a; m[c].b += x.b; if (x.b > 0) m[c].n++; });
          const cr = Object.entries(m).map(([c, v]) => Object.assign({ c }, v)).filter((x) => x.a > 0 || x.b > 0).sort((x, y) => y.b - x.b).slice(0, 12), mx = Math.max(1, ...cr.map((x) => Math.max(x.a, x.b)));
          h += `<div class="gcard"><h3>Ανά πόλη</h3><div class="gsub">Οι 12 μεγαλύτερες · πάτα μια πόλη για να τη δεις αναλυτικά</div>${legend}${cr.map((x) => pair(x.c, x.a, x.b, mx, `data-gc="${esc(x.c)}" data-tip="${esc(JSON.stringify({ n: x.c, a: x.a, b: x.b, cnt: x.n }))}"`)).join('')}</div>`; }
        const dl = r.map((x) => Object.assign({ dd: x.b - x.a }, x)).filter((x) => Math.abs(x.dd) >= 1), up = dl.filter((x) => x.dd > 0).sort((x, y) => y.dd - x.dd).slice(0, 8), dn = dl.filter((x) => x.dd < 0).sort((x, y) => x.dd - y.dd).slice(0, 8), mx = Math.max(1, ...up.concat(dn).map((x) => Math.abs(x.dd)));
        const dvr = (x) => `<div class="dv" data-id="${esc(x.id)}" data-tip="${esc(JSON.stringify({ n: x.name, a: x.a, b: x.b, city: x.city }))}"><div class="gnm">${esc(x.name)}<div class="gval">${x.dd > 0 ? '+' : '−'}${eur(Math.abs(x.dd))}</div></div><div class="dvl">${x.dd < 0 ? `<div class="dvb" style="width:${Math.abs(x.dd) / mx * 100}%"></div>` : ''}</div><div class="dvr">${x.dd > 0 ? `<div class="dvb" style="width:${x.dd / mx * 100}%"></div>` : ''}</div></div>`;
        h += `<div class="gcard"><h3>Ποιοι ανέβηκαν, ποιοι έπεσαν</h3><div class="gsub">Διαφορά φέτος − πέρσι ίδια περίοδο · πάτα για την καρτέλα</div><div class="glg"><span><i style="background:var(--gd)"></i>▼ Έπεσαν</span><span><i style="background:var(--gu)"></i>▲ Ανέβηκαν</span></div>${up.length ? `<p style="margin:6px 0 2px;font-weight:600">▲ Ανέβηκαν περισσότερο</p>${up.map(dvr).join('')}` : ''}${dn.length ? `<p style="margin:12px 0 2px;font-weight:600">▼ Έπεσαν περισσότερο</p>${dn.map(dvr).join('')}` : ''}${!up.length && !dn.length ? '<p class="mu">Δεν υπάρχουν δεδομένα.</p>' : ''}</div>`;
        $('#gbody').innerHTML = h; $('#gdt').textContent = CATD() || '—';
        $('#dclh').innerHTML = st.xOpen ? PL.dcl() : '';
      };
      const repaint = () => { if (!S.loaded('cats') || !S.loaded('settings')) return; if (st.gEdit || st.xOpen) return; fill(); paint(); };
      fill(); paint();
      const offs = ['cats', 'brands', 'clients', 'extra', 'settings'].map((c) => S.on(c, repaint));
      $('#gk').onchange = (e) => { st.k = e.target.value; st.chosen = true; paint(); };
      $('#gc').onchange = (e) => { st.city = e.target.value; paint(); };
      $('#wbopen').onclick = () => PL.nav.push('whobought');
      const tip = (ev, d) => { const t = $('#gtip'); t.innerHTML = `<b>${esc(d.n)}</b>${d.city ? '<br>' + esc(d.city) : ''}<br>Πέρσι ίδια περ.: ${eur(d.a)}<br>Φέτος: ${eur(d.b)}${d.cnt != null ? '<br>' + d.cnt + ' πελάτες με αγορές' : ''}`; t.style.display = 'block'; t.style.left = Math.min(ev.clientX + 12, innerWidth - 270) + 'px'; t.style.top = Math.max(ev.clientY - 70, 10) + 'px'; clearTimeout(tip.h); tip.h = setTimeout(() => { t.style.display = 'none'; }, 3500); };
      $('#gbody').addEventListener('pointermove', (ev) => { if (ev.pointerType !== 'mouse') return; const t = ev.target.closest('[data-tip]'); if (!t) return; try { tip(ev, JSON.parse(t.dataset.tip)); } catch (e) { /* τίποτα */ } });
      $('#gbody').addEventListener('click', async (ev) => {
        const t = ev.target;
        try {
          if (t.id === 'gxadd') { st.xOpen = true; paint(); const i = $('#gxa'); if (i) i.focus(); }
          else if (t.id === 'gxcancel') { st.xOpen = false; paint(); }
          else if (t.id === 'gxlist') { st.xList = !st.xList; paint(); }
          else if (t.dataset && t.dataset.xdel) {
            const id = t.dataset.xdel, x = S.get('extra', id); if (!x) return;
            if (!(await D.confirm('Να διαγραφεί η λιανική πώληση ' + eur(+x.amount || 0) + (x.cname ? ' (' + x.cname + ')' : '') + ';'))) return;
            S.drop('extra', id); paint(); try { await db().remove('extra/' + id); } catch (e) { /* τίποτα */ }
          } else if (t.id === 'gxsave') {
            const v = parseFloat(String($('#gxa').value).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
            if (!(v > 0)) { $('#gxst').textContent = 'Γράψε το ποσό, π.χ. 45 ή 45,50'; return; }
            const cv = $('#gxc').value.trim(), m = cv.match(/(c\d+)\s*$/), cid = m && M.byId(m[1]) ? m[1] : '', cname = cid ? M.byId(cid).name : cv, id = 'x' + Date.now();
            const rec = { amount: Math.round(v * 100) / 100, date: $('#gxdt').value || u.today(), cid, cname, note: $('#gxn').value.trim(), t: new Date().toISOString() };
            S.put('extra', id, rec); st.xOpen = false; paint(); try { await db().set('extra/' + id, rec); } catch (e) { /* τίποτα */ }
          } else if (t.id === 'gset') { st.gEdit = true; paint(); const i = $('#ginp'); if (i) { i.focus(); i.select(); } }
          else if (t.id === 'gcancel') { st.gEdit = false; paint(); }
          else if (t.id === 'gsave') {
            const v = parseFloat(String($('#ginp').value).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')); if (!(v > 0)) { $('#gst').textContent = 'Γράψε ένα ποσό, π.χ. 210000'; return; }
            const y = year(), G = Object.assign({}, S.get('settings', 'goal') || {}, { ['y' + y]: Math.round(v * 100) / 100, ['d' + y]: new Date().toISOString() });
            S.put('settings', 'goal', G); st.gEdit = false; paint(); try { await db().set('settings/goal', G); } catch (e) { /* τίποτα */ }
          } else if (t.closest('[data-id]')) PL.nav.push('client', { id: t.closest('[data-id]').dataset.id });
          else if (t.closest('[data-gk]')) { st.k = t.closest('[data-gk]').dataset.gk; st.chosen = true; fill(); paint(); window.scrollTo(0, 0); }
          else if (t.closest('[data-gc]')) { st.city = t.closest('[data-gc]').dataset.gc; fill(); paint(); window.scrollTo(0, 0); }
        } catch (e) { /* τίποτα */ }
      });
      return () => { offs.forEach((f) => f()); clearTimeout(tip.h); };
    },
  });
})();
