/* ΔΕΙΓΜΑ «Γραμματοσειρά» (17/11/2026, μόνο στη σελίδα diaxeirisi.html του demo): δοκιμή γραμματοσειρών σε όλη την εφαρμογή.
   Επιλογή από την Αρχική (γραμμή κάτω από την ημερομηνία) ή από τη Διαχείριση (πάνω δεξιά). Η γραμματοσειρά φορτώνει από
   το Google Fonts μόνο όταν διαλεχτεί· όλες έχουν πλήρη ελληνικά. Η συσκευή θυμάται την επιλογή (localStorage, μόνο ευκολία).
   Αν εγκριθεί μία, περνά κανονικά στο css/base.css ως ένα κοινό --font και αυτό το αρχείο σβήνεται. Εμφάνιση: fontpick.css. */
(function () {
  const PL = window.PL; if (!PL) return;
  const FONTS = [
    ['', 'Σημερινή (του κινητού)', ''],
    ['inter', 'Inter', 'Inter:wght@400;500;600;700;800'],
    ['manrope', 'Manrope', 'Manrope:wght@400;500;600;700;800'],
    ['commissioner', 'Commissioner', 'Commissioner:wght@400;500;600;700;800'],
    ['noto', 'Noto Sans', 'Noto+Sans:wght@400;500;600;700;800'],
  ];
  const NAME = { inter: 'Inter', manrope: 'Manrope', commissioner: 'Commissioner', noto: 'Noto Sans' }, K = 'pl.font', root = document.documentElement;
  const load = (k) => {
    const f = FONTS.find((x) => x[0] === k); if (!f || !f[2] || document.getElementById('fp-' + k)) return;
    const l = document.createElement('link'); l.id = 'fp-' + k; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + f[2] + '&display=swap';
    document.head.appendChild(l);
  };
  function set(k) {
    if (!NAME[k]) k = '';
    if (k) { load(k); root.dataset.font = k; root.style.setProperty('--pl-font', `"${NAME[k]}"`); } else { delete root.dataset.font; root.style.removeProperty('--pl-font'); }
    try { if (k) localStorage.setItem(K, k); else localStorage.removeItem(K); } catch (e) { /* χωρίς αποθήκευση */ }
    document.querySelectorAll('select.fpsel').forEach((s) => { s.value = k; });
  }
  const control = () => `<label class="fpick"><span>Aa</span><select class="fpsel" aria-label="Γραμματοσειρά (δείγμα)">${FONTS.map(([k, t]) => `<option value="${k}"${(root.dataset.font || '') === k ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`;
  document.addEventListener('change', (ev) => { if (ev.target.classList && ev.target.classList.contains('fpsel')) set(ev.target.value); });
  let saved = ''; try { saved = localStorage.getItem(K) || ''; } catch (e) { /* τίποτα */ }
  set(saved);
  PL.fontPick = { control, set };

  /* Αρχική: μικρή γραμμή «Γραμματοσειρά (δείγμα)» κάτω από την πάνω γραμμή */
  (PL.labActs = PL.labActs || []).push({ page: 'home', mount(root0) {
    const hh = root0.querySelector('.hh'); if (!hh) return null;
    const row = document.createElement('div'); row.className = 'fprow'; row.innerHTML = '<span class="mu">Γραμματοσειρά (δείγμα)</span>' + control();
    hh.parentNode.insertBefore(row, hh.nextSibling);
    return () => row.remove();
  } });
})();
