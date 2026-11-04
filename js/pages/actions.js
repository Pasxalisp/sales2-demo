/* Ενέργειες με πελάτες: ΣΕΜΙΝΑΡΙΑ και ΚΑΜΠΑΝΙΕΣ. Ένας κώδικας για τα δύο· κάθε είδος δίνει μόνο την «ταυτότητά» του (KINDS).
   Τα δεδομένα μένουν σε δύο συλλογές, όπως πάντα:
   - seminars/{id} = {title, date, time, notes, cust: [πελάτες], conf: [επιβεβαιωμένοι], created}
   - campaigns/{id} = {title, until, products, notes, cust: {πελάτης: 'int'|'won'|'no'}, created}
   Σελίδες: semlist/seminar και camplist/campaign (λίστα και λεπτομέρεια), smpick (κοινή «Επιλογή πελατών», και για το πρόγραμμα).
   Καρτέλα πελάτη: PL.actions.<είδος>.{state, line, pick}. Ενεργή = δεν έχει περάσει η ημερομηνία· οι άλλες στις «Ολοκληρωμένες». */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, D = PL.dlg, esc = u.esc, money = u.money, db = () => PL.adapter.db;
  const has = (a, id) => (a || []).includes(id);
  const pel = (n) => n + (n === 1 ? ' πελάτης' : ' πελάτες');

  const KINDS = {
    seminar: {
      col: 'seminars', list: 'semlist', page: 'seminar', p: 'sm', row: 'sem', nid: 's',
      one: 'σεμινάριο', the: 'το σεμινάριο', in: 'στο σεμινάριο', which: 'Σε ποιο σεμινάριο', delL: 'Διαγραφή σεμιναρίου', noneT: 'Δεν υπάρχει ενεργό σεμινάριο', title: 'Σεμινάρια', page1: 'Σεμινάριο', ic: () => '🎓', mEmoji: '🎓', newL: 'Νέο σεμινάριο', doneL: 'Ολοκληρωμένα',
      ph: 'π.χ. Τεχνικές ξανοίγματος', nph: 'π.χ. Ακαδημία Θεσσαλονίκης, εισηγητής, κόστος…',
      fields: [{ k: 'date', id: 'dt', label: 'Ημερομηνία', type: 'date' }, { k: 'time', id: 'tm', label: 'Ώρα', type: 'time', w: 120 }],
      ST: [['pend', '⏳', 'Σε εκκρεμότητα'], ['conf', '✅', 'Επιβεβαιώθηκε']],
      count: { pend: ['σε εκκρεμότητα', 'σε εκκρεμότητα'], conf: ['επιβεβαιώθηκε', 'επιβεβαιώθηκαν'] },
      on: (x) => !x.date || x.date >= u.today(),
      key: (x) => x.date || '9999',
      when: (x) => [x.date ? u.fd(x.date) : '', x.time || ''].filter(Boolean).join(' ') || 'Χωρίς ημερομηνία',
      info: (x) => [],
      sub: (x) => x.notes || '',
      get: (x, id) => (has(x.conf, id) && has(x.cust, id) ? 'conf' : has(x.cust, id) ? 'pend' : null),
      set: (x, id, s) => { const cu = (x.cust || []).filter((v) => v !== id), cf = (x.conf || []).filter((v) => v !== id); if (s) cu.push(id); if (s === 'conf') cf.push(id); x.cust = cu; x.conf = cf; },
      ids: (x) => x.cust || [],
      blank: () => ({ cust: [], conf: [] }),
      none: 'Δεν υπάρχουν σεμινάρια ακόμα. Πάτα «+ Νέο σεμινάριο» ή πες στην υπαγόρευση π.χ. «ο Ζαμουρίδης ενδιαφέρεται για το σεμινάριο ξανοίγματος».',
    },
    campaign: {
      col: 'campaigns', list: 'camplist', page: 'campaign', p: 'cm', row: 'camp', nid: 'k',
      one: 'καμπάνια', the: 'την καμπάνια', in: 'στην καμπάνια', which: 'Σε ποια καμπάνια', delL: 'Διαγραφή καμπάνιας', noneT: 'Δεν υπάρχει ενεργή καμπάνια', title: 'Καμπάνιες', page1: 'Καμπάνια', ic: () => PL.pct, mEmoji: null, newL: 'Νέα καμπάνια', doneL: 'Ολοκληρωμένες',
      ph: 'π.χ. Topchic 10+2', nph: 'π.χ. όροι της προσφοράς, ελάχιστη ποσότητα…',
      fields: [{ k: 'until', id: 'u', label: 'Ισχύει έως', type: 'date' }, { k: 'products', id: 'p', label: 'Προϊόντα / κατηγορία', type: 'text', ph: 'π.χ. Topchic, Colorance' }],
      ST: [['int', '⏳', 'Ενδιαφέρεται'], ['won', '✅', 'Την πήρε'], ['no', '✕', 'Δεν θέλει']],
      count: { int: ['ενδιαφέρεται', 'ενδιαφέρονται'], won: ['την πήρε', 'την πήραν'], no: ['δεν θέλει', 'δεν θέλουν'] },
      on: (x) => M.campOn(x),
      key: (x) => x.until || '9999',
      when: (x) => (x.until ? 'έως ' + u.fd(x.until) : 'χωρίς λήξη'),
      info: (x) => (x.products ? ['🧴 ' + x.products] : []),
      sub: (x) => x.products || '',
      get: (x, id) => (x.cust && x.cust[id]) || null,
      set: (x, id, s) => { const c = Object.assign({}, x.cust); if (s) c[id] = s; else delete c[id]; x.cust = c; },
      ids: (x) => Object.keys(x.cust || {}),
      blank: () => ({ cust: {} }),
      none: 'Καμία ενεργή καμπάνια. Πάτα «+ Νέα καμπάνια».',
    },
  };

  const COLS = ['clients', 'prospects', 'notes', 'brands', 'seminars', 'campaigns'];
  PL.actions = {};

  Object.entries(KINDS).forEach(([name, K]) => {
    const all = () => S.all(K.col);
    const save = async (id, x) => { await db().set(K.col + '/' + id, x); S.put(K.col, id, x); };
    const stOf = (s) => K.ST.find((z) => z[0] === s) || K.ST[0];
    const stTxt = (s) => stOf(s)[1] + ' ' + stOf(s)[2];
    /* πελάτες που υπάρχουν ακόμα: [[id, κατάσταση]] */
    const members = (x) => K.ids(x).filter((i) => M.byId(i)).map((i) => [i, K.get(x, i)]);
    const tally = (x) => { const n = {}; members(x).forEach(([, s]) => { n[s] = (n[s] || 0) + 1; });
      return K.ST.filter(([k]) => n[k]).map(([k, e]) => e + ' ' + n[k] + ' ' + K.count[k][n[k] === 1 ? 0 : 1]).join(' · '); };
    const field = (f, pre, v) => `<div style="${f.w ? 'flex:none;width:' + f.w + 'px' : 'flex:1;min-width:0'}"><label>${f.label}</label><input id="${pre}${f.id}" type="${f.type}"${f.ph ? ` placeholder="${esc(f.ph)}"` : ''}${v != null ? ` value="${esc(v)}"` : ''}></div>`;
    const fieldsHtml = (pre) => (K.fields.every((f) => f.type !== 'text') ? `<div style="display:flex;gap:6px">${K.fields.map((f) => field(f, pre)).join('')}</div>` : K.fields.map((f) => field(f, pre)).join(''));
    const read = (el, pre) => { const o = {}; K.fields.forEach((f) => { o[f.k] = el.querySelector('#' + pre + f.id).value.trim(); }); return o; };

    const nova = () => PL.menu(K.title, [{ e: K.mEmoji || K.ic(), label: K.newL, d: '', fn: () => {
      while (PL.nav.current().id !== K.list && PL.nav.depth() > 1) PL.nav.back();
      if (PL.nav.current().id !== K.list) PL.nav.push(K.list);
      setTimeout(() => { const b = document.getElementById(K.p + 'open'); if (b) b.click(); }, 30);
    } }]);

    /* ---------- Λίστα ---------- */
    PL.register(K.list, {
      title: K.title, nova,
      split: [K.page],
      render(el) {
        const p = K.p;
        el.innerHTML = `<h2>${K.ic()} ${K.title}</h2><button class="pri" id="${p}open" style="width:100%;padding:14px;font-size:calc(17*var(--u));margin-bottom:10px">+ ${K.newL}</button>
<div id="${p}form" class="card" style="cursor:default" hidden><label>Τίτλος</label><input id="${p}t" placeholder="${esc(K.ph)}">${fieldsHtml(p)}
<label>Παρατηρήσεις</label><textarea id="${p}n" rows="2" placeholder="${esc(K.nph)}"></textarea>
<p style="display:flex;gap:6px"><button class="pri" id="${p}new">Δημιουργία</button><button id="${p}cancel">Άκυρο</button></p><div id="${p}st" class="mu"></div></div><div id="${p}l"></div>`;
        const $ = (s) => el.querySelector(s);
        COLS.forEach((c) => S.use(c));
        const row = ([id, x]) => { const n = members(x).length, sb = K.sub(x), tl = tally(x);
          return `<div class="card" data-${K.row}="${esc(id)}"><div class="row"><span class="nm">${K.ic()} ${esc(x.title || '')}</span><span class="tz">${pel(n)}</span></div><div class="mu">📅 ${esc(K.when(x))}${sb ? ' · ' + esc(sb) : ''}</div>${tl ? `<div class="mu">${tl}</div>` : ''}</div>`; };
        const paint = () => {
          const L = Object.entries(all()).sort((a, b) => String(K.key(a[1])).localeCompare(String(K.key(b[1]))) || String(a[1].title).localeCompare(String(b[1].title), 'el'));
          const on = L.filter(([, x]) => K.on(x)), off = L.filter(([, x]) => !K.on(x)).reverse();
          $('#' + p + 'l').innerHTML = (on.length ? on.map(row).join('') : `<p class="mu">${esc(K.none)}</p>`) +
            (off.length ? `<h3 style="margin-top:18px">${K.doneL} (${off.length})</h3><div class="acold">${off.map(row).join('')}</div>` : '');
        };
        paint();
        const offs = COLS.map((c) => S.on(c, paint));
        $('#' + p + 'open').onclick = () => { $('#' + p + 'form').hidden = false; $('#' + p + 'open').hidden = true; $('#' + p + 't').focus(); };
        $('#' + p + 'cancel').onclick = () => { $('#' + p + 'form').hidden = true; $('#' + p + 'open').hidden = false; $('#' + p + 'st').textContent = ''; };
        $('#' + p + 'l').addEventListener('click', (ev) => { const c = ev.target.closest('[data-' + K.row + ']'); if (c) PL.nav.push(K.page, { id: c.dataset[K.row] }); });
        $('#' + p + 'new').onclick = async () => {
          const t = $('#' + p + 't').value.trim();
          if (!t) { $('#' + p + 'st').textContent = 'Γράψε τίτλο.'; return; }
          if (Object.values(all()).some((x) => K.on(x) && u.nn(x.title) === u.nn(t))) { $('#' + p + 'st').textContent = 'Υπάρχει ήδη ' + K.one + ' με αυτόν τον τίτλο.'; return; }
          const id = K.nid + Date.now();
          try { await save(id, Object.assign({ title: t }, read(el, p), { notes: $('#' + p + 'n').value.trim(), created: u.today() }, K.blank())); PL.nav.push(K.page, { id }); }
          catch (e) { $('#' + p + 'st').textContent = 'Δεν αποθηκεύτηκε.'; }
        };
        return () => offs.forEach((f) => f());
      },
    });

    /* ---------- Λεπτομέρεια ---------- */
    PL.register(K.page, {
      title: K.page1, nova,
      render(el, params) {
        const id = params.id, p = K.p, pe = p + 'e'; let gone = false;
        el.innerHTML = `<h2 id="${p}h"></h2><div id="${p}i" class="warn"></div>
<details id="${p}edit" style="margin-bottom:10px"><summary style="cursor:pointer;color:var(--ac);font-weight:600">✏️ Αλλαγή στοιχείων</summary><label>Τίτλος</label><input id="${pe}t">${fieldsHtml(pe)}
<label>Παρατηρήσεις</label><textarea id="${pe}n" rows="2"></textarea><p><button class="pri" id="${p}esave">Αποθήκευση</button></p></details>
<button class="pri" id="${p}pick" style="width:100%;padding:12px;font-size:calc(16*var(--u))">+ Πρόσθεσε πελάτες από το πελατολόγιο</button>
<div style="display:flex;gap:6px;margin-top:8px"><input id="${p}add" list="dcl" placeholder="ή γράψε όνομα πελάτη…" style="flex:1;min-width:0"><button id="${p}addb">Προσθήκη</button></div>
<div id="${p}dl" style="margin-top:8px"></div><p style="margin-top:18px"><button id="${p}del">🗑 ${K.delL}</button></p><span id="dclh"></span>`;
        const $ = (s) => el.querySelector(s);
        COLS.forEach((c) => S.use(c));
        const paint = () => {
          const x = all()[id]; if (!x) { if (!gone) { gone = true; PL.nav.back(); } return; }
          const n = members(x).length, tl = tally(x);
          $('#' + p + 'h').innerHTML = K.ic() + ' ' + esc(x.title || '');
          $('#' + p + 'i').innerHTML = `<div>📅 ${esc(K.when(x))}${K.on(x) ? '' : ' · <b>ολοκληρώθηκε</b>'}</div>${K.info(x).map((l) => `<div style="margin-top:4px">${esc(l)}</div>`).join('')}${x.notes ? `<div style="margin-top:4px;white-space:pre-wrap">${esc(x.notes)}</div>` : ''}<div style="margin-top:4px;font-weight:600">${pel(n)}${tl ? ' · ' + tl : ''}</div>`;
          if (!$('#' + p + 'edit').open) { $('#' + pe + 't').value = x.title || ''; K.fields.forEach((f) => { $('#' + pe + f.id).value = x[f.k] || ''; }); $('#' + pe + 'n').value = x.notes || ''; }
          const L = members(x).map(([i, s]) => [M.byId(i), s]).sort((a, b) => String(a[0].city).localeCompare(String(b[0].city), 'el') || String(a[0].name).localeCompare(String(b[0].name), 'el'));
          /* κατάσταση: μικρά κουμπιά σε μία σειρά· το τρέχον χρωματισμένο */
          const seg = (c, s) => '<div class="acseg">' + K.ST.map(([k, e, l]) => `<button data-${p}st="${esc(c.i)}" data-v="${k}" class="${s === k ? 'on' : ''}" aria-pressed="${s === k}"><span>${e}</span>${l}</button>`).join('') + '</div>';
          const card = ([c, s]) => { const tel = PL.call.first(c); return `<div class="card" style="cursor:default"><div class="row"><span class="nm acnm" data-open="${esc(c.i)}">${PL.prospects.tag(c)}${esc(c.name)} <span class="mu">›</span></span><button data-${p}rm="${esc(c.i)}" aria-label="Αφαίρεση" style="padding:2px 10px">✕</button></div><div class="mu">${esc(c.addr || '')}${tel ? ` · ${PL.call.btn(tel, c.name, true)}` : ''}</div>${seg(c, s)}</div>`; };
          const sec = ([k]) => { const arr = L.filter(([, s]) => s === k); let cc = ''; return arr.length ? `<h3 style="margin-top:16px">${stTxt(k)} (${arr.length})</h3>` + arr.map((r) => { const hd = r[0].city !== cc ? (cc = r[0].city, `<div class="mu" style="font-weight:600;margin:8px 0 2px">${esc(cc)}</div>`) : ''; return hd + card(r); }).join('') : ''; };
          $('#' + p + 'dl').innerHTML = L.length ? K.ST.map(sec).join('') : '<p class="mu">Κανένας πελάτης ακόμα.</p>';
          $('#dclh').innerHTML = PL.dcl();
        };
        paint();
        const offs = COLS.map((c) => S.on(c, paint));
        const upd = async (fn) => { const x = Object.assign({}, all()[id]); fn(x); try { await save(id, x); } catch (e) { D.toast('Δεν αποθηκεύτηκε'); } paint(); };
        $('#' + p + 'pick').onclick = () => PL.nav.push('smpick', {
          title: 'Για: ' + (all()[id] || {}).title, inSet: () => new Set(K.ids(all()[id] || {})),
          onOk: async (ids) => { const x = Object.assign({}, all()[id]); ids.forEach((i) => { if (!K.get(x, i)) K.set(x, i, K.ST[0][0]); }); await save(id, x); },
        });
        $('#' + p + 'esave').onclick = async () => {
          const t = $('#' + pe + 't').value.trim(); if (!t) { D.toast('Γράψε τίτλο'); return; }
          await upd((x) => Object.assign(x, { title: t }, read(el, pe), { notes: $('#' + pe + 'n').value.trim() })); $('#' + p + 'edit').open = false; paint();
        };
        el.addEventListener('click', async (ev) => {
          const x = all()[id]; if (!x) return;
          const t = ev.target.closest('[data-open],[data-' + p + 'st],[data-' + p + 'rm],button') || ev.target, d = t.dataset;
          if (d.open) PL.nav.push('client', { id: d.open });
          else if (d[p + 'st']) { if (K.get(x, d[p + 'st']) !== d.v) await upd((y) => K.set(y, d[p + 'st'], d.v)); }
          else if (d[p + 'rm']) {
            const c = M.byId(d[p + 'rm']);
            if (!(await D.confirm('Να αφαιρεθεί ο «' + (c ? c.name : '') + '» από ' + K.the + ';', 'Ναι, αφαίρεση'))) return;
            await upd((y) => K.set(y, d[p + 'rm'], null));
          } else if (t.id === p + 'addb') {
            const c = PL.dclId($('#' + p + 'add').value); if (!M.byId(c)) { D.toast('Διάλεξε πελάτη από τη λίστα'); return; }
            await upd((y) => { if (!K.get(y, c)) K.set(y, c, K.ST[0][0]); }); $('#' + p + 'add').value = '';
          } else if (t.id === p + 'del') {
            if (!(await D.confirm('Να διαγραφεί ' + K.the + ' «' + x.title + '»; Οι πελάτες δεν επηρεάζονται.'))) return;
            gone = true;
            try { await db().remove(K.col + '/' + id); } catch (e) { /* χωρίς σύνδεση */ }
            S.drop(K.col, id); PL.nav.back();
          }
        });
        return () => offs.forEach((f) => f());
      },
    });

    /* ---------- Καρτέλα πελάτη ---------- */
    const mine = (cid) => Object.values(all()).filter((x) => K.on(x) && K.get(x, cid));
    PL.actions[name] = {
      K,
      /* πόσες είναι ενεργές */
      active: () => Object.values(all()).filter(K.on).length,
      /* '' (καμία) · 'wait' (κάποια στην πρώτη κατάσταση, ⏳) · 'ok' (στη δεύτερη, ✅) · 'in' (άλλη) */
      state: (cid) => { const L = mine(cid).map((x) => K.get(x, cid)); return !L.length ? '' : L.includes(K.ST[0][0]) ? 'wait' : L.includes(K.ST[1][0]) ? 'ok' : 'in'; },
      line: (cid) => { const L = mine(cid).map((x) => x.title + ' (' + stTxt(K.get(x, cid)) + ')');
        return L.length ? `<div class="debt">${K.ic()} ${K.title}: ${esc(L.join(', '))}</div>` : ''; },
      async pick(cid) {
        const c = M.byId(cid), nm = c ? c.name : '';
        const L = Object.entries(all()).filter(([, x]) => K.on(x)).sort((a, b) => String(K.key(a[1])).localeCompare(String(K.key(b[1]))));
        if (!L.length) { D.toast(K.noneT + '. Φτιάξε από την αρχική: Ενέργειες → ' + K.title + '.'); return; }
        const opts = L.map(([, x]) => (K.get(x, cid) ? stOf(K.get(x, cid))[1] + ' ' : '') + (x.title || K.page1) + ' · ' + K.when(x)); opts.push('Άκυρο');
        const k = await D.choice(K.which + ' να μπει ο «' + nm + '»;', opts);
        if (k == null || k >= L.length) return;
        const [xid, x0] = L[k], x = Object.assign({}, x0), cur = K.get(x, cid);
        if (!cur) { K.set(x, cid, K.ST[0][0]); await save(xid, x); D.toast('Μπήκε ' + K.in + ' «' + x.title + '» · ' + stTxt(K.ST[0][0])); return; }
        const o2 = K.ST.map(([s, e, l]) => (s === cur ? '● ' : '') + e + ' ' + l).concat(['Αφαίρεση από ' + K.the, 'Άκυρο']);
        const j = await D.choice('«' + nm + '» ' + K.in + ' «' + x.title + '»:', o2);
        if (j == null || j > K.ST.length) return;
        if (j === K.ST.length) { if (!await D.confirm('Να αφαιρεθεί ο «' + nm + '» από ' + K.the + ' «' + x.title + '»;', 'Ναι, αφαίρεση')) return; K.set(x, cid, null); await save(xid, x); D.toast('Αφαιρέθηκε από ' + K.the); return; }
        if (K.ST[j][0] === cur) return;
        K.set(x, cid, K.ST[j][0]); await save(xid, x); D.toast(x.title + ': ' + stTxt(K.ST[j][0]));
      },
    };
  });

  /* ---------- Επιλογή πελατών (κοινή: σεμινάρια, καμπάνιες, πρόγραμμα) ----------
     params: {title, inSet():Set (όσοι είναι ήδη μέσα), cities?:[πόλεις], onOk(ids)} */
  PL.register('smpick', {
    title: 'Επιλογή πελατών',
    render(el, params) {
      el.innerHTML = `<h2>Επιλογή πελατών</h2><div class="mu" style="margin-bottom:8px">${esc(params.title || '')}</div>
<div style="display:flex;gap:6px;flex-wrap:wrap"><select id="smpc" style="flex:1;min-width:150px"></select><select id="smpk" style="flex:1;min-width:150px"></select></div>
<div style="display:flex;gap:6px;margin-top:6px;align-items:center"><input id="smpq" placeholder="Αναζήτηση ονόματος…" style="flex:1;min-width:0"><label style="margin:0;display:flex;align-items:center;gap:4px;white-space:nowrap;color:var(--tx);font-size:calc(14*var(--u))"><input type="checkbox" id="smpz" style="width:auto"> Με τζίρο</label></div>
<div style="display:flex;gap:6px;margin:8px 0"><button id="smpall">Επιλογή όλων</button><button id="smpnone">Καθαρισμός</button><span id="smpn" class="mu" style="align-self:center;margin-left:auto"></span></div>
<div id="smpl"></div><div class="smbar"><button class="pri" id="smpok" style="width:100%;padding:14px;font-size:calc(17*var(--u))">Προσθήκη</button></div>`;
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      let sel = new Set();
      const C = M.live(), cs = params.cities || null;
      const cm = {}; C.forEach((c) => { if (!cs || cs.includes(c.city)) cm[c.city] = (cm[c.city] || 0) + 1; });
      const cityKeys = cs ? cs : Object.keys(cm).sort((a, b) => a.localeCompare(b, 'el'));
      $('#smpc').innerHTML = (cs ? (cs.length > 1 ? '<option value="">Όλες οι περιοχές του προγράμματος</option>' : '') : '<option value="">Όλες οι περιοχές</option>') + cityKeys.map((k) => `<option value="${esc(k)}">${esc(k)} (${cm[k] || 0})</option>`).join('');
      $('#smpk').innerHTML = '<option value="">Όλες οι κατηγορίες</option>' + M.PR.map((k) => `<option value="${esc(k)}">Δουλεύει ${esc(k)}</option>`).join('');
      const list = () => {
        const inS = params.inSet ? params.inSet() : new Set(), cy = $('#smpc').value, k = $('#smpk').value, q = u.nn($('#smpq').value).trim(), z = $('#smpz').checked, pc = cs ? new Set(cs) : null;
        return C.filter((c) => (cy ? c.city === cy : (!pc || pc.has(c.city))) && (!k || M.works(c.i).includes(k)) && (!z || (M.tz(c) || 0) > 0) && (!q || u.nn(c.name + ' ' + (c.alt || []).join(' ') + ' ' + c.code).includes(q)))
          .sort((a, b) => String(a.city).localeCompare(String(b.city), 'el') || (M.tz(b) || 0) - (M.tz(a) || 0)).map((c) => ({ c, in: inS.has(c.i) }));
      };
      const btn = () => { $('#smpok').textContent = sel.size ? 'Προσθήκη (' + sel.size + ')' : 'Διάλεξε πελάτες'; $('#smpok').disabled = !sel.size; };
      const paint = () => {
        const L = list(); let cc = '';
        $('#smpl').innerHTML = L.length ? L.map(({ c, in: i }) => { const hd = !$('#smpc').value && c.city !== cc ? (cc = c.city, `<h3>${esc(cc)}</h3>`) : '', e = M.entries(c.i)[0], tz = M.tz(c) || 0;
          return hd + `<label class="card" style="display:flex;gap:10px;align-items:center;cursor:pointer;margin:6px 0;color:var(--tx);font-size:calc(15*var(--u))${i ? ';opacity:.55' : ''}"><input type="checkbox" data-smp="${esc(c.i)}" ${i || sel.has(c.i) ? 'checked' : ''} ${i ? 'disabled' : ''} style="width:22px;height:22px;flex:none"><span style="flex:1;min-width:0"><span class="nm">${PL.prospects.tag(c)}${esc(c.name)}</span><br><span class="mu">${esc(c.city)}${tz > 0 ? ' · ' + money(tz) : ' · χωρίς τζίρο'}${e && e.d ? ' · τελ. επαφή ' + esc(e.d) : ''}${i ? ' · ήδη μέσα' : ''}</span></span></label>`; }).join('')
          : '<p class="mu">Κανένας πελάτης με αυτά τα φίλτρα.</p>';
        $('#smpn').textContent = L.length + ' πελάτες'; btn();
      };
      paint();
      ['smpc', 'smpk', 'smpz'].forEach((i) => $('#' + i).addEventListener('change', paint)); $('#smpq').addEventListener('input', paint);
      $('#smpl').addEventListener('change', (ev) => { const i = ev.target.dataset.smp; if (!i) return; ev.target.checked ? sel.add(i) : sel.delete(i); btn(); });
      $('#smpall').onclick = () => { list().forEach(({ c, in: i }) => { if (!i) sel.add(c.i); }); paint(); };
      $('#smpnone').onclick = () => { sel = new Set(); paint(); };
      $('#smpok').onclick = async () => {
        if (!sel.size) return; $('#smpok').disabled = true;
        try { await params.onOk([...sel]); PL.nav.back(); } catch (e) { D.toast('Δεν αποθηκεύτηκε'); $('#smpok').disabled = false; }
      };
    },
  });
})();
