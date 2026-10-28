/* «Προϊόντα»: είσοδος στα δύο εργαλεία (Ποιος αγόρασε / Πωλήσεις ανά κατηγορία). */
(function () {
  const PL = window.PL;
  PL.register('products', {
    title: 'Προϊόντα',
    render(el) {
      el.innerHTML = `<h2>🧴 Προϊόντα</h2>
        <button class="card" data-go="whobought" style="width:100%;text-align:left;padding:20px 18px;margin:10px 0;display:flex;gap:14px;align-items:center"><span style="font-size:32px">🔎</span><span><span class="nm" style="font-size:19px">Αναζήτηση προϊόντος</span><br><span class="mu">Ποιος πελάτης αγόρασε ένα προϊόν, ανά περιοχή</span></span></button>
        <button class="card" data-go="sales" style="width:100%;text-align:left;padding:20px 18px;margin:10px 0;display:flex;gap:14px;align-items:center;background:rgba(47,111,94,.08);border:2px solid #2f6f5e"><span style="font-size:32px">📊</span><span><span class="nm" style="font-size:19px;color:#2f6f5e">Πωλήσεις ανά κατηγορία</span><br><span class="mu">Πόσα πούλησα φέτος σε σχέση με πέρσι και ποια ακριβώς</span></span></button>`;
      el.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) PL.nav.push(b.dataset.go); });
    },
  });
})();
