/* Σελίδα «Ρυθμίσεις» (κουμπί ⚙️ πάνω δεξιά στην Αρχική): έλεγχος (μέτρηση της βάσης).
   Δεν γράφει τίποτα στη βάση. Τα δεδομένα του orders τα περνά το Claude απευθείας. */
(function () {
  const PL = window.PL, D = () => PL.dataio;
  PL.register('data', {
    title: 'Ρυθμίσεις',
    render(el) {
      el.innerHTML =
        `<h2>⚙️ Ρυθμίσεις</h2>
         <div>
           <div class="card" style="cursor:default;margin-bottom:10px"><b>Έλεγχος</b>
             <p class="mu">Μετράει τι υπάρχει τώρα στη βάση. Δεν αλλάζει τίποτα.</p>
             <button id="cnt">Μέτρηση</button><div id="res"></div></div>
         </div>`;
      const $ = (s) => el.querySelector(s);
      $('#cnt').onclick = async () => {
        $('#res').textContent = 'Μετράω…';
        try {
          const c = await D().count();
          const row = (l, a) => `<tr><td>${l}</td><td style="text-align:right"><b>${a}</b></td></tr>`;
          $('#res').innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px">` +
            row('Πελάτες', c.clients) + row('Εγγραφές', c.docs) + row('Συλλογές με δεδομένα', c.collections) + `</table>`;
        } catch (e) { $('#res').textContent = 'Σφάλμα: ' + ((e && e.message) || e); }
      };
    },
  });
})();
