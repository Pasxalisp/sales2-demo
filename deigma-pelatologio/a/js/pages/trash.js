/* Σελίδα «Κάδος» (Ρυθμίσεις → Κάδος, απόφαση 18/11/2026, Β10): ό,τι διαγράφηκε τις τελευταίες 30 μέρες, με «Επαναφορά».
   Όλη η λογική στο js/trash.js (PL.trash)· εδώ μόνο η λίστα. */
(function () {
  const PL = window.PL, u = PL.u, esc = u.esc, S = PL.store;
  const day = (t) => { const d = new Date(t); return d.toLocaleDateString('el-GR') + ' ' + u.pad(d.getHours()) + ':' + u.pad(d.getMinutes()); };
  PL.register('trash', {
    title: 'Κάδος',
    render(el) {
      const paint = () => {
        const L = PL.trash.list();
        el.innerHTML = `<h2>🗑 Κάδος</h2><p class="mu">Ό,τι διαγράφεις μένει εδώ ${PL.trash.DAYS} μέρες και επαναφέρεται με ένα πάτημα. Μετά σβήνεται οριστικά.</p>` +
          (L.length ? L.map((t) => `<div class="card trc" style="cursor:default"><div class="row"><span class="nm">${esc(t.label)}</span>` +
            `<button class="trr" data-rest="${esc(t.id)}">↩ Επαναφορά</button></div>` +
            `<div class="mu">Διαγράφηκε ${esc(day(t.at))} · ${t.left === 1 ? 'μένει 1 μέρα' : 'μένουν ' + t.left + ' μέρες'}</div></div>`).join('')
            : '<p class="mu">Ο κάδος είναι άδειος.</p>');
      };
      el.innerHTML = '<h2>🗑 Κάδος</h2><p class="mu">Φορτώνω…</p>';
      PL.trash.purge().catch(() => {}).then(paint);
      const off = S.on('trash', () => { if (el.isConnected) paint(); });
      el.addEventListener('click', async (ev) => {
        const b = ev.target.closest('[data-rest]'); if (!b) return;
        b.disabled = true;
        try { await PL.trash.restore(b.dataset.rest); } catch (e) { PL.dlg.toast('Δεν έγινε επαναφορά. Έλεγξε τη σύνδεση και δοκίμασε ξανά.'); }
        if (el.isConnected) paint();
      });
      return off;
    },
  });
})();
