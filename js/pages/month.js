/* «Πρόγραμμα μήνα»: μήνας ανά εβδομάδα, ταξίδι ανά μέρα, πρόταση, ρυθμίσεις ταξιδιών, κάλυψη. (Πόρτα της παλιάς, ίδια εμφάνιση.) */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, MP = PL.monthplan, D = PL.dlg, esc = u.esc, db = () => PL.adapter.db;
  const WD = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];
  const MN = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
  const st = { y: new Date().getFullYear(), m: new Date().getMonth(), edit: '' };
  const mkey = () => st.y + '-' + String(st.m + 1).padStart(2, '0');
  const cityMap = () => { const cm = {}; M.clients().forEach((c) => (cm[c.city] = 1)); return cm; };
  const FQ = [[1, 'κάθε εβδομάδα'], [2, 'κάθε 2 εβδομάδες'], [4, 'κάθε μήνα'], [6, 'κάθε 6 εβδομάδες'], [8, 'κάθε 2 μήνες'], [12, 'κάθε 3 μήνες']];

  PL.register('month', {
    title: 'Πρόγραμμα μήνα',
    render(el) {
      el.classList.add('mo');
      el.innerHTML = `<h2 style="color:var(--pmon)">🗓 Πρόγραμμα μήνα</h2>
        <div class="mnav"><button id="moprev">‹</button><b id="motl"></b><button id="monext">›</button></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="pri" id="mogen" style="flex:1">✨ Πρότεινέ μου μήνα</button><button id="moset">⚙️ Ταξίδια &amp; ρυθμίσεις</button></div>
        <div id="mocov" class="warn" style="margin-top:10px"></div><div id="moset2" hidden></div><div id="mobody"></div>
        <p class="mu" style="font-size:13px">Οι αποστάσεις είναι κατά προσέγγιση (ευθεία × 1,3). Πάτα «▶ Πρόγραμμα ημέρας» για να φτιαχτεί το γνωστό πρόγραμμα με πελάτες και σειρά δρόμου.</p>`;
      const $ = (s) => el.querySelector(s);
      ['clients', 'prospects', 'notes', 'plans', 'visits', 'sos', 'settings', 'month', 'brands'].forEach((c) => S.use(c));
      const MON = () => JSON.parse(JSON.stringify(S.get('month', mkey()) || { days: {} }));
      const saveMon = async (doc) => { S.put('month', mkey(), doc); try { await db().set('month/' + mkey(), doc); } catch (e) { D.toast('Δεν αποθηκεύτηκε'); } };

      const editor = (SET, k, x) => {
        const sel = new Set(x.cities || []), cm = cityMap();
        return `<div class="ced" style="margin-top:8px">${SET.trips.map((t) => `<div class="trc" style="border-left-color:${t.color}"><b>${esc(t.name)}</b><br>${t.cities.filter((c) => cm[c]).map((c) => `<label><input type="checkbox" data-mocc="${esc(c)}" ${sel.has(c) ? 'checked' : ''}>${esc(c)} <span class="mu">(${MP.targets(c).length})</span></label>`).join('')}</div>`).join('')}
          <label style="margin-top:6px"><input type="checkbox" id="mooff" ${x.off ? 'checked' : ''}> Χωρίς επισκέψεις (γραφείο, ρεπό, σεμινάριο)</label>
          <input id="monote" placeholder="Σημείωση (προαιρετικό)" value="${esc(x.note || '')}" style="margin-top:6px">
          <div class="dbt"><button class="pri" data-mosv="${k}">Αποθήκευση</button><button data-mocx="1">Άκυρο</button></div></div>`;
      };
      const setHtml = (SET) => {
        const cm = cityMap();
        return `<div class="card" style="cursor:default;margin-top:10px"><div class="row" style="gap:8px;flex-wrap:wrap">
          <label style="margin:0">Ξεκινάω από<select id="mobase" style="margin-top:4px">${Object.keys(MP.GEO).filter((c) => cm[c] || c === SET.base).sort((a, b) => a.localeCompare(b, 'el')).map((c) => `<option ${c === SET.base ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
          <label style="margin:0">Επισκέψεις τη μέρα<input id="movpd" type="number" min="3" max="20" value="${SET.vpd}" style="margin-top:4px;width:90px"></label></div>
          ${SET.trips.map((t) => `<div class="trc" style="border-left-color:${t.color}"><div class="row"><b>${esc(t.name)}</b><select data-mofq="${t.id}" style="width:auto;padding:4px 8px">${FQ.map(([v, l]) => `<option value="${v}" ${t.freq == v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="mu" style="font-size:13px">${t.cities.filter((c) => cm[c]).map((c) => `${esc(c)} <select data-mocity="${esc(c)}" style="width:auto;padding:1px 4px;font-size:12px">${SET.trips.map((q) => `<option value="${q.id}" ${q.id === t.id ? 'selected' : ''}>${esc(q.name.split(' ')[0])}</option>`).join('')}</select>`).join(' · ')}</div></div>`).join('')}
          ${(() => { const miss = Object.keys(cm).filter((c) => !MP.tripOf(SET, c)); return miss.length ? `<p class="mu">Χωρίς ταξίδι: ${esc(miss.join(', '))}</p>` : ''; })()}
          <div class="dbt"><button class="pri" id="mosetsv">Αποθήκευση ρυθμίσεων</button><button id="mosetrs">Επαναφορά αρχικών</button></div></div>`;
      };

      const paint = () => {
        if (!S.loaded('settings') || !S.loaded('clients')) { $('#mobody').innerHTML = '<p class="mu">Φορτώνω…</p>'; return; }
        const SET = MP.settings(), mon = MON(), days = MP.workdays(st.y, st.m), W = MP.weeksOf(days), td = MP.iso(new Date()), has = Object.keys(mon.days || {}).length;
        $('#motl').textContent = MN[st.m] + ' ' + st.y;
        const [s, a] = MP.coverage(st.y, st.m);
        $('#mocov').innerHTML = `<b>Κάλυψη ${MN[st.m].toLowerCase()}:</b> είδες ${s} από τους ${a} ενεργούς πελάτες (${a ? Math.round(s / a * 100) : 0}%)<div class="prog" style="height:8px;background:var(--bd);border-radius:4px;margin-top:6px;overflow:hidden"><div style="height:100%;width:${a ? s / a * 100 : 0}%;background:var(--ac)"></div></div>`;
        let h = has ? '' : '<p class="mu" style="margin-top:12px">Δεν έχει στηθεί ακόμα πρόγραμμα γι\' αυτόν τον μήνα. Πάτα «✨ Πρότεινέ μου μήνα» ή «✎» σε μια μέρα για να τη συμπληρώσεις μόνος σου.</p>';
        W.forEach((wk, wi) => {
          const trips = [...new Set(wk.map((k) => (mon.days[k] || {}).trip).filter(Boolean))].map((id) => (SET.trips.find((t) => t.id === id) || {}).name).filter(Boolean);
          const a1 = new Date(wk[0] + 'T12:00:00'), b1 = new Date(wk[wk.length - 1] + 'T12:00:00');
          h += `<div class="wk">Εβδομάδα ${wi + 1} · ${a1.getDate()}–${b1.getDate()}/${st.m + 1}${trips.length ? ' <span class="mu" style="font-weight:400">· ' + esc(trips.join(', ')) + '</span>' : ''}</div>`;
          wk.forEach((k) => {
            const di = days.indexOf(k), d = new Date(k + 'T12:00:00'), x = mon.days[k] || {}, t = SET.trips.find((q) => q.id === x.trip), cs = x.cities || [];
            const n = cs.reduce((sum, c) => sum + MP.targets(c).length, 0), kmv = cs.length ? MP.dayKm(SET, mon.days, days, di) : 0;
            h += `<div class="day${k < td ? ' past' : ''}${k === td ? ' today' : ''}"><div class="dd">${WD[d.getDay()]}<small>${d.getDate()}/${st.m + 1}</small></div><div>${cs.length
              ? `<div class="cty"><span class="tdot" style="background:${t ? t.color : 'var(--mu)'}"></span>${esc(cs.join(', '))}</div><div class="dm">${t ? esc(t.name) + ' · ' : ''}${n} πελάτες${t && t.island ? ' · ✈️/⛴ ταξίδι' : kmv ? ' · ~' + Math.round(kmv) + ' χλμ (' + MP.fmtT(kmv) + ' οδήγηση)' : ''}${x.ovNext ? ' · 🛏 διανυκτέρευση' : ''}</div>`
              : `<div class="mu">${x.off ? '🚫 Χωρίς επισκέψεις' + (x.note ? ' · ' + esc(x.note) : '') : '— κενή μέρα —'}</div>`}${st.edit === k ? editor(SET, k, x) : `<div class="dbt">${cs.length ? `<button class="pri" data-mogo="${k}">▶ Πρόγραμμα ημέρας</button>` : ''}<button data-moed="${k}">✎ Αλλαγή</button></div>`}</div></div>`;
          });
        });
        $('#mobody').innerHTML = h;
        if (!$('#moset2').hidden) $('#moset2').innerHTML = setHtml(SET);
      };
      paint();
      const offs = ['settings', 'clients', 'plans', 'month', 'notes', 'brands'].map((c) => S.on(c, () => { if (!st.edit && $('#moset2').hidden) paint(); }));
      const shift = (n) => { st.m += n; if (st.m < 0) { st.m = 11; st.y--; } if (st.m > 11) { st.m = 0; st.y++; } st.edit = ''; paint(); };
      $('#moprev').onclick = () => shift(-1);
      $('#monext').onclick = () => shift(1);
      $('#moset').onclick = () => { const b = $('#moset2'); b.hidden = !b.hidden; if (!b.hidden) b.innerHTML = setHtml(MP.settings()); };
      $('#mogen').onclick = async () => {
        const td = MP.iso(new Date()), mon = MON(), has = Object.keys(mon.days || {}).some((k) => k >= td);
        if (has && !(await D.confirm('Να αντικατασταθεί το πρόγραμμα του μήνα από σήμερα και μετά με νέα πρόταση;', 'Ναι, νέα πρόταση', 'Άκυρο'))) return;
        const P = MP.propose(MP.settings(), st.y, st.m), keep = {};
        Object.entries(mon.days || {}).forEach(([k, v]) => { if (k < td || v.off) keep[k] = v; });
        await saveMon({ days: Object.assign({}, P, keep) }); paint();
      };
      $('#moset2').addEventListener('click', async (ev) => {
        const t = ev.target; let SET;
        if (t.id === 'mosetrs') { if (!(await D.confirm('Να γυρίσουν τα ταξίδια στις αρχικές ρυθμίσεις;', 'Ναι, επαναφορά'))) return; SET = JSON.parse(JSON.stringify(MP.DEF)); }
        else if (t.id === 'mosetsv') {
          SET = MP.settings(); SET.base = $('#mobase').value; SET.vpd = Math.max(3, Math.min(20, +$('#movpd').value || 8));
          el.querySelectorAll('[data-mofq]').forEach((s) => { const q = SET.trips.find((x) => x.id === s.dataset.mofq); if (q) q.freq = +s.value; });
          el.querySelectorAll('[data-mocity]').forEach((s) => { const c = s.dataset.mocity, to = s.value; SET.trips.forEach((q) => { q.cities = q.cities.filter((x) => x !== c); }); const q = SET.trips.find((x) => x.id === to); if (q) q.cities.push(c); });
        } else return;
        S.put('settings', 'trips', SET);
        try { await db().set('settings/trips', SET); } catch (e) { D.toast('Δεν αποθηκεύτηκε'); }
        paint();
      });
      $('#mobody').addEventListener('click', async (ev) => {
        const t = ev.target;
        if (t.dataset.moed) { st.edit = t.dataset.moed; paint(); }
        else if (t.dataset.mocx) { st.edit = ''; paint(); }
        else if (t.dataset.mosv) {
          const k = t.dataset.mosv, cs = [...el.querySelectorAll('[data-mocc]:checked')].map((x) => x.dataset.mocc), off = $('#mooff').checked, note = $('#monote').value.trim(), SET = MP.settings();
          const ord = []; SET.trips.forEach((q) => q.cities.forEach((c) => { if (cs.includes(c)) ord.push(c); }));
          const tr = ord.length ? (MP.tripOf(SET, ord[0]) || {}).id : '', mon = MON(); mon.days = mon.days || {};
          if (!ord.length && !off && !note) delete mon.days[k]; else mon.days[k] = { trip: tr, cities: off ? [] : ord, off, note };
          st.edit = ''; await saveMon(mon); paint();
        } else if (t.dataset.mogo) {
          const x = MON().days[t.dataset.mogo]; if (!x || !(x.cities || []).length) return;
          const cm = cityMap(); PL.dayplan.st.sel = new Set(x.cities.filter((c) => cm[c])); PL.nav.push('dayplan', { auto: true });
        }
      });
      return () => offs.forEach((f) => f());
    },
  });
})();
