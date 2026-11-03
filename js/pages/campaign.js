/* Καμπάνιες: λίστα (camplist), λεπτομέρεια (campaign). Η επιλογή πελατών είναι η κοινή «smpick» (seminar.js).
   Έγγραφο: campaigns/{id} = {title, until: 'ΕΕΕΕ-ΜΜ-ΗΗ' (ισχύει ως), products, notes, cust: {πελάτης: 'int'|'won'|'no'}, created}.
   Ενεργή = χωρίς ημερομηνία ή until ≥ σήμερα (M.campOn). Οι ληγμένες πάνε στις «Ολοκληρωμένες».
   Υπενθύμιση «% …: ενδιαφέρεται» (σήμα PL.pct, core.js) στο πρόγραμμα και στα φύλλα: M.campsInt (model.js). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, D = PL.dlg, esc = u.esc, db = () => PL.adapter.db;
  const COLS = ['clients', 'prospects', 'campaigns', 'notes', 'brands'];
  const ST = { int: '⏳ Ενδιαφέρεται', won: '✅ Την πήρε', no: '✕ Δεν θέλει' };
  const camp = () => S.all('campaigns');
  const save = async (id, x) => { await db().set('campaigns/' + id, x); S.put('campaigns', id, x); };
  /* πελάτες της καμπάνιας που υπάρχουν ακόμα: [[id, κατάσταση]] */
  const inC = (x) => Object.entries((x && x.cust) || {}).filter(([i]) => M.byId(i));
  const cnt = (x) => { const n = { int: 0, won: 0, no: 0 }; inC(x).forEach(([, s]) => { n[s] = (n[s] || 0) + 1; }); return n; };
  /* «⏳ 3 ενδιαφέρονται · ✅ 2 την πήραν · ✕ 1 δεν θέλει» χωρίς τα μηδενικά */
  const tally = (n) => [n.int && '⏳ ' + n.int + (n.int === 1 ? ' ενδιαφέρεται' : ' ενδιαφέρονται'), n.won && '✅ ' + n.won + ' την ' + (n.won === 1 ? 'πήρε' : 'πήραν'), n.no && '✕ ' + n.no + ' δεν ' + (n.no === 1 ? 'θέλει' : 'θέλουν')].filter(Boolean).join(' · ');
  const until = (x) => (x.until ? 'έως ' + u.fd(x.until) : 'χωρίς λήξη');

  const nova = () => PL.menu('Καμπάνιες', [{ e: PL.pct, label: 'Νέα καμπάνια', d: '', fn: () => {
    while (PL.nav.current().id !== 'camplist' && PL.nav.depth() > 1) PL.nav.back();
    if (PL.nav.current().id !== 'camplist') PL.nav.push('camplist');
    setTimeout(() => { const b = document.getElementById('cmopen'); if (b) b.click(); }, 30);
  } }]);

  /* ---------- Λίστα καμπανιών ---------- */
  PL.register('camplist', {
    title: 'Καμπάνιες', nova,
    split: ['campaign'],
    render(el) {
      el.id = 'cmsh';
      el.innerHTML = `<h2>${PL.pct} Καμπάνιες</h2><button class="pri" id="cmopen" style="width:100%;padding:14px;font-size:17px;margin-bottom:10px">+ Νέα καμπάνια</button>
<div id="cmform" class="card" style="cursor:default" hidden><label>Τίτλος</label><input id="cmt" placeholder="π.χ. Topchic 10+2">
<label>Ισχύει έως</label><input id="cmu" type="date">
<label>Προϊόντα / κατηγορία</label><input id="cmp" placeholder="π.χ. Topchic, Colorance">
<label>Παρατηρήσεις</label><textarea id="cmn" rows="2" placeholder="π.χ. όροι της προσφοράς, ελάχιστη ποσότητα…"></textarea>
<p style="display:flex;gap:6px"><button class="pri" id="cmnew">Δημιουργία</button><button id="cmcancel">Άκυρο</button></p><div id="cmst" class="mu"></div></div><div id="cml"></div>`;
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      const row = ([id, x]) => { const n = cnt(x);
        return `<div class="card" data-camp="${esc(id)}"><div class="row"><span class="nm">${PL.pct} ${esc(x.title || '')}</span><span class="tz">${n.int + n.won + n.no} πελάτες</span></div><div class="mu">📅 ${esc(until(x))}${x.products ? ' · ' + esc(x.products) : ''}</div><div class="mu">${tally(n)}</div></div>`; };
      const paint = () => {
        const L = Object.entries(camp()).sort((a, b) => String(a[1].until || '9999').localeCompare(String(b[1].until || '9999')) || String(a[1].title).localeCompare(String(b[1].title), 'el'));
        const on = L.filter(([, x]) => M.campOn(x)), off = L.filter(([, x]) => !M.campOn(x)).reverse();
        $('#cml').innerHTML = (on.length ? on.map(row).join('') : '<p class="mu">Καμία ενεργή καμπάνια. Πάτα «+ Νέα καμπάνια».</p>') +
          (off.length ? `<h3 style="margin-top:18px">Ολοκληρωμένες (${off.length})</h3><div class="cmold">${off.map(row).join('')}</div>` : '');
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      $('#cmopen').onclick = () => { $('#cmform').hidden = false; $('#cmopen').hidden = true; $('#cmt').focus(); };
      $('#cmcancel').onclick = () => { $('#cmform').hidden = true; $('#cmopen').hidden = false; $('#cmst').textContent = ''; };
      $('#cml').addEventListener('click', (ev) => { const c = ev.target.closest('[data-camp]'); if (c) PL.nav.push('campaign', { id: c.dataset.camp }); });
      $('#cmnew').onclick = async () => {
        const t = $('#cmt').value.trim();
        if (!t) { $('#cmst').textContent = 'Γράψε τίτλο.'; return; }
        if (Object.values(camp()).some((x) => u.nn(x.title) === u.nn(t) && M.campOn(x))) { $('#cmst').textContent = 'Υπάρχει ήδη ενεργή καμπάνια με αυτόν τον τίτλο.'; return; }
        const id = 'k' + Date.now();
        try { await save(id, { title: t, until: $('#cmu').value || '', products: $('#cmp').value.trim(), notes: $('#cmn').value.trim(), cust: {}, created: u.today() }); PL.nav.push('campaign', { id }); }
        catch (e) { $('#cmst').textContent = 'Δεν αποθηκεύτηκε.'; }
      };
      return () => offs.forEach((f) => f());
    },
  });

  /* ---------- Λεπτομέρεια καμπάνιας ---------- */
  PL.register('campaign', {
    title: 'Καμπάνια', nova,
    render(el, params) {
      const id = params.id; let gone = false;
      el.innerHTML = `<h2 id="cmh"></h2><div id="cmi" class="warn"></div>
<details id="cmedit" style="margin-bottom:10px"><summary style="cursor:pointer;color:var(--ac);font-weight:600">✏️ Αλλαγή στοιχείων</summary><label>Τίτλος</label><input id="cmet">
<label>Ισχύει έως</label><input id="cmeu" type="date"><label>Προϊόντα / κατηγορία</label><input id="cmep">
<label>Παρατηρήσεις</label><textarea id="cmen" rows="2"></textarea><p><button class="pri" id="cmesave">Αποθήκευση</button></p></details>
<button class="pri" id="cmpick" style="width:100%;padding:12px;font-size:16px">+ Πρόσθεσε πελάτες από το πελατολόγιο</button>
<div style="display:flex;gap:6px;margin-top:8px"><input id="cmadd" list="dcl" placeholder="ή γράψε όνομα πελάτη…" style="flex:1;min-width:0"><button id="cmaddb">Προσθήκη</button></div>
<div id="cmdl" style="margin-top:8px"></div><p style="margin-top:18px"><button id="cmdel">🗑 Διαγραφή καμπάνιας</button></p><span id="dclh"></span>`;
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      const paint = () => {
        const x = camp()[id]; if (!x) { if (!gone) { gone = true; PL.nav.back(); } return; }
        const on = M.campOn(x), n = cnt(x);
        $('#cmh').innerHTML = PL.pct + ' ' + esc(x.title || '');
        $('#cmi').innerHTML = `<div>📅 ${esc(until(x))}${on ? '' : ' · <b>ολοκληρώθηκε</b>'}</div>${x.products ? `<div style="margin-top:4px">🧴 ${esc(x.products)}</div>` : ''}${x.notes ? `<div style="margin-top:4px;white-space:pre-wrap">${esc(x.notes)}</div>` : ''}<div style="margin-top:4px;font-weight:600">${n.int + n.won + n.no} πελάτες${tally(n) ? ' · ' + tally(n) : ''}</div>`;
        if (!$('#cmedit').open) { $('#cmet').value = x.title || ''; $('#cmeu').value = x.until || ''; $('#cmep').value = x.products || ''; $('#cmen').value = x.notes || ''; }
        const L = inC(x).map(([i, s]) => [M.byId(i), s]).sort((a, b) => String(a[0].city).localeCompare(String(b[0].city), 'el') || String(a[0].name).localeCompare(String(b[0].name), 'el'));
        /* κατάσταση: τρία μικρά κουμπιά σε μία σειρά (σήμα και λέξη)· το τρέχον χρωματισμένο */
        const seg = (c, s) => '<div class="cmseg">' + ['int', 'won', 'no'].map((k) => `<button data-cmst="${esc(c.i)}" data-v="${k}" class="${s === k ? 'on' : ''}" aria-pressed="${s === k}"><span>${ST[k].slice(0, ST[k].indexOf(' '))}</span>${ST[k].slice(ST[k].indexOf(' ') + 1)}</button>`).join('') + '</div>';
        const card = ([c, s]) => { const tel = PL.call.first(c); return `<div class="card" style="cursor:default"><div class="row"><span class="nm cmnm" data-open="${esc(c.i)}">${PL.prospects.tag(c)}${esc(c.name)} <span class="mu">›</span></span><button data-cmrm="${esc(c.i)}" aria-label="Αφαίρεση" style="padding:2px 10px">✕</button></div><div class="mu">${esc(c.addr || '')}${tel ? ` · ${PL.call.btn(tel, c.name, true)}` : ''}</div>${seg(c, s)}</div>`; };
        const sec = (k, t) => { const arr = L.filter(([, s]) => s === k); let cc = ''; return arr.length ? `<h3 style="margin-top:16px">${t} (${arr.length})</h3>` + arr.map((r) => { const hd = r[0].city !== cc ? (cc = r[0].city, `<div class="mu" style="font-weight:600;margin:8px 0 2px">${esc(cc)}</div>`) : ''; return hd + card(r); }).join('') : ''; };
        $('#cmdl').innerHTML = L.length ? sec('int', ST.int) + sec('won', ST.won) + sec('no', ST.no) : '<p class="mu">Κανένας πελάτης ακόμα.</p>';
        $('#dclh').innerHTML = PL.dcl();
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      const upd = async (fn) => { const x = Object.assign({}, camp()[id]); x.cust = Object.assign({}, x.cust); fn(x); try { await save(id, x); } catch (e) { D.toast('Δεν αποθηκεύτηκε'); } paint(); };
      $('#cmpick').onclick = () => PL.nav.push('smpick', {
        title: 'Για: ' + (camp()[id] || {}).title, inSet: () => new Set(Object.keys((camp()[id] || {}).cust || {})),
        onOk: async (ids) => { const x = Object.assign({}, camp()[id]); x.cust = Object.assign({}, x.cust); ids.forEach((i) => { if (!x.cust[i]) x.cust[i] = 'int'; }); await save(id, x); },
      });
      $('#cmesave').onclick = async () => {
        const t = $('#cmet').value.trim(); if (!t) { D.toast('Γράψε τίτλο'); return; }
        await upd((x) => Object.assign(x, { title: t, until: $('#cmeu').value || '', products: $('#cmep').value.trim(), notes: $('#cmen').value.trim() })); $('#cmedit').open = false; paint();
      };
      el.addEventListener('click', async (ev) => {
        const x = camp()[id]; if (!x) return;
        const t = ev.target.closest('[data-open],[data-cmst]') || ev.target;
        if (t.dataset.open) PL.nav.push('client', { id: t.dataset.open });
        else if (t.dataset.cmst) { if (x.cust[t.dataset.cmst] !== t.dataset.v) await upd((y) => { y.cust[t.dataset.cmst] = t.dataset.v; }); }
        else if (t.dataset.cmrm) {
          const c = M.byId(t.dataset.cmrm);
          if (!(await D.confirm('Να αφαιρεθεί ο «' + (c ? c.name : '') + '» από την καμπάνια;', 'Ναι, αφαίρεση'))) return;
          await upd((y) => { delete y.cust[t.dataset.cmrm]; });
        } else if (t.id === 'cmaddb') {
          const c = PL.dclId($('#cmadd').value); if (!M.byId(c)) { D.toast('Διάλεξε πελάτη από τη λίστα'); return; }
          await upd((y) => { if (!y.cust[c]) y.cust[c] = 'int'; }); $('#cmadd').value = '';
        } else if (t.id === 'cmdel') {
          if (!(await D.confirm('Να διαγραφεί η καμπάνια «' + x.title + '»; Οι πελάτες δεν επηρεάζονται.'))) return;
          gone = true;
          try { await db().remove('campaigns/' + id); } catch (e) { /* χωρίς σύνδεση */ }
          S.drop('campaigns', id); PL.nav.back();
        }
      });
      return () => offs.forEach((f) => f());
    },
  });

  /* Καρτέλα πελάτη, κουμπί «Καμπάνια»: διάλεξε ενεργή καμπάνια → μπαίνει «Ενδιαφέρεται»· αν είναι ήδη μέσα, αλλάζεις κατάσταση ή τον αφαιρείς. */
  PL.campaigns = {
    ST,
    /* '' (καμία ενεργή) · 'int' (ενδιαφέρεται σε κάποια) · 'won' (την πήρε) */
    state: (cid) => { const L = Object.values(camp()).filter((x) => M.campOn(x) && x.cust && x.cust[cid]); return L.some((x) => x.cust[cid] === 'int') ? 'int' : L.some((x) => x.cust[cid] === 'won') ? 'won' : L.length ? 'no' : ''; },
    line: (cid) => { const L = Object.values(camp()).filter((x) => M.campOn(x) && x.cust && x.cust[cid]).map((x) => x.title + ' (' + ST[x.cust[cid]] + ')');
      return L.length ? `<div class="debt">${PL.pct} Καμπάνιες: ${esc(L.join(', '))}</div>` : ''; },
    async pick(cid) {
      const c = M.byId(cid), nm = c ? c.name : '';
      const L = Object.entries(camp()).filter(([, x]) => M.campOn(x)).sort((a, b) => String(a[1].until || '9999').localeCompare(String(b[1].until || '9999')));
      if (!L.length) { D.toast('Δεν υπάρχει ενεργή καμπάνια. Φτιάξε μία από την αρχική: Ενέργειες → Καμπάνιες.'); return; }
      const opts = L.map(([, x]) => (x.cust && x.cust[cid] ? ST[x.cust[cid]].slice(0, 2) + ' ' : '') + (x.title || 'Καμπάνια') + ' · ' + until(x)); opts.push('Άκυρο');
      const k = await D.choice('Σε ποια καμπάνια να μπει ο «' + nm + '»;', opts);
      if (k == null || k >= L.length) return;
      const [kid, x0] = L[k], x = Object.assign({}, x0, { cust: Object.assign({}, x0.cust) }), cur = x.cust[cid];
      if (!cur) { x.cust[cid] = 'int'; await save(kid, x); D.toast('Μπήκε στην καμπάνια «' + x.title + '» · ενδιαφέρεται'); return; }
      const ks = ['int', 'won', 'no'], o2 = ks.map((s) => (s === cur ? '● ' : '') + ST[s]).concat(['Αφαίρεση από την καμπάνια', 'Άκυρο']);
      const j = await D.choice('«' + nm + '» στην καμπάνια «' + x.title + '»:', o2);
      if (j == null || j > ks.length) return;
      if (j === ks.length) { if (!await D.confirm('Να αφαιρεθεί ο «' + nm + '» από την καμπάνια «' + x.title + '»;', 'Ναι, αφαίρεση')) return; delete x.cust[cid]; await save(kid, x); D.toast('Αφαιρέθηκε από την καμπάνια'); return; }
      if (ks[j] === cur) return;
      x.cust[cid] = ks[j]; await save(kid, x); D.toast(x.title + ': ' + ST[ks[j]]);
    },
  };
})();
