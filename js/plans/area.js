/* «Στοιχεία περιοχής» ενός προγράμματος: τζίρος, Goldwell φέτος/πέρσι, κατηγορίες, πελάτες που ανεβαίνουν/πέφτουν, χρέη.
   E.area.stats(πόλεις) → αριθμοί (και για το Excel) · E.area.sum(πόλεις, κλειδί προγράμματος) → το κουτί της οθόνης.
   Θυμάται ποια κουτιά είναι ανοιχτά (localStorage, μόνο για ευκολία) και ποια πόλη διάλεξες σε πρόγραμμα με πολλές. */
(function () {
  const PL = window.PL, M = PL.model, S = PL.store, E = PL.plans, esc = PL.u.esc, money = PL.u.money;
  let open = new Set(); try { open = new Set(JSON.parse(localStorage.getItem('aopen') || '[]')); } catch (e) { /* τίποτα */ }
  const pick = {};
  const pctOf = (ly, ty) => (ly > 0 ? (ty - ly) / ly * 100 : null);
  const pctTxt = (x) => (x == null ? '' : `<span class="${x >= 0 ? 'up' : 'dn'}">${x >= 0 ? '▲ +' : '▼ −'}${Math.abs(x).toFixed(0)}%</span>`);

  function stats(cities) {
    const L = M.clients().filter((c) => cities.includes(c.city) && !c.prospect); let tz = 0, ty = 0, ly = 0, lf = 0, nT = 0, nL = 0, up = 0, dn = 0, lost = 0, debt = 0, over = 0;
    L.forEach((c) => {
      const t = M.tz(c); tz += t; if (t > 0) nT++;
      const g = M.gold(c); if (g) { ly += g[0] || 0; ty += g[1] || 0; lf += g[2] || 0; if ((g[0] || 0) > 0) nL++; if ((g[0] || 0) > 0 && (g[1] || 0) <= 0) lost++; else if ((g[1] || 0) > (g[0] || 0)) up++; else if ((g[1] || 0) < (g[0] || 0)) dn++; }
      const b = S.get('balances', c.i); if (b) { debt += +b.amount || 0; over += +b.over || 0; }
    });
    return { n: L.length, tz, ty, ly, lf, nT, nL, up, dn, lost, debt, over, pct: pctOf(ly, ty) };
  }
  function cats(cities) {
    const CAT = M.catAll(), T = {};
    M.clients().forEach((c) => {
      if (!cities.includes(c.city)) return; const d = CAT[c.i]; if (!d) return;
      M.CATN.forEach((k) => { if (!Array.isArray(d[k])) return; const o = T[k] || (T[k] = [0, 0, 0, 0, 0]); o[0] += +d[k][0] || 0; o[1] += +d[k][1] || 0; o[2] += +d[k][2] || 0; if ((+d[k][0] || 0) > 0 && (+d[k][1] || 0) <= 0) o[3]++; if ((+d[k][1] || 0) > 0) o[4]++; });
    });
    const r = M.CATN.filter((k) => T[k] && (T[k][0] || T[k][1] || T[k][2])); if (!r.length) return '';
    return `<div style="margin-top:8px;font-weight:600">Ανά κατηγορία</div><div style="overflow-x:auto"><table class="ctab"><tr><th></th><th>Πέρσι ίδια περ.</th><th>Φέτος</th><th>%</th><th>Πελάτες</th></tr>${r.map((k) => { const [a, b, , l, n] = T[k]; return `<tr><td>${esc(M.CATL[k] || k)}</td><td>${money(a)}</td><td>${money(b)}</td><td>${pctTxt(pctOf(a, b))}</td><td>${n}${l ? ` <span class="dn">−${l}</span>` : ''}</td></tr>`; }).join('')}</table></div>`;
  }
  function body(cities) {
    const a = stats(cities);
    return `<div class="row"><span>Τζίρος περιοχής φέτος</span><b>${money(a.tz)}</b></div>
 <div class="row"><span>Goldwell φέτος / πέρσι ίδια περίοδο</span><b>${money(a.ty)} / ${money(a.ly)}</b></div>
 <div class="row"><span>Διαφορά</span><b>${pctTxt(a.pct)} <span class="${a.ty >= a.ly ? 'up' : 'dn'}">(${a.ty >= a.ly ? '+' : '−'}${money(Math.abs(a.ty - a.ly))})</span></b></div>
 <div class="row"><span>Goldwell όλο το περσινό έτος</span><b>${money(a.lf)}</b>${a.lf > 0 ? ` <span class="mu">· έχεις πιάσει ${Math.round(a.ty / a.lf * 100)}%</span>` : ''}</div>
 <div class="row"><span>Πελάτες που αγόρασαν</span><b>${a.nT} φέτος · ${a.nL} πέρσι</b></div>
 <div class="mu" style="margin-top:4px"><span class="up">▲ ${a.up} ανεβαίνουν</span> · <span class="dn">▼ ${a.dn} πέφτουν</span>${a.lost ? ` · <span class="dn">${a.lost} δεν αγόρασαν φέτος</span>` : ''}</div>
 ${cats(cities)}${a.debt >= 1 || a.over > 0 ? `<div class="row" style="margin-top:4px"><span>💶 Χρέη περιοχής</span><b>${money(a.debt)}${a.over > 0 ? ` · <span class="dn">υπέρβαση ${money(a.over)}</span>` : ''}</b></div>` : ''}`;
  }
  function box(cities, k, label) {
    const a = stats(cities), op = open.has(k);
    return `<div class="warn" style="margin:6px 0;padding:0"><div data-atog="${esc(k)}" style="display:flex;align-items:center;gap:8px;padding:7px 10px;cursor:pointer"><span style="font-size:calc(14*var(--u));width:14px">${op ? '▾' : '▸'}</span><span style="flex:1">${label}</span><b>${money(a.tz)}</b> ${pctTxt(a.pct)}</div>${op ? `<div style="padding:0 10px 10px">${body(cities)}</div>` : ''}</div>`;
  }

  E.area = {
    stats,
    /* pk: κλειδί του προγράμματος (για την επιλεγμένη πόλη) */
    sum(cities, pk) {
      const key = cities.slice().sort().join('|');
      if (cities.length < 2) return box(cities, 'all:' + key, 'Στοιχεία περιοχής');
      const sel = pick[pk] && cities.includes(pick[pk]) ? pick[pk] : '';
      const chips = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 0">${['', ...cities].map((c) => `<button class="chip${c === sel ? ' on' : ''}" data-apick="${esc(c)}" style="padding:6px 12px;border-radius:99px${c === sel ? ';background:var(--ac);color:#fff;border-color:var(--ac)' : ''}">${c ? esc(c) : 'Όλες οι περιοχές'}</button>`).join('')}</div>`;
      return chips + (sel ? box([sel], 'city:' + sel, 'Στοιχεία ' + esc(sel)) : box(cities, 'all:' + key, 'Στοιχεία όλων των περιοχών'));
    },
    /* πάτημα στο κουτί (data-atog) ή σε πόλη (data-apick) */
    toggle(k) { open.has(k) ? open.delete(k) : open.add(k); try { localStorage.setItem('aopen', JSON.stringify([...open])); } catch (e) { /* τίποτα */ } },
    pick(pk, city) { pick[pk] = city; },
  };
})();
