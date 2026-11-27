/* «Προϊόντα»: «Νέα παραγγελία» (διάλεξε πελάτη → PL.orders.openFor, 28/11/2026) και τα δύο εργαλεία (Ποιος αγόρασε / Πωλήσεις ανά κατηγορία). */
(function () {
  const PL = window.PL;
  PL.register('products', {
    title: 'Προϊόντα',
    render(el) {
      el.innerHTML = `<h2>🧴 Προϊόντα</h2>
        <div class="card" style="cursor:default;margin:10px 0"><button id="pnew" class="pri" style="width:100%">🛒 Νέα παραγγελία</button><div id="ppk" hidden style="margin-top:10px"></div></div>
        <button class="card" data-go="whobought" style="width:100%;text-align:left;padding:20px 18px;margin:10px 0;display:flex;gap:14px;align-items:center"><span style="font-size:calc(32*var(--u))">🔎</span><span><span class="nm" style="font-size:calc(19*var(--u))">Αναζήτηση προϊόντος</span><br><span class="mu">Ποιος πελάτης αγόρασε ένα προϊόν, ανά περιοχή</span></span></button>
        <button class="card" data-go="sales" style="width:100%;text-align:left;padding:20px 18px;margin:10px 0;display:flex;gap:14px;align-items:center;background:rgba(47,111,94,.08);border:2px solid #2f6f5e"><span style="font-size:calc(32*var(--u))">📊</span><span><span class="nm" style="font-size:calc(19*var(--u));color:#2f6f5e">Πωλήσεις ανά κατηγορία</span><br><span class="mu">Πόσα πούλησα φέτος σε σχέση με πέρσι και ποια ακριβώς</span></span></button>`;
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
