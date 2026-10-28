/* «Επισκέψεις εκτός προγράμματος» (ίδιο με της παλιάς σελίδας): για μέρες στη βάση και γύρω, χωρίς πρόγραμμα.
   Πόλη → περιοχή → ΤΚ, αναζήτηση με φωνητικό ταίριασμα, φίλτρα, ✓ Επίσκεψη, 🕐 Ραντεβού (πάνω-πάνω τα ραντεβού, σε σειρά ώρας). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, E = PL.plans, D = PL.dlg, esc = u.esc, money = u.money, db = () => PL.adapter.db;
  const XV = { city: '', area: '', zip: '', f: 'all', q: '' };
  const fmt = (d) => (d ? String(d).split('-').reverse().slice(0, 2).join('/') : '');
  const trips = () => S.get('settings', 'trips') || {};
  const xvCities = () => {
    const tr = trips(), base = tr.base || ''; if (!base) return [];
    const t = (tr.trips || []).find((x) => (x.cities || []).includes(base)), L = t ? t.cities.slice() : [base];
    return [base].concat(L.filter((c) => c !== base));
  };
  E.baseCities = xvCities;
  const owe = (id) => { const b = E.owB(id); return { a: b.a, o: b.o }; };

  PL.register('free', {
    title: 'Επισκέψεις εκτός προγράμματος',
    split: ['client'],
    nova: () => PL.menu('Εκτός προγράμματος', [{ e: '🆕', label: 'Νέο κομμωτήριο', d: '', fn: () => PL.dictation.open('Νέο κομμωτήριο ' + (trips().base || '') + ': ') }]),
    render(el) {
      el.id = 'xvsh';
      el.innerHTML = `<h2 style="color:#b5651d;margin:4px 0 6px">🚶 Επισκέψεις εκτός προγράμματος</h2><div id="xvtop"></div>
<div class="chips" id="xvc" style="flex-wrap:wrap"></div><div class="chips" id="xva" style="flex-wrap:wrap"></div><div class="chips" id="xvz" style="flex-wrap:wrap"></div>
<input id="xvq" type="search" placeholder="Όνομα, διεύθυνση ή τηλέφωνο…" autocomplete="off" style="margin:6px 0" value="${esc(XV.q)}"><div class="chips" id="xvf"></div><div id="xvl"></div>`;
      const $ = (s) => el.querySelector(s);
      E.use(); S.use('settings');
      let asking = false, apEdit = '';   // apEdit: πελάτης με ανοιχτό πεδίο ραντεβού
      const custs = () => { const set = new Set(XV.city ? [XV.city] : xvCities()); return M.clients().filter((c) => set.has(c.city)); };

      function chips() {
        const CS = xvCities(), L = custs(), all = M.clients().filter((c) => CS.includes(c.city)), cc = {}; all.forEach((c) => { cc[c.city] = (cc[c.city] || 0) + 1; });
        $('#xvc').innerHTML = `<button class="chip${!XV.city ? ' on' : ''}" data-xvc="">Όλες (${all.length})</button>` + CS.filter((c) => cc[c]).map((c) => `<button class="chip${XV.city === c ? ' on' : ''}" data-xvc="${esc(c)}">${esc(c)} (${cc[c]})</button>`).join('');
        let A = []; if (XV.city) { const ac = {}; L.forEach((c) => { const a = E.areaOf(c) || ''; if (a) ac[a] = (ac[a] || 0) + 1; }); A = Object.entries(ac).sort((a, b) => b[1] - a[1]); }
        $('#xva').innerHTML = A.length > 1 ? `<button class="chip${!XV.area ? ' on' : ''}" data-xva="">Όλη η πόλη</button>` + A.map(([a, n]) => `<button class="chip${XV.area === a ? ' on' : ''}" data-xva="${esc(a)}">${esc(a)} (${n})</button>`).join('') : '';
        let Z = []; if (XV.area) { const zc = {}; L.filter((c) => E.areaOf(c) === XV.area).forEach((c) => { if (c.zip) zc[c.zip] = (zc[c.zip] || 0) + 1; }); Z = Object.entries(zc).sort((a, b) => b[1] - a[1]); }
        $('#xvz').innerHTML = Z.length > 1 && L.filter((c) => E.areaOf(c) === XV.area).length > 15 ? `<button class="chip${!XV.zip ? ' on' : ''}" data-xvz="">Όλοι οι ΤΚ</button>` + Z.map(([z, n]) => `<button class="chip${XV.zip === z ? ' on' : ''}" data-xvz="${esc(z)}">ΤΚ ${esc(z)} (${n})</button>`).join('') : '';
      }

      function render() {
        const tr = trips();
        if (!S.loaded('settings') || !S.loaded('clients')) { $('#xvl').innerHTML = '<p class="mu">Φορτώνω…</p>'; return; }
        if (!tr.base) { $('#xvtop').innerHTML = ''; $('#xvl').innerHTML = '<p class="mu">Δεν έχει οριστεί βάση.</p>'; return; }
        chips();
        const q = u.nn(XV.q), qk = q ? PL.nameKey(XV.q) : '', lim = new Date(); lim.setDate(lim.getDate() - 60); const L60 = lim.toISOString().slice(0, 10), SOS = S.all('sos'), DL = S.get('deals', 'all') || {};
        let L = custs().filter((c) => (!XV.area || E.areaOf(c) === XV.area) && (!XV.zip || c.zip === XV.zip));
        if (q) L = L.filter((c) => { const n = u.nn(c.name + ' ' + (c.alt || []).join(' ')), qd = q.replace(/\D/g, '') || '#'; return n.includes(q) || PL.nameKey(c.name).includes(qk) || u.nn(c.addr || '').includes(q) || String(c.t1 || '').replace(/\D/g, '').includes(qd) || String(c.t2 || '').replace(/\D/g, '').includes(qd); });
        const F = { all: ['Όλοι', () => true], tz: ['Με τζίρο', (c) => M.tz(c) > 0], owe: ['Χρωστάνε', (c) => owe(c.i).a >= 1 || owe(c.i).o >= 1], old: ['Δεν τους είδα 2+ μήνες', (c) => { const v = E.lastVisit(c.i); return !v || v < L60; }] };
        $('#xvf').innerHTML = Object.entries(F).map(([k, [l]]) => `<button class="chip${XV.f === k ? ' on' : ''}" data-xvf="${k}">${l}</button>`).join('');
        L = L.filter(F[XV.f][1]);
        const pri = (c) => (SOS[c.i] ? 4 : 0) + (owe(c.i).a >= 1 ? 2 : 0) + ((DL[c.i] && DL[c.i].goal > DL[c.i].ty) ? 1 : 0);
        const AP = E.freeAppts(), apIds = new Set(AP.map((a) => a.id)); L = L.filter((c) => !apIds.has(c.i));
        const V = L.filter((c) => E.visitedToday(c.i)), R = L.filter((c) => !E.visitedToday(c.i)).sort((a, b) => pri(b) - pri(a) || M.tz(b) - M.tz(a) || a.name.localeCompare(b.name, 'el'));
        const nToday = ((S.get('plans', E.freeId()) || {}).stops || []).filter((s) => s.done).length;
        $('#xvtop').innerHTML = `<div class="xvsum"><span>Βάση: <b>${esc(tr.base)}</b>${nToday ? ` · σήμερα <b>${nToday}</b> ${nToday === 1 ? 'επίσκεψη' : 'επισκέψεις'}` : ''}</span><button id="xvend" style="padding:6px 12px">Τέλος</button></div>`;
        const row = (c) => {
          const v = E.visitedToday(c.i), ap = E.apptOf(c.i), lv = E.lastVisit(c.i), o = owe(c.i), os = E.openStop(c.i), dl = DL[c.i], tz = M.tz(c);
          const left = dl && dl.goal > dl.ty ? dl.goal - dl.ty : 0;
          return `<div class="card"><div class="xvr"><div style="flex:1;min-width:0"><div class="nm">${ap ? `<span class="appt">🕐 ${ap.d !== u.today() ? fmt(ap.d) + ' ' : ''}${esc(ap.appt)}</span> ` : ''}${SOS[c.i] ? '⭐ ' : ''}${PL.names.badge(c)}${PL.prospects.tag(c)}${esc(c.name)}${tz > 0 ? ` <span class="mu" style="font-weight:600;white-space:nowrap">· ${money(tz)}</span>` : ''}</div><div class="mu">${esc(c.addr || '')}${E.areaOf(c) ? ' · ' + esc(E.areaOf(c)) : ''}${c.zip ? ' · ' + esc(c.zip) : ''}</div><div>${lv ? `<span class="xvtag">Τελευταία: ${fmt(lv)}</span>` : '<span class="xvtag">Καμία επίσκεψη</span>'}${o.a >= 1 ? `<span class="xvtag" style="background:rgba(217,56,47,.12);color:#b8463e">💶 ${money(o.a)}</span>` : ''}${left ? `<span class="xvtag" style="background:rgba(122,63,184,.1);color:#7a3fb8">🤝 μένουν ${money(left)}</span>` : ''}${os ? '<span class="xvtag" style="background:rgba(35,135,90,.12);color:#23875a">📋 στο πρόγραμμα</span>' : ''}</div>
<div class="acts"><button data-xvv="${esc(c.i)}" class="${v ? 'xvdone' : ''}">${v ? '✓ Επίσκεψη σήμερα' : '✓ Επίσκεψη'}</button><button data-xap="${esc(c.i)}" aria-label="Ραντεβού">🕐</button>${PL.call.tels(c).length ? `<button data-callc="${esc(c.i)}" aria-label="Κλήση">📞</button>` : ''}<button data-xvo="${esc(c.i)}">Καρτέλα</button></div>${apEdit === c.i ? `<div class="aped"><label style="margin:0;color:var(--tx)">Ραντεβού</label><input type="date" id="xapd" value="${esc((ap && ap.d) || u.today())}"><input type="time" id="xapt" value="${esc((ap && ap.appt) || '')}"><button class="pri" data-xapsave="${esc(c.i)}">OK</button>${ap ? `<button data-xapdel="${esc(c.i)}">Χωρίς ραντεβού</button>` : ''}<button data-xapx="1">Άκυρο</button></div>` : ''}</div></div></div>`;
        };
        $('#xvl').innerHTML = (AP.length ? `<h3 style="margin:10px 0 4px">📅 Ραντεβού (${AP.length})</h3>` + AP.map((a) => row(M.byId(a.id))).join('') : '') + (V.length ? `<h3 style="margin:10px 0 4px;color:#23875a">✓ Σήμερα (${V.length})</h3>` + V.map(row).join('') : '') + (R.length ? `<h3 style="margin:12px 0 4px">${R.length} πελάτες</h3>` + R.slice(0, 200).map(row).join('') : '<p class="mu">Κανένας πελάτης με αυτά τα φίλτρα.</p>') + (R.length > 200 ? '<p class="mu">Εμφανίζονται οι 200 πρώτοι. Χρησιμοποίησε αναζήτηση ή περιοχή.</p>' : '');
      }

      /* η βάση: ρωτάει μία φορά με παράθυρο επιλογής (οι 8 πιο γεμάτες πόλεις) */
      async function pickBase() {
        const cc = {}; M.clients().forEach((c) => { cc[c.city] = (cc[c.city] || 0) + 1; });
        const top = Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 8).map((x) => x[0]);
        const k = await D.choice('Ποια είναι η βάση σου; (η πόλη όπου βγαίνεις χωρίς πρόγραμμα)', top.concat(['Άκυρο']));
        if (k == null || k < 0 || k >= top.length) return false;
        const nd = Object.assign({}, trips(), { base: top[k] });
        try { await db().set('settings/trips', nd); } catch (e) { /* τίποτα */ } S.put('settings', 'trips', nd); return true;
      }

      const start = async () => {
        await Promise.all([S.use('settings'), S.use('clients')]);
        if (!trips().base && !asking) { asking = true; const ok = await pickBase(); asking = false; if (!ok) { PL.nav.back(); return; } }
        $('#xvq').value = XV.q; render();
      };
      start();
      const offs = ['settings', 'clients', 'prospects', 'plans', 'visits', 'sos', 'balances', 'deals'].map((c) => S.on(c, () => { if (!asking && !apEdit) render(); }));
      $('#xvq').addEventListener('input', (e) => { XV.q = e.target.value; render(); });
      el.addEventListener('click', async (e) => {
        const t = e.target; let b;
        if ((b = t.closest('[data-xvc]'))) { XV.city = b.dataset.xvc; XV.area = ''; XV.zip = ''; render(); return; }
        if ((b = t.closest('[data-xva]'))) { XV.area = b.dataset.xva; XV.zip = ''; render(); return; }
        if ((b = t.closest('[data-xvz]'))) { XV.zip = b.dataset.xvz; render(); return; }
        if ((b = t.closest('[data-xvf]'))) { XV.f = b.dataset.xvf; render(); return; }
        if ((b = t.closest('[data-xvo]'))) { PL.nav.push('client', { id: b.dataset.xvo }); return; }
        if (t.id === 'xvend') { PL.nav.home(); return; }
        if ((b = t.closest('[data-xap]'))) { apEdit = apEdit === b.dataset.xap ? '' : b.dataset.xap; render(); setTimeout(() => { const i = $('#xapt'); if (i) i.focus(); }, 50); return; }
        if (t.dataset.xapx) { apEdit = ''; render(); return; }
        if (t.dataset.xapsave || t.dataset.xapdel) {
          const id = t.dataset.xapsave || t.dataset.xapdel, tm = t.dataset.xapsave ? ($('#xapt') || {}).value || '' : '', d = ($('#xapd') || {}).value || u.today();
          apEdit = ''; render();
          try { await E.setAppt(id, d, tm, (trips() || {}).base); } catch (x) { D.toast('Δεν αποθηκεύτηκε το ραντεβού. Δοκίμασε ξανά.'); }
          render(); return;
        }
        if ((b = t.closest('[data-xvv]'))) {
          const id = b.dataset.xvv, c = M.byId(id), on = !E.visitedToday(id); b.disabled = true;
          /* Εγγραφή στο παρασκήνιο· η ερώτηση δεν περιμένει τη βάση. */
          E.visit(id, on, (trips() || {}).base).catch(() => D.toast('Δεν αποθηκεύτηκε η επίσκεψη. Δοκίμασε ξανά.')).then(() => { b.disabled = false; render(); });
          if (on && c && (await D.confirm('Θες να πεις τι έγινε στον «' + c.name + '»;', 'Υπαγόρευση', 'Όχι τώρα'))) PL.dictation.open('Στον πελάτη ' + c.name + ' (' + c.city + '): ');
        }
      });
      return () => offs.forEach((f) => f());
    },
  });
})();
