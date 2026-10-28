/* «Πρόγραμμα ημέρας»: λίστα περιοχών, πελάτες χωρίς τζίρο, «Δημιουργία προγράμματος».
   Τα ανοιχτά, τα πρόχειρα και τα παλαιότερα προγράμματα είναι στη σελίδα «📂 Τα προγράμματά μου» (myplans.js). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, E = PL.plans, D = PL.dlg, esc = u.esc;
  const st = { sel: new Set(), n: 2, q: '', busy: false };

  PL.dayplan = { st };
  PL.register('dayplan', {
    title: 'Πρόγραμμα ημέρας',
    render(el, params) {
      el.innerHTML = `<h2 style="color:var(--pday);margin:6px 0 10px">📋 Πρόγραμμα ημέρας</h2>
<input id="pq" placeholder="Αναζήτηση περιοχής…" value="${esc(st.q)}">
<div id="pl" style="max-height:max(140px,calc(100dvh - 450px));overflow:auto;margin:8px 0;border:1px solid var(--bd);border-radius:10px"></div>
<div style="display:flex;align-items:center;gap:10px;margin:4px 0 8px"><label for="pn" style="margin:0;flex:1">Πελάτες χωρίς τζίρο</label><input id="pn" type="number" value="${st.n}" min="0" max="10" style="width:72px;text-align:center"></div>
<button class="pri" id="pgo" style="width:100%;min-height:50px;font-size:17px;font-weight:700;background:var(--pday);border-color:var(--pday)">Δημιουργία προγράμματος</button>
<div id="pst" class="mu"></div>`;
      const $ = (s) => el.querySelector(s);
      let alive = true;
      ['clients', 'prospects', 'plans'].forEach((c) => S.use(c));
      const cities = () => { const m = {}; M.clients().forEach((c) => { if (c.city) m[c.city] = (m[c.city] || 0) + 1; }); return m; };
      const plist = () => {
        const f = u.nn($('#pq').value), m = cities();
        $('#pl').innerHTML = Object.keys(m).filter((x) => !f || u.nn(x).includes(f)).sort((a, b) => a.localeCompare(b, 'el')).map((x) =>
          `<label class="pk" style="margin:0;color:var(--tx);font-size:16px"><span><input type="checkbox" data-pc="${esc(x)}" ${st.sel.has(x) ? 'checked' : ''} style="width:auto;margin-right:8px">${esc(x)}</span><span class="mu">${m[x]}</span></label>`).join('');
      };
      plist();
      const offs = [S.on('clients', plist), S.on('prospects', plist)];
      $('#pq').addEventListener('input', plist);
      $('#pn').addEventListener('change', () => { st.n = Math.max(0, Math.min(10, +$('#pn').value || 0)); });
      el.addEventListener('change', (ev) => { const c = ev.target.dataset.pc; if (c === undefined) return; ev.target.checked ? st.sel.add(c) : st.sel.delete(c); });
      const say = (m) => { if (alive) $('#pst').innerHTML = esc(m); };

      async function create() {
        if (st.busy) return;
        if (!st.sel.size) return say('Διάλεξε τουλάχιστον μία περιοχή.');
        if (!PL.adapter.ai.available()) return say('Το πρόγραμμα δουλεύει μόνο όταν ανοίξεις τη σελίδα συνδεδεμένος στο claude.ai.');
        st.busy = true; $('#pgo').disabled = true;
        let clock = null;
        try {
          await E.use();
          const sel = new Set(st.sel), cs = [...sel], t = u.today(), c = E.candidates(sel);
          let act = c.act, mode = '';
          if (c.recent.length || c.visited.size || c.actPl.length) {
            const O = [];
            if (c.actPl.length) O.push(['rest', 'Μόνο όσους δεν είναι στο ενεργό πρόγραμμα (' + act.filter((x) => !c.inPlan.has(x.i)).length + ')']);
            if (c.recent.length || c.visited.size) O.push(['new', 'Μόνο όσους δεν επισκέφθηκα αυτόν τον μήνα (' + act.filter((x) => !c.visited.has(x.i) || S.get('sos', x.i)).length + ')']);
            O.push(['all', 'Όλο το πελατολόγιο (' + act.length + ')']);
            const key = cs.slice().sort().join('|'), ex = c.actPl.find(([, p]) => (p.cities || []).slice().sort().join('|') === key);
            if (ex) O.push(['open', 'Άνοιξε το ενεργό πρόγραμμα']);
            O.push(['x', 'Άκυρο']);
            const msg = (c.actPl.length ? 'Έχεις ' + (c.actPl.length > 1 ? c.actPl.length + ' ενεργά προγράμματα' : 'ενεργό πρόγραμμα') + ' για ' + cs.join(' + ') + ' με ' + c.inPlan.size + ' πελάτες. ' : '') + (c.visited.size ? 'Αυτόν τον μήνα τσέκαρες ' + c.visited.size + ' πελάτες. ' : '') + 'Ποιους να βάλω στο νέο πρόγραμμα;';
            const k = O[await D.choice(msg, O.map((o) => o[1]))][0];
            if (k === 'x') return;
            if (k === 'open') { PL.planview.open(ex[0]); return; }
            mode = k === 'all' ? '' : k;
            if (mode === 'new') act = act.filter((x) => !c.visited.has(x.i) || S.get('sos', x.i));
            if (mode === 'rest') act = act.filter((x) => !c.inPlan.has(x.i));
          }
          const excl = new Set(act.map((x) => x.i).concat(mode === 'new' ? [...c.visited] : mode === 'rest' ? [...c.inPlan] : []));
          const zeros = E.zeroQueue(sel, excl).slice(0, Math.max(0, Math.min(10, st.n))), zset = new Set(zeros.map((x) => x.i)), all = act.concat(zeros);
          if (!all.length) return say('Δεν υπάρχουν ενεργοί ή νέοι πελάτες στις περιοχές αυτές.');
          const T0 = Date.now(), N = all.length;
          $('#pst').innerHTML = `<div class="pbw"><div class="pbt"><span id="pbm">Διαβάζω ${N} πελάτες…</span><span id="pbe">0″</span></div><div class="pbar ind" id="pbb"><i></i></div><div class="pbs">Σε μεγάλες περιοχές μπορεί να πάρει έως δύο λεπτά. Μην κλείσεις τη σελίδα.</div></div>`;
          clock = PL.tick.add(() => { const e = document.getElementById('pbe'); if (e) { const s = Math.round((Date.now() - T0) / 1000); e.textContent = s < 60 ? s + '″' : Math.floor(s / 60) + '′ ' + u.pad(s % 60) + '″'; } }, 1);
          const g = await E.generate(cs, all, { mode, zset, touch: c.touch, recentTouch: c.recentTouch }, (k, n) => {
            const b = document.getElementById('pbb'), m = document.getElementById('pbm'); if (!b || !m) return;
            if (k > 0) { b.classList.remove('ind'); const pc = Math.min(97, Math.round(k / n * 100)); b.firstChild.style.width = pc + '%'; m.textContent = 'Γράφω σημειώσεις: ' + k + ' από ' + n + ' πελάτες (' + pc + '%)'; } else m.textContent = 'Αναλύω τζίρους και σημειώσεις…';
          });
          { const b = document.getElementById('pbb'), m = document.getElementById('pbm'); if (b) { b.classList.remove('ind'); b.firstChild.style.width = '100%'; } if (m) m.textContent = 'Βάζω σε σειρά διαδρομής…'; }
          const plan = { id: null, cities: cs, created: t, stops: g.stops, note: g.note || '', saved: false, mode, sort: 'area' };
          { const m = document.getElementById('pbm'); if (m) m.textContent = 'Αποθηκεύω το πρόγραμμα…'; }
          try { const nid = 'pl' + Date.now(); await E.savePlan(nid, { sort: plan.sort, mode, cities: cs, created: t, closed: false, stops: plan.stops, note: plan.note }); plan.id = nid; plan.saved = true; } catch (e) { plan.saved = false; plan.id = null; }
          if (alive) $('#pst').textContent = '';
          PL.planview.openNew(plan);
        } catch (e) {
          say(e && e.code === 'not_granted' ? 'Χρειάζεται να επιτρέψεις στη σελίδα να χρησιμοποιήσει το Claude.' : 'Δεν ολοκληρώθηκε (' + ((e && e.code) || 'σφάλμα') + (e && e.message ? ': ' + String(e.message).slice(0, 160) : '') + '). Δοκίμασε ξανά.');
        } finally { if (clock) PL.tick.remove(clock); st.busy = false; const b = document.getElementById('pgo'); if (b) b.disabled = false; }
      }

      el.addEventListener('click', async (ev) => {
        const t = ev.target;
        try {
          if (t.id === 'pgo') create();
        } catch (e) { say('Δεν έγινε. Δοκίμασε ξανά.'); }
      });
      if (params && params.auto) setTimeout(create, 0);
      return () => { alive = false; offs.forEach((f) => f()); };
    },
  });
})();
