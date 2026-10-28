/* «📂 Τα προγράμματά μου» (4η κάρτα στη σελίδα «Πρόγραμμα»): δύο καρτέλες.
   Ανοιχτά = πρόχειρα + ενεργά προγράμματα. Παλαιότερα = όλα τα ολοκληρωμένα, από το πιο πρόσφατο, ανά μήνα, με αναζήτηση πόλης.
   Πάτημα σε πρόγραμμα → ανοίγει (planview). Διαγραφή με δεύτερο πάτημα επιβεβαίωσης. */
(function () {
  const PL = window.PL, u = PL.u, S = PL.store, E = PL.plans, D = PL.dlg, esc = u.esc;
  const MNG = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
  const st = { tab: 'open', q: '' };

  const delBtn = (id) => `<button data-pdel="${esc(id)}" style="padding:4px 10px">🗑 Διαγραφή</button>`;
  const openCard = ([id, p]) => { const d = (p.stops || []).filter((s) => s.done).length;
    return `<div class="card" data-plan="${esc(id)}"><div class="row"><span class="nm">${esc(p.cities.join(' + '))}${p.mode ? ' <span class="mu" style="font-weight:400">' + esc(E.modeLbl(p.mode).replace(/^ · /, '')) + '</span>' : ''}</span><span class="tz">${d}/${(p.stops || []).length}</span></div><div class="row"><span class="mu">${esc(p.created)} · πάτα για να ανοίξει</span>${delBtn(id)}</div></div>`; };
  const doneCard = ([id, p]) => { const n = (p.stops || []).length, d = (p.stops || []).filter((s) => s.done).length;
    return `<div class="card" data-plan="${esc(id)}"><div class="row"><span class="nm">✅ ${esc(p.cities.join(' + '))}</span><span class="tz">${d}/${n}</span></div><div class="row"><span class="mu">${esc(p.created)} · πάτα για να το δεις</span>${delBtn(id)}</div></div>`; };

  PL.register('myplans', {
    title: 'Τα προγράμματά μου',
    render(el) {
      el.innerHTML = `<h2 style="color:var(--ac)">📂 Τα προγράμματά μου</h2><div class="chips" id="mpt" style="margin:4px 0 10px"></div><div id="mpq"></div><div id="mpl"></div>`;
      const $ = (s) => el.querySelector(s);
      ['plans', 'pdrafts'].forEach((c) => S.use(c));
      const paint = () => {
        if (!S.loaded('plans')) return;
        const A = E.activeList(), Dn = E.doneList(), dr = PL.planview.draftsHtml() || '';
        $('#mpt').innerHTML = `<button class="chip${st.tab === 'open' ? ' on' : ''}" data-mpt="open">Ανοιχτά (${A.length})</button><button class="chip${st.tab === 'old' ? ' on' : ''}" data-mpt="old">Παλαιότερα (${Dn.length})</button>`;
        if (st.tab === 'open') {
          $('#mpq').innerHTML = '';
          $('#mpl').innerHTML = dr + (A.length ? A.map(openCard).join('') : (dr ? '' : '<p class="mu">Κανένα ανοιχτό πρόγραμμα. Φτιάξε ένα από το «📋 Πρόγραμμα ημέρας».</p>'));
          return;
        }
        if (!$('#mpq input')) { $('#mpq').innerHTML = `<input id="mps" type="search" placeholder="Αναζήτηση πόλης…" value="${esc(st.q)}" style="margin-bottom:6px">`; $('#mps').addEventListener('input', (e) => { st.q = e.target.value; paint(); }); }
        const f = u.nn(st.q), L = Dn.filter(([, p]) => !f || (p.cities || []).some((c) => u.nn(c).includes(f)));
        let h = '', mk = '';
        L.forEach((x) => { const c = String(x[1].created || ''), k = c.slice(0, 7);
          if (k !== mk) { mk = k; h += `<h3>${k ? MNG[+c.slice(5, 7) - 1] + ' ' + c.slice(0, 4) : 'Χωρίς ημερομηνία'}</h3>`; }
          h += doneCard(x); });
        $('#mpl').innerHTML = h || `<p class="mu">${f ? 'Κανένα πρόγραμμα για «' + esc(st.q) + '».' : 'Κανένα ολοκληρωμένο πρόγραμμα ακόμα.'}</p>`;
      };
      paint();
      const offs = [S.on('plans', paint), S.on('pdrafts', paint)];
      el.addEventListener('click', async (ev) => {
        const t = ev.target;
        try {
          const tb = t.closest('[data-mpt]');
          if (tb) { st.tab = tb.dataset.mpt; paint(); return; }
          if (t.dataset.pdel) {
            const p = S.get('plans', t.dataset.pdel);
            t.closest('.card').innerHTML = `<div>Σίγουρα θες να διαγράψεις το πρόγραμμα «${esc(p ? p.cities.join(' + ') : '')}»;</div><p style="margin:8px 0 0"><button class="pri" data-pdy="${esc(t.dataset.pdel)}" style="background:#d9382f;border-color:#d9382f">Ναι, διαγραφή</button> <button data-pdn="1">Άκυρο</button></p>`;
          }
          else if (t.dataset.pdy) { try { await E.deletePlan(t.dataset.pdy); } catch (e) { /* τίποτα */ } paint(); }
          else if (t.dataset.pdn) paint();
          else if (t.dataset.pdo) PL.planview.openDraft(t.dataset.pdo);
          else if (t.dataset.pdx) {
            const id = t.dataset.pdx, x = S.get('pdrafts', id);
            if (!(await D.confirm('Να διαγραφεί το πρόχειρο «' + ((x && x.cities) || []).join(' + ') + '»;'))) return;
            await PL.planview.deleteDraft(id); paint();
          }
          else { const c = t.closest('[data-plan]'); if (c && !t.closest('button')) PL.planview.open(c.dataset.plan); }
        } catch (e) { D.toast('Δεν έγινε. Δοκίμασε ξανά.'); }
      });
      return () => offs.forEach((f) => f());
    },
  });
})();
