/* Σεμινάρια: λίστα (semlist), λεπτομέρεια (seminar) και «Επιλογή πελατών» (smpick, κοινή και για το πρόγραμμα). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, D = PL.dlg, esc = u.esc, money = u.money, db = () => PL.adapter.db;
  const COLS = ['clients', 'prospects', 'seminars', 'notes', 'brands'];
  const sem = () => S.all('seminars');
  const when = (x) => [x.date ? x.date.split('-').reverse().join('/') : '', x.time || ''].filter(Boolean).join(' ');
  const save = async (id, x) => { await db().set('seminars/' + id, x); S.put('seminars', id, x); };
  const tel1 = (c) => [c.t1, c.t2].concat(c.more || []).filter(Boolean)[0];
  const nin = (a) => (a || []).filter((i) => M.byId(i));

  /* Το «+» σε κάθε οθόνη σεμιναρίων: «Νέο σεμινάριο» → πάει στη λίστα και ανοίγει τη φόρμα. */
  const nova = () => PL.menu('Σεμινάρια', [{ e: '🎓', label: 'Νέο σεμινάριο', d: '', fn: () => {
    while (PL.nav.current().id !== 'semlist' && PL.nav.depth() > 1) PL.nav.back();
    if (PL.nav.current().id !== 'semlist') PL.nav.push('semlist');
    setTimeout(() => { const b = document.getElementById('smopen'); if (b) b.click(); }, 30);
  } }]);

  /* ---------- Λίστα σεμιναρίων ---------- */
  PL.register('semlist', {
    title: 'Σεμινάρια', nova,
    split: ['seminar'],
    render(el) {
      el.id = 'smsh';   /* όπως στην παλιά: ο τίτλος παίρνει το μωβ των σεμιναρίων (#smsh h2) */
      el.innerHTML = `<h2>🎓 Σεμινάρια</h2><button class="pri" id="smopen" style="width:100%;padding:14px;font-size:17px;margin-bottom:10px">+ Νέο σεμινάριο</button>
<div id="smform" class="card" style="cursor:default" hidden><label>Τίτλος</label><input id="smt" placeholder="π.χ. Τεχνικές ξανοίγματος">
<div style="display:flex;gap:6px"><div style="flex:1"><label>Ημερομηνία</label><input id="smdt" type="date"></div><div style="flex:none;width:120px"><label>Ώρα</label><input id="smtm" type="time"></div></div>
<label>Παρατηρήσεις</label><textarea id="smnt" rows="2" placeholder="π.χ. Ακαδημία Θεσσαλονίκης, εισηγητής, κόστος…"></textarea>
<p style="display:flex;gap:6px"><button class="pri" id="smnew">Δημιουργία</button><button id="smcancel">Άκυρο</button></p><div id="smst" class="mu"></div></div><div id="sml"></div>`;
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      const paint = () => {
        const L = Object.entries(sem()).sort((a, b) => ((a[1].date || '9') < (b[1].date || '9') ? -1 : (a[1].date || '9') > (b[1].date || '9') ? 1 : String(a[1].title).localeCompare(String(b[1].title), 'el')));
        $('#sml').innerHTML = L.length ? L.map(([id, x]) => { const nc = nin(x.cust).length, nf = (x.conf || []).filter((c) => (x.cust || []).includes(c)).length;
          return `<div class="card" data-sem="${esc(id)}"><div class="row"><span class="nm">🎓 ${esc(x.title || '')}</span><span class="tz">${nc} πελάτες${nf ? ' · ✅ ' + nf : ''}</span></div><div class="mu">${when(x) ? '📅 ' + esc(when(x)) : 'Χωρίς ημερομηνία'}${x.notes ? ' · ' + esc(x.notes) : ''}</div></div>`; }).join('')
          : '<p class="mu">Δεν υπάρχουν σεμινάρια ακόμα. Πάτα «+ Νέο σεμινάριο» ή πες στην υπαγόρευση π.χ. «ο Ζαμουρίδης ενδιαφέρεται για το σεμινάριο ξανοίγματος».</p>';
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      $('#smopen').onclick = () => { $('#smform').hidden = false; $('#smopen').hidden = true; $('#smt').focus(); };
      $('#smcancel').onclick = () => { $('#smform').hidden = true; $('#smopen').hidden = false; $('#smst').textContent = ''; };
      $('#sml').addEventListener('click', (ev) => { const c = ev.target.closest('[data-sem]'); if (c) PL.nav.push('seminar', { id: c.dataset.sem }); });
      $('#smnew').onclick = async () => {
        const t = $('#smt').value.trim();
        if (!t) { $('#smst').textContent = 'Γράψε τίτλο.'; return; }
        if (Object.values(sem()).some((x) => u.nn(x.title) === u.nn(t))) { $('#smst').textContent = 'Υπάρχει ήδη σεμινάριο με αυτόν τον τίτλο.'; return; }
        const id = 's' + Date.now();
        try { await save(id, { title: t, date: $('#smdt').value || '', time: $('#smtm').value || '', notes: $('#smnt').value.trim(), cust: [], created: u.today() }); PL.nav.push('seminar', { id }); }
        catch (e) { $('#smst').textContent = 'Δεν αποθηκεύτηκε.'; }
      };
      return () => offs.forEach((f) => f());
    },
  });

  /* ---------- Λεπτομέρεια σεμιναρίου ---------- */
  PL.register('seminar', {
    title: 'Σεμινάριο', nova,
    render(el, params) {
      const id = params.id; let gone = false;
      el.innerHTML = `<h2 id="smdt2"></h2><div id="smdi" class="warn"></div>
<details id="smedit" style="margin-bottom:10px"><summary style="cursor:pointer;color:var(--ac);font-weight:600">✏️ Αλλαγή στοιχείων</summary><label>Τίτλος</label><input id="smet">
<div style="display:flex;gap:6px"><div style="flex:1"><label>Ημερομηνία</label><input id="smed" type="date"></div><div style="flex:none;width:120px"><label>Ώρα</label><input id="smetm" type="time"></div></div>
<label>Παρατηρήσεις</label><textarea id="smen" rows="2"></textarea><p><button class="pri" id="smesave">Αποθήκευση</button></p></details>
<button class="pri" id="smpick" style="width:100%;padding:12px;font-size:16px">+ Πρόσθεσε πελάτες από το πελατολόγιο</button>
<div style="display:flex;gap:6px;margin-top:8px"><input id="smadd" list="dcl" placeholder="ή γράψε όνομα πελάτη…" style="flex:1;min-width:0"><button id="smaddb">Προσθήκη</button></div>
<div id="smdl" style="margin-top:8px"></div><p style="margin-top:18px"><button id="smdel">🗑 Διαγραφή σεμιναρίου</button></p><span id="dclh"></span>`;
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      const paint = () => {
        const x = sem()[id]; if (!x) { if (!gone) { gone = true; PL.nav.back(); } return; }
        $('#smdt2').textContent = '🎓 ' + (x.title || '');
        const k = nin(x.cust), cf = new Set(x.conf || []);
        $('#smdi').innerHTML = `<div>📅 ${when(x) ? esc(when(x)) : 'Χωρίς ημερομηνία'}</div>${x.notes ? `<div style="margin-top:4px;white-space:pre-wrap">${esc(x.notes)}</div>` : ''}<div style="margin-top:4px;font-weight:600">${k.length} πελάτες · ✅ ${k.filter((c) => cf.has(c)).length} επιβεβαιωμένοι · ⏳ ${k.filter((c) => !cf.has(c)).length} σε εκκρεμότητα</div>`;
        if (!$('#smedit').open) { $('#smet').value = x.title || ''; $('#smed').value = x.date || ''; $('#smetm').value = x.time || ''; $('#smen').value = x.notes || ''; }
        const L = k.map((i) => M.byId(i)).sort((a, b) => String(a.city).localeCompare(String(b.city), 'el') || String(a.name).localeCompare(String(b.name), 'el'));
        const card = (c) => { const tel = tel1(c); return `<div class="card" style="cursor:default"><div class="row"><span class="nm">${PL.prospects.tag(c)}${esc(c.name)}</span><button data-smrm="${esc(c.i)}" aria-label="Αφαίρεση" style="padding:2px 10px">✕</button></div><div class="mu">${esc(c.addr || '')}${tel ? ` · ${PL.call.btn(tel, c.name, true)}` : ''}</div><div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><button data-open="${esc(c.i)}">Καρτέλα</button>${cf.has(c.i) ? `<span class="up" style="padding:6px 4px">✅ Επιβεβαιώθηκε</span><button data-smun="${esc(c.i)}" style="padding:4px 10px;font-size:13px">Αναίρεση</button>` : `<button class="pri" data-smok="${esc(c.i)}">✓ Επιβεβαιώθηκε</button>`}</div></div>`; };
        const sec = (arr, t) => { let cc = ''; return arr.length ? `<h3 style="margin-top:16px">${t} (${arr.length})</h3>` + arr.map((c) => { const hd = c.city !== cc ? (cc = c.city, `<div class="mu" style="font-weight:600;margin:8px 0 2px">${esc(cc)}</div>`) : ''; return hd + card(c); }).join('') : ''; };
        $('#smdl').innerHTML = L.length ? sec(L.filter((c) => !cf.has(c.i)), '⏳ Σε εκκρεμότητα') + sec(L.filter((c) => cf.has(c.i)), '✅ Επιβεβαιωμένοι') : '<p class="mu">Κανένας πελάτης ακόμα.</p>';
        $('#dclh').innerHTML = PL.dcl();
      };
      paint();
      const offs = COLS.map((c) => S.on(c, paint));
      const upd = async (fn) => { const x = Object.assign({}, sem()[id]); fn(x); try { await save(id, x); } catch (e) { D.toast('Δεν αποθηκεύτηκε'); } paint(); };
      $('#smpick').onclick = () => PL.nav.push('smpick', {
        title: 'Για: ' + (sem()[id] || {}).title, inSet: () => new Set((sem()[id] || {}).cust || []),
        onOk: async (ids) => { const x = Object.assign({}, sem()[id]); x.cust = [...new Set((x.cust || []).concat(ids))]; await save(id, x); },
      });
      $('#smesave').onclick = async () => {
        const t = $('#smet').value.trim(); if (!t) { D.toast('Γράψε τίτλο'); return; }
        await upd((x) => Object.assign(x, { title: t, date: $('#smed').value || '', time: $('#smetm').value || '', notes: $('#smen').value.trim() })); $('#smedit').open = false; paint();
      };
      el.addEventListener('click', async (ev) => {
        const t = ev.target, x = sem()[id]; if (!x) return;
        if (t.dataset.open) PL.nav.push('client', { id: t.dataset.open });
        else if (t.dataset.smok || t.dataset.smun) { const c = t.dataset.smok || t.dataset.smun; await upd((y) => { const cf = new Set(y.conf || []); t.dataset.smok ? cf.add(c) : cf.delete(c); y.conf = [...cf]; }); }
        else if (t.dataset.smrm) {
          const c = M.byId(t.dataset.smrm);
          if (!(await D.confirm('Να αφαιρεθεί ο «' + (c ? c.name : '') + '» από το σεμινάριο;', 'Ναι, αφαίρεση'))) return;
          await upd((y) => { y.cust = (y.cust || []).filter((i) => i !== t.dataset.smrm); y.conf = (y.conf || []).filter((i) => i !== t.dataset.smrm); });
        } else if (t.id === 'smaddb') {
          const c = PL.dclId($('#smadd').value); if (!M.byId(c)) { D.toast('Διάλεξε πελάτη από τη λίστα'); return; }
          await upd((y) => { y.cust = [...new Set((y.cust || []).concat([c]))]; }); $('#smadd').value = '';
        } else if (t.id === 'smdel') {
          if (!(await D.confirm('Να διαγραφεί το σεμινάριο «' + x.title + '»; Οι πελάτες δεν επηρεάζονται.'))) return;
          gone = true;
          try { await db().remove('seminars/' + id); } catch (e) { /* χωρίς σύνδεση */ }
          S.drop('seminars', id); PL.nav.back();
        }
      });
      return () => offs.forEach((f) => f());
    },
  });

  /* ---------- Επιλογή πελατών (κοινή) ---------- 
     params: {title, inSet():Set (όσοι είναι ήδη μέσα), cities?:[πόλεις], onOk(ids)} */
  PL.register('smpick', {
    title: 'Επιλογή πελατών', nova,
    render(el, params) {
      el.innerHTML = `<h2>Επιλογή πελατών</h2><div class="mu" style="margin-bottom:8px">${esc(params.title || '')}</div>
<div style="display:flex;gap:6px;flex-wrap:wrap"><select id="smpc" style="flex:1;min-width:150px"></select><select id="smpk" style="flex:1;min-width:150px"></select></div>
<div style="display:flex;gap:6px;margin-top:6px;align-items:center"><input id="smpq" placeholder="Αναζήτηση ονόματος…" style="flex:1;min-width:0"><label style="margin:0;display:flex;align-items:center;gap:4px;white-space:nowrap;color:var(--tx);font-size:14px"><input type="checkbox" id="smpz" style="width:auto"> Με τζίρο</label></div>
<div style="display:flex;gap:6px;margin:8px 0"><button id="smpall">Επιλογή όλων</button><button id="smpnone">Καθαρισμός</button><span id="smpn" class="mu" style="align-self:center;margin-left:auto"></span></div>
<div id="smpl"></div><div class="smbar"><button class="pri" id="smpok" style="width:100%;padding:14px;font-size:17px">Προσθήκη</button></div>`;
      const $ = (s) => el.querySelector(s);
      COLS.forEach((c) => S.use(c));
      let sel = new Set();
      const C = M.clients(), cs = params.cities || null;
      const cm = {}; C.forEach((c) => { if (!cs || cs.includes(c.city)) cm[c.city] = (cm[c.city] || 0) + 1; });
      const cityKeys = cs ? cs : Object.keys(cm).sort((a, b) => a.localeCompare(b, 'el'));
      $('#smpc').innerHTML = (cs ? (cs.length > 1 ? '<option value="">Όλες οι περιοχές του προγράμματος</option>' : '') : '<option value="">Όλες οι περιοχές</option>') + cityKeys.map((k) => `<option value="${esc(k)}">${esc(k)} (${cm[k] || 0})</option>`).join('');
      $('#smpk').innerHTML = '<option value="">Όλες οι κατηγορίες</option>' + M.PR.map((k) => `<option value="${esc(k)}">Δουλεύει ${esc(k)}</option>`).join('');
      const list = () => {
        const inS = params.inSet ? params.inSet() : new Set(), cy = $('#smpc').value, k = $('#smpk').value, q = u.nn($('#smpq').value).trim(), z = $('#smpz').checked, pc = cs ? new Set(cs) : null;
        return C.filter((c) => (cy ? c.city === cy : (!pc || pc.has(c.city))) && (!k || M.works(c.i).includes(k)) && (!z || (M.tz(c) || 0) > 0) && (!q || u.nn(c.name + ' ' + (c.alt || []).join(' ') + ' ' + c.code).includes(q)))
          .sort((a, b) => String(a.city).localeCompare(String(b.city), 'el') || (M.tz(b) || 0) - (M.tz(a) || 0)).map((c) => ({ c, in: inS.has(c.i) }));
      };
      const paint = () => {
        const L = list(); let cc = '';
        $('#smpl').innerHTML = L.length ? L.map(({ c, in: i }) => { const hd = !$('#smpc').value && c.city !== cc ? (cc = c.city, `<h3>${esc(cc)}</h3>`) : '', e = M.entries(c.i)[0], tz = M.tz(c) || 0;
          return hd + `<label class="card" style="display:flex;gap:10px;align-items:center;cursor:pointer;margin:6px 0;color:var(--tx);font-size:15px${i ? ';opacity:.55' : ''}"><input type="checkbox" data-smp="${esc(c.i)}" ${i || sel.has(c.i) ? 'checked' : ''} ${i ? 'disabled' : ''} style="width:22px;height:22px;flex:none"><span style="flex:1;min-width:0"><span class="nm">${PL.prospects.tag(c)}${esc(c.name)}</span><br><span class="mu">${esc(c.city)}${tz > 0 ? ' · ' + money(tz) : ' · χωρίς τζίρο'}${e && e.d ? ' · τελ. επαφή ' + esc(e.d) : ''}${i ? ' · ήδη μέσα' : ''}</span></span></label>`; }).join('')
          : '<p class="mu">Κανένας πελάτης με αυτά τα φίλτρα.</p>';
        $('#smpn').textContent = L.length + ' πελάτες'; $('#smpok').textContent = sel.size ? 'Προσθήκη (' + sel.size + ')' : 'Διάλεξε πελάτες'; $('#smpok').disabled = !sel.size;
      };
      paint();
      ['smpc', 'smpk', 'smpz'].forEach((i) => $('#' + i).addEventListener('change', paint)); $('#smpq').addEventListener('input', paint);
      $('#smpl').addEventListener('change', (ev) => { const i = ev.target.dataset.smp; if (!i) return; ev.target.checked ? sel.add(i) : sel.delete(i); $('#smpok').textContent = sel.size ? 'Προσθήκη (' + sel.size + ')' : 'Διάλεξε πελάτες'; $('#smpok').disabled = !sel.size; });
      $('#smpall').onclick = () => { list().forEach(({ c, in: i }) => { if (!i) sel.add(c.i); }); paint(); };
      $('#smpnone').onclick = () => { sel = new Set(); paint(); };
      $('#smpok').onclick = async () => {
        if (!sel.size) return; $('#smpok').disabled = true;
        try { await params.onOk([...sel]); PL.nav.back(); } catch (e) { D.toast('Δεν αποθηκεύτηκε'); $('#smpok').disabled = false; }
      };
    },
  });
})();
