/* «Τζίρος» (κουμπί στο Πελατολόγιο): τζίρος φέτος σε σχέση με πέρσι (ίδια περίοδο), φίλτρα μάρκας/κατηγορίας και πόλης,
   στόχος χρονιάς με «πού πρέπει να είμαστε σήμερα» και λιανικές πωλήσεις (προσθήκη/διαγραφή).
   Εμφάνιση 28/11/2026: σύνοψη σε δύο μισά (τζίρος | στόχος ή περσινό σύνολο), κουμπιά γρήγορης μετάβασης στις ενότητες,
   γραμμές «όνομα · μπάρες φέτος/πέρσι · ποσό · %», ανέβηκαν/έπεσαν σε δύο κουτιά (πράσινο/κόκκινο). Υπολογισμοί ίδιοι. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, esc = u.esc, eur = u.eur, db = () => PL.adapter.db;
  const EXB = M.EXB;
  const st = { k: '', chosen: false, city: '', gEdit: false, xOpen: false, xList: false };
  /* κλειδιά, ετικέτες, ημερομηνία και γραμμές τζίρου: από το μοντέλο (M.turnKeys, M.turnLabel, M.turnDate, M.turnover) */
  const pc = (a, b) => (a > 0 ? (b - a) / a * 100 : null);
  const pTxt = (a, b) => { const p = pc(a, b); if (p == null) return b > 0 ? '<span class="up">▲ νέο</span>' : ''; return `<span class="${p >= 0 ? 'up' : 'dn'}">${p >= 0 ? '▲ +' : '▼ −'}${Math.abs(p).toFixed(0)}%</span>`; };
  const SV = (q) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${q}</svg>`;
  const IC = {
    lens: SV('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    bars: SV('<path d="M6 20V12M12 20V5M18 20v-9"/>'),
    tag: SV('<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.3"/>'),
    pin: SV('<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
    trend: SV('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
    goal: SV('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>'),
    trash: SV('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
    plus: SV('<path d="M12 5v14M5 12h14"/>'),
  };
  const head = (ic, t, sub) => `<div class="tzhd"><span class="tzic">${ic}</span><h3>${t}</h3></div>${sub ? `<div class="gsub">${sub}</div>` : ''}`;
  const sum = (r, f) => r.reduce((s, x) => s + x[f], 0);

  const genTot = () => { if (M.hasBrands()) { const r = M.turnover('ALL', ''); return { b: sum(r, 'b'), has: true }; } const gw = M.turnover('Goldwell', ''), ks = M.turnover('Kerasilk', ''); return { b: sum(gw, 'b') - sum(ks, 'b'), has: false }; };
  const D = PL.dlg, money = u.money;
  const legend = '<div class="glg"><span><i style="background:var(--g2)"></i>Φέτος</span><span><i style="background:var(--g1)"></i>Πέρσι, ίδια περίοδος</span></div>';
  /* γραμμή: όνομα · μπάρες (φέτος σκούρα πάνω, πέρσι ανοιχτή κάτω) · ποσό φέτος (και πέρσι από κάτω) · % */
  const pair = (name, a, b, mx, data) => { const w = (v) => Math.max(0, v) / mx * 100;
    return `<div class="grow" ${data}><div class="gnm">${esc(name)}</div><div class="gbars"><div class="gb" style="width:${w(b)}%;background:var(--g2)"></div><div class="gb gbp" style="width:${w(a)}%;background:var(--g1)"></div></div><div class="gval"><b>${eur(b)}</b><small>πέρσι ${eur(a)}</small></div><div class="gpc">${pTxt(a, b)}</div></div>`; };

  /* Στόχος έτους με δείκτη «πού θα έπρεπε να είσαι σήμερα» (δεξί μισό της σύνοψης). */
  function goalHtml() {
    const GT = genTot(), B = GT.b, y = M.turnYear(), G = S.get('settings', 'goal') || {}, g = +G['y' + y] || 0;
    const form = `<div class="gform"><input id="ginp" type="text" inputmode="numeric" placeholder="π.χ. 210000" value="${g ? Math.round(g) : ''}"><button class="pri" id="gsave">Αποθήκευση</button><button id="gcancel">Άκυρο</button></div><div id="gst" class="mu" style="font-size:calc(13*var(--u))"></div>`;
    /* με όλες τις μάρκες ο αριθμός είναι ίδιος με τον τζίρο αριστερά· γράφεται μόνο όταν μετράει ακόμα μόνο το Goldwell */
    const base = GT.has ? '' : `<div class="tzgb">Γενικός τζίρος χωρίς Kerasilk & Moroccanoil: <b>${eur(B)}</b> · προς το παρόν μόνο Goldwell, οι άλλες μάρκες θα προστεθούν μόλις τραβηχτούν από το σύστημα</div>`;
    if (!g) return `<div class="tzgt"><span class="tzic">${IC.goal}</span><b>Στόχος ${y}</b></div>${st.gEdit ? `<div class="tzgb">Γενικός τζίρος χωρίς Kerasilk & Moroccanoil, σε €</div>${form}` : `<button class="gbtn tzset" id="gset">Ορισμός στόχου ${y}</button>`}`;
    const pct = B / g * 100, d = M.turnDate() ? new Date(M.turnDate() + 'T12:00:00') : new Date(), y0 = new Date(y, 0, 1), y1 = new Date(y + 1, 0, 1), fr = Math.min(1, Math.max(0, (d - y0) / (y1 - y0))), diff = B - g * fr;
    return `<div class="tzgt"><span class="tzic">${IC.goal}</span><div class="tzgl"><b>Στόχος ${y}</b><div class="tzgv">${eur(g)}</div></div></div>${st.gEdit ? form : ''}<div class="gtk" role="img" aria-label="${pct.toFixed(0)}% του στόχου"><div class="prog"><div style="width:${Math.min(100, pct)}%"></div></div><div class="mk" style="left:calc(${(fr * 100).toFixed(1)}% - 1px)" title="Πού θα έπρεπε να είσαι σήμερα"></div></div><div class="tzgb"><b>${pct.toFixed(0)}%</b> του στόχου${B < g ? ' · λείπουν ' + eur(g - B) : ' · πέτυχες τον στόχο!'}</div><div class="tzgr">${diff >= 0 ? `<span class="up">▲ Μπροστά από τον ρυθμό κατά ${eur(diff)}</span>` : `<span class="dn">▼ Πίσω από τον ρυθμό κατά ${eur(-diff)}</span>`}</div><div class="tzgb tzgm">| = πού θα έπρεπε να είσαι σήμερα</div>${base}${st.gEdit ? '' : '<button class="gbtn tzset" id="gset">Αλλαγή στόχου</button>'}`;
  }
  /* Όταν δεν μετράει ο στόχος (μία μάρκα/κατηγορία ή μία πόλη): πρόοδος προς το περσινό σύνολο. */
  function lastHtml(B, F) {
    if (!(F > 0)) return `<div class="tzgt"><span class="tzic">${IC.bars}</span><b>Πέρσι όλο το έτος</b></div><div class="tzgb">Δεν υπάρχουν περσινές πωλήσεις.</div>`;
    const prog = Math.min(100, B / F * 100);
    return `<div class="tzgt"><span class="tzic">${IC.bars}</span><div class="tzgl"><b>Πέρσι όλο το έτος</b><div class="tzgv">${eur(F)}</div></div></div><div class="prog" role="img" aria-label="${prog.toFixed(0)}% του περσινού συνόλου"><div style="width:${prog}%"></div></div><div class="tzgb"><b>${prog.toFixed(0)}%</b> του περσινού συνόλου${B < F ? ' · λείπουν ' + eur(F - B) : ' · το ξεπέρασες!'}</div>`;
  }
  /* Λιανικές πωλήσεις (προσθήκη / λίστα / διαγραφή). */
  function extraHtml(B) {
    const y = M.turnYear(), L = Object.entries(S.all('extra')).map(([id, x]) => Object.assign({ id }, x)).filter((x) => String(x.date || '').startsWith(String(y))).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const T = L.reduce((s, x) => s + (+x.amount || 0), 0);
    const form = st.xOpen ? `<div class="gxf"><input id="gxa" type="text" inputmode="decimal" placeholder="Ποσό €"><input id="gxdt" type="date" value="${u.today()}"><input id="gxc" class="w" list="dcl" placeholder="Πελάτης (προαιρετικό)"><input id="gxn" class="w" placeholder="Τι πούλησες (προαιρετικό)"><button class="pri" id="gxsave">Αποθήκευση</button><button id="gxcancel">Άκυρο</button><div id="gxst" class="mu w" style="font-size:calc(13*var(--u))"></div></div>` : '';
    return `<div class="gcard tzx"><div class="row" style="flex-wrap:wrap"><span style="font-size:calc(13*var(--u));flex:1;min-width:150px">${T ? `<b>Λιανικές ${y}:</b> ${money(T)} <span class="mu">(${L.length}) · μαζί: <b style="color:var(--tx)">${eur(B + T)}</b></span>` : '<span class="mu">Τζίρος λιανικών πωλήσεων</span>'}</span><span style="display:flex;gap:6px">${L.length ? `<button class="gbtn" id="gxlist">${st.xList ? 'Κλείσιμο' : 'Λίστα'}</button>` : ''}<button class="gbtn" id="gxadd">${IC.plus}Προσθήκη</button></span></div>${form}${st.xList && L.length ? `<div class="gxl">${L.map((x) => `<div class="row"><span>${esc((x.date || '').split('-').reverse().join('/'))} · <b>${money(+x.amount || 0)}</b>${x.cname ? ' · ' + esc(x.cname) : ''}${x.note ? ' · <span class="mu">' + esc(x.note) + '</span>' : ''}</span><button class="gxd" data-xdel="${esc(x.id)}" aria-label="Διαγραφή">${IC.trash}</button></div>`).join('')}</div>` : ''}</div>`;
  }

  PL.register('charts', {
    title: 'Τζίρος',
    topTitle: true,   /* ο τίτλος στη γραμμή του «‹ Πίσω» (εμφάνιση 28/11/2026) */
    render(el) {
      el.classList.add('gv', 'tzv');
      el.innerHTML = `<h2>Τζίρος</h2><button id="wbopen" class="tzq"><span>${IC.lens}</span>Ποιος αγόρασε… (προϊόν ανά περιοχή)</button><div class="gfl"><select id="gk" aria-label="Κατηγορία"></select><select id="gc" aria-label="Πόλη"></select></div><div class="tznav" id="tznav"></div><div id="gbody"></div><p class="mu" style="font-size:calc(13*var(--u))">Πάτα μια γραμμή για λεπτομέρειες. Πηγή: σύστημα παραγγελιών (<span id="gdt"></span>).</p><div class="gtip" id="gtip"></div><span id="dclh"></span>`;
      ['cats', 'brands', 'clients', 'prospects', 'extra', 'settings'].forEach((c) => S.use(c));
      const $ = (q) => el.querySelector(q);
      const fill = () => {
        const ks = M.turnKeys(); if (!st.chosen || !ks.includes(st.k)) st.k = ks[0] || 'Goldwell';
        $('#gk').innerHTML = ks.map((k) => `<option value="${esc(k)}"${k === st.k ? ' selected' : ''}>${esc(M.turnLabel(k))}</option>`).join('');
        const cs = [...new Set(Object.keys(M.catAll()).concat(Object.keys(M.brAll())).filter((i) => i[0] !== '_').map((i) => (M.byId(i) || {}).city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'el'));
        $('#gc').innerHTML = '<option value="">Όλες οι πόλεις</option>' + cs.map((c) => `<option${c === st.city ? ' selected' : ''}>${esc(c)}</option>`).join('');
      };
      /* κουμπιά γρήγορης μετάβασης: μόνο για τις ενότητες που υπάρχουν με τα τωρινά φίλτρα */
      const NAV = () => [['tzs', IC.bars, 'Σύνοψη'], st.k === 'ALL' ? ['tzb', IC.tag, 'Μάρκες'] : st.k === 'Goldwell' ? ['tzb', IC.tag, 'Κατηγορίες'] : null, st.city ? null : ['tzc', IC.pin, 'Πόλεις'], ['tzd', IC.trend, 'Μεταβολές']].filter(Boolean);
      let navOn = 'tzs';
      const navPaint = () => { $('#tznav').innerHTML = NAV().map(([id, ic, t]) => `<button data-tzj="${id}" class="${id === navOn ? 'on' : ''}">${ic}<span>${t}</span></button>`).join(''); };
      const paint = () => {
        const k = st.k, city = st.city, r = M.turnover(k, city), A = sum(r, 'a'), B = sum(r, 'b'), F = sum(r, 'f'); let h = '';
        const withGoal = (k === 'ALL' || (k === 'Goldwell' && !M.turnKeys().includes('ALL'))) && !city;
        const p = pc(A, B), pill = p == null ? (B > 0 ? '▲ νέο' : '') : `${p >= 0 ? '▲ +' : '▼ −'}${Math.abs(p).toFixed(0)}%`;
        h += `<div class="tzs" id="tzs"><div class="tzh"><div class="tzhl">${esc(M.turnLabel(k))}${city ? ' · ' + esc(city) : ''}</div><div class="tzhs">1/1 έως σήμερα</div><div class="hero">${eur(B)}</div>${pill ? `<div class="tzp${p != null && p < 0 ? ' dn' : ''}"><b>${pill}</b></div>` : ''}<div class="tzpa">από ${eur(A)} πέρσι την ίδια περίοδο</div><span class="tzhb">${IC.bars}</span></div><div class="tzg">${withGoal ? goalHtml() : lastHtml(B, F)}</div></div>`;
        if (k === 'ALL') h += `<p class="mu tznote">Όλες οι μάρκες εκτός Kerasilk & Moroccanoil (σύστημα ${esc(M.brAll()._d || '')})</p>`;
        if (withGoal) h += extraHtml(genTot().b);
        if (k === 'ALL') { const cr = M.brandKeys().map((b) => { const x = M.turnover('B:' + b, city); return { b, a: sum(x, 'a'), v: sum(x, 'b') }; }).filter((x) => x.a > 0 || x.v > 0).sort((x, y) => (EXB.includes(x.b) - EXB.includes(y.b)) || (y.v - x.v)); const mx = Math.max(1, ...cr.map((x) => Math.max(x.a, x.v)));
          h += `<div class="gcard" id="tzb">${head(IC.tag, 'Ανά μάρκα', 'Πάτα μια μάρκα για να τη δεις αναλυτικά · ✕ Kerasilk & Moroccanoil δεν μετράνε στον γενικό τζίρο')}${legend}${cr.map((x) => pair((M.BRL[x.b] || x.b) + (EXB.includes(x.b) ? ' ✕' : ''), x.a, x.v, mx, `data-gk="${esc(x.b === 'GOLDWELL' ? 'Goldwell' : 'B:' + x.b)}" data-tip="${esc(JSON.stringify({ n: M.BRL[x.b] || x.b, a: x.a, b: x.v }))}"`)).join('')}</div>`; }
        if (k === 'Goldwell') { const cr = M.CATN.map((c) => { const x = M.turnover(c, city); return { c, a: sum(x, 'a'), b: sum(x, 'b') }; }).filter((x) => x.a > 0 || x.b > 0).sort((x, y) => y.b - x.b); const mx = Math.max(1, ...cr.map((x) => Math.max(x.a, x.b)));
          h += `<div class="gcard" id="tzb">${head(IC.tag, 'Ανά κατηγορία', 'Πάτα μια κατηγορία για να τη δεις αναλυτικά')}${legend}${cr.map((x) => pair(M.turnLabel(x.c), x.a, x.b, mx, `data-gk="${esc(x.c)}" data-tip="${esc(JSON.stringify({ n: M.turnLabel(x.c), a: x.a, b: x.b }))}"`)).join('')}</div>`; }
        if (!city) { const m = {}; r.forEach((x) => { const c = x.city || '—'; m[c] = m[c] || { a: 0, b: 0, n: 0 }; m[c].a += x.a; m[c].b += x.b; if (x.b > 0) m[c].n++; });
          const cr = Object.entries(m).map(([c, v]) => Object.assign({ c }, v)).filter((x) => x.a > 0 || x.b > 0).sort((x, y) => y.b - x.b).slice(0, 12), mx = Math.max(1, ...cr.map((x) => Math.max(x.a, x.b)));
          h += `<div class="gcard" id="tzc">${head(IC.pin, 'Ανά πόλη', 'Οι 12 μεγαλύτερες · πάτα μια πόλη για να τη δεις αναλυτικά')}${legend}${cr.map((x) => pair(x.c, x.a, x.b, mx, `data-gc="${esc(x.c)}" data-tip="${esc(JSON.stringify({ n: x.c, a: x.a, b: x.b, cnt: x.n }))}"`)).join('')}</div>`; }
        const dl = r.map((x) => Object.assign({ dd: x.b - x.a }, x)).filter((x) => Math.abs(x.dd) >= 1), up = dl.filter((x) => x.dd > 0).sort((x, y) => y.dd - x.dd).slice(0, 8), dn = dl.filter((x) => x.dd < 0).sort((x, y) => x.dd - y.dd).slice(0, 8), mx = Math.max(1, ...up.concat(dn).map((x) => Math.abs(x.dd)));
        const dvr = (x) => `<div class="dv" data-id="${esc(x.id)}" data-tip="${esc(JSON.stringify({ n: x.name, a: x.a, b: x.b, city: x.city }))}"><div class="gnm">${esc(x.name)}</div><div class="dvt"><div class="dvb" style="width:${Math.abs(x.dd) / mx * 100}%"></div></div><div class="gval">${x.dd > 0 ? '+' : '−'}${eur(Math.abs(x.dd))}</div></div>`;
        h += `<div class="gcard" id="tzd">${head(IC.trend, 'Ποιοι ανέβηκαν, ποιοι έπεσαν', 'Διαφορά φέτος − πέρσι ίδια περίοδο · πάτα για την καρτέλα')}${up.length || dn.length ? `<div class="dvw">${up.length ? `<div class="dvx dvu"><p>▲ Ανέβηκαν περισσότερο</p>${up.map(dvr).join('')}</div>` : ''}${dn.length ? `<div class="dvx dvd"><p>▼ Έπεσαν περισσότερο</p>${dn.map(dvr).join('')}</div>` : ''}</div>` : '<p class="mu">Δεν υπάρχουν δεδομένα.</p>'}</div>`;
        $('#gbody').innerHTML = h; $('#gdt').textContent = M.turnDate() || '—';
        $('#dclh').innerHTML = st.xOpen ? PL.dcl() : '';
        if (!NAV().some(([id]) => id === navOn)) navOn = 'tzs';
        navPaint();
      };
      /* η ενότητα που φαίνεται πάνω-πάνω ανάβει το κουμπί της */
      const sc = PL.scroller(el), scEl = sc === document.scrollingElement ? window : sc;
      const onScroll = () => { const top = (sc === document.scrollingElement ? 0 : sc.getBoundingClientRect().top) + 120; let cur = 'tzs';
        NAV().forEach(([id]) => { const s2 = el.querySelector('#' + id); if (s2 && s2.getBoundingClientRect().top <= top) cur = id; });
        if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4) cur = NAV().slice(-1)[0][0];
        if (cur !== navOn) { navOn = cur; navPaint(); } };
      scEl.addEventListener('scroll', onScroll, { passive: true });
      $('#tznav').addEventListener('click', (ev) => { const b = ev.target.closest('[data-tzj]'); if (!b) return; const s2 = el.querySelector('#' + b.dataset.tzj); if (!s2) return;
        s2.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
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
            try { await PL.trash.doc('extra/' + id, 'Λιανική πώληση · ' + eur(+x.amount || 0) + (x.cname ? ' · ' + x.cname : '')); } catch (e) { D.toast('Δεν διαγράφηκε. Έλεγξε τη σύνδεση.'); } paint();
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
            const y = M.turnYear(), G = Object.assign({}, S.get('settings', 'goal') || {}, { ['y' + y]: Math.round(v * 100) / 100, ['d' + y]: new Date().toISOString() });
            S.put('settings', 'goal', G); st.gEdit = false; paint(); try { await db().set('settings/goal', G); } catch (e) { /* τίποτα */ }
          } else if (t.closest('[data-id]')) PL.nav.push('client', { id: t.closest('[data-id]').dataset.id });
          else if (t.closest('[data-gk]')) { st.k = t.closest('[data-gk]').dataset.gk; st.chosen = true; fill(); paint(); window.scrollTo(0, 0); }
          else if (t.closest('[data-gc]')) { st.city = t.closest('[data-gc]').dataset.gc; fill(); paint(); window.scrollTo(0, 0); }
        } catch (e) { /* τίποτα */ }
      });
      return () => { offs.forEach((f) => f()); clearTimeout(tip.h); scEl.removeEventListener('scroll', onScroll); };
    },
  });
})();
