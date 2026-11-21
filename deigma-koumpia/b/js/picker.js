/* Κοινό κομμάτι: πεδίο αναζήτησης πελάτη με φωνητικό ταίριασμα. PL.picker(host, {onPick(c), placeholder}) */
(function () {
  const PL = window.PL, esc = PL.u.esc;
  PL.picker = function (host, o) {
    host.innerHTML = `<input type="text" class="pk" placeholder="${esc(o.placeholder || 'Όνομα πελάτη…')}" autocomplete="off"><div class="pkres"></div>`;
    const inp = host.querySelector('.pk'), res = host.querySelector('.pkres');
    ['clients', 'prospects'].forEach((c) => PL.store.use(c));
    inp.addEventListener('input', () => {
      const q = inp.value.trim(); if (q.length < 2) { res.innerHTML = ''; return; }
      const L = PL.findCustomers(q);
      res.innerHTML = L.length ? L.map((c) => `<button class="pkb" data-pk="${esc(c.id)}">${esc(c.name)} <span class="mu">${esc(c.city || '')}${c.temporary ? ' · προσωρινός' : ''}</span></button>`).join('') : '<p class="mu">Κανένας πελάτης με αυτό το όνομα.</p>';
    });
    res.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-pk]'); if (!b) return;
      const c = PL.model.byId(b.dataset.pk); if (!c) return;
      inp.value = ''; res.innerHTML = ''; o.onPick(c);
    });
    return { focus: () => inp.focus() };
  };
})();

/* Λίστα ονομάτων για πεδία «γράψε όνομα πελάτη…» (<input list="dcl">), όπως στην παλιά σελίδα: «όνομα · πόλη · κωδικός». */
(function () {
  const PL = window.PL, esc = PL.u.esc;
  PL.dcl = () => `<datalist id="dcl">${PL.model.clients().map((c) => `<option value="${esc(c.name)} · ${esc(c.city)} · ${c.i}">`).join('')}</datalist>`;
  PL.dclId = (v) => String(v || '').split(' · ').pop();
})();
