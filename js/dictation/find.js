/* Φωνητική αναζήτηση πελατών: αντέχει λάθη αναγνώρισης φωνής (η/ι/υ, ει/οι, ου, μπ/ντ, πτώσεις, κομμένα ονόματα). */
(function () {
  const PL = window.PL, nn = PL.u.nn;
  const key = (w) => nn(w).replace(/ου/g, 'u').replace(/(ει|οι|υι)/g, 'ι').replace(/αι/g, 'ε').replace(/ω/g, 'ο').replace(/[ηυ]/g, 'ι').replace(/μπ/g, 'b').replace(/ντ/g, 'd').replace(/γκ|γγ/g, 'g').replace(/(.)\1+/g, '$1');
  const lev = (a, b) => { if (Math.abs(a.length - b.length) > 2) return 9; let p = [...Array(b.length + 1).keys()]; for (let i = 1; i <= a.length; i++) { const c = [i]; for (let j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[b.length]; };
  const wordMatch = (t, w) => {
    if (t === w) return 4;
    const ts = t.length > 4 ? t.slice(0, t.length - 2) : t, ws = w.length > 4 ? w.slice(0, w.length - 2) : w;
    if (w.startsWith(ts) || t.startsWith(ws)) return 3;
    if (ts.length >= 4 && ws.length >= 4) { const d = lev(ts, ws); if (d <= 1 || (d <= 2 && ts.length >= 7)) return 2; }
    return 0;
  };
  const split = (s) => nn(s).split(/[^a-zα-ω0-9]+/).filter(Boolean);
  PL.nameKey = key;   // κοινό φωνητικό κλειδί (το χρησιμοποιούν και άλλες σελίδες)
  PL.findCustomers = function (q, list) {
    const raw = split(q).filter((t) => t.length >= 2), toks = raw.map(key); if (!toks.length) return [];
    const out = [];
    for (const c of list || PL.model.clients()) {
      const words = split(c.name + ' ' + (c.alt || []).join(' ')).map(key), city = key(c.city || ''); let sc = 0;
      toks.forEach((t, k) => {
        if (String(c.code) === raw[k]) { sc += 10; return; }
        let m = 0; for (const w of words) m = Math.max(m, wordMatch(t, w));
        if (m) sc += m; else if (t.length >= 3 && city.startsWith(t.slice(0, Math.max(3, t.length - 2)))) sc += 1;
      });
      if (sc >= 2) out.push({ sc, c });
    }
    return out.sort((a, b) => b.sc - a.sc).slice(0, 8).map(({ c }) => ({ id: c.i, name: c.name, city: c.city, addr: c.addr, code: c.code, temporary: !!c.prospect }));
  };
})();
