/* «Προϊόντα»: «Νέα παραγγελία» (διάλεξε πελάτη → PL.orders.openFor) και τα δύο εργαλεία (Ποιος αγόρασε / Πωλήσεις ανά κατηγορία).
   Εμφάνιση 28/11/2026 (εικόνα Πασχάλη): τίτλος με πράσινο εικονίδιο, μεγάλη πράσινη μπάρα «Νέα παραγγελία», κάρτες με εικονίδιο σε κουτάκι, κείμενο και ›. */
(function () {
  const PL = window.PL;
  const SV = (p, w) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w || 2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const IC = {
    bottle: SV('<path d="M10 2h4v3h-4z"/><path d="M9 5h6l1 3v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8z"/>'),
    cart: SV('<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.2a2 2 0 0 0 2 1.6h8.3a2 2 0 0 0 2-1.5L21.5 8H6.2"/>'),
    lens: SV('<circle cx="14" cy="10" r="6"/><path d="M9.8 14.2 3 21"/>', 2.4),
    bars: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="12" width="5" height="9" rx="1" fill="currentColor"/><rect x="10" y="8" width="5" height="13" rx="1" fill="currentColor"/><rect x="17" y="3" width="5" height="18" rx="1" fill="currentColor"/></svg>',
    chev: SV('<path d="M9 6l6 6-6 6"/>'),
  };
  const tool = (go, ic, t, d) => `<button class="prc" data-go="${go}"><span class="pri2">${ic}</span><span class="prt"><b>${t}</b><span>${d}</span></span><span class="prv">${IC.chev}</span></button>`;
  PL.register('products', {
    title: 'Προϊόντα',
    render(el) {
      el.innerHTML = `<h2 class="pgh"><span class="pghi">${IC.bottle}</span>Προϊόντα</h2>
        <button id="pnew" class="prn"><span class="prni">${IC.cart}</span><b>Νέα παραγγελία</b><span class="prv">${IC.chev}</span></button><div id="ppk" class="prk" hidden></div>
        ${tool('whobought', IC.lens, 'Αναζήτηση προϊόντος', 'Ποιος πελάτης αγόρασε ένα προϊόν, ανά περιοχή')}
        ${tool('sales', IC.bars, 'Πωλήσεις ανά κατηγορία', 'Πόσα πούλησα φέτος σε σχέση με πέρσι και ποια ακριβώς')}`;
      el.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) PL.nav.push(b.dataset.go); });
      /* Νέα παραγγελία: πρώτα ο πελάτης (αν έχει ήδη πρόχειρη, ρωτά αν θα ανοίξει αυτή) */
      let pk = null;
      el.querySelector('#pnew').onclick = () => {
        const h = el.querySelector('#ppk'); h.hidden = false;
        if (!pk) pk = PL.picker(h, { placeholder: 'Γράψε όνομα ή κωδικό πελάτη…', onPick: (c) => PL.orders.openFor(c.i) });
        const i = h.querySelector('input'); if (i) i.focus();
      };
    },
  });
})();
