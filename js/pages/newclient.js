/* «Νέος πελάτης» (απόφαση Πασχάλη 19/11, μαζί με την αφαίρεση της Υπαγόρευσης από το demo): κομμωτήριο που δεν υπάρχει στο
   πελατολόγιο → προσωρινός πελάτης (E.newProspect· «🆕 Όχι στο orders» μέχρι να ενωθεί με τον κανονικό, js/prospects.js).
   Ανοίγει από το «•••» του Πελατολογίου και των Επισκέψεων εκτός προγράμματος. Μετά την αποθήκευση ανοίγει η καρτέλα του.
   (Το Πρόγραμμα έχει δική του φόρμα «Νέο κομμωτήριο», που το βάζει και στο πρόγραμμα με ώρα ραντεβού.)
   params: { city } προτεινόμενη πόλη (π.χ. η βάση στα εκτός προγράμματος). */
(function () {
  const PL = window.PL, u = PL.u, S = PL.store, D = PL.dlg, M = PL.model, E = PL.plans, esc = u.esc;

  PL.register('newclient', {
    title: 'Νέος πελάτης',
    render(el, params) {
      ['clients', 'prospects'].forEach((c) => S.use(c));
      const cities = () => [...new Set(M.clients().map((c) => c.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'el'));
      el.innerHTML = '<h2>Νέος πελάτης</h2><p class="mu">Κομμωτήριο που δεν υπάρχει στο πελατολόγιο. Μπαίνει ως προσωρινός πελάτης· όταν ανοιχτεί στο orders, ' +
        'το ενώνεις με τον κανονικό από την καρτέλα του.</p><form id="ncf" autocomplete="off" novalidate>' +
        '<div class="shbox"><label for="ncn">Όνομα κομμωτηρίου / ιδιοκτήτη</label><input id="ncn" type="text" aria-required="true">' +
        `<label for="ncc">Πόλη</label><input id="ncc" type="text" list="nccl" value="${esc(params.city || '')}"><datalist id="nccl"></datalist>` +
        '<label for="nca">Διεύθυνση</label><input id="nca" type="text"><label for="ncp">Τηλέφωνο</label><input id="ncp" type="tel">' +
        '<label for="nct">Σημείωση <span class="tew">(προαιρετικά)</span></label><input id="nct" type="text" placeholder="π.χ. νέο σαλόνι, δουλεύει L\'Oréal"></div>' +
        '<p class="teact"><button type="submit" class="pri" id="ncsave">Αποθήκευση</button><span id="ncerr" class="dn" aria-live="polite"></span></p></form>';
      const $ = (s) => el.querySelector(s), err = (t) => { $('#ncerr').textContent = t; };
      const fill = () => { $('#nccl').innerHTML = cities().map((k) => `<option value="${esc(k)}">`).join(''); };
      fill();
      const off = S.on('clients', fill);
      el.addEventListener('input', () => err(''));
      $('#ncf').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const name = $('#ncn').value.trim();
        if (!name) { err('Γράψε όνομα.'); $('#ncn').focus(); return; }
        $('#ncsave').disabled = true; err('');
        try {
          const id = await E.newProspect({ name, city: E.canonCity($('#ncc').value || ''), addr: $('#nca').value.trim(), phone: $('#ncp').value.trim() });
          const note = $('#nct').value.trim();
          if (note) await PL.notes.update(id, (d) => { d.code = d.code || 'ΝΕΟΣ'; d.entries.unshift({ d: u.today(), products: '', text: note, todo: '', next: '' }); });
          D.toast('🆕 Νέος πελάτης · ' + name);
          PL.nav.replace('client', { id });
        } catch (x) { err('Δεν αποθηκεύτηκε: ' + ((x && x.message) || x)); $('#ncsave').disabled = false; }
      });
      setTimeout(() => $('#ncn').focus(), 60);
      return off;
    },
  });
})();
